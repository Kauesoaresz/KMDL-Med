const {
  Simulado,
  SimuladoBloco,
  SimuladoQuestaoErro,
  Subject,
  Topic
} = require("../models");

const { Op } = require("sequelize");

/* =========================
   UTILS
========================= */
function percent(acertos, questoes) {
  return questoes > 0 ? Math.round((acertos / questoes) * 100) : 0;
}

function sortDesc(obj) {
  return Object.entries(obj)
    .sort((a, b) => b[1] - a[1])
    .map(([nome, total]) => ({ nome, total }));
}

function getDateLimit(periodo) {
  const now = new Date();
  switch (periodo) {
    case "30":
      return new Date(now.setDate(now.getDate() - 30));
    case "90":
      return new Date(now.setDate(now.getDate() - 90));
    case "180":
      return new Date(now.setMonth(now.getMonth() - 6));
    case "365":
      return new Date(now.setFullYear(now.getFullYear() - 1));
    default:
      return null;
  }
}

function calcularDesvioPadrao(valores) {
  if (valores.length === 0) return 0;
  const media = valores.reduce((a, b) => a + b, 0) / valores.length;
  const quadradoDiferencas = valores.map(valor => Math.pow(valor - media, 2));
  const mediaQuadrados = quadradoDiferencas.reduce((a, b) => a + b, 0) / valores.length;
  return Math.sqrt(mediaQuadrados);
}

function calcularMediaMovel(vetor, janela = 3) {
  const resultado = [];
  for (let i = 0; i < vetor.length; i++) {
    const inicio = Math.max(0, i - janela + 1);
    const janelaAtual = vetor.slice(inicio, i + 1);
    const media = janelaAtual.reduce((a, b) => a + b, 0) / janelaAtual.length;
    resultado.push(Math.round(media));
  }
  return resultado;
}

