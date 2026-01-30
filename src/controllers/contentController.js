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

  res.render("content/subjects", { subjects, erro: null, ok: null });
};

exports.subjectsCreate = async (req, res) => {
  const userId = req.session.userId;
  const nome = safeTrim(req.body.nome);

  if (!nome) {
    return exports.subjectsIndexWithMsg(req, res, "Digite o nome da matéria.");
  }

  try {
    await Subject.create({ user_id: userId, nome });
    return res.redirect("/conteudos/materias?ok=Materia+criada");
  } catch (e) {
    return exports.subjectsIndexWithMsg(req, res, "Erro ao criar matéria (talvez já exista).");
  }
};

exports.subjectsEditPage = async (req, res) => {
  const userId = req.session.userId;
  const id = ensureInt(req.params.id);

  const subject = await Subject.findOne({ where: { id, user_id: userId } });
  if (!subject) return res.redirect("/conteudos/materias?erro=Materia+nao+encontrada");

  res.render("content/subjects-edit", { subject, erro: null });
};

exports.subjectsUpdate = async (req, res) => {
  const userId = req.session.userId;
  const id = ensureInt(req.params.id);
  const nome = safeTrim(req.body.nome);

  if (!nome) return res.redirect(`/conteudos/materias/${id}/editar?erro=Nome+obrigatorio`);

  try {
    const [updated] = await Subject.update(
      { nome },
      { where: { id, user_id: userId } }
    );
    if (!updated) return res.redirect("/conteudos/materias?erro=Materia+nao+encontrada");
    return res.redirect("/conteudos/materias?ok=Materia+atualizada");
  } catch (e) {
    return res.redirect(`/conteudos/materias/${id}/editar?erro=Erro+ao+atualizar`);
  }
};

exports.subjectsDelete = async (req, res) => {
  const userId = req.session.userId;
  const id = ensureInt(req.params.id);

  try {
    // Vai deletar tópicos/assuntos em cascata (DB)
    await Subject.destroy({ where: { id, user_id: userId } });
    return res.redirect("/conteudos/materias?ok=Materia+excluida");
  } catch (e) {
    return res.redirect("/conteudos/materias?erro=Nao+foi+possivel+excluir");
  }
};

exports.subjectsIndexWithMsg = async (req, res, erro) => {
  const userId = req.session.userId;
  const subjects = await Subject.findAll({ where: { user_id: userId }, order: [["nome", "ASC"]] });
  res.render("content/subjects", { subjects, erro, ok: null });
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
    order: [[{ model: Subject, as: "subject" }, "nome", "ASC"], ["nome", "ASC"]]
  });

  res.render("content/topics", { subjects, topics, erro: null, ok: null });
};

exports.topicsCreate = async (req, res) => {
  const userId = req.session.userId;
  const subject_id = ensureInt(req.body.subject_id);
  const nome = safeTrim(req.body.nome);

  if (!subject_id) return res.redirect("/conteudos/topicos?erro=Escolha+uma+materia");
  if (!nome) return res.redirect("/conteudos/topicos?erro=Digite+o+nome+do+topico");

  const subject = await Subject.findOne({ where: { id: subject_id, user_id: userId } });
  if (!subject) return res.redirect("/conteudos/topicos?erro=Materia+invalida");

  try {
    await Topic.create({ user_id: userId, subject_id, nome });
    return res.redirect("/conteudos/topicos?ok=Topico+criado");
  } catch (e) {
    return res.redirect("/conteudos/topicos?erro=Erro+ao+criar+(talvez+ja+exista)");
  }
};

exports.topicsEditPage = async (req, res) => {
  const userId = req.session.userId;
  const id = ensureInt(req.params.id);

  const subjects = await Subject.findAll({
    where: { user_id: userId },
    order: [["nome", "ASC"]]
  });

  const topic = await Topic.findOne({
    where: { id, user_id: userId },
    include: [{ model: Subject, as: "subject" }]
  });

  if (!topic) return res.redirect("/conteudos/topicos?erro=Topico+nao+encontrado");

  res.render("content/topics-edit", { topic, subjects, erro: null });
};

exports.topicsUpdate = async (req, res) => {
  const userId = req.session.userId;
  const id = ensureInt(req.params.id);

  const subject_id = ensureInt(req.body.subject_id);
  const nome = safeTrim(req.body.nome);

  if (!subject_id) return res.redirect(`/conteudos/topicos/${id}/editar?erro=Escolha+uma+materia`);
  if (!nome) return res.redirect(`/conteudos/topicos/${id}/editar?erro=Nome+obrigatorio`);

  const subject = await Subject.findOne({ where: { id: subject_id, user_id: userId } });
  if (!subject) return res.redirect(`/conteudos/topicos/${id}/editar?erro=Materia+invalida`);

  try {
    const [updated] = await Topic.update(
      { subject_id, nome },
      { where: { id, user_id: userId } }
    );
    if (!updated) return res.redirect("/conteudos/topicos?erro=Topico+nao+encontrado");
    return res.redirect("/conteudos/topicos?ok=Topico+atualizado");
  } catch (e) {
    return res.redirect(`/conteudos/topicos/${id}/editar?erro=Erro+ao+atualizar`);
  }
};

