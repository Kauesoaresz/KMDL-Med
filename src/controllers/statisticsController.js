const { StudyEntry, Subject, Topic, StudyGoal } = require("../models");
const { Op, fn, col } = require("sequelize");

// =========================
// HELPERS
// =========================

// Helper function to convert decimal hours to "Xh Ymin" format
function formatHoursMinutes(decimalHours) {
  if (!decimalHours || decimalHours <= 0) return "0h 0min";
  
  const horas = Math.floor(decimalHours);
  const minutos = Math.round((decimalHours - horas) * 60);
  
  if (horas === 0) {
    return `${minutos}min`;
  }
  
  if (minutos === 0) {
    return `${horas}h`;
  }
  
  return `${horas}h ${minutos}min`;
}

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
// ESTATÍSTICAS POR MATÉRIA
// =========================
async function calcEstatisticasConteudo(userId, period) {
  const dateLimit = getDateLimit(period);
  const where = { user_id: userId };

  if (dateLimit) {
    where.data = { [Op.gte]: dateLimit };
  }

  const subjects = await Subject.findAll({
    where: { user_id: userId },
    order: [["nome", "ASC"]],
    raw: true
  });

  const materias = [];
  let totalTopics = 0;

  // Para cada matéria, buscar estatísticas
  for (const subject of subjects) {
    const subjectWhere = { ...where, subject_id: subject.id };

    // Estatísticas da matéria
    const [stats] = await StudyEntry.findAll({
      where: subjectWhere,
      attributes: [
        [fn("SUM", col("horas")), "horas"],
        [fn("SUM", col("questoes")), "questoes"],
        [fn("SUM", col("acertos")), "acertos"]
      ],
      raw: true
    });

    const horas = Number(stats?.horas) || 0;
    const questoes = Number(stats?.questoes) || 0;
    const acertos = Number(stats?.acertos) || 0;
    const erros = questoes - acertos;
    const aproveitamento = questoes > 0 ? Math.round((acertos / questoes) * 100) : 0;

    // Dias estudados nessa matéria
    const diasRaw = await StudyEntry.findAll({
      where: subjectWhere,
      attributes: ["data"],
      group: ["data"],
      raw: true
    });
    const dias_estudados = diasRaw.length;

    // Último estudo
    const ultimoStudy = await StudyEntry.findOne({
      where: subjectWhere,
      attributes: ["data"],
      order: [["data", "DESC"]],
      raw: true
    });

    // Só adicionar se tiver estudo no período
    if (horas > 0 || questoes > 0) {
      // Buscar tópicos dessa matéria
      const topics = await Topic.findAll({
        where: { subject_id: subject.id },
        order: [["nome", "ASC"]],
        raw: true
      });

      const topicos = [];
      let topicsCount = 0;

      for (const topic of topics) {
        const topicWhere = { ...where, topic_id: topic.id };

        const [topicStats] = await StudyEntry.findAll({
          where: topicWhere,
          attributes: [
            [fn("SUM", col("horas")), "horas"],
            [fn("SUM", col("questoes")), "questoes"],
            [fn("SUM", col("acertos")), "acertos"]
          ],
          raw: true
        });

        const topicHoras = Number(topicStats?.horas) || 0;
        const topicQuestoes = Number(topicStats?.questoes) || 0;
        const topicAcertos = Number(topicStats?.acertos) || 0;
        const topicAproveitamento = topicQuestoes > 0 ? Math.round((topicAcertos / topicQuestoes) * 100) : 0;

        if (topicHoras > 0 || topicQuestoes > 0) {
          topicos.push({
            id: topic.id,
            nome: topic.nome,
            horas: topicHoras,
            questoes: topicQuestoes,
            acertos: topicAcertos,
            erros: topicQuestoes - topicAcertos,
            aproveitamento: topicAproveitamento
          });
          topicsCount++;
        }
      }

      totalTopics += topicsCount;

      materias.push({
        id: subject.id,
        nome: subject.nome,
        horas,
        questoes,
        acertos,
        erros,
        aproveitamento,
        dias_estudados,
        ultimo_study: ultimoStudy?.data || null,
        topicos,
        perc_horas: 0 // será calculado depois
      });
    }
  }

  // Calcular total de horas para percentuais
  const totalHoras = materias.reduce((sum, m) => sum + m.horas, 0);
  materias.forEach(m => {
    m.perc_horas = totalHoras > 0 ? Math.round((m.horas / totalHoras) * 100) : 0;
  });

  // Rankings
  const rankingMelhores = [...materias].sort((a, b) => b.aproveitamento - a.aproveitamento);
  const rankingAtencao = [...materias].sort((a, b) => a.aproveitamento - b.aproveitamento);
  const rankingHoras = [...materias].sort((a, b) => b.horas - a.horas);
  const rankingQuestoes = [...materias].sort((a, b) => b.questoes - a.questoes);

  // Média geral
  const mediaGeral = materias.length > 0
    ? Math.round(materias.reduce((sum, m) => sum + m.aproveitamento, 0) / materias.length)
    : 0;

  return { materias, totalTopics, rankingMelhores, rankingAtencao, rankingHoras, rankingQuestoes, mediaGeral };
}

// =========================
// EVOLUÇÃO POR MATÉRIA (ÚLTIMOS 30 DIAS)
// =========================
async function calcEvolucaoPorMateria(userId, days = 30) {
  const inicio = daysAgoISO(days - 1);
  const hoje = todayISO();

  const evolucaoRaw = await StudyEntry.findAll({
    where: {
      user_id: userId,
      data: { [Op.between]: [inicio, hoje] }
    },
    attributes: [
      "data",
      "subject_id",
      [fn("SUM", col("horas")), "horas"],
      [fn("SUM", col("questoes")), "questoes"],
      [fn("SUM", col("acertos")), "acertos"]
    ],
    group: ["data", "subject_id"],
    order: [["data", "ASC"]],
    raw: true
  });

  return evolucaoRaw.map(d => ({
    data: d.data,
    subject_id: d.subject_id,
    horas: Number(d.horas) || 0,
    questoes: Number(d.questoes) || 0,
    acertos: Number(d.acertos) || 0
  }));
}

