const express = require("express");
const router = express.Router();
const arquivoController = require("../controllers/arquivoController");
const auth = require("../middlewares/auth");
const { uploadMaterial } = require("../config/upload"); // O multer que você atualizou

// Hub Principal
router.get("/arquivos", auth, arquivoController.renderHub);

// Gerenciamento de Tipos (Categorias dinâmicas)
router.post("/arquivos/tipo", auth, arquivoController.criarTipo);
router.post("/arquivos/tipo/deletar/:id", auth, arquivoController.deletarTipo);

// Gerenciamento de Arquivos (Upload, Download e Delete)
router.post("/arquivos/upload", auth, uploadMaterial, arquivoController.uploadArquivo);
router.get("/arquivos/download/:id", auth, arquivoController.downloadArquivo);
router.post("/arquivos/deletar/:id", auth, arquivoController.deletarArquivo);

module.exports = router;