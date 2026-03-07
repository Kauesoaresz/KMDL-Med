const { Prova, User } = require("../models");

// ================================
// HUB - PÁGINA PRINCIPAL
// ================================
async function hub(req, res) {
  try {
    const userId = req.session.userId;
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    // Buscar todas as provas do usuário
    const provas = await Prova.findAll({
      where: { user_id: userId },
      order: [["data_prova_1", "ASC"]],
    });

    // Calcular estatísticas
    let totalGasto = 0;
    let provasPendentes = 0;
    let provasPagas = 0;
    let provasProximas = 0; // próximo mês
    let provasHoje = 0;
    let provasPassadas = 0;
    let provasConfirmadas = 0;

    const proximasProvas = [];
    const provasRecentes = [];

    provas.forEach(prova => {
      // Gasto total
      if (prova.pago && prova.valor_inscricao) {
        totalGasto += parseFloat(prova.valor_inscricao);
      }

      // Status pagamento
      if (prova.pago) {
        provasPagas++;
      } else {
        provasPendentes++;
      }

      // Status inscrição
      if (prova.status_inscricao === 'confirmada') {
        provasConfirmadas++;
      }

      // Datas
      const dataProva = new Date(prova.data_prova_1);
      dataProva.setHours(0, 0, 0, 0);

      const diffTime = dataProva - hoje;
      const diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diasRestantes === 0) {
        provasHoje++;
      } else if (diasRestantes > 0 && diasRestantes <= 30) {
        provasProximas++;
        if (proximasProvas.length < 5) {
          proximasProvas.push({ ...prova.toJSON(), diasRestantes });
        }
      } else if (diasRestantes < 0) {
        provasPassadas++;
      }

      // Provas dos últimos 6 meses (para "recently added")
      const dataCriacao = new Date(prova.created_at);
      const diffCriacao = hoje - dataCriacao;
      const diasCriacao = Math.ceil(diffCriacao / (1000 * 60 * 60 * 24));

      if (diasCriacao <= 180 && provasRecentes.length < 4) {
        provasRecentes.push({ ...prova.toJSON(), diasRestantes });
      }
    });

    // Contagem por tipo
    const porTipo = {
      vestibular: provas.filter(p => p.tipo === 'Vestibular').length,
      enem: provas.filter(p => p.tipo === 'ENEM').length,
      outro: provas.filter(p => p.tipo === 'Outro').length,
    };

    res.render("app/provas/hub", {
      active: "provas",
      userNome: req.session.userNome,
      userFoto: req.session.userFoto || null,
      provas,
      estatisticas: {
        total: provas.length,
        totalGasto: totalGasto.toFixed(2),
        provasPendentes,
        provasPagas,
        provasProximas,
        provasHoje,
        provasPassadas,
        provasConfirmadas,
        porTipo,
      },
      proximasProvas,
      provasRecentes,
    });

  } catch (err) {
    console.error("🔥 ERRO NO HUB:", err);
    res.redirect("/provas/lista");
  }
}

// ================================
// LISTAR PROVAS (COM FILTROS)
// ================================
async function listar(req, res) {
  try {
    const userId = req.session.userId;
    const { tipo, pago, status, ordenar } = req.query;

    // Build where clause
    const where = { user_id: userId };

    if (tipo && tipo !== 'todos') {
      where.tipo = tipo;
    }

    if (pago !== undefined && pago !== 'todos') {
      where.pago = pago === 'true';
    }

    if (status && status !== 'todos') {
      where.status_inscricao = status;
    }

    // Order
    let order = [["data_prova_1", "ASC"]];
    if (ordenar === 'nome') {
      order = [["nome", "ASC"]];
    } else if (ordenar === 'valor') {
      order = [["valor_inscricao", "DESC"]];
    } else if (ordenar === 'recente') {
      order = [["created_at", "DESC"]];
    }

    const provas = await Prova.findAll({
      where,
      order,
    });

    // Calcular estatísticas para filtros ativos
    const todasProvas = await Prova.findAll({ where: { user_id: userId } });
    
    let totalGasto = 0;
    let provasPagas = 0;
    let provasPendentes = 0;

    todasProvas.forEach(prova => {
      if (prova.pago && prova.valor_inscricao) {
        totalGasto += parseFloat(prova.valor_inscricao);
        provasPagas++;
      } else if (!prova.pago) {
        provasPendentes++;
      }
    });

    res.render("app/provas/lista", {
      provas,
      active: "provas",
      userNome: req.session.userNome,
      userFoto: req.session.userFoto || null,
      filtros: { tipo, pago, status, ordenar },
      estatisticas: {
        total: todasProvas.length,
        totalGasto: totalGasto.toFixed(2),
        provasPagas,
        provasPendentes,
      },
    });

  } catch (err) {
    console.error("🔥 ERRO COMPLETO:", err);
    res.send(err);
  }
}

