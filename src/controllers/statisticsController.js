const { StudyEntry, Subject, Topic, Subtopic, StudyGoal, ReviewHistory } = require("../models");
const sequelize = require("../config/database");
const { Op, fn, col } = require("sequelize");

// =========================
// HELPERS
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

  if (period === "week") {
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    return start;
  }

  if (period === "month") {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  return null;
}

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

// =========================
// CALCULAR STREAK
// =========================
async function calcStreak(userId) {
  const diasEstudadosRaw = await StudyEntry.findAll({
    where: { user_id: userId },
    attributes: ["data"],
    group: ["data"],
    order: [["data", "DESC"]],
    raw: true
  });

  const diasEstudadosSet = new Set(diasEstudadosRaw.map(d => d.data));
  const hoje = todayISO();

  let streakAtual = 0;
  const hojeDate = parseLocalDate(hoje);

  for (let i = 0; i < 365; i++) {
    const d = new Date(hojeDate);
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);

    if (diasEstudadosSet.has(iso)) {
      streakAtual++;
    } else {
      if (i === 0) continue;
      break;
    }
  }

  return streakAtual;
}

// =========================
// ESTATÍSTICAS POR PERÍODO
// =========================
async function calcByPeriod(userId, dateLimit) {
  const where = { user_id: userId };

  if (dateLimit) {
    where.data = { [Op.gte]: dateLimit };
  }

  const [row] = await StudyEntry.findAll({
    where,
    attributes: [
      [fn("SUM", col("horas")), "horas"],
      [fn("SUM", col("questoes")), "questoes"],
      [fn("SUM", col("acertos")), "acertos"]
    ],
    raw: true
  });

  return calcStats(row || {});
}

// =========================
// DIAS ESTUDADOS NO PERÍODO
// =========================
async function calcDiasEstudados(userId, dateLimit) {
  const where = { user_id: userId };

  if (dateLimit) {
    where.data = { [Op.gte]: dateLimit };
  }

  const diasRaw = await StudyEntry.findAll({
    where,
    attributes: ["data"],
    group: ["data"],
    raw: true
  });

  return diasRaw.length;
}

// =========================
// EVOLUÇÃO (ÚLTIMOS 30 DIAS)
// =========================
async function calcEvolucao(userId, days = 30) {
  const inicio = daysAgoISO(days - 1);
  const hoje = todayISO();

  const evolucaoRaw = await StudyEntry.findAll({
    where: {
      user_id: userId,
      data: { [Op.between]: [inicio, hoje] }
    },
    attributes: [
      "data",
      [fn("SUM", col("horas")), "horas"],
      [fn("SUM", col("questoes")), "questoes"],
      [fn("SUM", col("acertos")), "acertos"]
    ],
    group: ["data"],
    order: [["data", "ASC"]],
    raw: true
  });

  return evolucaoRaw.map(d => ({
    data: d.data,
    label: parseLocalDate(d.data).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    horas: Number(d.horas) || 0,
    questoes: Number(d.questoes) || 0,
    acertos: Number(d.acertos) || 0
  }));
}

// =========================
// POR DIA DA SEMANA
// =========================
async function calcPorDiaSemana(userId) {
  const diasSemanaRaw = await StudyEntry.findAll({
    where: { user_id: userId },
    attributes: [
      [fn("DAYOFWEEK", col("data")), "dia"],
      [fn("SUM", col("horas")), "horas"],
      [fn("SUM", col("questoes")), "questoes"]
    ],
    group: [fn("DAYOFWEEK", col("data"))],
    raw: true
  });

  const horasPorDia = [0, 0, 0, 0, 0, 0, 0];
  const questoesPorDia = [0, 0, 0, 0, 0, 0, 0];

  diasSemanaRaw.forEach(d => {
    const dia = parseInt(d.dia) - 1;
    horasPorDia[dia] = Number(d.horas) || 0;
    questoesPorDia[dia] = Number(d.questoes) || 0;
  });

  return { horasPorDia, questoesPorDia };
}

// =========================
// POR DIFICULDADE
// =========================
async function calcPorDificuldade(userId, dateLimit) {
  const where = { user_id: userId };

  if (dateLimit) {
    where.data = { [Op.gte]: dateLimit };
  }

  const porDificuldade = await StudyEntry.findAll({
    where,
    attributes: [
      "dificuldade",
      [fn("SUM", col("questoes")), "questoes"],
      [fn("SUM", col("acertos")), "acertos"]
    ],
    group: ["dificuldade"],
    raw: true
  });

  const resultado = {
    MUITO_FACIL: { questoes: 0, acertos: 0 },
    FACIL: { questoes: 0, acertos: 0 },
    MEDIA: { questoes: 0, acertos: 0 },
    DIFICIL: { questoes: 0, acertos: 0 },
    MUITO_DIFICIL: { questoes: 0, acertos: 0 }
  };

  porDificuldade.forEach(d => {
    if (resultado[d.dificuldade]) {
      resultado[d.dificuldade] = {
        questoes: Number(d.questoes) || 0,
        acertos: Number(d.acertos) || 0
      };
    }
  });

  return resultado;
}

