const express = require("express");
const auth = require("../middlewares/auth");
const c = require("../controllers/contentController");

const router = express.Router();

// Matérias
router.get("/conteudos/materias", auth, c.subjectsIndex);
router.post("/conteudos/materias", auth, c.subjectsCreate);
router.get("/conteudos/materias/:id/editar", auth, c.subjectsEditPage);
router.post("/conteudos/materias/:id/editar", auth, c.subjectsUpdate);
router.post("/conteudos/materias/:id/excluir", auth, c.subjectsDelete);

// Tópicos
router.get("/conteudos/topicos", auth, c.topicsIndex);
router.post("/conteudos/topicos", auth, c.topicsCreate);
router.get("/conteudos/topicos/:id/editar", auth, c.topicsEditPage);
router.post("/conteudos/topicos/:id/editar", auth, c.topicsUpdate);
router.post("/conteudos/topicos/:id/excluir", auth, c.topicsDelete);

// API
router.get("/conteudos/api/topicos/:subjectId", auth, c.apiTopicsBySubject);

router.get("/conteudos", (req, res) => res.redirect("/conteudos/materias"));

module.exports = router;