const express = require("express");
const router = express.Router();
const calendarioController = require("../controllers/calendarioController");

// Middleware simples de auth (se já existir outro, usa o teu)
function auth(req, res, next) {
  if (!req.session.userId) {
    return res.redirect("/login");
  }
  next();
}

router.get("/calendario", auth, calendarioController.calendario);

module.exports = router;
