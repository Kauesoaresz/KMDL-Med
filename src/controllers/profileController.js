const bcrypt = require("bcryptjs");
const { fn, col } = require("sequelize");
const User = require("../models/User");
const StudyEntry = require("../models/StudyEntry");
const Simulado = require("../models/Simulado");
const fs = require("fs");
const path = require("path");

const BG_DIR = path.join(__dirname, "../public/uploads/login-bg");
const BG_URL = "/public/uploads/login-bg/";

function readCookie(req, name) {
  const m = (req.headers.cookie || "").match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : null;
}

function currentBg(req) {
  const v = readCookie(req, "kmed_bg");
  return v && v.startsWith(BG_URL) && !v.includes("..") ? v : null;
}

function removeBgFile(url) {
  if (url) fs.unlink(path.join(BG_DIR, path.basename(url)), () => {});
}

/* =========================
   HELPERS
========================= */
function toISO(d) {
  return (
    d.getFullYear() + "-" +
    String(d.getMonth() + 1).padStart(2, "0") + "-" +
    String(d.getDate()).padStart(2, "0")
  );
}

function go(res, tipo, msg) {
  res.redirect("/perfil?" + tipo + "=" + encodeURIComponent(msg));
}

async function getUserStats(userId) {
  const total = await StudyEntry.findOne({
    where: { user_id: userId },
    attributes: [
      [fn("SUM", col("horas")), "horas"],
      [fn("SUM", col("questoes")), "questoes"],
      [fn("SUM", col("acertos")), "acertos"],
    ],
    raw: true,
  });

  const diasRaw = await StudyEntry.findAll({
    where: { user_id: userId },
    attributes: ["data"],
    group: ["data"],
    raw: true,
  });
  const dias = new Set(diasRaw.map((d) => d.data));

  // sequência atual (se ainda não estudou hoje, conta a partir de ontem)
  const h = new Date();
  let streak = 0;
  for (let i = 0; i < 3650; i++) {
    const d = new Date(h.getFullYear(), h.getMonth(), h.getDate() - i);
    if (dias.has(toISO(d))) streak++;
    else if (i === 0) continue;
    else break;
  }

  const simulados = await Simulado.count({ where: { user_id: userId, status: "finalizado" } });

  const questoes = Number(total?.questoes) || 0;
  const acertos = Number(total?.acertos) || 0;

  return {
    horas: Number(total?.horas) || 0,
    questoes,
    acertos,
    taxa: questoes > 0 ? Math.round((acertos / questoes) * 100) : null,
    dias: dias.size,
    simulados,
    streak,
  };
}

/* =========================
   PÁGINA
========================= */
exports.profilePage = async (req, res) => {
  const user = await User.findByPk(req.session.userId);
  if (!user) return res.redirect("/logout");

  const criado = user.created_at || user.createdAt;
  const desde = criado
    ? new Date(criado).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
    : null;

  res.render("app/profile", {
    active: "perfil",
    userNome: req.session.userNome,
    userFoto: user.foto,
    user,
    desde,
    loginBg: currentBg(req),
    stats: await getUserStats(user.id),
    erro: req.query.erro || null,
    ok: req.query.ok || null,
  });
};

/* =========================
   SALVAR
========================= */
exports.profileSave = async (req, res) => {
  try {
    const user = await User.findByPk(req.session.userId);
    if (!user) return res.redirect("/logout");

    const nome = (req.body.nome || "").toString().trim().slice(0, 120);
    const email = (req.body.email || "").toString().trim().toLowerCase();
    const bio = (req.body.bio || "").toString().trim().slice(0, 300);
    const senhaAtual = (req.body.senha_atual || "").toString();
    const senhaNova = (req.body.senha_nova || "").toString();
    const senhaConf = (req.body.senha_conf || "").toString();

    if (!nome) return go(res, "erro", "O nome não pode ficar vazio.");
    if (!/^\S+@\S+\.\S+$/.test(email)) return go(res, "erro", "Informe um e-mail válido.");

    if (email !== user.email) {
      const existe = await User.findOne({ where: { email } });
      if (existe) return go(res, "erro", "Este e-mail já está em uso.");
    }

    // troca de senha (opcional)
    if (senhaNova || senhaAtual || senhaConf) {
      if (!senhaAtual) return go(res, "erro", "Informe a senha atual para trocar a senha.");
      const confere = await bcrypt.compare(senhaAtual, user.senha_hash);
      if (!confere) return go(res, "erro", "A senha atual está incorreta.");
      if (senhaNova.length < 6) return go(res, "erro", "A nova senha precisa ter pelo menos 6 caracteres.");
      if (senhaNova !== senhaConf) return go(res, "erro", "A confirmação não bate com a nova senha.");
      user.senha_hash = await bcrypt.hash(senhaNova, 10);
    }

    user.nome = nome;
    user.email = email;
    user.bio = bio || null;
    if (req.file) user.foto = `/public/uploads/profile/${req.file.filename}`;

    await user.save();

    req.session.userNome = user.nome;
    req.session.userFoto = user.foto;

    go(res, "ok", "Perfil atualizado com sucesso.");
  } catch (e) {
    console.error(e);
    go(res, "erro", "Não foi possível salvar. Tente novamente.");
  }
};

exports.bgSave = (req, res) => {
  if (!req.file) return go(res, "erro", "Escolha uma imagem.");

  removeBgFile(currentBg(req));
  res.cookie("kmed_bg", BG_URL + req.file.filename, {
    maxAge: 365 * 24 * 60 * 60 * 1000,
    sameSite: "lax",
    path: "/",
  });
  go(res, "ok", "Fundo da tela de login atualizado.");
};

exports.bgRemove = (req, res) => {
  removeBgFile(currentBg(req));
  res.clearCookie("kmed_bg", { path: "/" });
  go(res, "ok", "Fundo removido. Voltou ao padrão.");
};