/* =========================
   ESTATÍSTICAS DE SIMULADOS
========================= */
exports.dashboard = async (req, res) => {
  const userId = req.session.userId;
  if (!userId) return res.redirect("/login");

  const periodo = req.query.periodo || "total";
  const dateLimit = getDateLimit(periodo);

  /* =========================
     BUSCA BASE
  ========================= */
  const whereSimulado = { user_id: userId };
  
  const simulados = await Simulado.findAll({
    where: whereSimulado,
    include: [{
      model: SimuladoBloco,
      as: "blocos",
      include: [{
        model: SimuladoQuestaoErro,
        as: "erros",
        include: [
          { model: Subject, as: "subject" },
          { model: Topic, as: "topic" }
        ]
      }]
    }],
    order: [["data_realizacao", "ASC"]]
  });

  /* =========================
     CONTADORES DE STATUS
  ========================= */
  let simuladosEmAndamento = 0;
  let simuladosFinalizados = 0;
  let simuladosRevisao = 0;

  simulados.forEach(s => {
    if (s.status === "finalizado") simuladosFinalizados++;
    else if (s.status === "revisao") simuladosRevisao++;
    else simuladosEmAndamento++;
  });

  /* =========================
     INICIALIZAÇÃO DAS MÉTRICAS
  ========================= */
  let totalSimulados = simulados.length;
  let totalQuestoes = 0;
  let totalAcertos = 0;
  let totalErros = 0;
  let totalTempoMinutos = 0;

  const porArea = {
    linguagens: { questoes: 0, acertos: 0, erros: 0, tempo: 0, simulados: 0 },
    humanas: { questoes: 0, acertos: 0, erros: 0, tempo: 0, simulados: 0 },
    naturezas: { questoes: 0, acertos: 0, erros: 0, tempo: 0, simulados: 0 },
    matematica: { questoes: 0, acertos: 0, erros: 0, tempo: 0, simulados: 0 }
  };

  const porSimulado = [];
  const errosTotal = { total: 0, revisados: 0, pendentes: 0 };
  const errosPorMotivo = { falta_conteudo: 0, falta_atencao: 0, lacuna: 0 };
  const lacunasPorMateria = {};
  const lacunasPorTopico = {};
  const lacunasPorAssunto = {};
  
  const areasPorSimulado = {};
  const evolucaoRaw = [];

  /* =========================
     PROCESSAMENTO PRINCIPAL
  ========================= */
  simulados.forEach(simulado => {
    let questoesSim = 0;
    let acertosSim = 0;
    let tempoSim = 0;

    const dataSimulado = new Date(simulado.data_realizacao);
    const dentroPeriodo = !dateLimit || dataSimulado >= dateLimit;

    if (!dentroPeriodo) return;

    simulado.blocos.forEach(bloco => {
      totalQuestoes += bloco.total_questoes;
      totalAcertos += bloco.acertos;
      totalErros += (bloco.total_questoes - bloco.acertos);
      totalTempoMinutos += (bloco.tempo_minutos || 0);

      questoesSim += bloco.total_questoes;
      acertosSim += bloco.acertos;
      tempoSim += (bloco.tempo_minutos || 0);

      const area = bloco.area;
      porArea[area].questoes += bloco.total_questoes;
      porArea[area].acertos += bloco.acertos;
      porArea[area].erros += (bloco.total_questoes - bloco.acertos);
      porArea[area].tempo += (bloco.tempo_minutos || 0);
      porArea[area].simulados += 1;

      bloco.erros.forEach(erro => {
        errosTotal.total++;

        if (erro.revisada) errosTotal.revisados++;
        else errosTotal.pendentes++;

        errosPorMotivo[erro.motivo]++;

        if (erro.motivo === "lacuna") {
          if (erro.subject) {
            const materia = erro.subject.nome;
            lacunasPorMateria[materia] = (lacunasPorMateria[materia] || 0) + 1;
          }
          if (erro.topic) {
            const topico = erro.topic.nome;
            lacunasPorTopico[topico] = (lacunasPorTopico[topico] || 0) + 1;
          }
        }
      });
    });

    /* =========================
       DADOS POR SIMULADO
    ========================= */
    if (questoesSim > 0) {
      const pct = percent(acertosSim, questoesSim);
      porSimulado.push({
        id: simulado.id,
        nome: simulado.nome,
        data: simulado.data_realizacao,
        status: simulado.status,
        questoes: questoesSim,
        acertos: acertosSim,
        erros: questoesSim - acertosSim,
        percentual: pct,
        tempo: tempoSim
      });
      evolucaoRaw.push(pct);
    }
  });

  /* =========================
     CÁLCULOS DERIVADOS
  ========================= */
  
  // Calcular deltas
  porSimulado.forEach((sim, idx) => {
    if (idx > 0) {
      sim.delta = sim.percentual - porSimulado[idx - 1].percentual;
    } else {
      sim.delta = 0;
    }
  });

  // Média móvel (3 simulações)
  const mediaMovel = calcularMediaMovel(evolucaoRaw, 3);
  porSimulado.forEach((sim, idx) => {
    sim.mediaMovel = mediaMovel[idx];
  });

  // KPIs principais
  const aproveitamento = percent(totalAcertos, totalQuestoes);
  // Média de ACERTOS (não %) - número de acertos por simulado
  const mediaAcertos = simuladosFinalizados > 0 ? Math.round(totalAcertos / simuladosFinalizados) : 0;
  const mediaTempo = simuladosFinalizados > 0 ? Math.round(totalTempoMinutos / simuladosFinalizados) : 0;
  // Velocidade - só calcula se tiver tempo > 0
  const velocidadeMedia = totalTempoMinutos > 0 ? (totalQuestoes / totalTempoMinutos).toFixed(1) : "—";
  
  // Consistência - formatar com 2 casas decimais
  const consistencia = evolucaoRaw.length > 1 ? calcularDesvioPadrao(evolucaoRaw).toFixed(1) : 0;

  // Dias desde último simulado
  const ultimoSimulado = simulados
    .filter(s => s.status === "finalizado")
    .sort((a, b) => new Date(b.data_realizacao) - new Date(a.data_realizacao))[0];
  const diasDesdeUltimo = ultimoSimulado 
    ? Math.floor((new Date() - new Date(ultimoSimulado.data_realizacao)) / (1000 * 60 * 60 * 24))
    : null;

  // Frequência de simulados (por mês no período)
  const simuladosPorMes = {};
  simulados.forEach(s => {
    if (s.status === "finalizado") {
      const mes = s.data_realizacao.substring(0, 7);
      simuladosPorMes[mes] = (simuladosPorMes[mes] || 0) + 1;
    }
  });

  // Melhor e pior simulado
  const melhorSimulado = [...porSimulado].sort((a, b) => b.percentual - a.percentual)[0];
  const piorSimulado = [...porSimulado].sort((a, b) => a.percentual - b.percentual)[0];

  // Taxa de revisão
  const taxaRevisao = errosTotal.total > 0 
    ? Math.round((errosTotal.revisados / errosTotal.total) * 100) 
    : 0;

  // Área mais forte e mais fraca
  Object.values(porArea).forEach(a => {
    a.percentual = percent(a.acertos, a.questoes);
    a.tempoMedio = a.simulados > 0 ? Math.round(a.tempo / a.simulados) : 0;
    a.velocidade = a.tempo > 0 ? Math.round(a.questoes / a.tempo) : 0;
  });

  const areaMaisForte = Object.entries(porArea)
    .sort((a, b) => b[1].percentual - a[1].percentual)[0];
  const areaMaisFraca = Object.entries(porArea)
    .sort((a, b) => a[1].percentual - b[1].percentual)[0];

  const motivoDominante = Object.entries(errosPorMotivo)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  // Rankings
  const rankingMelhores = [...porSimulado]
    .sort((a, b) => b.percentual - a.percentual)
    .slice(0, 5);
  
  const rankingPiores = [...porSimulado]
    .sort((a, b) => a.percentual - b.percentual)
    .slice(0, 5);

  /* =========================
     RENDER
  ========================= */
  res.render("app/estatisticas-simulados", {
    active: "estatisticas",
    userNome: req.session.userNome,
    userFoto: req.session.userFoto,
    periodo,

    // Status
    totalSimulados,
    simuladosEmAndamento,
    simuladosFinalizados,
    simuladosRevisao,

    // KPIs principais
    totalQuestoes,
    totalAcertos,
    totalErros,
    totalTempoMinutos,
    aproveitamento,
    mediaAcertos,
    mediaTempo,
    velocidadeMedia,
    consistencia,
    diasDesdeUltimo,

    // Por área
    porArea,

    // Erros
    errosTotal: errosTotal.total,
    errosRevisados: errosTotal.revisados,
    errosPendentes: errosTotal.pendentes,
    errosPorMotivo,
    taxaRevisao,
    motivoDominante,

    // Áreas
    areaMaisForte: {
      nome: areaMaisForte?.[0],
      percentual: areaMaisForte?.[1]?.percentual
    },
    areaMaisFraca: {
      nome: areaMaisFraca?.[0],
      percentual: areaMaisFraca?.[1]?.percentual
    },

    // Lacunas - mostrar TODAS sem limite
    lacunas: {
      materias: sortDesc(lacunasPorMateria),
      topicos: sortDesc(lacunasPorTopico)
    },

    // Simulados
    porSimulado,
    rankingMelhores,
    rankingPiores,
    melhorSimulado,
    piorSimulado,
    simuladosPorMes,

    // Evolução
    evolucao: porSimulado
  });
};
