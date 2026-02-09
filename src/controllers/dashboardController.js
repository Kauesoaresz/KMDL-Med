const { StudyEntry } = require("../models");
const { Op } = require("sequelize");
const sequelize = require("../config/database");

/* =========================
   HELPERS DE DATA (CALENDÁRIO REAL)
========================= */
function todayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function parseLocalDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function startOfWeekISO() {
  const d = new Date();
  const day = d.getDay(); // 0 = domingo
  const diff = d.getDate() - (day === 0 ? 6 : day - 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function endOfWeekISO() {
  const d = new Date(startOfWeekISO());
  d.setDate(d.getDate() + 6);
  return d.toISOString().slice(0, 10);
}

function startOfMonthISO() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function endOfMonthISO() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1, 0);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function daysAgoISO(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

/* =========================
   DASHBOARD
========================= */
exports.dashboard = async (req, res) => {
  const userId = req.session.userId;
  const userNome = req.session.userNome;
  const userFoto = req.session.userFoto;
  const periodo = req.query.periodo || "total";

  const hoje = todayISO();

  let inicioPeriodo = null;
  let fimPeriodo = hoje;

  if (periodo === "hoje") {
    inicioPeriodo = hoje;
    fimPeriodo = hoje;
  }

  if (periodo === "semana") {
    inicioPeriodo = startOfWeekISO();
    fimPeriodo = endOfWeekISO();
  }

  if (periodo === "mes") {
    inicioPeriodo = startOfMonthISO();
    fimPeriodo = endOfMonthISO();
  }

  /* =========================
     WHERE PADRÃO
  ========================= */
  const wherePeriodo = {
    user_id: userId,
    ...(inicioPeriodo && {
      data: { [Op.between]: [inicioPeriodo, fimPeriodo] }
    })
  };

  /* =========================
     STATS PRINCIPAIS
  ========================= */
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

  const taxa = questoes > 0 ? Math.round((acertos / questoes) * 100) : 0;

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
     DIAS ESTUDADOS
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
     EVOLUÇÃO (RESPEITA FILTRO)
  ========================= */
  let inicioEvolucao = inicioPeriodo;
  let fimEvolucao = fimPeriodo;

  if (periodo === "total") {
    inicioEvolucao = daysAgoISO(29);
    fimEvolucao = hoje;
  }

  const evolucaoRaw = await StudyEntry.findAll({
    where: {
      user_id: userId,
      ...(inicioEvolucao && {
        data: { [Op.between]: [inicioEvolucao, fimEvolucao] }
      })
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

  if (periodo === "semana") {
    const inicioAnterior = parseLocalDate(inicioPeriodo);
    inicioAnterior.setDate(inicioAnterior.getDate() - 7);

    const fimAnterior = parseLocalDate(fimPeriodo);
    fimAnterior.setDate(fimAnterior.getDate() - 7);

    const anteriorRaw = await StudyEntry.findOne({
      where: {
        user_id: userId,
        data: {
          [Op.between]: [
            inicioAnterior.toISOString().slice(0, 10),
            fimAnterior.toISOString().slice(0, 10)
          ]
        }
      },
      attributes: [[sequelize.fn("SUM", sequelize.col("horas")), "horas"]],
      raw: true
    });

    horasDiff = horas - (Number(anteriorRaw?.horas) || 0);
  }

  if (periodo === "mes") {
    const inicioAnterior = new Date(startOfMonthISO());
    inicioAnterior.setMonth(inicioAnterior.getMonth() - 1);

    const fimAnterior = new Date(endOfMonthISO());
    fimAnterior.setMonth(fimAnterior.getMonth() - 1);

    const anteriorRaw = await StudyEntry.findOne({
      where: {
        user_id: userId,
        data: {
          [Op.between]: [
            inicioAnterior.toISOString().slice(0, 10),
            fimAnterior.toISOString().slice(0, 10)
          ]
        }
      },
      attributes: [[sequelize.fn("SUM", sequelize.col("horas")), "horas"]],
      raw: true
    });

    horasDiff = horas - (Number(anteriorRaw?.horas) || 0);
  }

  /* =========================
     RENDER
  ========================= */
  res.render("app/dashboard", {
    active: "dashboard",
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
