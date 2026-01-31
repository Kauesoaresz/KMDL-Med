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

    data_prova: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },

    tempo_minutos: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    status: {
      type: DataTypes.ENUM("EM_ANDAMENTO", "FINALIZADO"),
      defaultValue: "EM_ANDAMENTO"
    }
  },
  {
    tableName: "simulados",
    underscored: true
  }
);

module.exports = Simulado;
