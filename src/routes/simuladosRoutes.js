const express = require("express");
const router = express.Router();
const simuladosController = require("../controllers/simuladosController");

router.get("/", simuladosController.hub);
router.get("/novo", simuladosController.novo);
router.post("/novo", simuladosController.salvar);

// 👉 LISTA
router.get("/lista", simuladosController.lista);

module.exports = router;