exports.topicsDelete = async (req, res) => {
  const userId = req.session.userId;
  const id = ensureInt(req.params.id);

  try {
    // Vai deletar assuntos em cascata (DB)
    await Topic.destroy({ where: { id, user_id: userId } });
    return res.redirect("/conteudos/topicos?ok=Topico+excluido");
  } catch (e) {
    return res.redirect("/conteudos/topicos?erro=Nao+foi+possivel+excluir");
  }
};

// =========================
// SUBTOPICS (Assuntos)
// =========================
exports.subtopicsIndex = async (req, res) => {
  const userId = req.session.userId;

  const subjects = await Subject.findAll({
    where: { user_id: userId },
    order: [["nome", "ASC"]]
  });

  const topics = await Topic.findAll({
    where: { user_id: userId },
    include: [{ model: Subject, as: "subject" }],
    order: [[{ model: Subject, as: "subject" }, "nome", "ASC"], ["nome", "ASC"]]
  });

  const subtopics = await Subtopic.findAll({
    where: { user_id: userId },
    include: [
      { model: Topic, as: "topic", include: [{ model: Subject, as: "subject" }] }
    ],
    order: [
      [{ model: Topic, as: "topic" }, { model: Subject, as: "subject" }, "nome", "ASC"],
      [{ model: Topic, as: "topic" }, "nome", "ASC"],
      ["nome", "ASC"]
    ]
  });

  res.render("content/subtopics", { subjects, topics, subtopics, erro: null, ok: null });
};

exports.subtopicsCreate = async (req, res) => {
  const userId = req.session.userId;
  const topic_id = ensureInt(req.body.topic_id);
  const nome = safeTrim(req.body.nome);

  if (!topic_id) return res.redirect("/conteudos/assuntos?erro=Escolha+um+topico");
  if (!nome) return res.redirect("/conteudos/assuntos?erro=Digite+o+nome+do+assunto");

  const topic = await Topic.findOne({ where: { id: topic_id, user_id: userId } });
  if (!topic) return res.redirect("/conteudos/assuntos?erro=Topico+invalido");

  try {
    await Subtopic.create({ user_id: userId, topic_id, nome });
    return res.redirect("/conteudos/assuntos?ok=Assunto+criado");
  } catch (e) {
    return res.redirect("/conteudos/assuntos?erro=Erro+ao+criar+(talvez+ja+exista)");
  }
};

exports.subtopicsEditPage = async (req, res) => {
  const userId = req.session.userId;
  const id = ensureInt(req.params.id);

  const topics = await Topic.findAll({
    where: { user_id: userId },
    include: [{ model: Subject, as: "subject" }],
    order: [[{ model: Subject, as: "subject" }, "nome", "ASC"], ["nome", "ASC"]]
  });

  const subtopic = await Subtopic.findOne({
    where: { id, user_id: userId },
    include: [{ model: Topic, as: "topic", include: [{ model: Subject, as: "subject" }] }]
  });

  if (!subtopic) return res.redirect("/conteudos/assuntos?erro=Assunto+nao+encontrado");

  res.render("content/subtopics-edit", { subtopic, topics, erro: null });
};

exports.subtopicsUpdate = async (req, res) => {
  const userId = req.session.userId;
  const id = ensureInt(req.params.id);

  const topic_id = ensureInt(req.body.topic_id);
  const nome = safeTrim(req.body.nome);

  if (!topic_id) return res.redirect(`/conteudos/assuntos/${id}/editar?erro=Escolha+um+topico`);
  if (!nome) return res.redirect(`/conteudos/assuntos/${id}/editar?erro=Nome+obrigatorio`);

  const topic = await Topic.findOne({ where: { id: topic_id, user_id: userId } });
  if (!topic) return res.redirect(`/conteudos/assuntos/${id}/editar?erro=Topico+invalido`);

  try {
    const [updated] = await Subtopic.update(
      { topic_id, nome },
      { where: { id, user_id: userId } }
    );
    if (!updated) return res.redirect("/conteudos/assuntos?erro=Assunto+nao+encontrado");
    return res.redirect("/conteudos/assuntos?ok=Assunto+atualizado");
  } catch (e) {
    return res.redirect(`/conteudos/assuntos/${id}/editar?erro=Erro+ao+atualizar`);
  }
};

exports.subtopicsDelete = async (req, res) => {
  const userId = req.session.userId;
  const id = ensureInt(req.params.id);

  try {
    await Subtopic.destroy({ where: { id, user_id: userId } });
    return res.redirect("/conteudos/assuntos?ok=Assunto+excluido");
  } catch (e) {
    return res.redirect("/conteudos/assuntos?erro=Nao+foi+possivel+excluir");
  }
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
