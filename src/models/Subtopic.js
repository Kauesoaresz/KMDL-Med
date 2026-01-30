const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Subtopic = sequelize.define(
  "Subtopic",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    topic_id: { type: DataTypes.INTEGER, allowNull: false },
    nome: { type: DataTypes.STRING(160), allowNull: false }
  },
  {
    tableName: "subtopics",
    underscored: true
  }
);

module.exports = Subtopic;
