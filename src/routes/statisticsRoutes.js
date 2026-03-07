const express = require("express");
const auth = require("../middlewares/auth");
const stats = require("../controllers/statisticsController");
const compare = require("../controllers/simuladoCompareController");

const router = express.Router();

// HUB
router.get("/estatisticas", auth, stats.hub);

// ESTUDOS - Página principal de estatísticas
router.get("/estatisticas/estudos", auth, stats.geral);

// SIMULADOS – COMPARAÇÃO
router.get("/estatisticas/simulados/comparar", auth, compare.form);
router.post("/estatisticas/simulados/comparar", auth, compare.comparar);

module.exports = router;
