const { StudyEntry, Subject, Topic, Subtopic, StudyGoal, ReviewHistory } = require("../models");
const sequelize = require("../config/database");
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
// ESTATÍSTICAS POR MATÉRIA
// =========================
async function calcEstatisticasConteudo(userId, period) {
  const dateLimit = getDateLimit(period);
  const where = { user_id: userId };
  const whereAll = { user_id: userId };

  if (dateLimit) {
    where.data = { [Op.gte]: dateLimit };
  }

  // Buscar todas as matérias do usuário
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
    const subjectWhereAll = { ...whereAll, subject_id: subject.id };

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
// ESTATÍSTICAS REDAÇÃO
// =========================
async function calcEstatisticasRedacao(userId, period) {
  const redacaoSubject = await Subject.findOne({
    where: { user_id: userId, nome: 'Redação' }
  });

  if (!redacaoSubject) {
    return {
      total: 0,
      horas: 0,
      mediaNota: 0,
      notaMin: null,
      notaMax: null,
      totalCompetencias: 0,
      mediaCompetencias: 0,
      mediaC1: null,
      mediaC2: null,
      mediaC3: null,
      mediaC4: null,
      mediaC5: null,
      ultimasRedacoes: []
    };
  }

  const dateLimit = getDateLimit(period);
  const redacaoWhere = {
    user_id: userId,
    subject_id: redacaoSubject.id,
    [Op.or]: [
      { redacao_nota: { [Op.ne]: null } },
      { c1: { [Op.ne]: null } },
      { c2: { [Op.ne]: null } },
      { c3: { [Op.ne]: null } },
      { c4: { [Op.ne]: null } },
      { c5: { [Op.ne]: null } }
    ]
  };

  if (dateLimit) {
    redacaoWhere.data = { [Op.gte]: dateLimit };
  }

  const [summary] = await StudyEntry.findAll({
    where: redacaoWhere,
    attributes: [
      [fn('COUNT', col('id')), 'total_redacoes'],
      [fn('SUM', col('horas')), 'horas'],
      [fn('AVG', col('redacao_nota')), 'media_nota'],
      [fn('MIN', col('redacao_nota')), 'nota_min'],
      [fn('MAX', col('redacao_nota')), 'nota_max'],
      [fn('SUM', col('redacao_total_competencias')), 'total_competencias'],
      [fn('AVG', col('redacao_media_competencias')), 'media_competencias'],
      [fn('AVG', col('c1')), 'media_c1'],
      [fn('AVG', col('c2')), 'media_c2'],
      [fn('AVG', col('c3')), 'media_c3'],
      [fn('AVG', col('c4')), 'media_c4'],
      [fn('AVG', col('c5')), 'media_c5']
    ],
    raw: true
  });

  const ultimasRedacoesRaw = await StudyEntry.findAll({
    where: redacaoWhere,
    order: [['data', 'DESC']],
    limit: 20,
    include: [{ model: Topic, as: 'topic', attributes: ['nome'] }],
    raw: false
  });

  const ultimasRedacoes = ultimasRedacoesRaw.map(r => ({
    data: r.data,
    tema: r.tema || 'Não informado',
    estilo: r.topic?.nome || 'Redação',
    nota: r.redacao_nota != null ? r.redacao_nota : (r.acertos != null ? r.acertos * 100 : null),
    c1: r.c1,
    c2: r.c2,
    c3: r.c3,
    c4: r.c4,
    c5: r.c5,
    totalCompetencias: r.redacao_total_competencias,
    mediaCompetencias: r.redacao_media_competencias,
    horas: r.horas
  }));

  const notasMaiores = ultimasRedacoes
    .map(r => Number(r.nota || 0))
    .filter(n => n > 0)
    .sort((a, b) => b - a);

  const metas = ultimasRedacoes.reduce((acc, r) => {
    const nota = Number(r.nota || 0);
    if (nota >= 600) acc.ate600++;
    if (nota >= 700) acc.ate700++;
    if (nota >= 800) acc.ate800++;
    return acc;
  }, { ate600: 0, ate700: 0, ate800: 0 });

  return {
    total: Number(summary?.total_redacoes || 0),
    horas: Number(summary?.horas || 0),
    mediaNota: summary?.media_nota ? Number(Number(summary.media_nota).toFixed(1)) : 0,
    notaMin: summary?.nota_min ? Number(summary.nota_min) : null,
    notaMax: summary?.nota_max ? Number(summary.nota_max) : null,
    totalCompetencias: Number(summary?.total_competencias || 0),
    mediaCompetencias: summary?.media_competencias ? Number(Number(summary.media_competencias).toFixed(1)) : 0,
    mediaC1: summary?.media_c1 ? Number(Number(summary.media_c1).toFixed(1)) : null,
    mediaC2: summary?.media_c2 ? Number(Number(summary.media_c2).toFixed(1)) : null,
    mediaC3: summary?.media_c3 ? Number(Number(summary.media_c3).toFixed(1)) : null,
    mediaC4: summary?.media_c4 ? Number(Number(summary.media_c4).toFixed(1)) : null,
    mediaC5: summary?.media_c5 ? Number(Number(summary.media_c5).toFixed(1)) : null,
    melhorNota: notasMaiores[0] || null,
    piorNota: notasMaiores.length ? notasMaiores[notasMaiores.length - 1] : null,
    porcentagem800: ultimasRedacoes.length ? Math.round((metas.ate800 / ultimasRedacoes.length) * 100) : 0,
    porcentagem700: ultimasRedacoes.length ? Math.round((metas.ate700 / ultimasRedacoes.length) * 100) : 0,
    ultimasRedacoes
  };
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

  // Por dificuldade
  const porDificuldade = await calcPorDificuldade(userId, dateLimit);

  // Metas
  const metas = await calcMetas(userId);

  // Revisões
  const revisoes = await calcRevisoes(userId);

  // Conquistas
  const conquistas = await calcConquistas(userId);

  // Redação
  const redacao = await calcEstatisticasRedacao(userId, period);

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
// REDAÇÃO
// =========================
exports.redacao = async (req, res) => {
  const userId = req.session.userId;
  const period = req.query.period || 'all';

  const redacao = await calcEstatisticasRedacao(userId, period);

  res.render('app/estatisticas-redacao', {
    active: 'estatisticas',
    userNome: req.session.userNome,
    userFoto: req.session.userFoto,
    period,
    redacao
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

    // Buscar assuntos do tópico
    const subtopics = await Subtopic.findAll({
      where: { topic_id: topic.id },
      order: [["nome", "ASC"]],
      raw: true
    });

    const assuntos = [];
    for (const subtopic of subtopics) {
      const subtopicWhere = { ...where, subtopic_id: subtopic.id };

      const [subtopicStats] = await StudyEntry.findAll({
        where: subtopicWhere,
        attributes: [
          [fn("SUM", col("horas")), "horas"],
          [fn("SUM", col("questoes")), "questoes"],
          [fn("SUM", col("acertos")), "acertos"]
        ],
        raw: true
      });

      const subHoras = Number(subtopicStats?.horas) || 0;
      const subQuestoes = Number(subtopicStats?.questoes) || 0;
      const subAcertos = Number(subtopicStats?.acertos) || 0;
      const subAproveitamento = subQuestoes > 0 ? Math.round((subAcertos / subQuestoes) * 100) : 0;

      if (subHoras > 0 || subQuestoes > 0) {
        assuntos.push({
          id: subtopic.id,
          nome: subtopic.nome,
          horas: subHoras,
          questoes: subQuestoes,
          acertos: subAcertos,
          erros: subQuestoes - subAcertos,
          aproveitamento: subAproveitamento
        });
      }
    }

    if (topicHoras > 0 || topicQuestoes > 0) {
      topicos.push({
        id: topic.id,
        nome: topic.nome,
        horas: topicHoras,
        questoes: topicQuestoes,
        acertos: topicAcertos,
        erros: topicQuestoes - topicAcertos,
        aproveitamento: topicAproveitamento,
        assuntos
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


