// ============================================================
// src/routes/trilhaRoutes.js
// Rotas da "Trilha da Aprovação".
// ============================================================

const express = require("express");
const auth = require("../middlewares/auth");
const trilha = require("../controllers/trilhaController");

const router = express.Router();

// Página principal da trilha (com ?t=<trilha_key> opcional)
router.get("/trilha", auth, trilha.exibirTrilha);

// Resgatar um marco (chamado via AJAX; devolve JSON)
router.post("/trilha/resgatar", auth, trilha.resgatarMarco);

module.exports = router;