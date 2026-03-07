const bcrypt = require("bcryptjs");
const sequelize = require("../config/database");
const User = require("../models/User");
const StudyEntry = require("../models/StudyEntry");
const Simulado = require("../models/Simulado");

// Função para calcular estatísticas do usuário
async function getUserStats(userId) {
  // Total de horas estudadas e questões
  const studyStats = await StudyEntry.findOne({
    where: { user_id: userId },
    attributes: [
      [sequelize.fn('SUM', sequelize.col('horas')), 'totalHoras'],
      [sequelize.fn('SUM', sequelize.col('questoes')), 'totalQuestoes'],
      [sequelize.fn('SUM', sequelize.col('acertos')), 'totalAcertos']
    ],
    raw: true
  });

  // Total de simulados realizados
  const simuladoCount = await Simulado.count({
    where: { user_id: userId, status: 'finalizado' }
  });

  // Calcular streak (dias consecutivos de estudo)
  const studyEntries = await StudyEntry.findAll({
    where: { user_id: userId },
    attributes: ['data'],
    order: [['data', 'DESC']],
    raw: true
  });

  let streak = 0;
  if (studyEntries.length > 0) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    let dataAnterior = hoje;
    streak = 1; // Começa com 1 se tem pelo menos uma entrada

    for (let i = 0; i < studyEntries.length; i++) {
      const dataEstudo = new Date(studyEntries[i].data);
      dataEstudo.setHours(0, 0, 0, 0);
      
      const diffDias = Math.floor((dataAnterior - dataEstudo) / (1000 * 60 * 60 * 24));
      
      if (diffDias === 1) {
        streak++;
        dataAnterior = dataEstudo;
      } else if (diffDias > 1) {
        break;
      }
    }
  }

  // Calcular taxa de acertos
  const totalQuestoes = parseInt(studyStats?.totalQuestoes) || 0;
  const totalAcertos = parseInt(studyStats?.totalAcertos) || 0;
  const taxaAcertos = totalQuestoes > 0 ? Math.round((totalAcertos / totalQuestoes) * 100) : 0;

  return {
    totalHoras: parseFloat(studyStats?.totalHoras) || 0,
    totalQuestoes,
    totalAcertos,
    taxaAcertos,
    simuladoCount,
    streak
  };
}

// Página do perfil
exports.profilePage = async (req, res) => {
  const user = await User.findByPk(req.session.userId);
  const stats = await getUserStats(req.session.userId);

  // Formatar data de criação
  const dataCadastro = user.created_at 
    ? new Date(user.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    : 'Primeiro acesso';

  res.render("app/profile", {
    active: "perfil",
    userNome: req.session.userNome,
    userFoto: user.foto,
    user,
    dataCadastro,
    stats,
    erro: null,
    ok: null
  });
};

// Salvar perfil
exports.profileSave = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { nome, email, senha, bio } = req.body;

    const user = await User.findByPk(userId);
    if (!user) return res.redirect("/logout");

    // Email duplicado
    if (email !== user.email) {
      const existe = await User.findOne({ where: { email } });
      if (existe) {
        const stats = await getUserStats(userId);
        return res.render("app/profile", {
          active: "perfil",
          userNome: req.session.userNome,
          userFoto: user.foto,
          user,
          stats,
          erro: "Este email já está em uso.",
          ok: null
        });
      }
    }

    user.nome = nome;
    user.email = email;
    user.bio = bio || null;

    if (senha && senha.length >= 6) {
      user.senha_hash = await bcrypt.hash(senha, 10);
    }

    if (req.file) {
      user.foto = `/public/uploads/profile/${req.file.filename}`;
    }

    await user.save();

    // Atualiza sessão
    req.session.userNome = user.nome;
    req.session.userFoto = user.foto;

    const stats = await getUserStats(userId);
    const dataCadastro = user.created_at 
      ? new Date(user.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      : 'Primeiro acesso';

    res.render("app/profile", {
      active: "perfil",
      userNome: user.nome,
      userFoto: user.foto,
      user,
      dataCadastro,
      stats,
      erro: null,
      ok: "Perfil atualizado com sucesso."
    });

  } catch (e) {
    console.error(e);
    res.redirect("/perfil");
  }
};

