module.exports = (sequelize, DataTypes) => {
  const Revisao = sequelize.define("Revisao", {
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    subject_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    topic_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    proxima_revisao: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },

    intervalo_atual: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },

    facilidade: {
      type: DataTypes.FLOAT,
      defaultValue: 2.5
    },

    vezes_revisado: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },

    total_acertos: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },

    total_erros: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },

    ultima_resposta: {
      type: DataTypes.STRING
    }
  });

  Revisao.associate = (models) => {
    Revisao.belongsTo(models.Subject, { foreignKey: "subject_id", as: "subject" });
    Revisao.belongsTo(models.Topic, { foreignKey: "topic_id", as: "topic" });
  };

  return Revisao;
};
