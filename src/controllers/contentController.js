const { Subject, Topic, Subtopic } = require("../models");

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

exports.subjectsIndexWithMsg = async (req, res, erro) => {
  const userId = req.session.userId;

  const subjects = await Subject.findAll({
    where: { user_id: userId },
    order: [["nome", "ASC"]]
  });

  res.render("content/subjects", {
    subjects,
    erro,
    ok: null,
    active: "conteudos",
    userNome: req.session.userNome,
    userFoto: req.session.userFoto
  });
};

exports.subjectsCreate = async (req, res) => {
  const userId = req.session.userId;
  const nome = safeTrim(req.body.nome);

  if (!nome) {
    return exports.subjectsIndexWithMsg(req, res, "Digite o nome da matéria.");
  }

  try {
    await Subject.create({ user_id: userId, nome });
    return res.redirect("/conteudos/materias?ok=Matéria criada");
  } catch {
    return exports.subjectsIndexWithMsg(req, res, "Erro ao criar matéria.");
  }
};

exports.subjectsEditPage = async (req, res) => {
  const userId = req.session.userId;
  const id = ensureInt(req.params.id);

  const subject = await Subject.findOne({ where: { id, user_id: userId } });
  if (!subject) return res.redirect("/conteudos/materias?erro=Matéria não encontrada");

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

  const [updated] = await Subject.update(
    { nome },
    { where: { id, user_id: userId } }
  );

  if (!updated) {
    return res.redirect("/conteudos/materias?erro=Matéria não encontrada");
  }

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

  const subjects = await Subject.findAll({
    where: { user_id: userId },
    order: [["nome", "ASC"]]
  });

  const topics = await Topic.findAll({
    where: { user_id: userId },
    include: [{ model: Subject, as: "subject" }],
    order: [["nome", "ASC"]]
  });

  res.render("content/topics", {
    subjects,
    topics,
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
    return res.redirect("/conteudos/topicos?erro=Dados inválidos");
  }

  await Topic.create({ user_id: userId, subject_id, nome });
  return res.redirect("/conteudos/topicos?ok=Tópico criado");
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

  if (!topic) return res.redirect("/conteudos/topicos?erro=Tópico não encontrado");

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

  await Topic.destroy({ where: { id, user_id: userId } });
  return res.redirect("/conteudos/topicos?ok=Tópico excluído");
};

// =========================
// SUBTOPICS (Assuntos)
// =========================
exports.subtopicsIndex = async (req, res) => {
  const userId = req.session.userId;

  const topics = await Topic.findAll({
    where: { user_id: userId },
    include: [{ model: Subject, as: "subject" }],
    order: [["nome", "ASC"]]
  });

  const subtopics = await Subtopic.findAll({
    where: { user_id: userId },
    include: [
      { model: Topic, as: "topic", include: [{ model: Subject, as: "subject" }] }
    ],
    order: [["nome", "ASC"]]
  });

  res.render("content/subtopics", {
    topics,
    subtopics,
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
  const nome = safeTrim(req.body.nome);

  if (!topic_id || !nome) {
    return res.redirect("/conteudos/assuntos?erro=Dados inválidos");
  }

  await Subtopic.create({ user_id: userId, topic_id, nome });
  return res.redirect("/conteudos/assuntos?ok=Assunto criado");
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

  if (!subtopic) return res.redirect("/conteudos/assuntos?erro=Assunto não encontrado");

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

  await Subtopic.destroy({ where: { id, user_id: userId } });
  return res.redirect("/conteudos/assuntos?ok=Assunto excluído");
};

// =========================
// API helpers (para selects dinâmicos)
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
