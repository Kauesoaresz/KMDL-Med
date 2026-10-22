const {
  Simulado,
  SimuladoBloco,
  SimuladoQuestaoErro,
} = require("../models");

const { Op } = require("sequelize");

/* =========================
   LISTAR SIMULADOS
========================= */
exports.listarSimulados = async (req, res) => {
  const userId = req.session.userId;
  const userNome = req.session.userNome;
  const userFoto = req.session.userFoto || null;

  try {
    const simulados = await Simulado.findAll({
      where: { user_id: userId },
      order: [["created_at", "DESC"]],
    });

    res.render("app/simulados/lista", {
      simulados,
      error: null,
      ok: null,
      active: "simulados",
      userNome,
      userFoto,
    });
  } catch (err) {
    console.error(err);
    res.render("app/simulados/lista", {
      simulados: [],
      error: "Erro ao carregar simulados.",
      ok: null,
      active: "simulados",
      userNome,
      userFoto,
    });
  }
};

/* =========================
   CRIAR SIMULADO
========================= */
exports.criarSimulado = async (req, res) => {
  const userId = req.session.userId;
  const { nome, data_realizacao } = req.body;

  console.log("=== CRIAR SIMULADO ===");
  console.log("userId:", userId);
  console.log("nome:", nome);
  console.log("data_realizacao:", data_realizacao);

  if (!nome || !data_realizacao) {
    console.log("ERRO: Campos obrigatórios faltando");
    req.flash = req.flash || {};
    req.flash.error = "Preencha todos os campos obrigatórios.";
    return res.redirect("/simulados/lista");
  }

  if (!userId) {
    console.log("ERRO: Usuário não autenticado");
    return res.redirect("/login");
  }

  // Bloqueia datas futuras
  const dataInput = new Date(data_realizacao);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  
  if (dataInput > hoje) {
    console.log("ERRO: Data futura");
    req.flash = req.flash || {};
    req.flash.error = "Não é permitido criar simulados com datas futuras.";
    return res.redirect("/simulados/lista");
  }

  try {
    const novoSimulado = await Simulado.create({
      user_id: userId,
      nome,
      data_realizacao,
    });

    console.log("Simulado criado com sucesso! ID:", novoSimulado.id);
    res.redirect("/simulados/lista");
  } catch (err) {
    console.error("Erro ao criar simulado:", err);
    req.flash = req.flash || {};
    req.flash.error = "Erro ao criar simulado. Tente novamente.";
    res.redirect("/simulados/lista");
  }
};


/* =========================
   DETALHES DO SIMULADO
========================= */
exports.detalhesSimulado = async (req, res) => {
  const userId = req.session.userId;
  const { id } = req.params;

  try {
    const simulado = await Simulado.findOne({
      where: { id, user_id: userId },
      include: [
        {
          model: SimuladoBloco,
          as: "blocos",
          include: [
            {
              model: SimuladoQuestaoErro,
              as: "erros",
              include: [
                { model: require("../models").Subject, as: "subject" },
                { model: require("../models").Topic, as: "topic" },
              ],
            },
          ],
        },
      ],
      order: [
        [{ model: SimuladoBloco, as: "blocos" }, "created_at", "ASC"],
        [
          { model: SimuladoBloco, as: "blocos" },
          { model: SimuladoQuestaoErro, as: "erros" },
          "created_at",
          "ASC",
        ],
      ],
    });

    if (!simulado) {
      return res.redirect("/simulados/lista");
    }

    // 🔥 matérias para LACUNA
    const subjects = await require("../models").Subject.findAll({
      where: { user_id: userId },
      order: [["nome", "ASC"]],
    });

    res.render("app/simulados/detalhes", {
      simulado,
      subjects,
      error: null,
      ok: null,
      active: "simulados",
      userNome: req.session.userNome,
      userFoto: req.session.userFoto || null,
    });
  } catch (err) {
    console.error("ERRO detalhesSimulado:", err);
    res.redirect("/simulados/lista");
  }
};



