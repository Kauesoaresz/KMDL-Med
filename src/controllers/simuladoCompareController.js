const {
  Simulado,
  SimuladoBloco
} = require("../models");

/* =========================
   FORM DE COMPARAÇÃO
========================= */
exports.form = async (req, res) => {
  const userId = req.session.userId;
  if (!userId) return res.redirect("/login");

  const simulados = await Simulado.findAll({
    where: {
      user_id: userId
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

  // Buscar todos os simulados para manter no dropdown
  const simulados = await Simulado.findAll({
    where: {
      user_id: userId
    },
    order: [["data_realizacao", "DESC"]]
  });

  async function carregarSimulado(id) {
    const simulado = await Simulado.findOne({
      where: {
        id,
        user_id: userId
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

    // Formatar data - converter para objeto Date se necessário
    let dataObj = simulado.data_realizacao;
    if (dataObj && typeof dataObj === 'string') {
      dataObj = new Date(dataObj);
    }
    
    const dataFormatada = dataObj && dataObj instanceof Date && !isNaN(dataObj) 
      ? dataObj.toLocaleDateString('pt-BR')
      : '—';

    return {
      id: simulado.id,
      nome: simulado.nome,
      data: dataObj, // Retorna objeto Date para cálculo correto
      dataFormatada,
      status: simulado.status,
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

  // Calcular dias entre simulados
  let diasEntre = 0;
  if (A.data && B.data && A.data instanceof Date && B.data instanceof Date) {
    const diffTime = Math.abs(B.data.getTime() - A.data.getTime());
    diasEntre = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /* =========================
     DELTAS
  ========================= */
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
    simulados, // Agora mantém a lista completa de simulados
    resultado: {
      A,
      B,
      deltaGeral,
      deltaAreas,
      diasEntre
    },
    active: "estatisticas",
    userNome: req.session.userNome,
    userFoto: req.session.userFoto
  });
};

