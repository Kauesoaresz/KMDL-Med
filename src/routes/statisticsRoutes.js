const express = require("express");
const auth = require("../middlewares/auth");
const stats = require("../controllers/statisticsController");

const router = express.Router();

// tela principal
router.get("/estatisticas", auth, stats.geral);

// APIs (drill-down)
router.get("/estatisticas/materias", auth, stats.porMateria);
router.get("/estatisticas/materias/:subjectId/topicos", auth, stats.porTopico);
router.get("/estatisticas/topicos/:topicId/assuntos", auth, stats.porAssunto);

module.exports = router;
