const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const StudyEntry = sequelize.define(
  "StudyEntry",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    data: { type: DataTypes.DATEONLY, allowNull: false },

    subject_id: { type: DataTypes.INTEGER, allowNull: false },
    topic_id: { type: DataTypes.INTEGER, allowNull: false },
    subtopic_id: { type: DataTypes.INTEGER, allowNull: true },

    horas: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
    questoes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    acertos: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },

    // Redação (ENEM / Competências)
    redacao_nota: { type: DataTypes.DECIMAL(7, 2), allowNull: true },
    c1: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    c2: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    c3: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    c4: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    c5: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    redacao_total_competencias: { type: DataTypes.DECIMAL(7, 2), allowNull: true },
    redacao_media_competencias: { type: DataTypes.DECIMAL(7, 2), allowNull: true },
    tema: { type: DataTypes.STRING(255), allowNull: true },
    redacao_comentario: { type: DataTypes.TEXT, allowNull: true },

    dificuldade: {
      type: DataTypes.ENUM("MUITO_FACIL", "FACIL", "MEDIA", "DIFICIL", "MUITO_DIFICIL"),
      allowNull: false,
      defaultValue: "MEDIA"
    }
  },
  {
    tableName: "study_entries",
    underscored: true
  }
);

module.exports = StudyEntry;
