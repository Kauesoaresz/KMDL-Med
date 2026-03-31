const { Subject, Topic, Subtopic } = require("../models");
const { Op } = require("sequelize");

function safeTrim(v) {
  return (v || "").toString().trim();
}

function ensureInt(v) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}

// =========================
// SUBJECTS (Matérias)
// =========================
exports.subjectsIndex = async (req, res) => {
  const userId = req.session.userId;

  const subjects = await Subject.findAll({
    where: { user_id: userId },
    order: [["nome", "ASC"]]
  });

  res.render("content/subjects", {
    subjects,
    erro: req.query.erro || null,
    ok: req.query.ok || null,
    active: "conteudos",
    userNome: req.session.userNome,
    userFoto: req.session.userFoto
  });
};

exports.subjectsCreate = async (req, res) => {
  const userId = req.session.userId;
  const nome = safeTrim(req.body.nome);

  if (!nome) {
    return res.redirect("/conteudos/materias?erro=Digite o nome da matéria");
  }

  await Subject.create({ user_id: userId, nome });
  return res.redirect("/conteudos/materias?ok=Matéria criada");
};

exports.subjectsEditPage = async (req, res) => {
  const userId = req.session.userId;
  const id = ensureInt(req.params.id);

  const subject = await Subject.findOne({ where: { id, user_id: userId } });
  if (!subject) {
    return res.redirect("/conteudos/materias?erro=Matéria não encontrada");
  }

  res.render("content/subjects-edit", {
    subject,
    erro: req.query.erro || null,
    ok: null,
    active: "conteudos",
    userNome: req.session.userNome,
    userFoto: req.session.userFoto
  });
};

exports.subjectsUpdate = async (req, res) => {
  const userId = req.session.userId;
  const id = ensureInt(req.params.id);
  const nome = safeTrim(req.body.nome);

  if (!nome) {
    return res.redirect(`/conteudos/materias/${id}/editar?erro=Nome obrigatório`);
  }

  await Subject.update(
    { nome },
    { where: { id, user_id: userId } }
  );

  return res.redirect("/conteudos/materias?ok=Matéria atualizada");
};

exports.subjectsDelete = async (req, res) => {
  const userId = req.session.userId;
  const id = ensureInt(req.params.id);

  await Subject.destroy({ where: { id, user_id: userId } });
  return res.redirect("/conteudos/materias?ok=Matéria excluída");
};

// =========================
// TOPICS (Tópicos)
// =========================
exports.topicsIndex = async (req, res) => {
  const userId = req.session.userId;
  const filtroSubjectId = ensureInt(req.query.subject_id);

  const subjects = await Subject.findAll({
    where: { user_id: userId },
    order: [["nome", "ASC"]]
  });

  const where = { user_id: userId };
  if (filtroSubjectId) {
    where.subject_id = filtroSubjectId;
  }

  const topics = await Topic.findAll({
    where,
    include: [{ model: Subject, as: "subject" }],
    order: [["nome", "ASC"]]
  });

  res.render("content/topics", {
    subjects,
    topics,
    filtroSubjectId,
    erro: req.query.erro || null,
    ok: req.query.ok || null,
    active: "conteudos",
    userNome: req.session.userNome,
    userFoto: req.session.userFoto
  });
};



exports.topicsCreate = async (req, res) => {
  const userId = req.session.userId;
  const subject_id = ensureInt(req.body.subject_id);
  const nome = safeTrim(req.body.nome);

  if (!subject_id || !nome) {
    return res.redirect(`/conteudos/topicos?subject_id=${subject_id}&erro=Dados inválidos`);
  }

  await Topic.create({ user_id: userId, subject_id, nome });

  // 🔥 mantém o filtro
  return res.redirect(`/conteudos/topicos?subject_id=${subject_id}&ok=Tópico criado`);
};


exports.topicsEditPage = async (req, res) => {
  const userId = req.session.userId;
  const id = ensureInt(req.params.id);

  const subjects = await Subject.findAll({
    where: { user_id: userId },
    order: [["nome", "ASC"]]
  });

  const topic = await Topic.findOne({
    where: { id, user_id: userId }
  });

  if (!topic) {
    return res.redirect("/conteudos/topicos?erro=Tópico não encontrado");
  }

  res.render("content/topics-edit", {
    subjects,
    topic,
    erro: req.query.erro || null,
    ok: null,
    active: "conteudos",
    userNome: req.session.userNome,
    userFoto: req.session.userFoto
  });
};

exports.topicsUpdate = async (req, res) => {
  const userId = req.session.userId;
  const id = ensureInt(req.params.id);
  const subject_id = ensureInt(req.body.subject_id);
  const nome = safeTrim(req.body.nome);

  if (!subject_id || !nome) {
    return res.redirect(`/conteudos/topicos/${id}/editar?erro=Dados inválidos`);
  }

  await Topic.update(
    { subject_id, nome },
    { where: { id, user_id: userId } }
  );

  return res.redirect("/conteudos/topicos?ok=Tópico atualizado");
};

exports.topicsDelete = async (req, res) => {
  const userId = req.session.userId;
  const id = ensureInt(req.params.id);

  try {
    await Topic.destroy({
      where: { id, user_id: userId }
    });

    return res.redirect("/conteudos/topicos?ok=Tópico excluído");
  } catch (err) {
    if (err.name === "SequelizeForeignKeyConstraintError") {
      return res.redirect(
        "/conteudos/topicos?erro=Este tópico já foi usado em registros de estudo e não pode ser excluído"
      );
    }

    return res.redirect("/conteudos/topicos?erro=Erro ao excluir tópico");
  }
};


