const { Subject, Topic } = require("../models");

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