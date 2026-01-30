require("dotenv").config();
const path = require("path");
const express = require("express");
const session = require("express-session");

const sequelize = require("./config/database");
require("./models/index");

const authRoutes = require("./routes/authRoutes");
const appRoutes = require("./routes/appRoutes");
const contentRoutes = require("./routes/contentRoutes");

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "kmed_secret",
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true }
  })
);

app.use("/public", express.static(path.join(__dirname, "public")));

app.use(authRoutes);
app.use(appRoutes);
app.use(contentRoutes);

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
