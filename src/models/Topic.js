const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Topic = sequelize.define(
  "Topic",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    subject_id: { type: DataTypes.INTEGER, allowNull: false },
    nome: { type: DataTypes.STRING(120), allowNull: false }
  },
  {
    tableName: "topics",
    underscored: true
  }
);

module.exports = Topic;
