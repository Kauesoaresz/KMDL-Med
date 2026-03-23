const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/database");

class Arquivo extends Model {}

Arquivo.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    tipo_id: { type: DataTypes.INTEGER, allowNull: true }, // Pode ser null se você apagar o tipo depois
    nome: { type: DataTypes.STRING, allowNull: false }, // Ex: "Enem 2023 - Dia 1"
    caminho: { type: DataTypes.STRING, allowNull: false }, // "/uploads/materiais/mat_..."
    extensao: { type: DataTypes.STRING, allowNull: true }, // ".pdf"
    
    // Chaves Estrangeiras Nulas (O arquivo pode pertencer a um ou a outro)
    simulado_id: { type: DataTypes.INTEGER, allowNull: true },
    prova_id: { type: DataTypes.INTEGER, allowNull: true },
    subject_id: { type: DataTypes.INTEGER, allowNull: true },
    topic_id: { type: DataTypes.INTEGER, allowNull: true },
    subtopic_id: { type: DataTypes.INTEGER, allowNull: true } // <- ADICIONE ESTA LINHA
  },
  {
    sequelize,
    modelName: "Arquivo",
    tableName: "arquivos",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = Arquivo;