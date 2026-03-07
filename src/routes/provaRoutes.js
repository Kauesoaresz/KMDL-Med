const express = require("express");
const router = express.Router();
const provaController = require("../controllers/provaController");
const auth = require("../middlewares/auth");

// HUB (página principal)
router.get("/provas", auth, provaController.hub);

// LISTA (com filtros)
router.get("/provas/lista", auth, provaController.listar);

// NOVA
router.get("/provas/nova", auth, provaController.nova);

// CRIAR
router.post("/provas", auth, provaController.criar);

// EDITAR (form)
router.get("/provas/:id/editar", auth, provaController.editarForm);

// ATUALIZAR
router.post("/provas/:id/editar", auth, provaController.atualizar);

// EXCLUIR
router.post("/provas/:id/excluir", auth, provaController.excluir);


module.exports = router;
