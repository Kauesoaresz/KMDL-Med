const {
  Simulado,
  SimuladoBloco
} = require("../models");

/* =========================
   FORM DE COMPARAÇÃO
========================= */
exports.form = async (req, res) => {
  const userId = req.session.userId;

  const simulados = await Simulado.findAll({
    where: {
      user_id: userId,
      status: "finalizado"
    },
    order: [["data_realizacao", "DESC"]]
  });

  res.render("app/simulados/comparar", {
    simulados,
    resultado: null,
    active: "estatisticas",
    userNome: req.session.userNome,
    userFoto: req.session.userFoto
  });
};

/* =========================
   COMPARAR SIMULADOS
========================= */
exports.comparar = async (req, res) => {
  const userId = req.session.userId;
  const { simuladoA, simuladoB } = req.body;

  if (!simuladoA || !simuladoB || simuladoA === simuladoB) {
    return res.redirect("/estatisticas/simulados/comparar");
  }

  async function carregarSimulado(id) {
    const simulado = await Simulado.findOne({
      where: {
        id,
        user_id: userId,
        status: "finalizado"
      },
      include: [{
        model: SimuladoBloco,
        as: "blocos"
      }]
    });

    if (!simulado) return null;

    const areas = {
      linguagens: { questoes: 0, acertos: 0 },
      humanas: { questoes: 0, acertos: 0 },
      naturezas: { questoes: 0, acertos: 0 },
      matematica: { questoes: 0, acertos: 0 }
    };

    let totalQ = 0;
    let totalA = 0;

    simulado.blocos.forEach(b => {
      areas[b.area].questoes += b.total_questoes;
      areas[b.area].acertos += b.acertos;
      totalQ += b.total_questoes;
      totalA += b.acertos;
    });

    const percentual = totalQ > 0
      ? Math.round((totalA / totalQ) * 100)
      : 0;

    return {
      id: simulado.id,
      nome: simulado.nome,
      data: simulado.data_realizacao,
      totalQ,
      totalA,
      percentual,
      areas
    };
  }

  const A = await carregarSimulado(simuladoA);
  const B = await carregarSimulado(simuladoB);

  if (!A || !B) {
    return res.redirect("/estatisticas/simulados/comparar");
  }

  // =========================
  // DELTAS
  // =========================
  const deltaGeral = B.percentual - A.percentual;
  const deltaAreas = {};

  Object.keys(A.areas).forEach(area => {
    const percA = A.areas[area].questoes > 0
      ? Math.round((A.areas[area].acertos / A.areas[area].questoes) * 100)
      : 0;

    const percB = B.areas[area].questoes > 0
      ? Math.round((B.areas[area].acertos / B.areas[area].questoes) * 100)
      : 0;

    deltaAreas[area] = percB - percA;
  });

  res.render("app/simulados/comparar", {
    simulados: [],
    resultado: {
      A,
      B,
      deltaGeral,
      deltaAreas
    },
    active: "estatisticas",
    userNome: req.session.userNome,
    userFoto: req.session.userFoto
  });
};
