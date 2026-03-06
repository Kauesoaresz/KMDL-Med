const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ReviewHistory = sequelize.define(
  "ReviewHistory",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    subject_id: { type: DataTypes.INTEGER, allowNull: false },
    topic_id: { type: DataTypes.INTEGER, allowNull: false },
    assunto: { type: DataTypes.STRING(200), allowNull: true },
    dificuldade: {
      type: DataTypes.ENUM(
        "muito_facil",
        "facil",
        "medio",
        "dificil",
        "muito_dificil"
      ),
      allowNull: false
    },
    data_revisao: { type: DataTypes.DATEONLY, allowNull: false }
  },
  {
    tableName: "review_history",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"
  }
);

module.exports = ReviewHistory;

