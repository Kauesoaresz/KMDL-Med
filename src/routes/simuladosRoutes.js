const express = require("express");
const router = express.Router();
const simuladosController = require("../controllers/simuladosController");

// HUB
router.get("/", simuladosController.hub);

// NOVO / CONTINUAR
router.get("/novo", simuladosController.novo);
router.post("/novo", simuladosController.salvar);

// LISTA
router.get("/lista", simuladosController.lista);

router.post("/erros/:id/revisar", simuladosController.revisarErro);


// VER ERROS
router.get("/:id/erros", simuladosController.erros);

// DELETAR
router.post("/:id/deletar", simuladosController.deletar);

module.exports = router;
