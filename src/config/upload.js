const multer = require("multer");
const path = require("path");

// ==========================
// UPLOAD DE PERFIL (Imagens)
// ==========================
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../public/uploads/profile"));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `user_${req.session.userId}_${Date.now()}${ext}`);
  }
});

const uploadProfile = multer({
  storage: profileStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Arquivo de imagem inválido"));
    }
    cb(null, true);
  }
}).single("foto");

// ==========================
// UPLOAD DE MATERIAIS (PDFs, etc)
// ==========================
const materialStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../public/uploads/materiais"));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    // Limpa o nome original para não dar problema de caracteres especiais
    const originalName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, "_");
    cb(null, `mat_${req.session.userId}_${originalName}_${Date.now()}${ext}`);
  }
});

const uploadMaterial = multer({
  storage: materialStorage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB para PDFs e provas
  fileFilter: (req, file, cb) => {
    // Permite PDFs, Word e Imagens
    const allowedMimes = [
      "application/pdf", 
      "application/msword", 
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg", 
      "image/png"
    ];
    if (!allowedMimes.includes(file.mimetype)) {
      return cb(new Error("Tipo de arquivo não permitido. Envie PDF, DOC ou Imagens."));
    }
    cb(null, true);
  }
}).single("arquivo");

module.exports = { uploadProfile, uploadMaterial };