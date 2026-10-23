const multer = require("multer");
const fs = require("fs");
const path = require("path");

const DIR = path.join(__dirname, "../public/uploads/login-bg");
fs.mkdirSync(DIR, { recursive: true });

const EXT = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp" };

module.exports = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, DIR),
    filename: (req, file, cb) => cb(null, "bg-" + Date.now() + EXT[file.mimetype]),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (EXT[file.mimetype]) return cb(null, true);
    cb(new Error("Use uma imagem JPG, PNG ou WebP."));
  },
});