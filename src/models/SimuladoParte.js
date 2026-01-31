const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const SimuladoParte = sequelize.define(
  "SimuladoParte",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    simulado_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    dia: {
      type: DataTypes.ENUM("DIA_1", "DIA_2"),
      allowNull: false
    },

    area: {
      type: DataTypes.ENUM(
        "LINGUAGENS",
        "HUMANAS",
        "NATUREZA",
        "MATEMATICA"
      ),
      allowNull: false
    },

    questao_inicio: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    questao_fim: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    data_prova: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },

    tempo_minutos: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  },
  {
    tableName: "simulado_partes",
    underscored: true
  }
);

module.exports = SimuladoParte;
