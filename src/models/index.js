// ============================================================
// src/models/index.js
// Associações entre os models.
// ============================================================

const User = require("./User");
const Subject = require("./Subject");
const Topic = require("./Topic");
const StudyEntry = require("./StudyEntry");
const StudyGoal = require("./StudyGoal");
const Simulado = require("./Simulado");
const SimuladoBloco = require("./SimuladoBloco");
const SimuladoQuestaoErro = require("./SimuladoQuestaoErro");
const RewardUnlock = require("./RewardUnlock");
const StreakCredit = require("./StreakCredit");

// USUÁRIO
User.hasMany(Subject, { foreignKey: "user_id", as: "subjects" });
Subject.belongsTo(User, { foreignKey: "user_id", as: "user" });

User.hasMany(Topic, { foreignKey: "user_id", as: "topics" });
Topic.belongsTo(User, { foreignKey: "user_id", as: "user" });

User.hasMany(StudyEntry, { foreignKey: "user_id", as: "entries" });
StudyEntry.belongsTo(User, { foreignKey: "user_id", as: "user" });

// CONTEÚDOS (2 níveis)
Subject.hasMany(Topic, { foreignKey: "subject_id", as: "topics" });
Topic.belongsTo(Subject, { foreignKey: "subject_id", as: "subject" });

StudyEntry.belongsTo(Subject, { foreignKey: "subject_id", as: "subject" });
StudyEntry.belongsTo(Topic, { foreignKey: "topic_id", as: "topic" });

// SIMULADOS
User.hasMany(Simulado, { foreignKey: "user_id", as: "simulados" });
Simulado.belongsTo(User, { foreignKey: "user_id", as: "user" });

Simulado.hasMany(SimuladoBloco, { foreignKey: "simulado_id", as: "blocos", onDelete: "CASCADE" });
SimuladoBloco.belongsTo(Simulado, { foreignKey: "simulado_id", as: "simulado" });

SimuladoBloco.hasMany(SimuladoQuestaoErro, { foreignKey: "simulado_bloco_id", as: "erros", onDelete: "CASCADE" });
SimuladoQuestaoErro.belongsTo(SimuladoBloco, { foreignKey: "simulado_bloco_id", as: "bloco" });

SimuladoQuestaoErro.belongsTo(Subject, { foreignKey: "subject_id", as: "subject" });
SimuladoQuestaoErro.belongsTo(Topic, { foreignKey: "topic_id", as: "topic" });

// METAS
User.hasMany(StudyGoal, { foreignKey: "user_id", as: "goals" });
StudyGoal.belongsTo(User, { foreignKey: "user_id", as: "user" });

// GAMIFICAÇÃO
User.hasMany(RewardUnlock, { foreignKey: "user_id", as: "rewardUnlocks", onDelete: "CASCADE" });
RewardUnlock.belongsTo(User, { foreignKey: "user_id", as: "user" });

User.hasMany(StreakCredit, { foreignKey: "user_id", as: "streakCredits", onDelete: "CASCADE" });
StreakCredit.belongsTo(User, { foreignKey: "user_id", as: "user" });

module.exports = {
  User, Subject, Topic, StudyEntry, StudyGoal,
  Simulado, SimuladoBloco, SimuladoQuestaoErro,
  RewardUnlock, StreakCredit,
};