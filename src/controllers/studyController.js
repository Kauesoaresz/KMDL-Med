const { StudyEntry, Subject, Topic } = require("../models");
const sequelize = require("../config/database");


function ensureInt(v) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}

// =========================
// HUB /registrar
// =========================
exports.hub = async (req, res) => {
  res.render("app/register-hub", {
    active: "registrar",
    userNome: req.session.userNome,
    userFoto: req.session.userFoto
  });
};

// =========================
// REGISTRAR NOVO DIA
// =========================
exports.registerPage = async (req, res) => {
  const userId = req.session.userId;

  const subjects = await Subject.findAll({
    where: { user_id: userId },
    order: [["nome", "ASC"]]
  });

  const hoje = new Date().toISOString().slice(0, 10);

  res.render("app/register-day", {
    subjects,
    hoje,
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

  for (const b of blocos) {
    const subject_id = ensureInt(b.subject_id);
    const topic_id = ensureInt(b.topic_id);
    const horas = parseFloat(b.horas) || 0;
    const minutos = parseFloat(b.minutos) || 0;
    const totalHoras = horas + (minutos / 60); // Converter horas e minutos para horas decimais
    const questoes = ensureInt(b.questoes) || 0;
    const acertos = ensureInt(b.acertos) || 0;
    const dificuldade = b.dificuldade || "MEDIA";

    if (!subject_id || !topic_id || totalHoras <= 0) continue;

    await StudyEntry.create({
      user_id: userId,
      data,
      subject_id,
      topic_id,
      horas: totalHoras,
      questoes,
      acertos,
      dificuldade
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

  const subjects = await Subject.findAll({
    where: { user_id: userId },
    order: [["nome", "ASC"]]
  });

  const entriesRaw = await StudyEntry.findAll({
    where: { user_id: userId, data },
    order: [["id", "ASC"]],
    include: [
      {
        model: Subject,
        as: "subject",
        attributes: ["id", "nome"]
      },
      {
        model: Topic,
        as: "topic",
        attributes: ["id", "nome"]
      }
    ]
  });

  if (!entriesRaw.length) {
    return res.redirect("/registrar/lista");
  }

  // 🔥 formata exatamente como o front espera (converte horas para minutos)
  const entries = entriesRaw.map(e => ({
    subject_id: e.subject_id,
    subject_nome: e.subject?.nome || "",

    topic_id: e.topic_id,
    topic_nome: e.topic?.nome || "",

    minutos: Math.round(e.horas * 60), // Converter horas para minutos
    horas: e.horas,
    questoes: e.questoes,
    acertos: e.acertos,
    dificuldade: e.dificuldade
  }));

  res.render("app/register-edit", {
    data,
    subjects,
    entries,
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

  for (const b of blocos) {
    const subject_id = ensureInt(b.subject_id);
    const topic_id = ensureInt(b.topic_id);
    const horas = parseFloat(b.horas) || 0;
    const minutos = parseFloat(b.minutos) || 0;
    const totalHoras = horas + (minutos / 60); // Converter horas e minutos para horas decimais
    const questoes = ensureInt(b.questoes) || 0;
    const acertos = ensureInt(b.acertos) || 0;
    const dificuldade = b.dificuldade || "MEDIA";

    if (!subject_id || !topic_id || totalHoras <= 0) continue;

    await StudyEntry.create({
      user_id: userId,
      data,
      subject_id,
      topic_id,
      horas: totalHoras,
      questoes,
      acertos,
      dificuldade
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
