// ============================================================
// src/models/StreakCredit.js
// Guarda quais marcos de streak já foram creditados (por ciclo).
// Ciclo = 1 antes de qualquer quebra; 2 após a 1ª quebra; etc.
// ============================================================

const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/database");

class StreakCredit extends Model {}

StreakCredit.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    user_id: { type: DataTypes.INTEGER, allowNull: false },

    // 1, 3, 7, 15, 30, 60, 100, 150, 200, 250, 300
    marco: { type: DataTypes.SMALLINT, allowNull: false },

    // 1 = primeiro ciclo; 2 = depois da 1ª quebra; 3 = depois da 2ª; etc.
    ciclo: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },

    creditado_em: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    modelName: "StreakCredit",
    tableName: "streak_credits",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      {
        name: "uq_user_marco_ciclo",
        unique: true,
        fields: ["user_id", "marco", "ciclo"],
      },
      { name: "idx_streak_credits_user", fields: ["user_id"] },
    ],
  }
);

module.exports = StreakCredit;