const { StudyGoal, StudyEntry } = require("../models");
const { Op, fn, col } = require("sequelize");

/* =========================
   HELPERS DE DATA (fuso local)
========================= */
function toISO(d) {
  return (
    d.getFullYear() + "-" +
    String(d.getMonth() + 1).padStart(2, "0") + "-" +
    String(d.getDate()).padStart(2, "0")
  );
}
const todayISO = () => toISO(new Date());

function parseISO(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}
const diffDays = (a, b) => Math.round((parseISO(b) - parseISO(a)) / 86400000);
const validISO = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(parseISO(s));
const fmtBR = (iso) => (iso ? iso.split("-").reverse().join("/") : "");

/* =========================
   PROGRESSO (só do início até o prazo)
========================= */
async function atualizarProgressoMeta(goal) {
  const hoje = todayISO();
  const ate = hoje > goal.data_limite ? goal.data_limite : hoje;

  let horas = 0;
  let questoes = 0;

  if (ate >= goal.data_inicio) {
    const r = await StudyEntry.findOne({
      where: {
        user_id: goal.user_id,
        data: { [Op.between]: [goal.data_inicio, ate] },
      },
      attributes: [
        [fn("SUM", col("horas")), "horas"],
        [fn("SUM", col("questoes")), "questoes"],
      ],
      raw: true,
    });
    horas = Number(r?.horas) || 0;
    questoes = Number(r?.questoes) || 0;
  }

  goal.horas_concluidas = horas;
  goal.questoes_concluidas = questoes;

  if (goal.status === "ativa") {
    const okH = horas >= Number(goal.meta_horas);
    const okQ = goal.meta_questoes > 0 ? questoes >= goal.meta_questoes : true;

    if (okH && okQ) {
      goal.status = "concluida";
      goal.data_conclusao = ate; // nunca depois do prazo
    } else if (hoje > goal.data_limite) {
      goal.status = "vencida";
    }
  }

  await goal.save();
  return goal;
}

/* =========================
   MONTAR DADOS PARA A VIEW
========================= */
function montar(g) {
  const hoje = todayISO();
  const metaH = Number(g.meta_horas) || 0;
  const feitoH = Number(g.horas_concluidas) || 0;
  const metaQ = g.meta_questoes || 0;
  const feitoQ = g.questoes_concluidas || 0;

  const pH = metaH > 0 ? Math.min(100, Math.round((feitoH / metaH) * 100)) : 0;
  const pQ = metaQ > 0 ? Math.min(100, Math.round((feitoQ / metaQ) * 100)) : null;
  const total = pQ === null ? pH : Math.round((pH + pQ) / 2);

  const m = {
    id: g.id,
    nome: g.nome,
    status: g.status,
    eh_principal: !!g.eh_principal,
    metaH, feitoH, metaQ, feitoQ, pH, pQ, total,
    inicio: fmtBR(g.data_inicio),
    limite: fmtBR(g.data_limite),
    conclusao: g.data_conclusao ? fmtBR(g.data_conclusao) : null,
    faltaH: Math.max(0, metaH - feitoH),
    faltaQ: Math.max(0, metaQ - feitoQ),
    dentroPrazo: g.status === "concluida" && !!g.data_conclusao && g.data_conclusao <= g.data_limite,
    diasParaConcluir: g.data_conclusao ? diffDays(g.data_inicio, g.data_conclusao) + 1 : null,
    prazoTexto: null,
    pace: null,
  };

  if (g.status !== "ativa") return m;

  const totalDias = diffDays(g.data_inicio, g.data_limite) + 1;
  const iniciada = hoje >= g.data_inicio;
  const decorridos = iniciada ? Math.min(totalDias, diffDays(g.data_inicio, hoje) + 1) : 0;
  const diasRest = !iniciada ? totalDias : Math.max(1, diffDays(hoje, g.data_limite) + 1);
  const esperado = Math.round((decorridos / totalDias) * 100);

  let situacao = "aguardando";
  if (iniciada) {
    const dif = total - esperado;
    situacao = dif >= 10 ? "adiantada" : dif >= -10 ? "no_ritmo" : "atrasada";
  }

  if (!iniciada) m.prazoTexto = `Começa em ${diffDays(hoje, g.data_inicio)} dia(s)`;
  else if (hoje === g.data_limite) m.prazoTexto = "Último dia";
  else m.prazoTexto = `${diffDays(hoje, g.data_limite)} dia(s) restantes`;

  m.pace = {
    situacao,
    esperado,
    diasRestantes: diasRest,
    porDiaH: m.faltaH / diasRest,
    porDiaQ: Math.ceil(m.faltaQ / diasRest),
  };
  return m;
}