/* =========================
   ADICIONAR BLOCO
========================= */
exports.adicionarBloco = async (req, res) => {
  const userId = req.session.userId;
  const { id } = req.params;

  const {
    area,
    total_questoes,
    acertos,
    tempo_minutos,
    data_realizacao,
    erros,
  } = req.body;

  try {
    const simulado = await Simulado.findOne({
      where: { id, user_id: userId },
    });

    if (!simulado || (simulado.status !== "em_andamento" && simulado.status !== "revisao")) {
      return res.status(403).json({ error: "Simulado inválido ou já finalizado." });
    }

    // 🔒 SOMA TOTAL DA ÁREA
    const totalExistente = await SimuladoBloco.sum("total_questoes", {
      where: { simulado_id: simulado.id, area },
    });

    const totalAtual = totalExistente || 0;
    const novoTotal = totalAtual + Number(total_questoes);

    if (novoTotal > 45) {
      return res.status(400).json({
        error: `Não é possível adicionar este bloco. ${area.toUpperCase()} ficaria com ${novoTotal} questões (máximo 45).`
      });
    }

    if (Number(acertos) > Number(total_questoes)) {
      return res.status(400).json({
        error: "Acertos não podem ser maiores que o total de questões."
      });
    }

    const bloco = await SimuladoBloco.create({
      simulado_id: simulado.id,
      area,
      total_questoes,
      acertos,
      tempo_minutos,
      data_realizacao,
    });

    if (erros) {
      const listaErros = Array.isArray(erros) ? erros : Object.values(erros);

      for (const erro of listaErros) {
        await SimuladoQuestaoErro.create({
          simulado_bloco_id: bloco.id,
          area,
          numero_questao: erro.numero_questao,
          motivo: erro.motivo,
          subject_id: erro.subject_id || null,
          topic_id: erro.topic_id || null,
        });
      }
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro interno ao adicionar bloco." });
  }
};



/* =========================
   MARCAR ERRO COMO REVISADO
========================= */
exports.marcarErroRevisado = async (req, res) => {
  const userId = req.session.userId;
  const { erroId } = req.params;

  try {
    const erro = await SimuladoQuestaoErro.findOne({
      where: { id: erroId },
      include: [
        {
          model: SimuladoBloco,
          as: "bloco",
          include: [
            {
              model: Simulado,
              as: "simulado",
              where: { user_id: userId },
            },
          ],
        },
      ],
    });

    if (!erro) return res.redirect("/simulados/lista");

    erro.revisada = true;
    erro.data_revisao = new Date();
    await erro.save();

    res.redirect("back");
  } catch (err) {
    console.error(err);
    res.redirect("/simulados/lista");
  }
};

/* =========================
   DESFAZER REVISÃO DE ERRO
========================= */
exports.desfazerErroRevisado = async (req, res) => {
  const userId = req.session.userId;
  const { erroId } = req.params;

  try {
    const erro = await SimuladoQuestaoErro.findOne({
      where: { id: erroId },
      include: [
        {
          model: SimuladoBloco,
          as: "bloco",
          include: [
            {
              model: Simulado,
              as: "simulado",
              where: { user_id: userId },
            },
          ],
        },
      ],
    });

    if (!erro) return res.redirect("/simulados/lista");

    erro.revisada = false;
    erro.data_revisao = null;
    await erro.save();

    res.redirect("back");
  } catch (err) {
    console.error(err);
    res.redirect("/simulados/lista");
  }
};


/* =========================
   FINALIZAR SIMULADO
========================= */
exports.finalizarSimulado = async (req, res) => {
  const userId = req.session.userId;
  const { id } = req.params;

  try {
    const simulado = await Simulado.findOne({
      where: { id, user_id: userId },
    });

    if (!simulado) return res.redirect("/simulados/lista");

    simulado.status = "finalizado";
    simulado.finished_at = new Date();
    await simulado.save();

    res.redirect(`/simulados/${id}`);
  } catch (err) {
    console.error(err);
    res.redirect("/simulados/lista");
  }
};

/* =========================
   TELA GLOBAL DE ERROS
========================= */
exports.listarErros = async (req, res) => {
  const userId = req.session.userId;
  const userNome = req.session.userNome;
  const userFoto = req.session.userFoto || null;

  const { area, motivo, status } = req.query;

  const whereErro = {};
  if (area) whereErro.area = area;
  if (motivo) whereErro.motivo = motivo;
  if (status === "pendentes") whereErro.revisada = false;
  if (status === "revisadas") whereErro.revisada = true;

  try {
    const erros = await SimuladoQuestaoErro.findAll({
      where: whereErro,
      include: [
        {
          model: SimuladoBloco,
          as: "bloco",
          required: true,
          include: [
            {
              model: Simulado,
              as: "simulado",
              required: true,
              where: { user_id: userId },
            },
          ],
        },

        // 🔥 ISSO É O QUE FALTAVA
        {
          model: require("../models").Subject,
          as: "subject",
        },
        {
          model: require("../models").Topic,
          as: "topic",
        },
      ],
      order: [["created_at", "DESC"]],
    });

    res.render("app/simulados/erros", {
      erros,
      active: "simulados",
      userNome,
      userFoto,
    });
  } catch (err) {
    console.error("ERRO LISTAR ERROS:", err);
    res.render("app/simulados/erros", {
      erros: [],
      active: "simulados",
      userNome,
      userFoto,
    });
  }
};


exports.excluirBloco = async (req, res) => {
  const userId = req.session.userId;
  const { blocoId } = req.params;

  try {
    const bloco = await SimuladoBloco.findOne({
      where: { id: blocoId },
      include: [{
        model: Simulado,
        as: "simulado",
        where: { user_id: userId }
      }]
    });

    if (!bloco) return res.redirect("/simulados/lista");

    await bloco.destroy(); // CASCADE apaga erros

    res.redirect(`/simulados/${bloco.simulado.id}`);
  } catch (err) {
    console.error(err);
    res.redirect("/simulados/lista");
  }
};

exports.excluirErro = async (req, res) => {
  const userId = req.session.userId;
  const { erroId } = req.params;

  try {
    const erro = await SimuladoQuestaoErro.findOne({
      where: { id: erroId },
      include: [{
        model: SimuladoBloco,
        as: "bloco",
        include: [{
          model: Simulado,
          as: "simulado",
          where: { user_id: userId }
        }]
      }]
    });

    if (!erro) return res.redirect("/simulados/lista");

    const simuladoId = erro.bloco.simulado.id;

    await erro.destroy();

    res.redirect(`/simulados/${simuladoId}`);
  } catch (err) {
    console.error(err);
    res.redirect("/simulados/lista");
  }
};

exports.editarBlocoForm = async (req, res) => {
  const userId = req.session.userId;
  const { blocoId } = req.params;

  const bloco = await SimuladoBloco.findOne({
    where: { id: blocoId },
    include: [{
      model: Simulado,
      as: "simulado",
      where: { user_id: userId }
    }]
  });

  if (!bloco) return res.redirect("/simulados/lista");

  res.render("app/simulados/bloco-editar", {
    bloco,
    simulado: bloco.simulado,
    userNome: req.session.userNome,
    userFoto: req.session.userFoto || null,
    active: "simulados",
  });
};

exports.editarBlocoSalvar = async (req, res) => {
  const userId = req.session.userId;
  const { blocoId } = req.params;
  const { area, total_questoes, acertos, tempo_minutos, data_realizacao } = req.body;

  const bloco = await SimuladoBloco.findOne({
    where: { id: blocoId },
    include: [{
      model: Simulado,
      as: "simulado",
      where: { user_id: userId }
    }]
  });

  if (!bloco) return res.redirect("/simulados/lista");

  await bloco.update({
    area,
    total_questoes,
    acertos,
    tempo_minutos,
    data_realizacao
  });

  res.redirect(`/simulados/${bloco.simulado.id}`);
};

exports.editarErroForm = async (req, res) => {
  const userId = req.session.userId;
  const { erroId } = req.params;

  const erro = await SimuladoQuestaoErro.findOne({
    where: { id: erroId },
    include: [{
      model: SimuladoBloco,
      as: "bloco",
      include: [{
        model: Simulado,
        as: "simulado",
        where: { user_id: userId }
      }]
    }]
  });

  if (!erro) return res.redirect("/simulados/lista");

  res.render("app/simulados/erro-editar", {
    erro,
    simulado: erro.bloco.simulado,
    userNome: req.session.userNome,
    userFoto: req.session.userFoto || null,
    active: "simulados",
  });
};

exports.editarErroSalvar = async (req, res) => {
  const userId = req.session.userId;
  const { erroId } = req.params;
  const { numero_questao, motivo } = req.body;

  const erro = await SimuladoQuestaoErro.findOne({
    where: { id: erroId },
    include: [{
      model: SimuladoBloco,
      as: "bloco",
      include: [{
        model: Simulado,
        as: "simulado",
        where: { user_id: userId }
      }]
    }]
  });

  if (!erro) return res.redirect("/simulados/lista");

  await erro.update({ numero_questao, motivo });

  res.redirect(`/simulados/${erro.bloco.simulado.id}`);
};

/* =========================
   EXCLUIR SIMULADO
========================= */
exports.excluirSimulado = async (req, res) => {
  const userId = req.session.userId;
  const { id } = req.params;

  try {
    const simulado = await Simulado.findOne({
      where: { id, user_id: userId },
    });

    if (!simulado) {
      return res.redirect("/simulados/lista");
    }

    // CASCADE já apaga blocos e erros
    await simulado.destroy();

    res.redirect("/simulados/lista");
  } catch (err) {
    console.error("Erro ao excluir simulado:", err);
    res.redirect("/simulados/lista");
  }
};

/* =========================
   ADICIONAR ERRO EM BLOCO
========================= */
exports.adicionarErroNoBloco = async (req, res) => {
  const userId = req.session.userId;
  const { blocoId } = req.params;

  let {
    numero_questao,
    motivo,
    subject_id,
    topic_id
  } = req.body;

  const numero = Number(numero_questao);

  if (!numero || numero <= 0 || !motivo) {
    return res.status(400).json({ error: "Dados inválidos." });
  }

  try {
    const bloco = await SimuladoBloco.findOne({
      where: { id: blocoId },
      include: [{
        model: Simulado,
        as: "simulado",
        where: { user_id: userId }
      }]
    });

    if (!bloco || (bloco.simulado.status !== "em_andamento" && bloco.simulado.status !== "revisao")) {
      return res.status(403).json({ error: "Bloco inválido ou simulado já fechado." });
    }

    // 🔒 lacuna exige matéria + tópico
    if (motivo === "lacuna" && (!subject_id || !topic_id)) {
      return res.status(400).json({
        error: "Para lacuna, é obrigatório informar matéria e tópico."
      });
    }

    // 🔒 não repetir número no MESMO bloco
    const jaExiste = await SimuladoQuestaoErro.findOne({
      where: {
        simulado_bloco_id: bloco.id,
        numero_questao: numero
      }
    });

    if (jaExiste) {
      return res.status(400).json({
        error: `A questão ${numero} já foi registrada neste bloco.`
      });
    }

    await SimuladoQuestaoErro.create({
      simulado_bloco_id: bloco.id,
      area: bloco.area,
      numero_questao: numero,
      motivo,
      subject_id: subject_id || null,
      topic_id: topic_id || null
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error("ERRO adicionarErroNoBloco:", err);
    return res.status(500).json({ error: "Erro interno." });
  }
};

/* =========================
   ENTRAR/SAIR MODO REVISÃO
========================= */
exports.toggleRevisao = async (req, res) => {
  const userId = req.session.userId;
  const { id } = req.params;

  try {
    const simulado = await Simulado.findOne({
      where: { id, user_id: userId },
    });

    if (!simulado) {
      return res.redirect("/simulados/lista");
    }

    // Só permite revisão se estiver finalizado
    if (simulado.status !== "finalizado" && simulado.status !== "revisao") {
      return res.redirect(`/simulados/${id}`);
    }

    // Alterna o status
    if (simulado.status === "finalizado") {
      simulado.status = "revisao";
    } else {
      simulado.status = "finalizado";
    }

    await simulado.save();

    res.redirect(`/simulados/${id}`);
  } catch (err) {
    console.error("ERRO toggleRevisao:", err);
    res.redirect("/simulados/lista");
  }
};
