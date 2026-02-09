const { Op, fn, col } = require("sequelize");
const sequelize = require("../config/database");

const {
  StudyEntry,
  Subject,
  Topic,
  Subtopic,
  SimuladoQuestaoErro,
  SimuladoBloco,
  Simulado
} = require("../models");

/* =========================
   HELPERS
========================= */
function calcBase({ horas = 0, questoes = 0, acertos = 0 }) {
  const erros = questoes - acertos;
  const aproveitamento = questoes > 0
    ? Math.round((acertos / questoes) * 100)
    : 0;

  return { horas, questoes, acertos, erros, aproveitamento };
}

async function errosPorConteudo({ userId, subjectId, topicId, subtopicId }) {
  const whereErro = {};

  if (subjectId) whereErro.subject_id = subjectId;
  if (topicId) whereErro.topic_id = topicId;
  if (subtopicId) whereErro.subtopic_id = subtopicId;

  const rows = await SimuladoQuestaoErro.findAll({
    attributes: [
      "motivo",
      [fn("COUNT", col("id")), "total"]
    ],
    where: whereErro,
    include: [{
      model: SimuladoBloco,
      as: "bloco",
      attributes: [],
      include: [{
        model: Simulado,
        as: "simulado",
        where: { user_id: userId, status: "finalizado" },
        attributes: []
      }]
    }],
    group: ["motivo"],
    raw: true
  });

  const base = {
    lacuna: 0,
    falta_conteudo: 0,
    falta_atencao: 0
  };

  rows.forEach(r => {
    base[r.motivo] = Number(r.total);
  });

  return base;
}

/* =========================
   RENDER PRINCIPAL
========================= */
exports.dashboard = async (req, res) => {
  res.render("app/estatisticas-conteudo", {
    active: "estatisticas",
    userNome: req.session.userNome,
    userFoto: req.session.userFoto
  });
};

/* =========================
   MATÉRIAS
========================= */
exports.materias = async (req, res) => {
  const userId = req.session.userId;

  const rows = await StudyEntry.findAll({
    where: { user_id: userId },
    attributes: [
      "subject_id",
      [fn("SUM", col("horas")), "horas"],
      [fn("SUM", col("questoes")), "questoes"],
      [fn("SUM", col("acertos")), "acertos"],
      [fn("COUNT", fn("DISTINCT", col("data"))), "dias"]
    ],
    include: [{
      model: Subject,
      as: "subject",
      attributes: ["id", "nome"]
    }],
    group: ["subject_id", "subject.id"],
    raw: true,
    nest: true
  });

  const materias = [];

  for (const r of rows) {
    const base = calcBase(r);
    const erros = await errosPorConteudo({
      userId,
      subjectId: r.subject.id
    });

    materias.push({
      id: r.subject.id,
      nome: r.subject.nome,
      dias: Number(r.dias),
      ...base,
      erros
    });
  }

  res.json(materias);
};

/* =========================
   TÓPICOS
========================= */
exports.topicos = async (req, res) => {
  const userId = req.session.userId;
  const subjectId = req.params.subjectId;

  const rows = await StudyEntry.findAll({
    where: { user_id: userId, subject_id: subjectId },
    attributes: [
      "topic_id",
      [fn("SUM", col("horas")), "horas"],
      [fn("SUM", col("questoes")), "questoes"],
      [fn("SUM", col("acertos")), "acertos"]
    ],
    include: [{
      model: Topic,
      as: "topic",
      attributes: ["id", "nome"]
    }],
    group: ["topic_id", "topic.id"],
    raw: true,
    nest: true
  });

  const topicos = [];

  for (const r of rows) {
    const base = calcBase(r);
    const erros = await errosPorConteudo({
      userId,
      subjectId,
      topicId: r.topic.id
    });

    topicos.push({
      id: r.topic.id,
      nome: r.topic.nome,
      ...base,
      erros
    });
  }

  res.json(topicos);
};

/* =========================
   ASSUNTOS
========================= */
exports.assuntos = async (req, res) => {
  const userId = req.session.userId;
  const topicId = req.params.topicId;

  const rows = await StudyEntry.findAll({
    where: { user_id: userId, topic_id: topicId },
    attributes: [
      "subtopic_id",
      [fn("SUM", col("horas")), "horas"],
      [fn("SUM", col("questoes")), "questoes"],
      [fn("SUM", col("acertos")), "acertos"]
    ],
    include: [{
      model: Subtopic,
      as: "subtopic",
      attributes: ["id", "nome"]
    }],
    group: ["subtopic_id", "subtopic.id"],
    raw: true,
    nest: true
  });

  const assuntos = [];

  for (const r of rows) {
    const base = calcBase(r);
    const erros = await errosPorConteudo({
      userId,
      topicId,
      subtopicId: r.subtopic?.id
    });

    assuntos.push({
      id: r.subtopic?.id || null,
      nome: r.subtopic?.nome || "Geral",
      ...base,
      erros
    });
  }

  res.json(assuntos);
};
