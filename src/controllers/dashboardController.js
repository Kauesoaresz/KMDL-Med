const { StudyEntry, Subject, Topic, Simulado, SimuladoBloco, StudyGoal } = require("../models");
const { Op, fn, col } = require("sequelize");
const sequelize = require("../config/database");

/* =========================
   HELPER: Atualizar progresso de meta
========================= */
async function atualizarProgressoMeta(goal) {
  const hoje = todayISO();
  
  // Buscar todos os estudos a partir da data de início
  const estudos = await StudyEntry.findAll({
    where: {
      user_id: goal.user_id,
      data: { [Op.gte]: goal.data_inicio }
    },
    attributes: [
      [fn("SUM", col("horas")), "horas"],
      [fn("SUM", col("questoes")), "questoes"]
    ],
    raw: true
  });

  const horasConcluidas = Number(estudos[0]?.horas) || 0;
  const questoesConcluidas = Number(estudos[0]?.questoes) || 0;

  // Atualizar o registro da meta
  goal.horas_concluidas = horasConcluidas;
  goal.questoes_concluidas = questoesConcluidas;

  // Verificar se a meta foi concluída
  const horasConcluidasMeta = horasConcluidas >= goal.meta_horas;
  const questoesConcluidasMeta = goal.meta_questoes > 0 
    ? questoesConcluidas >= goal.meta_questoes 
    : true;

  // Se passaram da data limite e não concluiu
  if (hoje > goal.data_limite && (!horasConcluidasMeta || !questoesConcluidasMeta)) {
    goal.status = "vencida";
  }

  // Se completou todas as metas
  if (horasConcluidasMeta && questoesConcluidasMeta && goal.status === "ativa") {
    goal.status = "concluida";
    goal.data_conclusao = hoje;
  }

  await goal.save();
  return goal;
}

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
  const filtros = ["hoje", "semana", "mês", "total"];

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

  // Criar conjunto para busca rápida
  const diasEstudadosSet = new Set(diasEstudadosRaw.map(d => d.data));

  let streakAtual = 0;
  let streakSemana = [];

  const hojeDate = parseLocalDate(hoje);

  // Calcular streak atual (dias consecutivos até hoje)
  // Começa por hoje e vai para trás
  for (let i = 0; i < 365; i++) {
    const d = new Date(hojeDate);
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);

    if (diasEstudadosSet.has(iso)) {
      streakAtual++;
    } else {
      // Se não estudou hoje, verifica se foi ontem para continuar o streak
      if (i === 0) {
        // Hoje não estudou ainda, mas pode ter estudado ontem
        continue;
      }
      // Quebrou a sequência
      break;
    }
  }

  // streakSemana: últimos 7 dias (de 6 dias atrás até hoje)
  for (let i = 6; i >= 0; i--) {
    const d = new Date(hojeDate);
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    streakSemana.push(diasEstudadosSet.has(iso));
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
     MINI CALENDÁRIO (DIAS DO MÊS ATUAL)
  ========================= */
  const anoAtual = new Date().getFullYear();
  const mesAtual = new Date().getMonth();
  const primeiroDiaMes = new Date(anoAtual, mesAtual, 1);
  const ultimoDiaMes = new Date(anoAtual, mesAtual + 1, 0);
  const diasNoMes = ultimoDiaMes.getDate();
  
  const diasCalendario = [];
  for (let d = 1; d <= diasNoMes; d++) {
    const dataISO = `${anoAtual}-${String(mesAtual + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const estudoDia = evolucaoRaw.find(e => e.data === dataISO);
    diasCalendario.push({
      dia: d,
      dataISO: dataISO,
      horas: estudoDia ? Number(estudoDia.horas) : 0,
      hoje: dataISO === hoje
    });
  }

  /* =========================
     SIMULADOS (ÚLTIMO + MÉDIA + DETALHES POR ÁREA)
  ========================= */
  const simuladosRaw = await Simulado.findAll({
    where: { user_id: userId, status: "finalizado" },
    order: [["data_realizacao", "DESC"]],
    limit: 5,
    raw: true
  });

  // Calcular média das notas dos simulados
  let mediaSimulados = 0;
  let ultimoSimulado = null;
  let ultimoSimuladoBlocos = [];
  
  if (simuladosRaw.length > 0) {
    // Buscar blocos para calcular nota (corrigido: total_questoes)
    const simuladoIds = simuladosRaw.map(s => s.id);
    const blocos = await SimuladoBloco.findAll({
      where: { simulado_id: { [Op.in]: simuladoIds } },
      attributes: ["simulado_id", "area", "acertos", "total_questoes", "tempo_minutos"],
      raw: true
    });

    // Calcular nota de cada simulado com mais detalhes
    const notasSimulados = simuladosRaw.map(sim => {
      const blocosSimulado = blocos.filter(b => b.simulado_id === sim.id);
      const totalAcertos = blocosSimulado.reduce((sum, b) => sum + (b.acertos || 0), 0);
      const totalQuestoes = blocosSimulado.reduce((sum, b) => sum + (b.total_questoes || 0), 0);
      const tempoTotal = blocosSimulado.reduce((sum, b) => sum + (b.tempo_minutos || 0), 0);
      return {
        nota: totalQuestoes > 0 ? Math.round((totalAcertos / totalQuestoes) * 100) : 0,
        acertos: totalAcertos,
        questoes: totalQuestoes,
        tempo: tempoTotal
      };
    });

    mediaSimulados = Math.round(notasSimulados.reduce((a, b) => a + b.nota, 0) / notasSimulados.length);
    
    // Último simulado com detalhes completos
    ultimoSimulado = {
      nome: simuladosRaw[0].nome,
      data: simuladosRaw[0].data_realizacao,
      nota: notasSimulados[0].nota,
      acertos: notasSimulados[0].acertos,
      questoes: notasSimulados[0].questoes,
      tempo: notasSimulados[0].tempo
    };

    // Buscar detalhes por área do último simulado
    const blocosUltimo = blocos.filter(b => b.simulado_id === simuladosRaw[0].id);
    
    // Mapeamento de áreas para nomes amigáveis
    const areaNomes = {
      'linguagens': 'Linguagens',
      'humanas': 'Humanas',
'naturezas': 'Naturezas',
      'matematica': 'Matemática'
    };

    // Cores para cada área
    const areaCores = {
      'linguagens': '#a78bfa',
      'humanas': '#f0c75e',
      'naturezas': '#4da3ff',
      'matematica': '#2ee59d'
    };

    ultimoSimuladoBlocos = blocosUltimo.map(bloco => ({
      area: areaNomes[bloco.area] || bloco.area,
      areaKey: bloco.area,
      cor: areaCores[bloco.area] || '#6b7280',
      acertos: bloco.acertos || 0,
      totalQuestoes: bloco.total_questoes || 0,
      nota: bloco.total_questoes > 0 ? Math.round((bloco.acertos / bloco.total_questoes) * 100) : 0,
      tempo: bloco.tempo_minutos || 0
    }));
  }

  /* =========================
     ESTATÍSTICAS POR MATÉRIA (GRÁFICO ROSCA)
  ========================= */
  // Cores para as matérias (cores fixas em ordem)
  const coresMaterias = [
    "#2ee59d", "#4da3ff", "#f0c75e", "#a78bfa", "#ef4444",
    "#22c55e", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899"
  ];

  const porMateriaRaw = await StudyEntry.findAll({
    where: { user_id: userId },
    attributes: [
      "subject_id",
      [fn("SUM", col("horas")), "horas"],
      [fn("SUM", col("questoes")), "questoes"],
      [fn("SUM", col("acertos")), "acertos"]
    ],
    include: [
      { model: Subject, as: "subject", attributes: ["id", "nome"] }
    ],
    group: ["subject_id"],
    raw: false
  });

  const porMateria = porMateriaRaw.map((m, index) => ({
    id: m.subject_id,
    nome: m.subject?.nome || "Sem matéria",
    cor: coresMaterias[index % coresMaterias.length],
    horas: Number(m.get("horas")) || 0,
    questoes: Number(m.get("questoes")) || 0,
    acertos: Number(m.get("acertos")) || 0,
    taxa: Number(m.get("questoes")) > 0 
      ? Math.round((Number(m.get("acertos")) / Number(m.get("questoes"))) * 100) 
      : 0
  })).sort((a, b) => b.horas - a.horas);

  /* =========================
     POR DIA DA SEMANA (GRÁFICO BARRAS)
  ========================= */
  const diasSemanaRaw = await StudyEntry.findAll({
    where: { user_id: userId },
    attributes: [
      [fn("DAYOFWEEK", col("data")), "dia"],
      [fn("SUM", col("horas")), "horas"]
    ],
    group: [fn("DAYOFWEEK", col("data"))],
    raw: true
  });

  // Agregar por dia da semana (0 = domingo, 6 = sábado)
  const horasPorDia = [0, 0, 0, 0, 0, 0, 0];
  diasSemanaRaw.forEach(d => {
    const dia = parseInt(d.dia) - 1; // MySQL: 1=domingo, 7=sábado
    horasPorDia[dia] = Number(d.horas) || 0;
  });

  const diasSemanaLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  /* =========================
     META DIÁRIA
  ========================= */
  const metaDiaria = 4; // horas padrão
  const estudoHojeRaw = await StudyEntry.findOne({
    where: { user_id: userId, data: hoje },
    attributes: [[fn("SUM", col("horas")), "horas"]],
    raw: true
  });
  const horasHoje = Number(estudoHojeRaw?.horas) || 0;
  const metaPercentual = Math.min(Math.round((horasHoje / metaDiaria) * 100), 100);

  /* =========================
     METAS PRINCIPAIS (para dashboard)
  ========================= */
  const metasPrincipaisRaw = await StudyGoal.findAll({
    where: {
      user_id: userId,
      eh_principal: true,
      status: "ativa"
    },
    order: [["data_limite", "ASC"]],
    limit: 4
  });

  const metasPrincipais = await Promise.all(
    metasPrincipaisRaw.map(async (meta) => {
      const atualizada = await atualizarProgressoMeta(meta);
      return {
        id: atualizada.id,
        nome: atualizada.nome,
        meta_horas: Number(atualizada.meta_horas),
        meta_questoes: atualizada.meta_questoes,
        horas_concluidas: Number(atualizada.horas_concluidas),
        questoes_concluidas: atualizada.questoes_concluidas,
        data_limite: atualizada.data_limite,
        data_limite_formatada: new Date(atualizada.data_limite).toLocaleDateString("pt-BR"),
        progresso_horas: Math.min(Math.round((Number(atualizada.horas_concluidas) / Number(atualizada.meta_horas)) * 100), 100),
        progresso_questoes: atualizada.meta_questoes > 0 
          ? Math.min(Math.round((atualizada.questoes_concluidas / atualizada.meta_questoes) * 100), 100)
          : 100,
        progresso_total: atualizada.meta_questoes > 0
          ? Math.min(Math.round(((Number(atualizada.horas_concluidas) / Number(atualizada.meta_horas)) + (atualizada.questoes_concluidas / atualizada.meta_questoes)) / 2 * 100), 100)
          : Math.min(Math.round((Number(atualizada.horas_concluidas) / Number(atualizada.meta_horas)) * 100), 100)
      };
    })
  );

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
      acertos,
      taxa,
      dias,
      horasDiff
    },
    evolucao,
    // Novas funcionalidades
    diasCalendario,
    ultimoSimulado,
    ultimoSimuladoBlocos,
    mediaSimulados,
    porMateria,
    horasPorDia,
    diasSemanaLabels,
    metaDiaria,
    horasHoje,
    metaPercentual,
    metasPrincipais,
    filtros
  });
};

