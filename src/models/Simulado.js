const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Simulado = sequelize.define(
  "Simulado",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    nome: {
      type: DataTypes.STRING,
      allowNull: false
    },

    tipo: {
      type: DataTypes.ENUM("ENEM", "PROPRIO", "OUTRO"),
      allowNull: false,
      defaultValue: "ENEM"
    },

    status: {
      type: DataTypes.ENUM("EM_ANDAMENTO", "FINALIZADO"),
      allowNull: false,
      defaultValue: "EM_ANDAMENTO"
    }
  },
  {
    tableName: "simulados",
    underscored: true
  }
);

module.exports = Simulado;
