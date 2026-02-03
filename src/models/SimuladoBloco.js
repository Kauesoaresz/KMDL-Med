const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/database");

class SimuladoBloco extends Model {}

SimuladoBloco.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    simulado_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    area: {
      type: DataTypes.ENUM(
        "linguagens",
        "humanas",
        "naturezas",
        "matematica"
      ),
      allowNull: false,
    },

    total_questoes: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    acertos: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    tempo_minutos: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    data_realizacao: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "SimuladoBloco",
    tableName: "simulado_blocos",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = SimuladoBloco;
