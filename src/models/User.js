const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const User = sequelize.define(
  "User",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nome: { type: DataTypes.STRING(80), allowNull: false },
    email: { type: DataTypes.STRING(120), allowNull: false, unique: true },
    senha_hash: { type: DataTypes.STRING(255), allowNull: false },
    foto: { type: DataTypes.STRING(255), allowNull: true }
  },
  {
    tableName: "users",
    underscored: true
  }
);

module.exports = User;