// =========================
// SUBTOPICS (Assuntos)
// =========================
exports.subtopicsIndex = async (req, res) => {
  const userId = req.session.userId;
  const filtroSubjectId = ensureInt(req.query.subject_id);
  const filtroTopicId = ensureInt(req.query.topic_id);

  const subjects = await Subject.findAll({
    where: { user_id: userId },
    order: [["nome", "ASC"]]
  });

  const topicsWhere = { user_id: userId };
  if (filtroSubjectId) {
    topicsWhere.subject_id = filtroSubjectId;
  }

  const topics = await Topic.findAll({
    where: topicsWhere,
    include: [{ model: Subject, as: "subject" }],
    order: [["nome", "ASC"]]
  });

  const where = { user_id: userId };
  if (filtroTopicId) {
    where.topic_id = filtroTopicId;
  } else if (filtroSubjectId) {
    // Se filtrar por matéria, mostra apenas assuntos dos tópicos dessa matéria
    const topicIds = topics.map(t => t.id);
    if (topicIds.length > 0) {
      where.topic_id = { [Op.in]: topicIds };
    }
  }

  const subtopics = await Subtopic.findAll({
    where,
    include: [
      { model: Topic, as: "topic", include: [{ model: Subject, as: "subject" }] }
    ],
    order: [["nome", "ASC"]]
  });

  res.render("content/subtopics", {
    subjects,
    topics,
    subtopics,
    filtroSubjectId,
    filtroTopicId,
    erro: req.query.erro || null,
    ok: req.query.ok || null,
    active: "conteudos",
    userNome: req.session.userNome,
    userFoto: req.session.userFoto
  });
};



exports.subtopicsCreate = async (req, res) => {
  const userId = req.session.userId;
  const topic_id = ensureInt(req.body.topic_id);
  const subject_id = ensureInt(req.query.subject_id);
  const nome = safeTrim(req.body.nome);

  if (!topic_id || !nome) {
    return res.redirect(`/conteudos/assuntos?subject_id=${subject_id || ''}&topic_id=${topic_id || ''}&erro=Dados inválidos`);
  }

  const [subtopic, created] = await Subtopic.findOrCreate({
    where: { user_id: userId, topic_id, nome },
    defaults: { user_id: userId, topic_id, nome }
  });

  if (!created) {
    return res.redirect(`/conteudos/assuntos?subject_id=${subject_id || ''}&topic_id=${topic_id || ''}&erro=Assunto já existe para este tópico`);
  }

  // Mantém os filtros
  return res.redirect(`/conteudos/assuntos?subject_id=${subject_id || ''}&topic_id=${topic_id}&ok=Assunto criado`);
};


exports.subtopicsEditPage = async (req, res) => {
  const userId = req.session.userId;
  const id = ensureInt(req.params.id);

  const topics = await Topic.findAll({
    where: { user_id: userId },
    include: [{ model: Subject, as: "subject" }],
    order: [["nome", "ASC"]]
  });

  const subtopic = await Subtopic.findOne({
    where: { id, user_id: userId }
  });

  if (!subtopic) {
    return res.redirect("/conteudos/assuntos?erro=Assunto não encontrado");
  }

  res.render("content/subtopics-edit", {
    topics,
    subtopic,
    erro: req.query.erro || null,
    ok: null,
    active: "conteudos",
    userNome: req.session.userNome,
    userFoto: req.session.userFoto
  });
};

exports.subtopicsUpdate = async (req, res) => {
  const userId = req.session.userId;
  const id = ensureInt(req.params.id);
  const topic_id = ensureInt(req.body.topic_id);
  const nome = safeTrim(req.body.nome);

  if (!topic_id || !nome) {
    return res.redirect(`/conteudos/assuntos/${id}/editar?erro=Dados inválidos`);
  }

  await Subtopic.update(
    { topic_id, nome },
    { where: { id, user_id: userId } }
  );

  return res.redirect("/conteudos/assuntos?ok=Assunto atualizado");
};

exports.subtopicsDelete = async (req, res) => {
  const userId = req.session.userId;
  const id = ensureInt(req.params.id);

  try {
    await Subtopic.destroy({
      where: { id, user_id: userId }
    });

    return res.redirect("/conteudos/assuntos?ok=Assunto excluído");
  } catch (err) {
    if (err.name === "SequelizeForeignKeyConstraintError") {
      return res.redirect(
        "/conteudos/assuntos?erro=Este assunto já foi usado em registros de estudo e não pode ser excluído"
      );
    }

    return res.redirect("/conteudos/assuntos?erro=Erro ao excluir assunto");
  }
};

// =========================
// API HELPERS (MANTIDOS)
// =========================
exports.apiTopicsBySubject = async (req, res) => {
  const userId = req.session.userId;
  const subject_id = ensureInt(req.params.subjectId);

  if (!subject_id) return res.json([]);

  const topics = await Topic.findAll({
    where: { user_id: userId, subject_id },
    order: [["nome", "ASC"]]
  });

  res.json(topics.map(t => ({ id: t.id, nome: t.nome })));
};

exports.apiSubtopicsByTopic = async (req, res) => {
  const userId = req.session.userId;
  const topic_id = ensureInt(req.params.topicId);

  if (!topic_id) return res.json([]);

  const subtopics = await Subtopic.findAll({
    where: { user_id: userId, topic_id },
    order: [["nome", "ASC"]]
  });

  res.json(subtopics.map(s => ({ id: s.id, nome: s.nome })));
};
