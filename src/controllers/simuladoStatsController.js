const {
  Simulado,
  SimuladoBloco,
  SimuladoQuestaoErro,
  Subject,
  Topic,
  Subtopic
} = require("../models");

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

/* =========================
   ESTATÍSTICAS DE SIMULADOS
========================= */
exports.dashboard = async (req, res) => {
  const userId = req.session.userId;
  if (!userId) return res.redirect("/login");

  /* =========================
     BUSCA BASE (SEM FILTRO DE STATUS)
  ========================= */
  const simulados = await Simulado.findAll({
    where: { user_id: userId },
    include: [{
      model: SimuladoBloco,
      as: "blocos",
      include: [{
        model: SimuladoQuestaoErro,
        as: "erros",
        include: [
          { model: Subject, as: "subject" },
          { model: Topic, as: "topic" },
          { model: Subtopic, as: "subtopic" }
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

  simulados.forEach(s => {
    if (s.status === "finalizado") simuladosFinalizados++;
    else simuladosEmAndamento++;
  });

  /* =========================
     BASE GERAL
  ========================= */
  let totalSimulados = simulados.length;
  let totalQuestoes = 0;
  let totalAcertos = 0;

  const porArea = {
    linguagens: { questoes: 0, acertos: 0, erros: 0 },
    humanas: { questoes: 0, acertos: 0, erros: 0 },
    naturezas: { questoes: 0, acertos: 0, erros: 0 },
    matematica: { questoes: 0, acertos: 0, erros: 0 }
  };

  let errosTotal = 0;
  let errosRevisados = 0;
  let errosPendentes = 0;

  const errosPorMotivo = {
    falta_conteudo: 0,
    falta_atencao: 0,
    lacuna: 0
  };

  const lacunasPorMateria = {};
  const lacunasPorTopico = {};
  const lacunasPorAssunto = {};

  const evolucao = [];

  /* =========================
     PROCESSAMENTO
  ========================= */
  simulados.forEach(simulado => {
    let questoesSim = 0;
    let acertosSim = 0;

    simulado.blocos.forEach(bloco => {
      totalQuestoes += bloco.total_questoes;
      totalAcertos += bloco.acertos;

      questoesSim += bloco.total_questoes;
      acertosSim += bloco.acertos;

      porArea[bloco.area].questoes += bloco.total_questoes;
      porArea[bloco.area].acertos += bloco.acertos;
      porArea[bloco.area].erros += (bloco.total_questoes - bloco.acertos);

      bloco.erros.forEach(erro => {
        errosTotal++;

        if (erro.revisada) errosRevisados++;
        else errosPendentes++;

        errosPorMotivo[erro.motivo]++;

        if (erro.motivo === "lacuna") {
          if (erro.subject)
            lacunasPorMateria[erro.subject.nome] =
              (lacunasPorMateria[erro.subject.nome] || 0) + 1;

          if (erro.topic)
            lacunasPorTopico[erro.topic.nome] =
              (lacunasPorTopico[erro.topic.nome] || 0) + 1;

          if (erro.subtopic)
            lacunasPorAssunto[erro.subtopic.nome] =
              (lacunasPorAssunto[erro.subtopic.nome] || 0) + 1;
        }
      });
    });

    /* =========================
       EVOLUÇÃO (SÓ SE TIVER QUESTÕES)
    ========================= */
    if (questoesSim > 0) {
      const pct = percent(acertosSim, questoesSim);
      const anterior = evolucao[evolucao.length - 1];

      evolucao.push({
        nome: simulado.nome,
        data: simulado.data_realizacao,
        questoes: questoesSim,
        acertos: acertosSim,
        percentual: pct,
        delta: anterior ? pct - anterior.percentual : 0,
        status: simulado.status
      });
    }
  });

  /* =========================
     FINALIZAÇÕES
  ========================= */
  Object.values(porArea).forEach(a => {
    a.percentual = percent(a.acertos, a.questoes);
  });

  const aproveitamento = percent(totalAcertos, totalQuestoes);

  const mediaAcertos =
    simuladosFinalizados > 0
      ? Math.round(totalAcertos / simuladosFinalizados)
      : 0;

  const areaMaisFraca = Object.entries(porArea)
    .sort((a, b) => a[1].percentual - b[1].percentual)[0];

  const areaMaisForte = Object.entries(porArea)
    .sort((a, b) => b[1].percentual - a[1].percentual)[0];

  const motivoDominante = Object.entries(errosPorMotivo)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  /* =========================
     RENDER
  ========================= */
  res.render("app/estatisticas-simulados", {
    active: "estatisticas",
    userNome: req.session.userNome,
    userFoto: req.session.userFoto,

    totalSimulados,
    simuladosEmAndamento,
    simuladosFinalizados,

    totalQuestoes,
    totalAcertos,
    aproveitamento,
    mediaAcertos,

    porArea,

    errosTotal,
    errosRevisados,
    errosPendentes,
    errosPorMotivo,

    areaMaisForte: {
      nome: areaMaisForte?.[0],
      percentual: areaMaisForte?.[1]?.percentual
    },

    areaMaisFraca: {
      nome: areaMaisFraca?.[0],
      percentual: areaMaisFraca?.[1]?.percentual
    },

    motivoDominante,

    lacunas: {
      materias: sortDesc(lacunasPorMateria).slice(0, 5),
      topicos: sortDesc(lacunasPorTopico).slice(0, 5),
      assuntos: sortDesc(lacunasPorAssunto).slice(0, 5)
    },

    evolucao
  });
};
