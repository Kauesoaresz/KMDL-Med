const express = require("express");
const auth = require("../middlewares/auth");
const stats = require("../controllers/statisticsController");

const router = express.Router();

// HUB
router.get("/estatisticas", auth, stats.hub);

// ESTUDOS
router.get("/estatisticas/estudos", auth, stats.geral);

// APIs
router.get("/estatisticas/materias", auth, stats.porMateria);
router.get("/estatisticas/materias/:subjectId/topicos", auth, stats.porTopico);
router.get("/estatisticas/topicos/:topicId/assuntos", auth, stats.porAssunto);


module.exports = router;
