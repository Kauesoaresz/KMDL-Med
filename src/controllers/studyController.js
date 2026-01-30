const { StudyEntry, Subject, Topic, Subtopic } = require("../models");

function ensureInt(v) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}

// =========================
// REGISTRAR DIA - GET
// =========================
exports.registerPage = async (req, res) => {
  const userId = req.session.userId;

  const subjects = await Subject.findAll({
    where: { user_id: userId },
    order: [["nome", "ASC"]]
  });

  const hoje = new Date().toISOString().slice(0, 10);

  res.render("app/register-day", {
    subjects,
    hoje,
    erro: null,
    ok: null
  });
};

// =========================
// REGISTRAR DIA - POST
// =========================
exports.registerSave = async (req, res) => {
  const userId = req.session.userId;
  const { data, blocos } = req.body;

  if (!data || !Array.isArray(blocos) || blocos.length === 0) {
    return res.redirect("/registrar?erro=Dados+invalidos");
  }

  try {
    // apaga registros antigos do dia (regravar o dia)
    await StudyEntry.destroy({
      where: { user_id: userId, data }
    });

    for (const b of blocos) {
      const subject_id = ensureInt(b.subject_id);
      const topic_id = ensureInt(b.topic_id);
      const subtopic_id = ensureInt(b.subtopic_id);
      const horas = parseFloat(b.horas || 0);
      const questoes = ensureInt(b.questoes) || 0;
      const acertos = ensureInt(b.acertos) || 0;
      const dificuldade = b.dificuldade || "MEDIA";

      if (!subject_id || !topic_id || horas <= 0) continue;

      await StudyEntry.create({
        user_id: userId,
        data,
        subject_id,
        topic_id,
        subtopic_id,
        horas,
        questoes,
        acertos,
        dificuldade
      });
    }

    return res.redirect("/registrar?ok=Dia+registrado");
  } catch (e) {
    console.error(e);
    return res.redirect("/registrar?erro=Erro+ao+salvar");
  }
};
