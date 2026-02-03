const express = require("express");
const auth = require("../middlewares/auth");
const simuladoController = require("../controllers/simuladoController");

const router = express.Router();

// =========================
// HUB
// =========================
router.get("/simulados", auth, (req, res) => {
  res.render("app/simulados/hub", {
    active: "simulados",
    userNome: req.session.userNome,
    userFoto: req.session.userFoto || null,
  });
});

// =========================
// ERROS (GLOBAL)
// =========================
router.get("/simulados/erros", auth, simuladoController.listarErros);
router.post("/simulados/erro/:erroId/revisar", auth, simuladoController.marcarErroRevisado);

// =========================
// LISTA / CRIAÇÃO
// =========================
router.get("/simulados/lista", auth, simuladoController.listarSimulados);
router.post("/simulados", auth, simuladoController.criarSimulado);

// =========================
// SIMULADO
// =========================
router.get("/simulados/:id", auth, simuladoController.detalhesSimulado);
router.post("/simulados/:id/bloco", auth, simuladoController.adicionarBloco);
router.post("/simulados/:id/finalizar", auth, simuladoController.finalizarSimulado);

// =========================
// BLOCO
// =========================
router.get("/simulados/bloco/:blocoId/editar", auth, simuladoController.editarBlocoForm);
router.post("/simulados/bloco/:blocoId/editar", auth, simuladoController.editarBlocoSalvar);
router.post("/simulados/bloco/:blocoId/excluir", auth, simuladoController.excluirBloco);

// =========================
// ERRO
// =========================
router.get("/simulados/erro/:erroId/editar", auth, simuladoController.editarErroForm);
router.post("/simulados/erro/:erroId/editar", auth, simuladoController.editarErroSalvar);
router.post("/simulados/erro/:erroId/excluir", auth, simuladoController.excluirErro);

module.exports = router;
