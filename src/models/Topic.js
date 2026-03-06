const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Topic = sequelize.define(
  "Topic",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    subject_id: { type: DataTypes.INTEGER, allowNull: false },
    nome: { type: DataTypes.STRING(120), allowNull: false },
    ultima_revisao: { type: DataTypes.DATEONLY, allowNull: true },
    proxima_revisao: { type: DataTypes.DATEONLY, allowNull: true }
  },
  {
    tableName: "topics",
    underscored: true
  }
);

module.exports = Topic;
