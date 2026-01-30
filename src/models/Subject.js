const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Subject = sequelize.define(
  "Subject",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    nome: { type: DataTypes.STRING(80), allowNull: false }
  },
  {
    tableName: "subjects",
    underscored: true
  }
);

module.exports = Subject;