/* =========================
   VALIDAÇÃO
========================= */
function lerCampos(body) {
  const nome = (body.nome || "").toString().trim().slice(0, 200);
  const meta_horas = parseFloat(body.meta_horas);
  const meta_questoes = parseInt(body.meta_questoes, 10) || 0;
  const data_inicio = (body.data_inicio || "").toString();
  const data_limite = (body.data_limite || "").toString();
  const eh_principal = body.eh_principal === true || body.eh_principal === "true";

  let erro = null;
  if (!nome) erro = "Dê um nome à meta.";
  else if (!Number.isFinite(meta_horas) || meta_horas <= 0 || meta_horas > 9999) erro = "Informe uma meta de horas válida.";
  else if (meta_questoes < 0 || meta_questoes > 1000000) erro = "Meta de questões inválida.";
  else if (!validISO(data_inicio) || !validISO(data_limite)) erro = "Informe as datas de início e de prazo.";
  else if (data_limite < data_inicio) erro = "O prazo não pode ser antes do início.";

  return { erro, campos: { nome, meta_horas, meta_questoes, data_inicio, data_limite, eh_principal } };
}

async function podeSerPrincipal(userId, excluirId) {
  const where = { user_id: userId, eh_principal: true, status: "ativa" };
  if (excluirId) where.id = { [Op.ne]: excluirId };
  return (await StudyGoal.count({ where })) < 4;
}

/* =========================
   PÁGINA
========================= */
exports.pagina = async (req, res) => {
  try {
    const userId = req.session.userId;

    let goals = await StudyGoal.findAll({ where: { user_id: userId } });

    // atualiza as ativas (também marca como vencida/concluída)
    for (const g of goals) {
      if (g.status === "ativa") await atualizarProgressoMeta(g);
    }

    const todas = goals.map(montar);

    const ativas = todas
      .filter((m) => m.status === "ativa")
      .sort((a, b) => Number(b.eh_principal) - Number(a.eh_principal) || a.limite.split("/").reverse().join("").localeCompare(b.limite.split("/").reverse().join("")));
    const concluidas = todas.filter((m) => m.status === "concluida").reverse();
    const vencidas = todas.filter((m) => m.status === "vencida").reverse();

    const fim = concluidas.length + vencidas.length;
    const stats = {
      ativas: ativas.length,
      concluidas: concluidas.length,
      vencidas: vencidas.length,
      taxa: fim > 0 ? Math.round((concluidas.length / fim) * 100) : null,
      principais: ativas.filter((m) => m.eh_principal).length,
    };

    const raw = {};
    goals.forEach((g) => {
      raw[g.id] = {
        id: g.id,
        nome: g.nome,
        meta_horas: Number(g.meta_horas),
        meta_questoes: g.meta_questoes,
        data_inicio: g.data_inicio,
        data_limite: g.data_limite,
        eh_principal: !!g.eh_principal,
      };
    });

    res.render("app/metas", {
      active: "metas",
      userNome: req.session.userNome,
      userFoto: req.session.userFoto,
      ativas,
      concluidas,
      vencidas,
      stats,
      hoje: todayISO(),
      goalsJson: JSON.stringify(raw).replace(/</g, "\\u003c"),
    });
  } catch (err) {
    console.error("Erro ao carregar metas:", err);
    res.status(500).send("Erro ao carregar página");
  }
};

