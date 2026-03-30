const express = require("express");
const auth = require("../middlewares/auth");

const study = require("../controllers/studyController");
const dashboard = require("../controllers/dashboardController");
const profile = require("../controllers/profileController");
const reviewController = require("../controllers/reviewController");
const reportController = require("../controllers/reportController");

const { uploadProfile } = require("../config/upload");

const router = express.Router();

// =========================
// ROOT
// =========================
router.get("/", (req, res) => res.redirect("/login"));

// =========================
// DASHBOARD
// =========================
router.get("/dashboard", auth, dashboard.dashboard);

// =========================
// PERFIL
// =========================
router.get("/perfil", auth, profile.profilePage);
router.post("/perfil", auth, uploadProfile, profile.profileSave);

// =========================
// REGISTRAR DIA
// =========================
router.get("/registrar", auth, study.hub);
router.get("/registrar/novo", auth, study.registerPage);
router.post("/registrar/novo", auth, study.registerSave);
router.get("/registrar/lista", auth, study.listDays);
router.get("/registrar/editar/:data", auth, study.editPage);
router.post("/registrar/editar/:data", auth, study.editSave);
router.post("/registrar/excluir/:data", auth, study.deleteDay);

// =========================
// REDAÇÃO
// =========================
router.get("/redacao", auth, study.redacaoPage);
router.post("/redacao", auth, study.redacaoSave);

// =========================
// REDAÇÃO EDIT/DELETE
// =========================
router.get("/redacao/editar/:id", auth, study.editRedacaoPage);
router.post("/redacao/editar/:id", auth, study.editRedacaoSave);
router.post("/redacao/excluir/:id", auth, study.deleteRedacao);
router.post("/redacao/comentario/:id", auth, study.saveRedacaoComentario);

// =========================



// =========================
// REVISÕES
// =========================
router.get("/revisoes", auth, reviewController.index);
router.post("/revisoes/registrar", auth, reviewController.registrarRevisao);
router.get("/revisoes/hoje", auth, reviewController.listarRevisoesHoje);
router.get("/revisoes/historico/:subjectId/:topicId", auth, reviewController.historicoRevisao);
router.get("/revisoes/erros/:subjectId/:topicId", auth, reviewController.obterErrosTopico);
router.post("/revisoes/erros/revisar", auth, reviewController.marcarErrosRevisados);

// =========================
// RELATÓRIO PDF
// =========================
router.get("/relatorio", auth, reportController.index);
router.get("/relatorio/gerar/:periodo", auth, reportController.gerarRelatorio);

module.exports = router;
