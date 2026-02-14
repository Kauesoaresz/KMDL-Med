const { Prova, User } = require("../models");

// ===============================
// LISTAR PROVAS
// ===============================
async function listar(req, res) {
  try {
    const userId = req.session.userId;

    const provas = await Prova.findAll({
      where: { user_id: userId },
      order: [["data_prova_1", "ASC"]],
    });

    console.log("PROVAS ENCONTRADAS:", provas);

    res.render("app/provas/lista", {
      provas,
      active: "provas",
      userNome: req.session.user?.nome || "Usuário",
      userFoto: req.session.user?.foto || null,
    });

  } catch (err) {
    console.error("🔥 ERRO COMPLETO:", err);
    res.send(err); // 👈 MUDE PARA ISSO
  }
}



// ===============================
// NOVA PROVA
// ===============================
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

// ===============================
// CRIAR PROVA
// ===============================
async function criar(req, res) {
  try {
    await Prova.create({
      user_id: req.session.userId,
      nome: req.body.nome,
      tipo: req.body.tipo,
      data_prova_1: req.body.data_prova_1,
      data_prova_2: req.body.data_prova_2 || null,
      valor_inscricao: req.body.valor_inscricao || null,
      pago: req.body.pago ? true : false,
      local: req.body.local || null,
      observacoes: req.body.observacoes || null,
    });

    res.redirect("/provas");

  } catch (err) {
    console.error(err);
    res.redirect("/provas");
  }
}

async function editarForm(req, res) {
  const prova = await Prova.findByPk(req.params.id);

  res.render("app/provas/editar", {
    prova,
    active: "provas",
    userNome: req.session.user?.nome,
    userFoto: req.session.user?.foto,
  });
}

async function atualizar(req, res) {
  await Prova.update(
    {
      nome: req.body.nome,
      tipo: req.body.tipo,
      data_prova_1: req.body.data_prova_1,
      valor_inscricao: req.body.valor_inscricao,
      pago: req.body.pago ? true : false,
      local: req.body.local,
      observacoes: req.body.observacoes,
    },
    { where: { id: req.params.id } }
  );

  res.redirect("/provas");
}

async function excluir(req, res) {
  await Prova.destroy({
    where: { id: req.params.id },
  });

  res.redirect("/provas");
}


module.exports = {
  listar,
  nova,
  criar,
  editarForm,
  atualizar,
  excluir
};
