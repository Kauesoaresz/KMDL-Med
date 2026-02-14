const { StudyEntry, SimuladoQuestaoErro, Subject, Topic } = require("../models");
const { Op, fn, col, literal } = require("sequelize");
const sequelize = require("../config/database");

exports.index = async (req, res) => {
  const userId = req.session.userId;
  const hoje = new Date();

  // 🔥 1. Agrupar estudos por matéria + tópico
  const estudos = await StudyEntry.findAll({
    where: { user_id: userId },
    attributes: [
      "subject_id",
      "topic_id",
      [fn("SUM", col("questoes")), "total_questoes"],
      [fn("SUM", col("acertos")), "total_acertos"],
      [fn("MAX", col("data")), "ultima_data"],
      [fn("AVG",
        literal(`
          CASE dificuldade
            WHEN 'MUITO_DIFICIL' THEN 5
            WHEN 'DIFICIL' THEN 4
            WHEN 'MEDIA' THEN 3
            WHEN 'FACIL' THEN 2
            WHEN 'MUITO_FACIL' THEN 1
          END
        `)
      ), "media_dificuldade"]
    ],
    include: [
      { model: Subject, as: "subject", attributes: ["nome"] },
      { model: Topic, as: "topic", attributes: ["nome"] }
    ],
    group: ["subject_id", "topic_id"],
    raw: false
  });

  // 🔥 2. Buscar erros não revisados
  const erros = await SimuladoQuestaoErro.findAll({
    where: {
      revisada: false,
      subject_id: { [Op.not]: null }
    },
    attributes: [
      "subject_id",
      "topic_id",
      [fn("COUNT", col("id")), "total_erros"]
    ],
    group: ["subject_id", "topic_id"],
    raw: true
  });

  const erroMap = {};
  erros.forEach(e => {
    erroMap[`${e.subject_id}-${e.topic_id}`] = parseInt(e.total_erros);
  });

  // 🔥 3. Calcular score
  const revisoes = estudos.map(e => {
    const totalQuestoes = parseInt(e.get("total_questoes")) || 0;
    const totalAcertos = parseInt(e.get("total_acertos")) || 0;
    const ultimaData = new Date(e.get("ultima_data"));
    const mediaDificuldade = parseFloat(e.get("media_dificuldade")) || 0;

    const diasSemEstudar =
      Math.floor((hoje - ultimaData) / (1000 * 60 * 60 * 24));

    const erroPercentual =
      totalQuestoes > 0
        ? 1 - (totalAcertos / totalQuestoes)
        : 0;

    const errosPendentes =
      erroMap[`${e.subject_id}-${e.topic_id}`] || 0;

    const score =
      (mediaDificuldade * 2) +
      (erroPercentual * 5) +
      (diasSemEstudar * 0.3) +
      (errosPendentes * 2);

    return {
      subject: e.subject.nome,
      topic: e.topic.nome,
      diasSemEstudar,
      erroPercentual: (erroPercentual * 100).toFixed(1),
      errosPendentes,
      score: score.toFixed(2)
    };
  });

  revisoes.sort((a, b) => b.score - a.score);

  res.render("app/revisoes", {
    revisoes,
    active: "revisoes",
    userNome: req.session.userNome,
    userFoto: req.session.userFoto
  });
};
