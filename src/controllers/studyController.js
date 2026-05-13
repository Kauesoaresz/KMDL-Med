const { StudyEntry, Subject, Topic, Subtopic } = require("../models");
const sequelize = require("../config/database");
const { Op } = require("sequelize");

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
    const subtopic_id = ensureInt(b.subtopic_id);
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
      subtopic_id,
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
      [sequelize.literal("SUM(CASE WHEN subject.nome = 'Redação' THEN 0 ELSE questoes END)"), "total_questoes"],
      [sequelize.literal("SUM(CASE WHEN subject.nome = 'Redação' THEN 0 ELSE acertos END)"), "total_acertos"],
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
      },
      {
        model: Subtopic,
        as: "subtopic",
        attributes: ["id", "nome"],
        required: false
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

    subtopic_id: e.subtopic_id,
    subtopic_nome: e.subtopic?.nome || "",

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
    const subtopic_id = ensureInt(b.subtopic_id);
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
      subtopic_id,
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

// =========================
// REDAÇÃO PAGE
// =========================
exports.redacaoPage = async (req, res) => {
  const userId = req.session.userId;

  const redacaoSubject = await Subject.findOne({
    where: {
      user_id: userId,
      nome: 'Redação'
    }
  });

  let redacaoTopics = [];
  if (redacaoSubject) {
  redacaoTopics = await Topic.findAll({
      where: {
        user_id: userId,
        subject_id: redacaoSubject.id
      },
      order: [["nome", "ASC"]]
    });
  }

  const hoje = new Date().toISOString().slice(0, 10);

  const defaults = {
    redacaoSubject: redacaoSubject || null,
    redacaoTopics: Array.isArray(redacaoTopics) ? redacaoTopics : [],
    hoje: hoje || new Date().toISOString().slice(0, 10),
    erro: req.query.erro || null,
    editing: false,
    entryId: null,
    prefill: null,
    active: "redacao",
    userNome: req.session.userNome || 'Usuário',
    userFoto: req.session.userFoto || '/public/img/avatar-default.png'
  };
  res.render("app/redacao", defaults);

};

// =========================
// REDAÇÃO SAVE
// =========================
exports.redacaoSave = async (req, res) => {
  const userId = req.session.userId;
  const { data, horas, minutos, topic_id, tema, nota, c1, c2, c3, c4, c5, comentario } = req.body;

  const totalHoras = parseFloat(horas || 0) + parseFloat(minutos || 0) / 60;

  if (!data || totalHoras <= 0 || !topic_id) {
    return res.redirect('/redacao?erro=Dados inválidos');
  }

  // Find subject and topic
  const redacaoSubject = await Subject.findOne({
    where: { user_id: userId, nome: 'Redação' }
  });

  if (!redacaoSubject) {
    return res.redirect('/redacao?erro=Matéria Redação não encontrada');
  }

  // Prevent duplicate redação on same day
  const existingRedacao = await StudyEntry.findOne({
    where: {
      user_id: userId,
      data: data,
      subject_id: redacaoSubject.id
    }
  });

  if (existingRedacao) {
    return res.redirect('/redacao?erro=Já existe uma redação registrada neste dia');
  }

  const topic = await Topic.findOne({
    where: { id: ensureInt(topic_id), user_id: userId }
  });

  if (!redacaoSubject || !topic) {
    return res.redirect('/redacao?erro=Matéria ou estilo não encontrado');
  }

  const competencias = [c1, c2, c3, c4, c5].map(value => {
    const v = parseFloat(value || 0);
    return Number.isFinite(v) ? Math.max(0, Math.min(v, 200)) : null;
  });

  const competenciasValidas = competencias.filter(v => v !== null && !Number.isNaN(v));
  const totalCompetencias = competenciasValidas.reduce((sum, v) => sum + v, 0);
  const mediaCompetencias = competenciasValidas.length > 0 ? totalCompetencias / competenciasValidas.length : null;

  const notaCompetencias = totalCompetencias > 0 ? totalCompetencias : null;
  const notaFinal = nota ? Number(nota) : notaCompetencias;

  await StudyEntry.create({
    user_id: userId,
    data,
    subject_id: redacaoSubject.id,
    topic_id: topic.id,
    subtopic_id: null,
    tema: tema || null,
    horas: totalHoras,
    questoes: 0,
    acertos: 0,
    dificuldade: 'MEDIA',
    redacao_nota: notaFinal || null,
    c1: competencias[0],
    c2: competencias[1],
    c3: competencias[2],
    c4: competencias[3],
    c5: competencias[4],
    redacao_total_competencias: totalCompetencias || null,
    redacao_media_competencias: mediaCompetencias || null,
    redacao_comentario: comentario?.trim() || null
  });

res.redirect('/dashboard');
};

// =========================
// REDAÇÃO EDITAR PAGE
// =========================
exports.editRedacaoPage = async (req, res) => {
  const userId = req.session.userId;
  const entryId = parseInt(req.params.id);

  const entry = await StudyEntry.findOne({
    where: { id: entryId, user_id: userId },
    include: [
      { model: Subject, as: 'subject' },
      { model: Topic, as: 'topic' }
    ]
  });

  if (!entry || entry.subject.nome !== 'Redação') {
    return res.redirect('/estatisticas/redacao?erro=Redação não encontrada');
  }

  const redacaoSubject = await Subject.findOne({
    where: { user_id: userId, nome: 'Redação' }
  });

  const redacaoTopics = await Topic.findAll({
    where: { user_id: userId, subject_id: redacaoSubject.id },
    order: [["nome", "ASC"]]
  });

  // Prefill form data
  const minutos = Math.round(entry.horas * 60);
  const horasDisplay = Math.floor(entry.horas);

  res.render("app/redacao", {
    active: "redacao",
    userNome: req.session.userNome,
    userFoto: req.session.userFoto,
    redacaoSubject,
    redacaoTopics,
    hoje: entry.data,
    editing: true,
    entryId: entry.id,
    erro: req.query.erro || null,
    prefill: {
      data: entry.data,
      horas: horasDisplay,
      minutos: minutos % 60,
      topic_id: entry.topic_id,
      tema: entry.tema,
      nota: entry.redacao_nota,
      c1: entry.c1,
      c2: entry.c2,
      c3: entry.c3,
      c4: entry.c4,
      c5: entry.c5,
      comentario: entry.redacao_comentario
    }
  });
};

// =========================
// REDAÇÃO EDITAR SAVE
// =========================
exports.editRedacaoSave = async (req, res) => {
  const userId = req.session.userId;
  const entryId = parseInt(req.params.id);
  const { data, horas, minutos, topic_id, tema, nota, c1, c2, c3, c4, c5, comentario } = req.body;

  const totalHoras = parseFloat(horas || 0) + parseFloat(minutos || 0) / 60;

  if (!data || totalHoras <= 0 || !topic_id) {
    return res.redirect(`/redacao/editar/${entryId}?erro=Dados inválidos`);
  }

  const redacaoSubject = await Subject.findOne({
    where: { user_id: userId, nome: 'Redação' }
  });

  const topic = await Topic.findOne({
    where: { id: parseInt(topic_id), user_id: userId }
  });

  if (!redacaoSubject || !topic) {
    return res.redirect(`/redacao/editar/${entryId}?erro=Estilo não encontrado`);
  }

  const entry = await StudyEntry.findOne({
    where: { id: entryId, user_id: userId, subject_id: redacaoSubject.id }
  });
  if (!entry) {
    return res.redirect('/estatisticas/redacao?erro=Redação não encontrada');
  }

  const duplicated = await StudyEntry.findOne({
    where: {
      user_id: userId,
      subject_id: redacaoSubject.id,
      data,
      id: { [Op.ne]: entryId }
    }
  });
  if (duplicated) {
    return res.redirect(`/redacao/editar/${entryId}?erro=Já existe redação nesta data`);
  }

  const competencias = [c1, c2, c3, c4, c5].map(value => {
    const v = parseFloat(value || 0);
    return Number.isFinite(v) ? Math.max(0, Math.min(v, 200)) : null;
  });
  const competenciasValidas = competencias.filter(v => v !== null && !Number.isNaN(v));
  const totalCompetencias = competenciasValidas.reduce((sum, v) => sum + v, 0);
  const mediaCompetencias = competenciasValidas.length > 0 ? totalCompetencias / competenciasValidas.length : null;
  const notaFinal = nota ? Number(nota) : (totalCompetencias > 0 ? totalCompetencias : null);

  await StudyEntry.update({
    data,
    horas: totalHoras,
    topic_id: topic.id,
    tema: tema || null,
    redacao_nota: notaFinal || null,
    c1: competencias[0],
    c2: competencias[1],
    c3: competencias[2],
    c4: competencias[3],
    c5: competencias[4],
    redacao_total_competencias: totalCompetencias || null,
    redacao_media_competencias: mediaCompetencias || null,
    redacao_comentario: comentario?.trim() || null,
    questoes: 0,
    acertos: 0
  }, {
    where: { id: entryId, user_id: userId }
  });

  res.redirect('/estatisticas/redacao');
};

// =========================
// REDAÇÃO DELETE
// =========================
exports.deleteRedacao = async (req, res) => {
  const userId = req.session.userId;
  const entryId = parseInt(req.params.id);

  await StudyEntry.destroy({
    where: { id: entryId, user_id: userId }
  });

  res.redirect('/estatisticas/redacao');
};

// =========================
// REDAÇÃO COMMENT SAVE
// =========================
exports.saveRedacaoComentario = async (req, res) => {
  const userId = req.session.userId;
  const entryId = parseInt(req.params.id, 10);
  const comentario = (req.body.comentario || "").trim();

  const [updated] = await StudyEntry.update(
    { redacao_comentario: comentario || null },
    { where: { id: entryId, user_id: userId } }
  );

  if (!updated) {
    return res.status(404).json({ ok: false, error: "Redação não encontrada" });
  }

  return res.json({ ok: true, comentario: comentario || null });
};

