const { StudyEntry, Subject, Topic, Subtopic } = require("../models");
const sequelize = require("../config/database");
const { Op } = require("sequelize");
const { SimuladoQuestaoErro } = require("../models");



// =========================
// UTILS
// =========================
function calcStats(row) {
  const horas = Number(row.horas) || 0;
  const questoes = Number(row.questoes) || 0;
  const acertos = Number(row.acertos) || 0;
  const erros = questoes - acertos;
  const aproveitamento = questoes > 0
    ? Math.round((acertos / questoes) * 100)
    : 0;

  return { horas, questoes, acertos, erros, aproveitamento };
}

function getDateLimit(period) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // SEMANA ATUAL (domingo → hoje)
  if (period === "week") {
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay()); // domingo
    return start;
  }

  // MÊS ATUAL (dia 1 → hoje)
  if (period === "month") {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  // TOTAL
  return null;
}


// =========================
// ERROS DE CONTEÚDO (HELPER)
// =========================
async function buscarErrosConteudo({ level, id, dateLimit }) {
  const where = {};

  if (dateLimit) {
    where.created_at = { [Op.gte]: dateLimit };
  }

  if (level === "materia") where.subject_id = id;
  if (level === "topico") where.topic_id = id;
  if (level === "assunto") where.subtopic_id = id;

  const rows = await SimuladoQuestaoErro.findAll({
    where,
    attributes: [
      "motivo",
      [sequelize.fn("COUNT", sequelize.col("id")), "total"]
    ],
    group: ["motivo"],
    raw: true
  });

  const base = {
    total: 0,
    falta_conteudo: 0,
    lacuna: 0,
    falta_atencao: 0
  };

  rows.forEach(r => {
    base.total += Number(r.total);
    base[r.motivo] = Number(r.total);
  });

  return base;
}

// =========================
// VISÃO GERAL
// =========================
exports.geral = async (req, res) => {
  const userId = req.session.userId;

  async function calcByPeriod(dateLimit) {
    const where = { user_id: userId };

    if (dateLimit) {
      where.data = { [Op.gte]: dateLimit };
    }

    const [row] = await StudyEntry.findAll({
      where,
      attributes: [
        [sequelize.fn("SUM", sequelize.col("horas")), "horas"],
        [sequelize.fn("SUM", sequelize.col("questoes")), "questoes"],
        [sequelize.fn("SUM", sequelize.col("acertos")), "acertos"]
      ],
      raw: true
    });

    return calcStats(row || {});
  }

  const semana = await calcByPeriod(getDateLimit("week"));
const mes = await calcByPeriod(getDateLimit("month"));
const total = await calcByPeriod(null);


  res.render("app/statistics", {
    active: "estatisticas",
    userNome: req.session.userNome,
    userFoto: req.session.userFoto,

    semana,
    mes,
    total,

    nivel: "geral"
  });
};


