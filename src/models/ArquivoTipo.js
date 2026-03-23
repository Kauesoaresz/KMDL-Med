const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/database");

class ArquivoTipo extends Model {}

ArquivoTipo.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    nome: { type: DataTypes.STRING, allowNull: false } // Ex: "Gabarito", "Resolução"
  },
  {
    sequelize,
    modelName: "ArquivoTipo",
    tableName: "arquivo_tipos",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = ArquivoTipo;