// =========================
// METAS ATIVAS COM PROGRESSO
// =========================
async function calcMetas(userId) {
  const hoje = todayISO();

  const metasRaw = await StudyGoal.findAll({
    where: {
      user_id: userId,
      status: "ativa"
    },
    order: [["data_limite", "ASC"]],
    raw: true
  });

  const metas = [];

  for (const meta of metasRaw) {
    const estudos = await StudyEntry.findAll({
      where: {
        user_id: userId,
        data: { [Op.between]: [meta.data_inicio, hoje > meta.data_limite ? meta.data_limite : hoje] }
      },
      attributes: [
        [fn("SUM", col("horas")), "horas"],
        [fn("SUM", col("questoes")), "questoes"]
      ],
      raw: true
    });

    const horasConcluidas = Number(estudos[0]?.horas) || 0;
    const questoesConcluidas = Number(estudos[0]?.questoes) || 0;

    metas.push({
      id: meta.id,
      nome: meta.nome,
      meta_horas: Number(meta.meta_horas),
      meta_questoes: meta.meta_questoes,
      horasConcluidas,
      questoesConcluidas,
      data_limite: meta.data_limite,
      progresso_horas: Math.min(Math.round((horasConcluidas / Number(meta.meta_horas)) * 100), 100),
      progresso_questoes: meta.meta_questoes > 0
        ? Math.min(Math.round((questoesConcluidas / meta.meta_questoes) * 100), 100)
        : 100,
      dias_restantes: Math.max(0, Math.ceil((new Date(meta.data_limite) - new Date(hoje)) / (1000 * 60 * 60 * 24)))
    });
  }

  return metas;
}

// =========================
// REVISÕES
// =========================
async function calcRevisoes(userId) {
  const totalRevisoes = await ReviewHistory.count({
    where: { user_id: userId }
  });

  const revisoesPorMateria = await ReviewHistory.findAll({
    where: { user_id: userId },
    attributes: [
      "subject_id",
      [fn("COUNT", col("ReviewHistory.id")), "total"]
    ],
    include: [{ model: Subject, as: "subject", attributes: ["id", "nome"] }],
    group: ["subject_id", "subject.id"],
    raw: false
  });

  return {
    total: totalRevisoes,
    porMateria: revisoesPorMateria.map(r => ({
      nome: r.subject?.nome || "Sem matéria",
      total: Number(r.get("total"))
    }))
  };
}

