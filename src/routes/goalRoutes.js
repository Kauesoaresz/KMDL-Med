const express = require("express");
const auth = require("../middlewares/auth");
const goalController = require("../controllers/goalController");

const router = express.Router();

// =========================
// ROTAS DE METAS
// =========================

// API - Criar meta
router.post("/api/metas/criar", auth, goalController.criarMeta);

// API - Listar metas principais (para dashboard)
router.get("/api/metas/principais", auth, goalController.listarMetasPrincipais);

// API - Listar todas as metas ativas (para modal de seleção)
router.get("/api/metas/todas", auth, goalController.listarTodasMetas);

// API - Definir como principal
router.post("/api/metas/:id/principal", auth, goalController.definirPrincipal);

// API - Atualizar progresso
router.post("/api/metas/:id/atualizar", auth, goalController.atualizarProgresso);

// API - Finalizar meta manualmente
router.post("/api/metas/:id/finalizar", auth, goalController.finalizarMeta);

// API - Deletar meta
router.delete("/api/metas/:id", auth, goalController.deletarMeta);

// Página de histórico de metas
router.get("/metas", auth, goalController.historicoMetas);

module.exports = router;

