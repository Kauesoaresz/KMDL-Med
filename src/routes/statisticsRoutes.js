const express = require("express");
const auth = require("../middlewares/auth");
const stats = require("../controllers/statisticsController");
const compare = require("../controllers/simuladoCompareController");

const router = express.Router();

// HUB
router.get("/estatisticas", auth, stats.hub);

// ESTUDOS - Página principal de estatísticas
router.get("/estatisticas/estudos", auth, stats.geral);

// REDAÇÃO - Estatísticas de redação
router.get("/estatisticas/redacao", auth, stats.redacao);
router.get("/estatisticas/redacao/:entryId", auth, stats.redacaoDetalhes);

// CONTEÚDO - Estatísticas por matéria/tópico/assunto
router.get("/estatisticas/conteudo", auth, stats.conteudo);
router.get("/estatisticas/conteudo/dashboard", auth, stats.conteudo);

// DETALHES - Ver detalhes de uma matéria específica
router.get("/estatisticas/conteudo/:id", auth, stats.detalhesMateria);

// SIMULADOS – COMPARAÇÃO
router.get("/estatisticas/simulados/comparar", auth, compare.form);
router.post("/estatisticas/simulados/comparar", auth, compare.comparar);

module.exports = router;
