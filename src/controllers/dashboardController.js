const { StudyEntry } = require("../models");
const { Op } = require("sequelize");
const sequelize = require("../config/database");

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoISO(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

exports.dashboard = async (req, res) => {
  const userId = req.session.userId;

  const hoje = todayISO();
  const inicioSemana = daysAgoISO(6); // últimos 7 dias (hoje incluso)
  const inicioMes = daysAgoISO(29);   // últimos 30 dias

  // =========================
  // AGREGADOS GERAIS
  // =========================
  const totais = await StudyEntry.findOne({
    where: { user_id: userId },
    attributes: [
      [sequelize.fn("SUM", sequelize.col("horas")), "horas_total"],
      [sequelize.fn("SUM", sequelize.col("questoes")), "questoes_total"],
      [sequelize.fn("SUM", sequelize.col("acertos")), "acertos_total"]
    ],
    raw: true
  });

  const horasTotal = Number(totais?.horas_total) || 0;
  const questoesTotal = Number(totais?.questoes_total) || 0;
  const acertosTotal = Number(totais?.acertos_total) || 0;

  const taxaGeral =
    questoesTotal > 0 ? Math.round((acertosTotal / questoesTotal) * 100) : 0;

  // =========================
  // HOJE
  // =========================
  const hojeAgg = await StudyEntry.findOne({
    where: { user_id: userId, data: hoje },
    attributes: [
      [sequelize.fn("SUM", sequelize.col("horas")), "horas"],
      [sequelize.fn("SUM", sequelize.col("questoes")), "questoes"],
      [sequelize.fn("SUM", sequelize.col("acertos")), "acertos"]
    ],
    raw: true
  });

  const horasHoje = Number(hojeAgg?.horas) || 0;
  const questoesHoje = Number(hojeAgg?.questoes) || 0;

  // =========================
  // ÚLTIMOS 7 DIAS
  // =========================
  const semanaAgg = await StudyEntry.findOne({
    where: {
      user_id: userId,
      data: { [Op.between]: [inicioSemana, hoje] }
    },
    attributes: [
      [sequelize.fn("SUM", sequelize.col("horas")), "horas"],
      [sequelize.fn("SUM", sequelize.col("questoes")), "questoes"],
      [sequelize.fn("SUM", sequelize.col("acertos")), "acertos"]
    ],
    raw: true
  });

  const horasSemana = Number(semanaAgg?.horas) || 0;
  const questoesSemana = Number(semanaAgg?.questoes) || 0;
  const acertosSemana = Number(semanaAgg?.acertos) || 0;

  const taxaSemana =
    questoesSemana > 0 ? Math.round((acertosSemana / questoesSemana) * 100) : 0;

  // =========================
  // ÚLTIMOS 30 DIAS
  // =========================
  const mesAgg = await StudyEntry.findOne({
    where: {
      user_id: userId,
      data: { [Op.between]: [inicioMes, hoje] }
    },
    attributes: [
      [sequelize.fn("SUM", sequelize.col("horas")), "horas"],
      [sequelize.fn("SUM", sequelize.col("questoes")), "questoes"]
    ],
    raw: true
  });

  const horasMes = Number(mesAgg?.horas) || 0;
  const questoesMes = Number(mesAgg?.questoes) || 0;

  // =========================
  // EVOLUÇÃO (BASE PARA GRÁFICOS)
  // =========================
  const evolucaoRaw = await StudyEntry.findAll({
    where: {
      user_id: userId,
      data: { [Op.between]: [inicioMes, hoje] }
    },
    attributes: [
      "data",
      [sequelize.fn("SUM", sequelize.col("horas")), "horas"],
      [sequelize.fn("SUM", sequelize.col("questoes")), "questoes"],
      [sequelize.fn("SUM", sequelize.col("acertos")), "acertos"]
    ],
    group: ["data"],
    order: [["data", "ASC"]],
    raw: true
  });

  const evolucao = evolucaoRaw.map(d => ({
    data: d.data,
    horas: Number(d.horas) || 0,
    questoes: Number(d.questoes) || 0,
    acertos: Number(d.acertos) || 0
  }));

  // =========================
  // RENDER
  // =========================
 res.render("app/dashboard", {
  active: "dashboard",
  userNome: req.session.userNome,
  userFoto: req.session.userFoto,

  horasHoje,
  horasSemana,
  horasMes,
  horasTotal,
  questoesHoje,
  questoesSemana,
  questoesMes,
  questoesTotal,
  taxaGeral,
  taxaSemana,
  evolucao
});

};
