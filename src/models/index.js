const User = require("./User");
const Subject = require("./Subject");
const Topic = require("./Topic");
const Subtopic = require("./Subtopic");
const StudyEntry = require("./StudyEntry");

const Simulado = require("./Simulado");
const SimuladoParte = require("./SimuladoParte");
const SimuladoErro = require("./SimuladoErro");

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
// SIMULADOS (PARTE IMPORTANTE)
// ==========================
Simulado.hasMany(SimuladoParte, {
  foreignKey: "simulado_id",
  as: "partes",
  onDelete: "CASCADE"
});

SimuladoParte.belongsTo(Simulado, {
  foreignKey: "simulado_id",
  as: "simulado"
});

SimuladoParte.hasMany(SimuladoErro, {
  foreignKey: "simulado_parte_id",
  as: "erros",
  onDelete: "CASCADE"
});

SimuladoErro.belongsTo(SimuladoParte, {
  foreignKey: "simulado_parte_id",
  as: "parte"
});

module.exports = {
  User,
  Subject,
  Topic,
  Subtopic,
  StudyEntry,
  Simulado,
  SimuladoParte,
  SimuladoErro
};
