const express = require("express");
const auth = require("../middlewares/auth");
const c = require("../controllers/simuladoController");

const router = express.Router();

// HUB
router.get("/simulados", auth, (req, res) => {
  res.render("app/simulados/hub", {
    active: "simulados",
    userNome: req.session.userNome,
    userFoto: req.session.userFoto || null,
  });
});

// CADERNO DE ERROS (global)
router.get("/simulados/erros", auth, c.listarErros);
router.post("/simulados/erro/:erroId/revisar", auth, c.marcarErroRevisado);
router.post("/simulados/erro/:erroId/desfazer", auth, c.desfazerErroRevisado);

// LISTA / CRIAÇÃO
router.get("/simulados/lista", auth, c.listarSimulados);
router.post("/simulados", auth, c.criarSimulado);

// SIMULADO (grade)
router.get("/simulados/:id", auth, c.detalhesSimulado);
router.post("/simulados/:id/gabarito", auth, c.salvarGabarito);
router.post("/simulados/:id/status", auth, c.alterarStatus);
router.post("/simulados/:id/excluir", auth, c.excluirSimulado);

module.exports = router;