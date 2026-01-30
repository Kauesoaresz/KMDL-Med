const express = require("express");
const auth = require("../middlewares/auth");
const study = require("../controllers/studyController");

const router = express.Router();

router.get("/", (req, res) => res.redirect("/login"));

router.get("/dashboard", auth, (req, res) => {
  res.render("app/dashboard", { nome: req.session.userNome });
});

// REGISTRAR DIA
router.get("/registrar", auth, study.registerPage);
router.post("/registrar", auth, study.registerSave);

module.exports = router;
