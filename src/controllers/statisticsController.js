const { StudyEntry, Subject, Topic, Subtopic } = require("../models");
const sequelize = require("../config/database");

// util
function calcStats(row) {
  const horas = Number(row.horas) || 0;
  const questoes = Number(row.questoes) || 0;
  const acertos = Number(row.acertos) || 0;
  const erros = questoes - acertos;
  const aproveitamento = questoes > 0 ? Math.round((acertos / questoes) * 100) : 0;

  return { horas, questoes, acertos, erros, aproveitamento };
}

// =========================
// VISÃO GERAL
// =========================
exports.geral = async (req, res) => {
  const userId = req.session.userId;

  const [row] = await StudyEntry.findAll({
    where: { user_id: userId },
    attributes: [
      [sequelize.fn("SUM", sequelize.col("horas")), "horas"],
      [sequelize.fn("SUM", sequelize.col("questoes")), "questoes"],
      [sequelize.fn("SUM", sequelize.col("acertos")), "acertos"]
    ],
    raw: true
  });

  res.render("app/statistics", {
    active: "estatisticas",
    userNome: req.session.userNome,
    userFoto: req.session.userFoto,
    geral: calcStats(row),
    materias: [],
    nivel: "geral"
  });
};

exports.hub = async (req, res) => {
  res.render("app/estatisticas-hub", {
    active: "estatisticas",
    userNome: req.session.userNome,
    userFoto: req.session.userFoto
  });
};


// =========================
// POR MATÉRIA
// =========================
exports.porMateria = async (req, res) => {
  const userId = req.session.userId;

  const rows = await StudyEntry.findAll({
    where: { user_id: userId },
    attributes: [
      "subject_id",
      [sequelize.fn("SUM", sequelize.col("horas")), "horas"],
      [sequelize.fn("SUM", sequelize.col("questoes")), "questoes"],
      [sequelize.fn("SUM", sequelize.col("acertos")), "acertos"]
    ],
    include: [{ model: Subject, as: "subject", attributes: ["id", "nome"] }],
    group: ["subject_id"],
    raw: true,
    nest: true
  });

  const materias = rows.map(r => ({
    id: r.subject.id,
    nome: r.subject.nome,
    ...calcStats(r)
  }));

  res.json(materias);
};

// =========================
// POR TÓPICO (de uma matéria)
// =========================
exports.porTopico = async (req, res) => {
  const userId = req.session.userId;
  const subjectId = req.params.subjectId;

  const rows = await StudyEntry.findAll({
    where: { user_id: userId, subject_id: subjectId },
    attributes: [
      "topic_id",
      [sequelize.fn("SUM", sequelize.col("horas")), "horas"],
      [sequelize.fn("SUM", sequelize.col("questoes")), "questoes"],
      [sequelize.fn("SUM", sequelize.col("acertos")), "acertos"]
    ],
    include: [{ model: Topic, as: "topic", attributes: ["id", "nome"] }],
    group: ["topic_id"],
    raw: true,
    nest: true
  });

  const topicos = rows.map(r => ({
    id: r.topic.id,
    nome: r.topic.nome,
    ...calcStats(r)
  }));

  res.json(topicos);
};

// =========================
// POR ASSUNTO (de um tópico)
// =========================
exports.porAssunto = async (req, res) => {
  const userId = req.session.userId;
  const topicId = req.params.topicId;

  const rows = await StudyEntry.findAll({
    where: { user_id: userId, topic_id: topicId },
    attributes: [
      "subtopic_id",
      [sequelize.fn("SUM", sequelize.col("horas")), "horas"],
      [sequelize.fn("SUM", sequelize.col("questoes")), "questoes"],
      [sequelize.fn("SUM", sequelize.col("acertos")), "acertos"]
    ],
    include: [{ model: Subtopic, as: "subtopic", attributes: ["id", "nome"] }],
    group: ["subtopic_id"],
    raw: true,
    nest: true
  });

  const assuntos = rows.map(r => ({
    id: r.subtopic.id,
    nome: r.subtopic.nome,
    ...calcStats(r)
  }));

  res.json(assuntos);
};

const Simulado = require("../models/Simulado");
const SimuladoErro = require("../models/SimuladoErro");

/* =========================
   ESTATÍSTICAS DE SIMULADOS
========================= */
exports.simulados = async (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }

  const userId = req.session.userId;

  // total de simulados
  const totalSimulados = await Simulado.count({
    where: { user_id: userId }
  });

  // total de erros
const totalErros = await SimuladoErro.count({
  include: [{
    model: Simulado,
    as: "simulado",
    where: { user_id: userId }
  }]
});

// erros por área
const errosPorArea = await Simulado.findAll({
  where: { user_id: userId },
  attributes: [
    "area",
    [sequelize.fn("COUNT", sequelize.col("erros.id")), "erros"]
  ],
  include: [{
    model: SimuladoErro,
    as: "erros",
    attributes: []
  }],
  group: ["area"],
  raw: true
});

// erros por dia
const errosPorDia = await Simulado.findAll({
  where: { user_id: userId },
  attributes: [
    "dia",
    [sequelize.fn("COUNT", sequelize.col("erros.id")), "erros"]
  ],
  include: [{
    model: SimuladoErro,
    as: "erros",
    attributes: []
  }],
  group: ["dia"],
  raw: true
});

  res.render("app/estatisticas-simulados", {
    active: "estatisticas",
    userNome: req.session.userNome,
    userFoto: req.session.userFoto,
    totalSimulados,
    totalErros,
    errosPorArea,
    errosPorDia
  });
};
