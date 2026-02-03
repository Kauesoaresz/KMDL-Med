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
  const { nome } = req.body;

  if (!nome || !userId) {
    return res.redirect("/simulados/lista");
  }

  try {
    await Simulado.create({
      user_id: userId,
      nome,
    });

    res.redirect("/simulados/lista");
  } catch (err) {
    console.error("Erro ao criar simulado:", err);
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
            },
          ],
        },
      ],
      order: [
        [{ model: SimuladoBloco, as: "blocos" }, "created_at", "ASC"],
      ],
    });

    if (!simulado) {
      return res.redirect("/simulados/lista");
    }

    res.render("app/simulados/detalhes", {
      simulado,
      error: null,
      ok: null,
      active: "simulados",
      userNome: req.session.userNome,
      userFoto: req.session.userFoto || null,
    });
  } catch (err) {
    console.error(err);
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

    if (!simulado || simulado.status === "finalizado") {
      return res.redirect("/simulados/lista");
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
  const listaErros = Array.isArray(erros)
    ? erros
    : Object.values(erros);

  for (const erro of listaErros) {
    await SimuladoQuestaoErro.create({
      simulado_bloco_id: bloco.id,
      area,
      numero_questao: erro.numero_questao,
      motivo: erro.motivo,
    });
  }
}

    res.redirect(`/simulados/${simulado.id}`);
  } catch (err) {
    console.error(err);
    res.redirect(`/simulados/${id}`);
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

