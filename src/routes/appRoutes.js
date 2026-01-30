const express = require("express");
const auth = require("../middlewares/auth");

const router = express.Router();

router.get("/", (req, res) => res.redirect("/login"));

router.get("/dashboard", auth, (req, res) => {
  res.render("app/dashboard", { nome: req.session.userNome });
});

module.exports = router;
