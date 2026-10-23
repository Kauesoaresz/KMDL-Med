const { StudyEntry, Subject, Topic } = require("../models");
const sequelize = require("../config/database");


function ensureInt(v) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}

// Devolve o id do tópico "Geral" da matéria (cria se ainda não existir)
async function getGeralTopicId(userId, subjectId) {
  const [topic] = await Topic.findOrCreate({
    where: { user_id: userId, subject_id: subjectId, nome: "Geral" }
  });
  return topic.id;
}

// matérias + tópicos num objeto só, com a mesma cor (hue) do dashboard
async function subjectsWithTopics(userId) {
  const subjects = await Subject.findAll({ where: { user_id: userId }, order: [["id", "ASC"]], raw: true });
  const topics = await Topic.findAll({ where: { user_id: userId }, order: [["nome", "ASC"]], raw: true });

  return subjects
    .map((s, i) => ({
      id: s.id,
      nome: s.nome,
      hue: Math.round((245 + i * 137.508) % 360),
      topics: topics.filter((t) => t.subject_id === s.id).map((t) => ({ id: t.id, nome: t.nome })),
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

function hojeLocalISO() {
  return new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD no fuso local
}

// =========================
// HUB /registrar
// =========================
exports.hub = (req, res) => res.redirect("/registrar/novo");

// =========================
// REGISTRAR NOVO DIA
// =========================
exports.registerPage = async (req, res) => {
  const userId = req.session.userId;
  const hoje = hojeLocalISO();

  const subjects = await subjectsWithTopics(userId);
  const dias = await StudyEntry.findAll({
    where: { user_id: userId },
    attributes: ["data"],
    group: ["data"],
    raw: true
  });

  res.render("app/register-day", {
    subjects,
    entries: [],
    editing: false,
    data: hoje,
    hoje,
    diasRegistrados: dias.map((d) => d.data),
    active: "registrar",
    userNome: req.session.userNome,
    userFoto: req.session.userFoto
  });
};

// =========================
// SALVAR NOVO DIA
// =========================
exports.registerSave = async (req, res) => {
  const userId = req.session.userId;
  const { data, blocos } = req.body;

  if (!data || !Array.isArray(blocos)) {
    return res.redirect("/registrar/novo");
  }

  await StudyEntry.destroy({ where: { user_id: userId, data } });

      const geralCache = {}; // evita consultar o banco várias vezes por matéria

  for (const b of blocos) {
    const subject_id = ensureInt(b.subject_id);
    let topic_id = ensureInt(b.topic_id);
    const totalHoras = (parseFloat(b.horas) || 0) + (parseFloat(b.minutos) || 0) / 60;
    const questoes = ensureInt(b.questoes) || 0;
    const acertos = ensureInt(b.acertos) || 0;

    if (!subject_id || totalHoras <= 0) continue;

    // sem tópico escolhido -> "Geral" da matéria
    if (!topic_id) {
      if (!geralCache[subject_id]) {
        geralCache[subject_id] = await getGeralTopicId(userId, subject_id);
      }
      topic_id = geralCache[subject_id];
    }

    await StudyEntry.create({
      user_id: userId,
      data,
      subject_id,
      topic_id,
      horas: totalHoras,
      questoes,
      acertos
    });
  }

  res.redirect("/registrar/lista");
};

// =========================
// LISTA DE DIAS
// =========================
exports.listDays = async (req, res) => {
  const userId = req.session.userId;

  const diasRaw = await StudyEntry.findAll({
    where: { user_id: userId },
    attributes: [
  "data",
  [sequelize.fn("SUM", sequelize.col("horas")), "total_horas"],
  [sequelize.fn("SUM", sequelize.col("questoes")), "total_questoes"],
  [sequelize.fn("SUM", sequelize.col("acertos")), "total_acertos"],
  [sequelize.fn("GROUP_CONCAT", sequelize.fn("DISTINCT", sequelize.col("subject.nome"))), "materias"]
],
    include: [{
      model: Subject,
      as: "subject",
      attributes: []
    }],
    group: ["data"],
    order: [["data", "DESC"]],
    raw: true
  });

  const dias = diasRaw.map(d => ({
    data: d.data,
    total_horas: Number(d.total_horas) || 0,
    total_questoes: Number(d.total_questoes) || 0,
    total_acertos: Number(d.total_acertos) || 0,
    materias: d.materias ? d.materias.split(",") : []
  }));

  res.render("app/register-list", {
    dias,
    active: "registrar",
    userNome: req.session.userNome,
    userFoto: req.session.userFoto
  });
};


// =========================
// EDITAR DIA
// =========================
exports.editPage = async (req, res) => {
  const userId = req.session.userId;
  const data = req.params.data;

  const rows = await StudyEntry.findAll({
    where: { user_id: userId, data },
    order: [["id", "ASC"]],
    raw: true
  });

  if (!rows.length) return res.redirect("/registrar/lista");

  const entries = rows.map((e) => ({
    subject_id: e.subject_id,
    topic_id: e.topic_id,
    minutos: Math.round(Number(e.horas) * 60),
    questoes: e.questoes,
    acertos: e.acertos
  }));

  res.render("app/register-day", {
    subjects: await subjectsWithTopics(userId),
    entries,
    editing: true,
    data,
    hoje: hojeLocalISO(),
    diasRegistrados: [],
    active: "registrar",
    userNome: req.session.userNome,
    userFoto: req.session.userFoto
  });
};

// =========================
// SALVAR EDIÇÃO
// =========================
exports.editSave = async (req, res) => {
  const userId = req.session.userId;
  const dataFromBody = req.body?.data;
  const dataFromParams = req.params.data;
  const data = dataFromBody || dataFromParams;

  const { blocos } = req.body;

  if (!Array.isArray(blocos)) {
    return res.redirect(`/registrar/editar/${data}`);
  }

  await StudyEntry.destroy({ where: { user_id: userId, data } });

    const geralCache = {}; // evita consultar o banco várias vezes por matéria

  for (const b of blocos) {
    const subject_id = ensureInt(b.subject_id);
    let topic_id = ensureInt(b.topic_id);
    const totalHoras = (parseFloat(b.horas) || 0) + (parseFloat(b.minutos) || 0) / 60;
    const questoes = ensureInt(b.questoes) || 0;
    const acertos = ensureInt(b.acertos) || 0;

    if (!subject_id || totalHoras <= 0) continue;

    // sem tópico escolhido -> "Geral" da matéria
    if (!topic_id) {
      if (!geralCache[subject_id]) {
        geralCache[subject_id] = await getGeralTopicId(userId, subject_id);
      }
      topic_id = geralCache[subject_id];
    }

    await StudyEntry.create({
      user_id: userId,
      data,
      subject_id,
      topic_id,
      horas: totalHoras,
      questoes,
      acertos
    });
  }

  res.redirect("/registrar/lista");
};

// =========================
// EXCLUIR DIA
// =========================
exports.deleteDay = async (req, res) => {
  const userId = req.session.userId;
  const data = req.params.data;

  await StudyEntry.destroy({
    where: { user_id: userId, data }
  });

  res.redirect("/registrar/lista");
};