/* =========================
   API
========================= */
exports.criarMeta = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { erro, campos } = lerCampos(req.body || {});
    if (erro) return res.status(400).json({ erro });

    if (campos.eh_principal && !(await podeSerPrincipal(userId))) {
      return res.status(400).json({ erro: "Máximo de 4 metas principais. Desmarque outra primeiro." });
    }

    const meta = await StudyGoal.create({ user_id: userId, ...campos, status: "ativa" });
    await atualizarProgressoMeta(meta);

    res.json({ sucesso: true, id: meta.id });
  } catch (err) {
    console.error("Erro ao criar meta:", err);
    res.status(500).json({ erro: "Erro ao criar meta" });
  }
};

exports.editarMeta = async (req, res) => {
  try {
    const userId = req.session.userId;
    const meta = await StudyGoal.findOne({ where: { id: req.params.id, user_id: userId } });
    if (!meta) return res.status(404).json({ erro: "Meta não encontrada" });

    const { erro, campos } = lerCampos(req.body || {});
    if (erro) return res.status(400).json({ erro });

    if (campos.eh_principal && !(await podeSerPrincipal(userId, meta.id))) {
      return res.status(400).json({ erro: "Máximo de 4 metas principais. Desmarque outra primeiro." });
    }

    meta.set(campos);
    meta.status = "ativa"; // recalculada abaixo
    meta.data_conclusao = null;
    await atualizarProgressoMeta(meta);

    res.json({ sucesso: true });
  } catch (err) {
    console.error("Erro ao editar meta:", err);
    res.status(500).json({ erro: "Erro ao editar meta" });
  }
};

exports.definirPrincipal = async (req, res) => {
  try {
    const userId = req.session.userId;
    const meta = await StudyGoal.findOne({ where: { id: req.params.id, user_id: userId } });
    if (!meta) return res.status(404).json({ erro: "Meta não encontrada" });

    if (!meta.eh_principal) {
      if (meta.status !== "ativa") return res.status(400).json({ erro: "Só metas ativas podem ser principais." });
      if (!(await podeSerPrincipal(userId, meta.id))) {
        return res.status(400).json({ erro: "Máximo de 4 metas principais permitido." });
      }
      meta.eh_principal = true;
    } else {
      meta.eh_principal = false;
    }

    await meta.save();
    res.json({ sucesso: true, eh_principal: meta.eh_principal });
  } catch (err) {
    console.error("Erro ao definir principal:", err);
    res.status(500).json({ erro: "Erro ao definir meta principal" });
  }
};

exports.finalizarMeta = async (req, res) => {
  try {
    const meta = await StudyGoal.findOne({ where: { id: req.params.id, user_id: req.session.userId } });
    if (!meta) return res.status(404).json({ erro: "Meta não encontrada" });

    const hoje = todayISO();
    meta.status = "concluida";
    meta.data_conclusao = hoje > meta.data_limite ? meta.data_limite : hoje;
    meta.eh_principal = false;
    await meta.save();

    res.json({ sucesso: true });
  } catch (err) {
    console.error("Erro ao finalizar meta:", err);
    res.status(500).json({ erro: "Erro ao finalizar meta" });
  }
};

exports.deletarMeta = async (req, res) => {
  try {
    const meta = await StudyGoal.findOne({ where: { id: req.params.id, user_id: req.session.userId } });
    if (!meta) return res.status(404).json({ erro: "Meta não encontrada" });

    await meta.destroy();
    res.json({ sucesso: true });
  } catch (err) {
    console.error("Erro ao deletar meta:", err);
    res.status(500).json({ erro: "Erro ao deletar meta" });
  }
};