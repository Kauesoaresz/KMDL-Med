const express = require("express");
const auth = require("../middlewares/auth");
const { Topic, Subtopic } = require("../models");

const router = express.Router();

// 🔹 Tópicos por matéria
router.get("/api/subjects/:id/topics", auth, async (req, res) => {
  const userId = req.session.userId;
  const subjectId = req.params.id;

  const topics = await Topic.findAll({
    where: {
      subject_id: subjectId,
      user_id: userId
    },
    order: [["nome", "ASC"]]
  });

  res.json(topics);
});

// 🔹 Assuntos por tópico
router.get("/api/topics/:id/subtopics", auth, async (req, res) => {
  const userId = req.session.userId;
  const topicId = req.params.id;

  const subtopics = await Subtopic.findAll({
    where: {
      topic_id: topicId,
      user_id: userId
    },
    order: [["nome", "ASC"]]
  });

  res.json(subtopics);
});

module.exports = router;
