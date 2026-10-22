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
const goalRoutes = require("./routes/goalRoutes");

const app = express();

// =========================
// VIEW ENGINE
// =========================
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
// Development: disable cache
if (process.env.NODE_ENV !== 'production') {
  app.set('view cache', false);
}

// =========================
// HELPER FUNCTIONS GLOBAL
// =========================
// Função para formatar horas em "Xh Ymin", "Xh" ou "Ymin"
app.locals.formatHours = function(decimalHours) {
  if (!decimalHours || decimalHours <= 0) return "0min";
  
  const horas = Math.floor(decimalHours);
  const minutos = Math.round((decimalHours - horas) * 60);
  
  if (horas === 0) {
    return minutos + "min";
  }
  
  if (minutos === 0) {
    return horas + "h";
  }
  
  return horas + "h " + minutos + "min";
};

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

app.use(goalRoutes);

app.use(apiRoutes);

// =========================
// SERVER
// =========================
const PORT = process.env.PORT || 3000;

(async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Conectado no MySQL com Sequelize");

    await sequelize.sync(); // cria tabelas novas; NÃO apaga tabelas/colunas antigas

    console.log("📦 Tabelas sincronizadas");

    app.listen(PORT, () => {
      console.log(`🚀 KMDL Med rodando em http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Erro ao conectar no banco:", err.message);
  }
})();
