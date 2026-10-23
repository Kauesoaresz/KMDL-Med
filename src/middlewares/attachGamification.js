// ============================================================
// src/middlewares/attachGamification.js
// Em toda request autenticada, calcula o "retrato" da gamificação
// e disponibiliza em res.locals.gamif para qualquer view EJS usar.
// ============================================================

const gamificationService = require("../services/gamificationService");

module.exports = async function attachGamification(req, res, next) {
  // Só roda se estiver logado
  if (!req.session || !req.session.userId) {
    res.locals.gamif = null;
    return next();
  }

  try {
    const retrato = await gamificationService.retratoGamificacao(req.session.userId);
    res.locals.gamif = retrato;
  } catch (err) {
    // Nunca quebra a página por causa da gamificação
    console.error("[attachGamification] erro ao calcular gamificação:", err.message);
    res.locals.gamif = null;
  }

  next();
};