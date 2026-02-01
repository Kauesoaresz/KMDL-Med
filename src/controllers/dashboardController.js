const { StudyEntry } = require("../models");
const { Op } = require("sequelize");
const sequelize = require("../config/database");

/* =========================
   HELPERS DE DATA (SEM BUG)
========================= */
function todayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function daysAgoISO(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function parseLocalDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/* =========================
   DASHBOARD
========================= */
exports.dashboard = async (req, res) => {
  const userId = req.session.userId;
  const userNome = req.session.userNome;
  const userFoto = req.session.userFoto; // ✅ ESSENCIAL
  const periodo = req.query.periodo || "total";

  const hoje = todayISO();

  let inicioPeriodo;
  let diasPeriodo = 1;

  if (periodo === "semana") {
    inicioPeriodo = daysAgoISO(6);
    diasPeriodo = 7;
  } else if (periodo === "mes") {
    inicioPeriodo = daysAgoISO(29);
    diasPeriodo = 30;
  } else if (periodo === "total") {
    inicioPeriodo = null;
    diasPeriodo = null;
  } else {
    inicioPeriodo = hoje;
    diasPeriodo = 1;
  }

  /* =========================
     STATS PRINCIPAIS
  ========================= */
  const wherePeriodo = {
    user_id: userId,
    ...(inicioPeriodo && {
      data: { [Op.between]: [inicioPeriodo, hoje] }
    })
  };

  const statsRaw = await StudyEntry.findOne({
    where: wherePeriodo,
    attributes: [
      [sequelize.fn("SUM", sequelize.col("horas")), "horas"],
      [sequelize.fn("SUM", sequelize.col("questoes")), "questoes"],
      [sequelize.fn("SUM", sequelize.col("acertos")), "acertos"]
    ],
    raw: true
  });

  const horas = Number(statsRaw?.horas) || 0;
  const questoes = Number(statsRaw?.questoes) || 0;
  const acertos = Number(statsRaw?.acertos) || 0;

  const taxa =
    questoes > 0 ? Math.round((acertos / questoes) * 100) : 0;

  /* =========================
     CONSTÂNCIA (STREAK)
  ========================= */
  const diasEstudadosRaw = await StudyEntry.findAll({
    where: { user_id: userId },
    attributes: ["data"],
    group: ["data"],
    order: [["data", "DESC"]],
    raw: true
  });

  let streakAtual = 0;
  let streakSemana = [];

  const hojeDate = parseLocalDate(hoje);

  for (let i = 0; i < 7; i++) {
    const d = new Date(hojeDate);
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);

    const estudou = diasEstudadosRaw.some(e => e.data === iso);
    streakSemana.unshift(estudou);

    if (i === streakAtual && estudou) {
      streakAtual++;
    }
  }

  /* =========================
     DIAS ESTUDADOS NO PERÍODO
  ========================= */
  let dias = 0;

if (periodo === "total") {
  const diasRaw = await StudyEntry.findAll({
    where: { user_id: userId },
    attributes: ["data"],
    group: ["data"],
    raw: true
  });
  dias = diasRaw.length;
} else {
  const diasRaw = await StudyEntry.findAll({
    where: wherePeriodo,
    attributes: ["data"],
    group: ["data"],
    raw: true
  });
  dias = diasRaw.length;
}


  /* =========================
     EVOLUÇÃO (30 DIAS)
  ========================= */
  const inicioEvolucao = daysAgoISO(29);

  const evolucaoRaw = await StudyEntry.findAll({
    where: {
      user_id: userId,
      data: { [Op.between]: [inicioEvolucao, hoje] }
    },
    attributes: [
      "data",
      [sequelize.fn("SUM", sequelize.col("horas")), "horas"]
    ],
    group: ["data"],
    order: [["data", "ASC"]],
    raw: true
  });

  const evolucao = evolucaoRaw.map(d => ({
    label: parseLocalDate(d.data).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit"
    }),
    horas: Number(d.horas) || 0
  }));

  /* =========================
     COMPARAÇÃO (SETINHA)
  ========================= */
  let horasDiff;

  if (periodo !== "hoje" && periodo !== "total") {
    const inicioAnterior =
      periodo === "semana"
        ? daysAgoISO(13)
        : daysAgoISO(59);

    const fimAnterior =
      periodo === "semana"
        ? daysAgoISO(7)
        : daysAgoISO(30);

    const anteriorRaw = await StudyEntry.findOne({
      where: {
        user_id: userId,
        data: { [Op.between]: [inicioAnterior, fimAnterior] }
      },
      attributes: [
        [sequelize.fn("SUM", sequelize.col("horas")), "horas"]
      ],
      raw: true
    });

    const horasAnterior = Number(anteriorRaw?.horas) || 0;
    horasDiff = horas - horasAnterior;
  }

  /* =========================
     RENDER
  ========================= */
  res.render("app/dashboard", {
    active: "dashboard",

    // 🔥 PADRÃO DO KMed
    userNome,
    userFoto,

    periodo,

    streakAtual,
    streakSemana,

    stats: {
      horas,
      questoes,
      taxa,
      dias,
      horasDiff
    },

    evolucao
  });
};
