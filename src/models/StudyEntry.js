const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const StudyEntry = sequelize.define(
  "StudyEntry",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    data: { type: DataTypes.DATEONLY, allowNull: false },
    subject_id: { type: DataTypes.INTEGER, allowNull: false },
    topic_id: { type: DataTypes.INTEGER, allowNull: true }, // opcional
    horas: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
    questoes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    acertos: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }
  },
  { tableName: "study_entries", underscored: true }
);

module.exports = StudyEntry;