// =========================
// PÁGINA PRINCIPAL
// =========================
exports.geral = async (req, res) => {
  const userId = req.session.userId;

  // Período atual (padrão: total)
  const period = req.query.period || "all";
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

  // Metas
  const metas = await calcMetas(userId);

  res.render("app/estatisticas-estudos", {
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

    // Metas
    metas,

        // Resumo geral (reaproveita o que já foi calculado)
    horasTotal: statsTotal.horas,
    questoesTotal: statsTotal.questoes,
    taxaGeral: statsTotal.aproveitamento,
    streakGeral: streak,

  });
};

// =========================
// ESTATÍSTICAS DE CONTEÚDO
// =========================
exports.conteudo = async (req, res) => {
  const userId = req.session.userId;

  // Período atual (padrão: total)
  const period = req.query.period || "all";
  const dateLimit = getDateLimit(period);

  // Stats por período
  const statsPeriodo = await calcByPeriod(userId, dateLimit);

  // Stats totais
  const statsTotal = await calcByPeriod(userId, null);

  // Estatísticas de conteúdo
  const conteudo = await calcEstatisticasConteudo(userId, period);

  // Evolução por matéria
  const evolucao = await calcEvolucaoPorMateria(userId, 30);

  res.render("app/estatisticas-conteudo", {
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

    // Matérias e rankings
    materias: conteudo.materias,
    totalTopics: conteudo.totalTopics,
    mediaGeral: conteudo.mediaGeral,
    rankingMelhores: conteudo.rankingMelhores,
    rankingAtencao: conteudo.rankingAtencao,
    rankingHoras: conteudo.rankingHoras,
    rankingQuestoes: conteudo.rankingQuestoes,

    // Evolução
    evolucao
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
// DETALHES DE MATÉRIA ESPECÍFICA
// =========================
exports.detalhesMateria = async (req, res) => {
  const userId = req.session.userId;
  const subjectId = req.params.id;
  const period = req.query.period || "all";
  const dateLimit = getDateLimit(period);

  // Buscar a matéria
  const materia = await Subject.findOne({
    where: { id: subjectId, user_id: userId },
    raw: true
  });

  if (!materia) {
    return res.redirect("/estatisticas/conteudo/dashboard");
  }

  const where = { user_id: userId, subject_id: subjectId };
  if (dateLimit) {
    where.data = { [Op.gte]: dateLimit };
  }

  // Estatísticas da matéria
  const [stats] = await StudyEntry.findAll({
    where,
    attributes: [
      [fn("SUM", col("horas")), "horas"],
      [fn("SUM", col("questoes")), "questoes"],
      [fn("SUM", col("acertos")), "acertos"]
    ],
    raw: true
  });

  const horas = Number(stats?.horas) || 0;
  const questoes = Number(stats?.questoes) || 0;
  const acertos = Number(stats?.acertos) || 0;
  const erros = questoes - acertos;
  const aproveitamento = questoes > 0 ? Math.round((acertos / questoes) * 100) : 0;

  // Dias estudados
  const diasRaw = await StudyEntry.findAll({
    where,
    attributes: ["data"],
    group: ["data"],
    raw: true
  });
  const dias_estudados = diasRaw.length;

  // Último estudo
  const ultimoStudy = await StudyEntry.findOne({
    where,
    attributes: ["data"],
    order: [["data", "DESC"]],
    raw: true
  });

  // Buscar TODOS os tópicos da matéria
  const topics = await Topic.findAll({
    where: { subject_id: subjectId },
    order: [["nome", "ASC"]],
    raw: true
  });

  const topicos = [];
  let totalTopicsCount = 0;

    for (const topic of topics) {
    const topicWhere = { ...where, topic_id: topic.id };

    const [topicStats] = await StudyEntry.findAll({
      where: topicWhere,
      attributes: [
        [fn("SUM", col("horas")), "horas"],
        [fn("SUM", col("questoes")), "questoes"],
        [fn("SUM", col("acertos")), "acertos"]
      ],
      raw: true
    });

    const topicHoras = Number(topicStats?.horas) || 0;
    const topicQuestoes = Number(topicStats?.questoes) || 0;
    const topicAcertos = Number(topicStats?.acertos) || 0;
    const topicAproveitamento = topicQuestoes > 0 ? Math.round((topicAcertos / topicQuestoes) * 100) : 0;

    if (topicHoras > 0 || topicQuestoes > 0) {
      topicos.push({
        id: topic.id,
        nome: topic.nome,
        horas: topicHoras,
        questoes: topicQuestoes,
        acertos: topicAcertos,
        erros: topicQuestoes - topicAcertos,
        aproveitamento: topicAproveitamento,
        assuntos: [] // TEMPORÁRIO: a view ainda pode iterar sobre isso
      });
      totalTopicsCount++;
    }
  }

  res.render("app/estatisticas-conteudo-detalhes", {
    active: "estatisticas",
    userNome: req.session.userNome,
    userFoto: req.session.userFoto,
    materia: {
      ...materia,
      horas,
      questoes,
      acertos,
      erros,
      aproveitamento,
      dias_estudados,
      ultimo_study: ultimoStudy?.data || null,
      topicos
    },
    period
  });
};


