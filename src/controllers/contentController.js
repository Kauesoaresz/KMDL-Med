const { Subject, Topic } = require("../models");
const { fn, col } = require("sequelize");

/* =========================
   HELPERS
========================= */
const safeTrim = (v) => (v || "").toString().trim();

function ensureInt(v) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}

// mesma cor do dashboard e do Registrar (posição da matéria por id)
const hueDe = (i) => Math.round((245 + i * 137.508) % 360);

function go(res, path, tipo, msg, extra) {
  const q = [];
  if (extra) q.push(extra);
  if (msg) q.push(tipo + "=" + encodeURIComponent(msg));
  res.redirect(path + (q.length ? "?" + q.join("&") : ""));
}

const base = (req) => ({
  active: "conteudos",
  userNome: req.session.userNome,
  userFoto: req.session.userFoto,
});

// matérias do usuário com cor e contagem de tópicos
async function carregarMaterias(userId) {
  const subjects = await Subject.findAll({
    where: { user_id: userId },
    order: [["id", "ASC"]],
    raw: true,
  });

  const contagem = await Topic.findAll({
    where: { user_id: userId },
    attributes: ["subject_id", [fn("COUNT", col("id")), "total"]],
    group: ["subject_id"],
    raw: true,
  });
  const porId = {};
  contagem.forEach((c) => { porId[c.subject_id] = Number(c.total); });

  return subjects
    .map((s, i) => ({
      id: s.id,
      nome: s.nome,
      hue: s.hue != null ? Number(s.hue) : hueDe(i),
      topicos: porId[s.id] || 0,
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

/* =========================
   MATÉRIAS
========================= */
exports.subjectsIndex = async (req, res) => {
  const subjects = await carregarMaterias(req.session.userId);

  res.render("content/subjects", {
    ...base(req),
    subjects,
    erro: req.query.erro || null,
    ok: req.query.ok || null,
  });
};

exports.subjectsCreate = async (req, res) => {
  const userId = req.session.userId;
  const nome = safeTrim(req.body.nome).slice(0, 120);
  if (!nome) return go(res, "/conteudos/materias", "erro", "Digite o nome da matéria");

  const [, criada] = await Subject.findOrCreate({
    where: { user_id: userId, nome },
    defaults: { user_id: userId, nome },
  });
  if (!criada) return go(res, "/conteudos/materias", "erro", "Essa matéria já existe");

  go(res, "/conteudos/materias", "ok", "Matéria criada");
};

exports.subjectsEditPage = async (req, res) => {
  const id = ensureInt(req.params.id);
  const subject = await Subject.findOne({ where: { id, user_id: req.session.userId } });
  if (!subject) return go(res, "/conteudos/materias", "erro", "Matéria não encontrada");

  // hue automático (pela posição) pra usar como "voltar ao automático"
  const todas = await Subject.findAll({
    where: { user_id: req.session.userId },
    order: [["id", "ASC"]],
    raw: true,
  });
  const idx = todas.findIndex((s) => s.id === subject.id);
  const hueAuto = hueDe(idx >= 0 ? idx : 0);

  res.render("content/subjects-edit", {
    ...base(req),
    subject,
    hueAtual: subject.hue != null ? Number(subject.hue) : hueAuto,
    hueAuto,
    erro: req.query.erro || null,
  });
};

exports.subjectsUpdate = async (req, res) => {
  const userId = req.session.userId;
  const id = ensureInt(req.params.id);
  const nome = safeTrim(req.body.nome).slice(0, 120);
  if (!nome) return go(res, `/conteudos/materias/${id}/editar`, "erro", "Nome obrigatório");

  const raw = safeTrim(req.body.hue);
  let hue = null;
  if (raw !== "") {
    const n = parseInt(raw, 10);
    if (!Number.isFinite(n) || n < 0 || n > 359) {
      return go(res, `/conteudos/materias/${id}/editar`, "erro", "Cor inválida");
    }
    hue = n;
  }

  await Subject.update(
    { nome, hue },
    { where: { id, user_id: userId } }
  );
  go(res, "/conteudos/materias", "ok", "Matéria atualizada");
};

exports.subjectsDelete = async (req, res) => {
  const userId = req.session.userId;
  const id = ensureInt(req.params.id);

  try {
    const tem = await Topic.count({ where: { subject_id: id, user_id: userId } });
    if (tem > 0) {
      return go(res, "/conteudos/materias", "erro",
        "Esta matéria ainda tem tópicos. Exclua os tópicos antes (ou ela já tem estudos registrados).");
    }
    await Subject.destroy({ where: { id, user_id: userId } });
    go(res, "/conteudos/materias", "ok", "Matéria excluída");
  } catch (err) {
    if (err.name === "SequelizeForeignKeyConstraintError") {
      return go(res, "/conteudos/materias", "erro", "Esta matéria já foi usada em registros e não pode ser excluída");
    }
    console.error(err);
    go(res, "/conteudos/materias", "erro", "Erro ao excluir matéria");
  }
};

/* =========================
   TÓPICOS
========================= */
exports.topicsIndex = async (req, res) => {
  const userId = req.session.userId;
  const subjects = await carregarMaterias(userId);

  const pedido = ensureInt(req.query.subject_id);
  const selected = subjects.find((s) => s.id === pedido) || subjects[0] || null;

  const topics = selected
    ? await Topic.findAll({
        where: { user_id: userId, subject_id: selected.id },
        order: [["nome", "ASC"]],
        raw: true,
      })
    : [];

  res.render("content/topics", {
    ...base(req),
    subjects,
    selected,
    topics,
    erro: req.query.erro || null,
    ok: req.query.ok || null,
  });
};

exports.topicsCreate = async (req, res) => {
  const userId = req.session.userId;
  const subject_id = ensureInt(req.body.subject_id);
  const nome = safeTrim(req.body.nome).slice(0, 120);
  const volta = `/conteudos/topicos`;
  const filtro = subject_id ? `subject_id=${subject_id}` : "";

  if (!subject_id || !nome) return go(res, volta, "erro", "Dados inválidos", filtro);

  const materia = await Subject.findOne({ where: { id: subject_id, user_id: userId } });
  if (!materia) return go(res, volta, "erro", "Matéria inválida");

  const [, criado] = await Topic.findOrCreate({
    where: { user_id: userId, subject_id, nome },
    defaults: { user_id: userId, subject_id, nome },
  });
  if (!criado) return go(res, volta, "erro", "Esse tópico já existe nesta matéria", filtro);

  go(res, volta, "ok", "Tópico criado", filtro);
};

exports.topicsEditPage = async (req, res) => {
  const userId = req.session.userId;
  const id = ensureInt(req.params.id);

  const topic = await Topic.findOne({ where: { id, user_id: userId } });
  if (!topic) return go(res, "/conteudos/topicos", "erro", "Tópico não encontrado");

  const subjects = await carregarMaterias(userId);

  res.render("content/topics-edit", {
    ...base(req),
    subjects,
    topic,
    erro: req.query.erro || null,
  });
};

exports.topicsUpdate = async (req, res) => {
  const userId = req.session.userId;
  const id = ensureInt(req.params.id);
  const subject_id = ensureInt(req.body.subject_id);
  const nome = safeTrim(req.body.nome).slice(0, 120);

  if (!subject_id || !nome) return go(res, `/conteudos/topicos/${id}/editar`, "erro", "Dados inválidos");

  const materia = await Subject.findOne({ where: { id: subject_id, user_id: userId } });
  if (!materia) return go(res, `/conteudos/topicos/${id}/editar`, "erro", "Matéria inválida");

  await Topic.update({ subject_id, nome }, { where: { id, user_id: userId } });
  go(res, "/conteudos/topicos", "ok", "Tópico atualizado", `subject_id=${subject_id}`);
};

exports.topicsDelete = async (req, res) => {
  const userId = req.session.userId;
  const id = ensureInt(req.params.id);

  const topic = await Topic.findOne({ where: { id, user_id: userId } });
  if (!topic) return go(res, "/conteudos/topicos", "erro", "Tópico não encontrado");
  const filtro = `subject_id=${topic.subject_id}`;

  try {
    await topic.destroy();
    go(res, "/conteudos/topicos", "ok", "Tópico excluído", filtro);
  } catch (err) {
    if (err.name === "SequelizeForeignKeyConstraintError") {
      return go(res, "/conteudos/topicos", "erro",
        "Este tópico já foi usado em registros de estudo e não pode ser excluído", filtro);
    }
    console.error(err);
    go(res, "/conteudos/topicos", "erro", "Erro ao excluir tópico", filtro);
  }
};

/* =========================
   API (usada no Simulado)
========================= */
exports.apiTopicsBySubject = async (req, res) => {
  const subject_id = ensureInt(req.params.subjectId);
  if (!subject_id) return res.json([]);

  const topics = await Topic.findAll({
    where: { user_id: req.session.userId, subject_id },
    order: [["nome", "ASC"]],
  });
  res.json(topics.map((t) => ({ id: t.id, nome: t.nome })));
};