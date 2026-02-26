require("dotenv").config();

const path = require("path");
const express = require("express");
const session = require("express-session");

const sequelize = require("./config/database");
require("./models/index");

// =========================
// ROTAS
// =========================
const authRoutes = require("./routes/authRoutes");
const appRoutes = require("./routes/appRoutes");
const contentRoutes = require("./routes/contentRoutes");
const statisticsRoutes = require("./routes/statisticsRoutes");
const simuladoStatsRoutes = require("./routes/simuladoStatsRoutes");
const calendarioRoutes = require("./routes/calendarioRoutes");
const apiRoutes = require("./routes/apiRoutes");
const simuladoRoutes = require("./routes/simuladoRoutes");
const provaRoutes = require("./routes/provaRoutes");

const app = express();

// =========================
// VIEW ENGINE
// =========================
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// =========================
// MIDDLEWARES
// =========================
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "kmed_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
    },
  })
);

// =========================
// STATIC FILES
// =========================
app.use("/public", express.static(path.join(__dirname, "public")));

// =========================
// ROTAS
// =========================
app.use(authRoutes);
app.use(appRoutes);
app.use(contentRoutes);

app.use(statisticsRoutes);
app.use(simuladoStatsRoutes);

app.use(calendarioRoutes);

app.use(simuladoRoutes);
app.use(provaRoutes);

app.use(apiRoutes);

// =========================
// SERVER
// =========================
const PORT = process.env.PORT || 3000;

(async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Conectado no MySQL com Sequelize");

    // 🔥 ESSA LINHA CRIA A TABELA PROVAS
    await sequelize.sync();

    console.log("📦 Tabelas sincronizadas");

    app.listen(PORT, () => {
      console.log(`🚀 KMDL Med rodando em http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Erro ao conectar no banco:", err.message);
  }
})();
