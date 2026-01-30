require("dotenv").config();
const path = require("path");
const express = require("express");
const session = require("express-session");

const sequelize = require("./config/database");

// Models (garante que o Sequelize “conheça”)
require("./models/User");

const authRoutes = require("./routes/authRoutes");
const appRoutes = require("./routes/appRoutes");

const app = express();

// View engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middlewares básicos
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Sessão
app.use(
  session({
    secret: process.env.SESSION_SECRET || "kmed_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true
    }
  })
);

// Static
app.use("/public", express.static(path.join(__dirname, "public")));

// Rotas
app.use(authRoutes);
app.use(appRoutes);

// Start
const PORT = process.env.PORT || 3000;

(async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Conectado no MySQL com Sequelize");
    app.listen(PORT, () => console.log(`🚀 KMed rodando em http://localhost:${PORT}`));
  } catch (err) {
    console.error("❌ Erro ao conectar no banco:", err.message);
  }
})();
