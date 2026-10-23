const express = require("express");
const auth = require("../middlewares/auth");

const study = require("../controllers/studyController");
const dashboard = require("../controllers/dashboardController");
const profile = require("../controllers/profileController");
const { uploadProfile } = require("../config/upload");
const uploadBg = require("../config/uploadBg");

const router = express.Router();

router.get("/", (req, res) => res.redirect("/login"));

router.get("/dashboard", auth, dashboard.dashboard);

router.get("/perfil", auth, profile.profilePage);
router.post("/perfil", auth, uploadProfile, profile.profileSave);

router.post(
  "/perfil/fundo",
  auth,
  (req, res, next) =>
    uploadBg.single("fundo")(req, res, (err) => {
      if (err) {
        const msg = err.code === "LIMIT_FILE_SIZE" ? "A imagem deve ter até 5 MB." : err.message || "Imagem inválida.";
        return res.redirect("/perfil?erro=" + encodeURIComponent(msg));
      }
      next();
    }),
  profile.bgSave
);
router.post("/perfil/fundo/remover", auth, profile.bgRemove);

router.get("/registrar", auth, study.hub);
router.get("/registrar/novo", auth, study.registerPage);
router.post("/registrar/novo", auth, study.registerSave);
router.get("/registrar/lista", auth, study.listDays);
router.get("/registrar/editar/:data", auth, study.editPage);
router.post("/registrar/editar/:data", auth, study.editSave);
router.post("/registrar/excluir/:data", auth, study.deleteDay);

router.get("/ui-teste", auth, (req, res) => {
  res.render("app/ui-teste", {
    active: "dashboard",
    userNome: req.session.userNome,
    userFoto: req.session.userFoto
  });
});

module.exports = router;