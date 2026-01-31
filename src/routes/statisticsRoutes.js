const express = require("express");
const auth = require("../middlewares/auth");
const stats = require("../controllers/statisticsController");

const router = express.Router();

// 🔁 HUB (novo)
router.get("/estatisticas", auth, stats.hub);

// 🔁 TELA ATUAL (mesma lógica)
router.get("/estatisticas/estudos", auth, stats.geral);

// APIs continuam IGUAIS
router.get("/estatisticas/materias", auth, stats.porMateria);
router.get("/estatisticas/materias/:subjectId/topicos", auth, stats.porTopico);
router.get("/estatisticas/topicos/:topicId/assuntos", auth, stats.porAssunto);

router.get("/estatisticas/simulados", auth, stats.simulados);

module.exports = router;
