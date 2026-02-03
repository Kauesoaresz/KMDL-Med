const express = require("express");
const auth = require("../middlewares/auth");
const simuladoStatsController = require("../controllers/simuladoStatsController");

const router = express.Router();

// =========================
// DASHBOARD DE SIMULADOS
// =========================
router.get(
  "/estatisticas/simulados",
  auth,
  simuladoStatsController.dashboard
);

module.exports = router;
