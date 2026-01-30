const express = require("express");
const auth = require("../middlewares/auth");
const content = require("../controllers/contentController");

const router = express.Router();

// Menu/atalho: redireciona para matérias
router.get("/conteudos", auth, (req, res) => res.redirect("/conteudos/materias"));

// Matérias
router.get("/conteudos/materias", auth, content.subjectsIndex);
router.post("/conteudos/materias", auth, content.subjectsCreate);
router.get("/conteudos/materias/:id/editar", auth, content.subjectsEditPage);
router.post("/conteudos/materias/:id/editar", auth, content.subjectsUpdate);
router.post("/conteudos/materias/:id/excluir", auth, content.subjectsDelete);

// Tópicos
router.get("/conteudos/topicos", auth, content.topicsIndex);
router.post("/conteudos/topicos", auth, content.topicsCreate);
router.get("/conteudos/topicos/:id/editar", auth, content.topicsEditPage);
router.post("/conteudos/topicos/:id/editar", auth, content.topicsUpdate);
router.post("/conteudos/topicos/:id/excluir", auth, content.topicsDelete);

// Assuntos
router.get("/conteudos/assuntos", auth, content.subtopicsIndex);
router.post("/conteudos/assuntos", auth, content.subtopicsCreate);
router.get("/conteudos/assuntos/:id/editar", auth, content.subtopicsEditPage);
router.post("/conteudos/assuntos/:id/editar", auth, content.subtopicsUpdate);
router.post("/conteudos/assuntos/:id/excluir", auth, content.subtopicsDelete);

// API para selects dinâmicos (usaremos depois no Registrar Dia)
router.get("/api/subjects/:subjectId/topics", auth, content.apiTopicsBySubject);
router.get("/api/topics/:topicId/subtopics", auth, content.apiSubtopicsByTopic);

module.exports = router;
