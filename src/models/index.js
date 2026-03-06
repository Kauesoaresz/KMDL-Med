const User = require("./User");
const Subject = require("./Subject");
const Topic = require("./Topic");
const Subtopic = require("./Subtopic");
const StudyEntry = require("./StudyEntry");
const ReviewHistory = require("./ReviewHistory");

/* ==========================
   SIMULADOS
========================== */
const Simulado = require("./Simulado");
const SimuladoBloco = require("./SimuladoBloco");
const SimuladoQuestaoErro = require("./SimuladoQuestaoErro");

/* ==========================
   PROVAS
========================== */
const Prova = require("./Prova");

// ==========================
// USUÁRIO
// ==========================
User.hasMany(Subject, { foreignKey: "user_id", as: "subjects" });
Subject.belongsTo(User, { foreignKey: "user_id", as: "user" });

User.hasMany(Topic, { foreignKey: "user_id", as: "topics" });
Topic.belongsTo(User, { foreignKey: "user_id", as: "user" });

User.hasMany(Subtopic, { foreignKey: "user_id", as: "subtopics" });
Subtopic.belongsTo(User, { foreignKey: "user_id", as: "user" });

User.hasMany(StudyEntry, { foreignKey: "user_id", as: "entries" });
StudyEntry.belongsTo(User, { foreignKey: "user_id", as: "user" });

// ==========================
// CONTEÚDOS
// ==========================
Subject.hasMany(Topic, { foreignKey: "subject_id", as: "topics" });
Topic.belongsTo(Subject, { foreignKey: "subject_id", as: "subject" });

Topic.hasMany(Subtopic, { foreignKey: "topic_id", as: "subtopics" });
Subtopic.belongsTo(Topic, { foreignKey: "topic_id", as: "topic" });

StudyEntry.belongsTo(Subject, { foreignKey: "subject_id", as: "subject" });
StudyEntry.belongsTo(Topic, { foreignKey: "topic_id", as: "topic" });
StudyEntry.belongsTo(Subtopic, { foreignKey: "subtopic_id", as: "subtopic" });

// ==========================
// SIMULADOS
// ==========================

// Simulado pertence a um usuário
User.hasMany(Simulado, { foreignKey: "user_id", as: "simulados" });
Simulado.belongsTo(User, { foreignKey: "user_id", as: "user" });

// Simulado → Blocos
Simulado.hasMany(SimuladoBloco, {
  foreignKey: "simulado_id",
  as: "blocos",
  onDelete: "CASCADE",
});
SimuladoBloco.belongsTo(Simulado, {
  foreignKey: "simulado_id",
  as: "simulado",
});

// Bloco → Questões erradas
SimuladoBloco.hasMany(SimuladoQuestaoErro, {
  foreignKey: "simulado_bloco_id",
  as: "erros",
  onDelete: "CASCADE",
});
SimuladoQuestaoErro.belongsTo(SimuladoBloco, {
  foreignKey: "simulado_bloco_id",
  as: "bloco",
});

// ==========================
// LIGAÇÃO ERROS → CONTEÚDOS
// ==========================
SimuladoQuestaoErro.belongsTo(Subject, {
  foreignKey: "subject_id",
  as: "subject",
});

SimuladoQuestaoErro.belongsTo(Topic, {
  foreignKey: "topic_id",
  as: "topic",
});

SimuladoQuestaoErro.belongsTo(Subtopic, {
  foreignKey: "subtopic_id",
  as: "subtopic",
});

// ==========================
// PROVAS
// ==========================

// Prova pertence a um usuário
User.hasMany(Prova, {
  foreignKey: "user_id",
  as: "provas",
});
Prova.belongsTo(User, {
  foreignKey: "user_id",
  as: "user",
});

// ==========================
// REVIEW HISTORY
// ==========================

User.hasMany(ReviewHistory, { foreignKey: "user_id", as: "reviewHistory" });
ReviewHistory.belongsTo(User, { foreignKey: "user_id", as: "user" });

Subject.hasMany(ReviewHistory, { foreignKey: "subject_id", as: "reviews" });
ReviewHistory.belongsTo(Subject, { foreignKey: "subject_id", as: "subject" });

Topic.hasMany(ReviewHistory, { foreignKey: "topic_id", as: "reviews" });
ReviewHistory.belongsTo(Topic, { foreignKey: "topic_id", as: "topic" });

module.exports = {
  User,
  Subject,
  Topic,
  Subtopic,
  StudyEntry,
  ReviewHistory,
  Simulado,
  SimuladoBloco,
  SimuladoQuestaoErro,
  Prova,
};