// =========================
// HUB
// =========================
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
  const period = req.query.period || "all";
  const dateLimit = getDateLimit(period);

  const where = { user_id: userId };
  if (dateLimit) {
    where.data = { [Op.gte]: dateLimit };
  }

  const rows = await StudyEntry.findAll({
    where,
    attributes: [
      "subject_id",
      [sequelize.fn("SUM", sequelize.col("horas")), "horas"],
      [sequelize.fn("SUM", sequelize.col("questoes")), "questoes"],
      [sequelize.fn("SUM", sequelize.col("acertos")), "acertos"]
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
  const erros = await buscarErrosConteudo({
    level: "materia",
    id: r.subject.id,
    dateLimit
  });

  materias.push({
    id: r.subject.id,
    nome: r.subject.nome,
    ...calcStats(r),
    erros_conteudo: erros
  });
}

res.json(materias);

};

// =========================
// POR TÓPICO
// =========================
exports.porTopico = async (req, res) => {
  const userId = req.session.userId;
  const subjectId = req.params.subjectId;
  const period = req.query.period || "all";
  const dateLimit = getDateLimit(period);

  const where = { user_id: userId, subject_id: subjectId };
  if (dateLimit) {
    where.data = { [Op.gte]: dateLimit };
  }

  const rows = await StudyEntry.findAll({
    where,
    attributes: [
      "topic_id",
      [sequelize.fn("SUM", sequelize.col("horas")), "horas"],
      [sequelize.fn("SUM", sequelize.col("questoes")), "questoes"],
      [sequelize.fn("SUM", sequelize.col("acertos")), "acertos"]
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
  const erros = await buscarErrosConteudo({
    level: "topico",
    id: r.topic.id,
    dateLimit
  });

  topicos.push({
    id: r.topic.id,
    nome: r.topic.nome,
    ...calcStats(r),
    erros_conteudo: erros
  });
}

res.json(topicos);

};

// =========================
// POR ASSUNTO
// =========================
exports.porAssunto = async (req, res) => {
  const userId = req.session.userId;
  const topicId = req.params.topicId;
  const period = req.query.period || "all";
  const dateLimit = getDateLimit(period);

  const where = { user_id: userId, topic_id: topicId };
  if (dateLimit) {
    where.data = { [Op.gte]: dateLimit };
  }

  const rows = await StudyEntry.findAll({
    where,
    attributes: [
      "subtopic_id",
      [sequelize.fn("SUM", sequelize.col("horas")), "horas"],
      [sequelize.fn("SUM", sequelize.col("questoes")), "questoes"],
      [sequelize.fn("SUM", sequelize.col("acertos")), "acertos"]
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
  const subId = r.subtopic?.id || null;

  const erros = subId
    ? await buscarErrosConteudo({
        level: "assunto",
        id: subId,
        dateLimit
      })
    : { total: 0, falta_conteudo: 0, lacuna: 0, falta_atencao: 0 };

  assuntos.push({
    id: subId,
    nome: r.subtopic?.nome || "Geral",
    ...calcStats(r),
    erros_conteudo: erros
  });
}

res.json(assuntos);

};

exports.materiasDashboard = async (req, res) => {
  res.render("app/estatisticas-conteudo", {
    active: "estatisticas",
    userNome: req.session.userNome,
    userFoto: req.session.userFoto
  });
};




// =========================
// ESTATÍSTICAS DE SIMULADOS
// =========================
exports.simulados = async (req, res) => {
  if (!req.session.userId) return res.redirect("/login");

  const userId = req.session.userId;

  const totalSimulados = await Simulado.count({
    where: { user_id: userId }
  });

  const totalErros = await SimuladoErro.count({
    include: [{
      model: SimuladoParte,
      as: "parte",
      include: [{
        model: Simulado,
        as: "simulado",
        where: { user_id: userId }
      }]
    }]
  });

  const totalRevisados = await SimuladoErro.count({
    where: { revisado: true },
    include: [{
      model: SimuladoParte,
      as: "parte",
      include: [{
        model: Simulado,
        as: "simulado",
        where: { user_id: userId }
      }]
    }]
  });

  const totalPendentes = totalErros - totalRevisados;

  const errosPorAreaRaw = await SimuladoParte.findAll({
    attributes: [
      "area",
      [sequelize.fn("COUNT", sequelize.col("erros.id")), "erros"]
    ],
    include: [{
      model: SimuladoErro,
      as: "erros",
      attributes: []
    }, {
      model: Simulado,
      as: "simulado",
      where: { user_id: userId },
      attributes: []
    }],
    group: ["area"],
    raw: true
  });

  const baseAreas = {
    LINGUAGENS: 0,
    HUMANAS: 0,
    NATUREZA: 0,
    MATEMATICA: 0
  };

  errosPorAreaRaw.forEach(a => {
    baseAreas[a.area] = Number(a.erros);
  });

  const errosPorArea = Object.entries(baseAreas).map(([area, erros]) => ({
    area,
    erros,
    acertos: 45 - erros
  }));

  const errosPorDiaRaw = await SimuladoParte.findAll({
    attributes: [
      "dia",
      [sequelize.fn("COUNT", sequelize.col("erros.id")), "erros"]
    ],
    include: [{
      model: SimuladoErro,
      as: "erros",
      attributes: []
    }, {
      model: Simulado,
      as: "simulado",
      where: { user_id: userId },
      attributes: []
    }],
    group: ["dia"],
    raw: true
  });

  const dia1 = errosPorDiaRaw.find(d => d.dia === "DIA_1")?.erros || 0;
  const dia2 = errosPorDiaRaw.find(d => d.dia === "DIA_2")?.erros || 0;

  const totalQuestoes = 180;
  const acertosTotais = totalQuestoes - totalErros;
  const proficiencia = Math.round((acertosTotais / totalQuestoes) * 100);
  const mediaAcertos = totalSimulados > 0
    ? Math.round(acertosTotais / totalSimulados)
    : 0;

  const areaMaisFraca = errosPorArea.reduce((a, b) =>
    b.erros > a.erros ? b : a
  );

  const areaMaisForte = errosPorArea.reduce((a, b) =>
    b.erros < a.erros ? b : a
  );

  const piorDia =
    dia1 === dia2 ? "EQUILIBRADO" : (dia1 > dia2 ? "DIA_1" : "DIA_2");

  res.render("app/estatisticas-simulados", {
    active: "estatisticas",
    userNome: req.session.userNome,
    userFoto: req.session.userFoto,

    totalSimulados,
    totalErros,
    totalRevisados,
    totalPendentes,

    errosPorArea,
    dia1,
    dia2,

    acertosTotais,
    proficiencia,
    mediaAcertos,
    areaMaisForte,
    areaMaisFraca,
    piorDia
  });
};
