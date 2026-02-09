const { StudyEntry, Subject, Topic, Subtopic } = require("../models");
const sequelize = require("../config/database");
const { Op } = require("sequelize");


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

  // SEMANA ATUAL (segunda → hoje)
  if (period === "7") {
    const day = now.getDay(); // 0 = domingo
    const diff = day === 0 ? 6 : day - 1;

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - diff);
    startOfWeek.setHours(0, 0, 0, 0);

    return startOfWeek;
  }

  // MÊS ATUAL (dia 1 → hoje)
  if (period === "30") {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);

    return startOfMonth;
  }

  // TOTAL
  return null;
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

  const semana = await calcByPeriod(getDateLimit("7"));
  const mes = await calcByPeriod(getDateLimit("30"));
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

  const materias = rows.map(r => ({
    id: r.subject.id,
    nome: r.subject.nome,
    ...calcStats(r)
  }));

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

  const topicos = rows.map(r => ({
    id: r.topic.id,
    nome: r.topic.nome,
    ...calcStats(r)
  }));

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

  const assuntos = rows.map(r => ({
  id: r.subtopic?.id || null,
  nome: r.subtopic?.nome || "Geral",
  ...calcStats(r)
}));


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
