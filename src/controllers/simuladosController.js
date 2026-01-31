const Simulado = require("../models/Simulado");
const SimuladoErro = require("../models/SimuladoErro");
const User = require("../models/User");

/* =========================
   HUB
========================= */
exports.hub = async (req, res) => {
  if (!req.session.userId) return res.redirect("/login");

  const user = await User.findByPk(req.session.userId);

  res.render("app/simulados", {
    tituloPagina: "Simulados",
    active: "simulados",
    userNome: user.nome,
    userFoto: user.foto
  });
};

/* =========================
   NOVO
========================= */
exports.novo = async (req, res) => {
  if (!req.session.userId) return res.redirect("/login");

  const user = await User.findByPk(req.session.userId);

  res.render("app/simulados-novo", {
    tituloPagina: "Cadastrar Simulado",
    active: "simulados",
    userNome: user.nome,
    userFoto: user.foto
  });
};

/* =========================
   SALVAR
========================= */
exports.salvar = async (req, res) => {
  try {
    const {
      nome,
      dia,
      area,
      data_prova,
      tempo_minutos,
      erros
    } = req.body;

    const simulado = await Simulado.create({
      user_id: req.session.userId,
      nome,
      dia,
      area,
      data_prova,
      tempo_minutos,
      status: "EM_ANDAMENTO"
    });

    if (erros) {
      const lista = JSON.parse(erros);

      const errosFormatados = lista.map(q => ({
        simulado_id: simulado.id,
        questao: Number(q)
      }));

      await SimuladoErro.bulkCreate(errosFormatados);
    }

    res.redirect("/simulados");

  } catch (e) {
    console.error(e);
    res.redirect("/simulados/novo");
  }
};

/* =========================
   LISTA DE SIMULADOS
========================= */
exports.lista = async (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }

  const user = await User.findByPk(req.session.userId);

  const simulados = await Simulado.findAll({
    where: { user_id: req.session.userId },
    order: [
      ["nome", "ASC"],
      ["dia", "ASC"],
      ["data_prova", "ASC"]
    ]
  });

  res.render("app/simulados-lista", {
    tituloPagina: "Meus Simulados",
    active: "simulados",
    userNome: user.nome,
    userFoto: user.foto,
    simulados
  });
};
