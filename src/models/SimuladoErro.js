const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const SimuladoErro = sequelize.define(
  "SimuladoErro",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    simulado_parte_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    questao: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    revisado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  },
  {
    tableName: "simulado_erros",
    underscored: true,
    timestamps: false
  }
);

module.exports = SimuladoErro;
