const express = require("express");
const auth = require("../middlewares/auth");
const study = require("../controllers/studyController");

const router = express.Router();

router.get("/", (req, res) => res.redirect("/login"));

router.get("/dashboard", auth, (req, res) => {
  res.render("app/dashboard", { nome: req.session.userNome });
});

// =========================
// REGISTRAR DIA - HUB
// =========================
router.get("/registrar", auth, study.hub);

// novo dia
router.get("/registrar/novo", auth, study.registerPage);
router.post("/registrar/novo", auth, study.registerSave);

// lista de dias
router.get("/registrar/lista", auth, study.listDays);

// editar dia (acesso SEMPRE pela lista)
router.get("/registrar/editar/:data", auth, study.editPage);
router.post("/registrar/editar/:data", auth, study.editSave);

// excluir dia
router.post("/registrar/excluir/:data", auth, study.deleteDay);

module.exports = router;
