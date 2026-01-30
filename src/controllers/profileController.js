const bcrypt = require("bcryptjs");
const User = require("../models/User");

exports.profilePage = async (req, res) => {
  const user = await User.findByPk(req.session.userId);

  res.render("app/profile", {
    active: "perfil",
    userNome: req.session.userNome,
    userFoto: user.foto,   // ✅ AQUI
    user,
    erro: null,
    ok: null
  });
};

exports.profileSave = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { nome, email, senha } = req.body;

    const user = await User.findByPk(userId);
    if (!user) return res.redirect("/logout");

    // Email duplicado
    if (email !== user.email) {
      const existe = await User.findOne({ where: { email } });
      if (existe) {
        return res.render("app/profile", {
          active: "perfil",
          userNome: req.session.userNome,
          userFoto: user.foto,
          user,
          erro: "Este email já está em uso.",
          ok: null
        });
      }
    }

    user.nome = nome;
    user.email = email;

    if (senha && senha.length >= 6) {
      user.senha_hash = await bcrypt.hash(senha, 10);
    }

    if (req.file) {
      user.foto = `/public/uploads/profile/${req.file.filename}`;
    }

    await user.save();

    // 🔁 Atualiza sessão
    req.session.userNome = user.nome;
    req.session.userFoto = user.foto;

    res.render("app/profile", {
      active: "perfil",
      userNome: user.nome,
      userFoto: user.foto,
      user,
      erro: null,
      ok: "Perfil atualizado com sucesso."
    });

  } catch (e) {
    console.error(e);
    res.redirect("/perfil");
  }
};
