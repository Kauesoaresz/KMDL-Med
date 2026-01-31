const express = require("express");
const auth = require("../middlewares/auth");
const contentController = require("../controllers/contentController");

const router = express.Router();

// =========================
// SUBJECTS (Matérias)
// =========================
router.get("/conteudos/materias", auth, contentController.subjectsIndex);
router.post("/conteudos/materias", auth, contentController.subjectsCreate);
router.get("/conteudos/materias/:id/editar", auth, contentController.subjectsEditPage);
router.post("/conteudos/materias/:id/editar", auth, contentController.subjectsUpdate);
router.post("/conteudos/materias/:id/excluir", auth, contentController.subjectsDelete);

// =========================
// TOPICS (Tópicos)
// =========================
router.get("/conteudos/topicos", auth, contentController.topicsIndex);
router.post("/conteudos/topicos", auth, contentController.topicsCreate);
router.get("/conteudos/topicos/:id/editar", auth, contentController.topicsEditPage);
router.post("/conteudos/topicos/:id/editar", auth, contentController.topicsUpdate);
router.post("/conteudos/topicos/:id/excluir", auth, contentController.topicsDelete);

// =========================
// SUBTOPICS (Assuntos)
// =========================
router.get("/conteudos/assuntos", auth, contentController.subtopicsIndex);
router.post("/conteudos/assuntos", auth, contentController.subtopicsCreate);
router.get("/conteudos/assuntos/:id/editar", auth, contentController.subtopicsEditPage);
router.post("/conteudos/assuntos/:id/editar", auth, contentController.subtopicsUpdate);
router.post("/conteudos/assuntos/:id/excluir", auth, contentController.subtopicsDelete);

// =========================
// API HELPERS
// =========================
router.get("/conteudos/api/topicos/:subjectId", auth, contentController.apiTopicsBySubject);
router.get("/conteudos/api/assuntos/:topicId", auth, contentController.apiSubtopicsByTopic);

router.get("/conteudos", (req, res) => {
  return res.redirect("/conteudos/materias");
});


module.exports = router;
