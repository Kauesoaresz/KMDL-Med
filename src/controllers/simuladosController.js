const { Op } = require("sequelize");
const Simulado = require("../models/Simulado");
const SimuladoParte = require("../models/SimuladoParte");
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
   NOVO / CONTINUAR
========================= */
exports.novo = async (req, res) => {
  if (!req.session.userId) return res.redirect("/login");

  const user = await User.findByPk(req.session.userId);

  // Se vier ?simulado_id=XX → estamos continuando
  let simulado = null;

  if (req.query.simulado_id) {
    simulado = await Simulado.findOne({
      where: {
        id: req.query.simulado_id,
        user_id: req.session.userId
      },
      include: {
        model: SimuladoParte,
        as: "partes"
      }
    });
  }

  res.render("app/simulados-novo", {
    tituloPagina: "Cadastrar Simulado",
    active: "simulados",
    userNome: user.nome,
    userFoto: user.foto,
    simulado // pode ser null
  });
};

/* =========================
   SALVAR PARTE DO SIMULADO
========================= */
exports.salvar = async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.redirect("/login");

    const {
      nome,
      tipo,
      dia,
      data_prova,
      tempo_minutos,
      erros,
      simulado_id
    } = req.body;

    /* =========================
       1️⃣ SIMULADO (CRIA OU REUSA)
    ========================= */
    let simulado;

    if (simulado_id) {
      simulado = await Simulado.findOne({
        where: { id: simulado_id, user_id: userId }
      });
    }

    if (!simulado) {
      simulado = await Simulado.create({
        user_id: userId,
        nome,
        tipo: tipo || "ENEM",
        status: "EM_ANDAMENTO"
      });
    }

    /* =========================
       2️⃣ ERROS POR ÁREA (OBJETO)
    ========================= */
    const errosPorArea = erros ? JSON.parse(erros) : {};

    const areasConfig = {
      LINGUAGENS: [1, 45],
      HUMANAS: [46, 90],
      NATUREZA: [91, 135],
      MATEMATICA: [136, 180]
    };

    /* =========================
       3️⃣ PARA CADA ÁREA COM ERRO → CRIA UMA PARTE
    ========================= */
    for (const area of Object.keys(areasConfig)) {
      const listaErros = errosPorArea[area] || [];

      // 👉 se não marcou NENHUM erro nessa área, ignora
      if (listaErros.length === 0) continue;

      const [questao_inicio, questao_fim] = areasConfig[area];

      // evita duplicar a mesma área no mesmo dia
      const jaExiste = await SimuladoParte.findOne({
        where: {
          simulado_id: simulado.id,
          dia,
          area
        }
      });

      if (jaExiste) continue;

      const parte = await SimuladoParte.create({
        simulado_id: simulado.id,
        dia,
        area,
        questao_inicio,
        questao_fim,
        data_prova,
        tempo_minutos
      });

      await SimuladoErro.bulkCreate(
        listaErros.map(q => ({
          simulado_parte_id: parte.id,
          questao: Number(q)
        }))
      );
    }

    /* =========================
       4️⃣ ATUALIZA STATUS
    ========================= */
    const partes = await SimuladoParte.findAll({
      where: { simulado_id: simulado.id }
    });

    const diasFeitos = new Set(partes.map(p => p.dia));

    if (diasFeitos.has("DIA_1") && diasFeitos.has("DIA_2")) {
      await simulado.update({ status: "FINALIZADO" });
    }

    res.redirect("/simulados/lista");

  } catch (err) {
    console.error("Erro ao salvar simulado:", err);
    res.redirect("/simulados/novo");
  }
};


/* =========================
   LISTA DE SIMULADOS
========================= */
exports.lista = async (req, res) => {
  if (!req.session.userId) return res.redirect("/login");

  const user = await User.findByPk(req.session.userId);

  const simulados = await Simulado.findAll({
    where: { user_id: req.session.userId },
    include: {
      model: SimuladoParte,
      as: "partes"
    },
    order: [["created_at", "DESC"]]
  });

  res.render("app/simulados-lista", {
    tituloPagina: "Meus Simulados",
    active: "simulados",
    userNome: user.nome,
    userFoto: user.foto,
    simulados
  });
};

/* =========================
   VER ERROS DO SIMULADO
========================= */
exports.erros = async (req, res) => {
  if (!req.session.userId) return res.redirect("/login");

  const user = await User.findByPk(req.session.userId);

  const simulado = await Simulado.findOne({
    where: {
      id: req.params.id,
      user_id: req.session.userId
    },
    include: {
      model: SimuladoParte,
      as: "partes",
      include: {
        model: SimuladoErro,
        as: "erros"
      }
    }
  });

  if (!simulado) return res.redirect("/simulados/lista");

  res.render("app/simulados-erros", {
    tituloPagina: "Erros do Simulado",
    active: "simulados",
    userNome: user.nome,
    userFoto: user.foto,
    simulado
  });
};


exports.deletar = async (req, res) => {
  try {
    const simulado = await Simulado.findOne({
      where: {
        id: req.params.id,
        user_id: req.session.userId
      }
    });

    if (!simulado) return res.redirect("/simulados/lista");

    await simulado.destroy();
    res.redirect("/simulados/lista");

  } catch (err) {
    console.error("Erro ao deletar simulado:", err);
    res.redirect("/simulados/lista");
  }
};

exports.revisarErro = async (req, res) => {
  try {
    const erro = await SimuladoErro.findByPk(req.params.id);

    if (!erro) {
      return res.status(404).json({ ok: false });
    }

    erro.revisado = !erro.revisado;
    await erro.save();

    res.json({ ok: true, revisado: erro.revisado });

  } catch (err) {
    console.error("Erro ao revisar questão:", err);
    res.status(500).json({ ok: false });
  }
};