// ================================
// NOVA PROVA
// ================================
async function nova(req, res) {
  try {
    const user = await User.findByPk(req.session.userId);

    res.render("app/provas/nova", {
      active: "provas",
      userNome: user.nome,
      userFoto: user.foto,
    });

  } catch (err) {
    console.error(err);
    res.redirect("/provas");
  }
}

// ================================
// CRIAR PROVA
// ================================
async function criar(req, res) {
  try {
    await Prova.create({
      user_id: req.session.userId,
      nome: req.body.nome,
      tipo: req.body.tipo,
      status_inscricao: req.body.status_inscricao || 'nao_iniciada',
      data_inscricao_inicio: req.body.data_inscricao_inicio || null,
      data_inscricao_fim: req.body.data_inscricao_fim || null,
      data_prova_1: req.body.data_prova_1,
      data_prova_2: req.body.data_prova_2 || null,
      valor_inscricao: req.body.valor_inscricao || null,
      pago: req.body.pago ? true : false,
      data_pagamento: req.body.data_pagamento || null,
      local: req.body.local || null,
      endereco: req.body.endereco || null,
      observacoes: req.body.observacoes || null,
      link_inscricao: req.body.link_inscricao || null,
      nota_corte: req.body.nota_corte || null,
      nota_obtida: req.body.nota_obtida || null,
      posicao: req.body.posicao || null,
      resultado: req.body.resultado || null,
    });

    res.redirect("/provas");

  } catch (err) {
    console.error(err);
    res.redirect("/provas");
  }
}

// ================================
// EDITAR FORM
// ================================
async function editarForm(req, res) {
  try {
    const prova = await Prova.findByPk(req.params.id);

    if (!prova) {
      return res.redirect("/provas");
    }

    res.render("app/provas/editar", {
      prova,
      active: "provas",
      userNome: req.session.userNome,
      userFoto: req.session.userFoto || null,
    });

  } catch (err) {
    console.error(err);
    res.redirect("/provas");
  }
}

// ================================
// ATUALIZAR PROVA
// ================================
async function atualizar(req, res) {
  try {
    await Prova.update(
      {
        nome: req.body.nome,
        tipo: req.body.tipo,
        status_inscricao: req.body.status_inscricao || 'nao_iniciada',
        data_inscricao_inicio: req.body.data_inscricao_inicio || null,
        data_inscricao_fim: req.body.data_inscricao_fim || null,
        data_prova_1: req.body.data_prova_1,
        data_prova_2: req.body.data_prova_2 || null,
        valor_inscricao: req.body.valor_inscricao || null,
        pago: req.body.pago ? true : false,
        data_pagamento: req.body.data_pagamento || null,
        local: req.body.local || null,
        endereco: req.body.endereco || null,
        observacoes: req.body.observacoes || null,
        link_inscricao: req.body.link_inscricao || null,
        nota_corte: req.body.nota_corte || null,
        nota_obtida: req.body.nota_obtida || null,
        posicao: req.body.posicao || null,
        resultado: req.body.resultado || null,
      },
      { where: { id: req.params.id } }
    );

    res.redirect("/provas");

  } catch (err) {
    console.error(err);
    res.redirect("/provas");
  }
}

// ================================
// EXCLUIR PROVA
// ================================
async function excluir(req, res) {
  try {
    await Prova.destroy({
      where: { id: req.params.id },
    });

    res.redirect("/provas");

  } catch (err) {
    console.error(err);
    res.redirect("/provas");
  }
}

module.exports = {
  hub,
  listar,
  nova,
  criar,
  editarForm,
  atualizar,
  excluir
};

