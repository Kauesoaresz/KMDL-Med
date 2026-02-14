const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/database");

class Prova extends Model {}

Prova.init(
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

    tipo: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    valor_inscricao: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },

    pago: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    data_prova_1: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    data_prova_2: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    local: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    observacoes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "Prova",
    tableName: "provas",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = Prova;
