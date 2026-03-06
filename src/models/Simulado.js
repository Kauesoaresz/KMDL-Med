const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/database");

class Simulado extends Model {}

Simulado.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    nome: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    data_realizacao: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    status: {
      type: DataTypes.ENUM("em_andamento", "finalizado", "revisao"),
      allowNull: false,
      defaultValue: "em_andamento",
    },

    finished_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "Simulado",
    tableName: "simulados",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = Simulado;
