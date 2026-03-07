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

    // Status da inscrição (texto simples para compatibilidade)
    status_inscricao: {
      type: DataTypes.STRING,
      defaultValue: 'nao_iniciada',
    },

    // Datas importantes
    data_inscricao_inicio: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    data_inscricao_fim: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    data_prova_1: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    data_prova_2: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    // Informações financeiras
    valor_inscricao: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },

    pago: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    data_pagamento: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    // Local
    local: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    endereco: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    // Informações adicionais
    observacoes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    // Link para inscrição
    link_inscricao: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    // Notas internas
    nota_corte: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },

    nota_obtida: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },

    posicao: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    // Resultado (texto simples para compatibilidade)
    resultado: {
      type: DataTypes.STRING,
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

