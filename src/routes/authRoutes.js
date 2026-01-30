const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const router = express.Router();

// Tela login
router.get("/login", (req, res) => {
  res.render("auth/login", { erro: null });
});

// Processa login
router.post("/login", async (req, res) => {
  try {
    const { email, senha } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).render("auth/login", { erro: "Email ou senha inválidos." });

    const ok = await bcrypt.compare(senha, user.senha_hash);
    if (!ok) return res.status(401).render("auth/login", { erro: "Email ou senha inválidos." });

    req.session.userId = user.id;
    req.session.userNome = user.nome;

    return res.redirect("/dashboard");
  } catch (e) {
    return res.status(500).render("auth/login", { erro: "Erro interno. Tente novamente." });
  }
});

// Tela cadastro (opcional, mas ajuda no começo)
router.get("/cadastrar", (req, res) => {
  res.render("auth/register", { erro: null });
});

// Processa cadastro
router.post("/cadastrar", async (req, res) => {
  try {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).render("auth/register", { erro: "Preencha todos os campos." });
    }

    const existe = await User.findOne({ where: { email } });
    if (existe) {
      return res.status(409).render("auth/register", { erro: "Esse email já está cadastrado." });
    }

    const senha_hash = await bcrypt.hash(senha, 10);
    const user = await User.create({ nome, email, senha_hash });

    req.session.userId = user.id;
    req.session.userNome = user.nome;

    return res.redirect("/dashboard");
  } catch (e) {
    return res.status(500).render("auth/register", { erro: "Erro interno. Tente novamente." });
  }
});

// Logout
router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

module.exports = router;
