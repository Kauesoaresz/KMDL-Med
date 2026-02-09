const express = require("express");
const auth = require("../middlewares/auth");
const stats = require("../controllers/statisticsController");
const compare = require("../controllers/simuladoCompareController");
const conteudo = require("../controllers/statisticsConteudoController");

const router = express.Router();

// HUB
router.get("/estatisticas", auth, stats.hub);

// ESTUDOS
router.get("/estatisticas/estudos", auth, stats.geral);

// SIMULADOS – COMPARAÇÃO
router.get("/estatisticas/simulados/comparar", auth, compare.form);
router.post("/estatisticas/simulados/comparar", auth, compare.comparar);

router.get(
  "/estatisticas/conteudo/dashboard",
  auth,
  stats.materiasDashboard
);



// DASHBOARD CONTEÚDO
router.get(
  "/estatisticas/conteudo",
  auth,
  conteudo.dashboard
);

// APIs
router.get(
  "/estatisticas/conteudo/materias",
  auth,
  conteudo.materias
);

router.get(
  "/estatisticas/conteudo/materias/:subjectId/topicos",
  auth,
  conteudo.topicos
);

router.get(
  "/estatisticas/conteudo/topicos/:topicId/assuntos",
  auth,
  conteudo.assuntos
);


// APIs
router.get("/estatisticas/materias", auth, stats.porMateria);
router.get("/estatisticas/materias/:subjectId/topicos", auth, stats.porTopico);
router.get("/estatisticas/topicos/:topicId/assuntos", auth, stats.porAssunto);

module.exports = router;
