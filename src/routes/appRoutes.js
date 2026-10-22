const express = require("express");
const auth = require("../middlewares/auth");

const study = require("../controllers/studyController");
const dashboard = require("../controllers/dashboardController");
const profile = require("../controllers/profileController");
const { uploadProfile } = require("../config/upload");

const router = express.Router();

router.get("/", (req, res) => res.redirect("/login"));

router.get("/dashboard", auth, dashboard.dashboard);

router.get("/perfil", auth, profile.profilePage);
router.post("/perfil", auth, uploadProfile, profile.profileSave);

router.get("/registrar", auth, study.hub);
router.get("/registrar/novo", auth, study.registerPage);
router.post("/registrar/novo", auth, study.registerSave);
router.get("/registrar/lista", auth, study.listDays);
router.get("/registrar/editar/:data", auth, study.editPage);
router.post("/registrar/editar/:data", auth, study.editSave);
router.post("/registrar/excluir/:data", auth, study.deleteDay);

module.exports = router;