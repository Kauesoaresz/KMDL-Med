const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const StudyGoal = sequelize.define(
  "StudyGoal",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    nome: { type: DataTypes.STRING(200), allowNull: false },
    meta_horas: { type: DataTypes.DECIMAL(6, 2), allowNull: false },
    meta_questoes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    data_inicio: { type: DataTypes.DATEONLY, allowNull: false },
    data_limite: { type: DataTypes.DATEONLY, allowNull: false },
    eh_principal: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    status: {
      type: DataTypes.ENUM("ativa", "concluida", "vencida"),
      allowNull: false,
      defaultValue: "ativa"
    },
    data_conclusao: { type: DataTypes.DATEONLY, allowNull: true },
    horas_concluidas: { type: DataTypes.DECIMAL(6, 2), allowNull: false, defaultValue: 0 },
    questoes_concluidas: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }
  },
  {
    tableName: "study_goals",
    underscored: true
  }
);

module.exports = StudyGoal;

