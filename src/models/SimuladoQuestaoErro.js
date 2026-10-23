const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/database");

class SimuladoQuestaoErro extends Model {}

SimuladoQuestaoErro.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    simulado_bloco_id: { type: DataTypes.INTEGER, allowNull: false },

    area: {
      type: DataTypes.ENUM("linguagens", "humanas", "naturezas", "matematica"),
      allowNull: false,
    },

    // posição GLOBAL na prova (1 a 180)
    numero_questao: { type: DataTypes.INTEGER, allowNull: false },

    motivo: {
      type: DataTypes.ENUM("falta_conteudo", "lacuna", "falta_atencao"),
      allowNull: true, // "não feita" não tem motivo
    },

    status: {
      type: DataTypes.ENUM("errada", "nao_feita"),
      allowNull: false,
      defaultValue: "errada",
    },

    subject_id: { type: DataTypes.INTEGER, allowNull: true },
    topic_id: { type: DataTypes.INTEGER, allowNull: true },

    anotacao: { type: DataTypes.STRING(255), allowNull: true },

    revisada: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    data_revisao: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    modelName: "SimuladoQuestaoErro",
    tableName: "simulado_questao_erros",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = SimuladoQuestaoErro;