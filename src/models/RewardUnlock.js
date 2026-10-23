// ============================================================
// src/models/RewardUnlock.js
// Guarda quais marcos da Trilha da Aprovação o usuário resgatou.
// Não guarda XP — o XP é derivado do valor atual da trilha.
// ============================================================

const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/database");

class RewardUnlock extends Model {}

RewardUnlock.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    user_id: { type: DataTypes.INTEGER, allowNull: false },

    // ex.: 'questoes_feitas', 'questoes_acertadas', 'dias_estudados',
    //      'horas_estudadas', 'simulados_completos', 'metas'
    trilha_key: { type: DataTypes.STRING(40), allowNull: false },

    // ex.: 'questoes_feitas_b01' (brasão) ou 'questoes_feitas_m01_1' (mini)
    marco_id: { type: DataTypes.STRING(60), allowNull: false },

    resgatado_em: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    modelName: "RewardUnlock",
    tableName: "reward_unlocks",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      {
        name: "uq_user_trilha_marco",
        unique: true,
        fields: ["user_id", "trilha_key", "marco_id"],
      },
      { name: "idx_reward_unlocks_user", fields: ["user_id"] },
    ],
  }
);

module.exports = RewardUnlock;