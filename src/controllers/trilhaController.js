// ============================================================
// src/controllers/trilhaController.js
// Controller da página /trilha ("Trilha da Aprovação").
// ============================================================

const gamificationService = require("../services/gamificationService");
const G = require("../lib/gamification");

// ------------------------------------------------------------
// Helper: converte 1..10 em número romano
// ------------------------------------------------------------
function numeroRomano(n) {
  const rom = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
  return rom[Math.max(1, Math.min(10, n))] || "I";
}

// ------------------------------------------------------------
// Helper: cor de fundo por trilha (usada na tab)
// Cada trilha tem uma "família visual" (definida aqui, não no CSS,
// pra ficar fácil de mudar depois)
// ------------------------------------------------------------
const CORES_TRILHA = {
  questoes_feitas:      "#6366f1", // índigo (accent)
  questoes_acertadas:   "#34d399", // verde
  dias_estudados:       "#fbbf24", // amarelo
  horas_estudadas:      "#60a5fa", // azul
  simulados_completos:  "#f472b6", // rosa
  metas:                "#a78bfa", // lilás
};

// ------------------------------------------------------------
// Calcula o estágio do brasão (1..10) atingido na trilha
// (conta quantos brasões já foram alcançados)
// ------------------------------------------------------------
function calcularEstagio(marcos) {
  const brasoesAtingidos = marcos.filter(m => m.tipo === "brasao" && m.atingido);
  return Math.max(1, Math.min(10, brasoesAtingidos.length));
}

// ------------------------------------------------------------
// GET /trilha
// Query opcional: ?t=<trilha_key>
// ------------------------------------------------------------
async function exibirTrilha(req, res) {
  try {
    const userId = req.session.userId;
    if (!userId) return res.redirect("/login");

    const retrato = await gamificationService.retratoGamificacao(userId);

    const trilhaKeys = G.TRILHAS.map(t => t.key);
    let trilhaAtivaKey = String(req.query.t || "").trim();
    if (!trilhaKeys.includes(trilhaAtivaKey)) {
      trilhaAtivaKey = trilhaKeys[0];
    }

    const trilhaAtiva = retrato.trilhas[trilhaAtivaKey];

    // Tabs — já com estágio, número romano, cor e tooltip
    const tabs = G.TRILHAS.map(t => {
      const estado = retrato.trilhas[t.key];
      const resgatados  = estado.marcos.filter(m => m.resgatado).length;
      const resgataveis = estado.marcos.filter(m => m.podeResgatar).length;
      const estagio = calcularEstagio(estado.marcos);

      return {
        key: t.key,
        nome: t.nome,
        icone: t.icone,
        ativa: t.key === trilhaAtivaKey,
        valorAtual: estado.trilha.valorAtual,
        teto: estado.trilha.teto,
        resgatados,
        resgataveis,
        totalMarcos: estado.marcos.length,
        estagio,
        romano: numeroRomano(estagio),
        cor: CORES_TRILHA[t.key] || "#6366f1",
      };
    });

    const marcos = trilhaAtiva.marcos;
    const proximo = marcos.find(m => !m.atingido) || null;

    const xpBonusDisponivel = marcos
      .filter(m => m.podeResgatar)
      .reduce((s, m) => s + m.xpBonus, 0);

    const pctTrilha = Math.min(
      100,
      Math.round((trilhaAtiva.trilha.valorAtual / trilhaAtiva.trilha.teto) * 100)
    );

    res.render("app/trilha", {
      title: "Trilha da Aprovação",
      userNome: req.session.userNome || "Usuário",
      userFoto: req.session.userFoto || null,
      retrato,
      tabs,
      trilhaAtiva,
      marcos,
      proximo,
      xpBonusDisponivel,
      pctTrilha,
    });
  } catch (err) {
    console.error("[trilhaController.exibirTrilha]", err);
    res.status(500).send("Erro ao carregar a Trilha da Aprovação.");
  }
}

// ------------------------------------------------------------
// POST /trilha/resgatar (sem mudanças)
// ------------------------------------------------------------
async function resgatarMarco(req, res) {
  try {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ ok: false, erro: "Não autenticado" });

    const trilha_key = String(req.body.trilha_key || "").trim();
    const marco_id = String(req.body.marco_id || "").trim();

    if (!trilha_key || !marco_id) {
      return res.status(400).json({ ok: false, erro: "Dados incompletos" });
    }

    const resultado = await gamificationService.resgatarMarco(userId, trilha_key, marco_id);

    const retrato = await gamificationService.retratoGamificacao(userId);
    const xpBonusDisponivel = Object.values(retrato.trilhas).reduce(
      (s, t) => s + t.marcos.filter(m => m.podeResgatar).reduce((a, m) => a + m.xpBonus, 0),
      0
    );

    return res.json({
      ok: true,
      jaResgatado: !!resultado.jaResgatado,
      novoXpTotal: retrato.xpTotal,
      nivel: retrato.nivel,
      progresso: retrato.progresso,
      patente: retrato.patente,
      xpBonusDisponivel,
    });
  } catch (err) {
    console.error("[trilhaController.resgatarMarco]", err);
    return res.status(400).json({ ok: false, erro: err.message || "Erro ao resgatar" });
  }
}

module.exports = {
  exibirTrilha,
  resgatarMarco,
};