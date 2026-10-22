const express = require("express");
const auth = require("../middlewares/auth");
const { Topic } = require("../models");

const router = express.Router();

// Tópicos por matéria
router.get("/api/subjects/:id/topics", auth, async (req, res) => {
  const userId = req.session.userId;
  const subjectId = req.params.id;

  const topics = await Topic.findAll({
    where: { subject_id: subjectId, user_id: userId },
    order: [["nome", "ASC"]]
  });

  res.json(topics);
});

module.exports = router;