// =========================
// CONQUISTAS
// =========================
async function calcConquistas(userId) {
  const conquistas = [];
  const progresso = [];

  // Total de horas
  const statsTotal = await StudyEntry.findOne({
    where: { user_id: userId },
    attributes: [
      [fn("SUM", col("horas")), "horas"],
      [fn("SUM", col("questoes")), "questoes"]
    ],
    raw: true
  });

  const horasTotal = Number(statsTotal?.horas) || 0;
  const questoesTotal = Number(statsTotal?.questoes) || 0;

  // streak
  const streak = await calcStreak(userId);

  // Total de dias estudados
  const diasRaw = await StudyEntry.findAll({
    where: { user_id: userId },
    attributes: ["data"],
    group: ["data"],
    raw: true
  });
  const diasTotal = diasRaw.length;

  // Total de revisões
  const totalRevisoes = await ReviewHistory.count({
    where: { user_id: userId }
  });

  // Taxa de acertos
  const taxaGeral = questoesTotal > 0
    ? Math.round((Number(statsTotal?.acertos) || 0) / questoesTotal * 100)
    : 0;

  // Conquistas de horas
  if (horasTotal >= 10) conquistas.push({ icone: "🌱", titulo: "Primeiros Passos", desc: "10h estudadas" });
  if (horasTotal >= 50) conquistas.push({ icone: "📚", titulo: "Dedicado", desc: "50h estudadas" });
  if (horasTotal >= 100) conquistas.push({ icone: "⏰", titulo: "Cem Horas", desc: "100h estudadas" });
  if (horasTotal >= 250) conquistas.push({ icone: "🎓", titulo: "Mestre", desc: "250h estudadas" });
  if (horasTotal >= 500) conquistas.push({ icone: "🏆", titulo: "Lenda", desc: "500h estudadas" });
  else if (horasTotal >= 100) progresso.push({ icone: "🏆", titulo: "Lenda", atual: horasTotal, meta: 500 });

  // Conquistas de streak
  if (streak >= 7) conquistas.push({ icone: "🔥", titulo: "Semana de Ouro", desc: "7 dias seguidos" });
  if (streak >= 30) conquistas.push({ icone: "⚡", titulo: "Mês de Ferro", desc: "30 dias seguidos" });
  if (streak >= 100) conquistas.push({ icone: "👑", titulo: "Lenda", desc: "100 dias seguidos" });
  else if (streak >= 7) progresso.push({ icone: "👑", titulo: "Lenda", atual: streak, meta: 100 });

  // Conquistas de questões
  if (questoesTotal >= 100) conquistas.push({ icone: "✏️", titulo: "Praticante", desc: "100 questões" });
  if (questoesTotal >= 500) conquistas.push({ icone: "📝", titulo: "Questionador", desc: "500 questões" });
  if (questoesTotal >= 1000) conquistas.push({ icone: "🧠", titulo: "Cérebros em Fogo", desc: "1000 questões" });
  else if (questoesTotal >= 500) progresso.push({ icone: "🧠", titulo: "Cérebros em Fogo", atual: questoesTotal, meta: 1000 });

  // Conquistas de dias
  if (diasTotal >= 7) conquistas.push({ icone: "📅", titulo: "Semana Completa", desc: "7 dias estudados" });
  if (diasTotal >= 30) conquistas.push({ icone: "🗓️", titulo: "Mês de Estudos", desc: "30 dias estudados" });

  // Conquistas de revisões
  if (totalRevisoes >= 10) conquistas.push({ icone: "🔄", titulo: "Revisor", desc: "10 revisões" });
  if (totalRevisoes >= 50) conquistas.push({ icone: "📖", titulo: "Mestre da Revisão", desc: "50 revisões" });

  // Conquistas de taxa
  if (taxaGeral >= 70) conquistas.push({ icone: "🎓", titulo: "Alto Rendimento", desc: "70%+ aproveitamento" });
  if (taxaGeral >= 90) conquistas.push({ icone: "🌟", titulo: "Gênio", desc: "90%+ aproveitamento" });

  return { conquistas, progresso, streak, diasTotal, horasTotal, questoesTotal, taxaGeral, totalRevisoes };
}

// =========================
// PÁGINA PRINCIPAL
// =========================
exports.geral = async (req, res) => {
  const userId = req.session.userId;

  // Período atual (padrão: semana)
  const period = req.query.period || "week";
  const dateLimit = getDateLimit(period);

  // Stats por período
  const statsPeriodo = await calcByPeriod(userId, dateLimit);

  // Stats totais
  const statsTotal = await calcByPeriod(userId, null);

  // Streak
  const streak = await calcStreak(userId);

  // Dias estudados
  const diasEstudados = await calcDiasEstudados(userId, dateLimit);
  const diasTotal = await calcDiasEstudados(userId, null);

  // Evolução
  const evolucao = await calcEvolucao(userId, 30);

  // Por dia da semana
  const { horasPorDia, questoesPorDia } = await calcPorDiaSemana(userId);

  // Por dificuldade
  const porDificuldade = await calcPorDificuldade(userId, dateLimit);

  // Metas
  const metas = await calcMetas(userId);

  // Revisões
  const revisoes = await calcRevisoes(userId);

  // Conquistas
  const conquistas = await calcConquistas(userId);

  res.render("app/statistics", {
    active: "estatisticas",
    userNome: req.session.userNome,
    userFoto: req.session.userFoto,

    // Período atual
    period,

    // Stats do período
    stats: {
      horas: statsPeriodo.horas,
      questoes: statsPeriodo.questoes,
      acertos: statsPeriodo.acertos,
      erros: statsPeriodo.erros,
      aproveitamento: statsPeriodo.aproveitamento
    },

    // Stats totais
    total: {
      horas: statsTotal.horas,
      questoes: statsTotal.questoes,
      acertos: statsTotal.acertos,
      erros: statsTotal.erros,
      aproveitamento: statsTotal.aproveitamento
    },

    // Streak e dias
    streak,
    diasEstudados,
    diasTotal,

    // Evolução
    evolucao,

    // Por dia da semana
    horasPorDia,
    questoesPorDia,

    // Por dificuldade
    porDificuldade,

    // Metas
    metas,

    // Revisões
    revisoes,

    // Conquistas
    conquistas: conquistas.conquistas,
    conquistasProgresso: conquistas.progresso,
    streakGeral: conquistas.streak,
    horasTotal: conquistas.horasTotal,
    questoesTotal: conquistas.questoesTotal,
    taxaGeral: conquistas.taxaGeral,
    totalRevisoes: conquistas.totalRevisoes
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

