const { StudyEntry, Subject, StudyGoal } = require("../models");
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

function todayISO() {
  return toISO(new Date());
}

function startOfWeek() {
  const d = new Date();
  const dow = d.getDay(); // 0 = domingo
  d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1)); // semana começa na segunda
  return d;
}

function weekRange() {
  const ini = startOfWeek();
  const fim = new Date(ini);
  fim.setDate(fim.getDate() + 6);
  return [toISO(ini), toISO(fim)];
}

function monthRange() {
  const n = new Date();
  return [toISO(new Date(n.getFullYear(), n.getMonth(), 1)), toISO(new Date(n.getFullYear(), n.getMonth() + 1, 0))];
}

function pct(a, b) {
  return b > 0 ? Math.round((a / b) * 100) : 0;
}

const PERIODOS = [
  { key: "hoje", label: "Hoje" },
  { key: "semana", label: "Semana" },
  { key: "mes", label: "Mês" },
  { key: "total", label: "Total" },
];

const PALETA = [
  "#2ee59d", "#4da3ff", "#f0c75e", "#a78bfa", "#ef4444",
  "#22c55e", "#f59e0b", "#ec4899", "#14b8a6", "#8b5cf6",
  "#f97316", "#06b6d4",
];

/* =========================
   STREAK (todos os dias)
========================= */
async function calcStreak(userId) {
  const rows = await StudyEntry.findAll({
    where: { user_id: userId },
    attributes: ["data"],
    group: ["data"],
    raw: true,
  });
  const dias = new Set(rows.map((r) => r.data));

  const h = new Date();
  let streak = 0;

  for (let i = 0; i < 3650; i++) {
    const d = new Date(h.getFullYear(), h.getMonth(), h.getDate() - i);
    if (dias.has(toISO(d))) streak++;
    else if (i === 0) continue; // ainda não estudou hoje: conta a partir de ontem
    else break;
  }
  return streak;
}

/* =========================
   METAS PRINCIPAIS
========================= */
async function atualizarProgressoMeta(goal) {
  const hoje = todayISO();
  const ate = hoje > goal.data_limite ? goal.data_limite : hoje;

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

  const horas = Number(r?.horas) || 0;
  const questoes = Number(r?.questoes) || 0;

  goal.horas_concluidas = horas;
  goal.questoes_concluidas = questoes;

  const okHoras = horas >= Number(goal.meta_horas);
  const okQuestoes = goal.meta_questoes > 0 ? questoes >= goal.meta_questoes : true;

  if (hoje > goal.data_limite && (!okHoras || !okQuestoes)) {
    goal.status = "vencida";
  }
  if (okHoras && okQuestoes && goal.status === "ativa") {
    goal.status = "concluida";
    goal.data_conclusao = hoje;
  }

  await goal.save();
  return goal;
}

async function carregarMetas(userId) {
  const raw = await StudyGoal.findAll({
    where: { user_id: userId, eh_principal: true, status: "ativa" },
    order: [["data_limite", "ASC"]],
    limit: 4,
  });

  const metas = [];
  for (const g of raw) {
    const m = await atualizarProgressoMeta(g);
    const metaH = Number(m.meta_horas) || 0;
    const feitoH = Number(m.horas_concluidas) || 0;
    const progH = metaH > 0 ? Math.min(Math.round((feitoH / metaH) * 100), 100) : 0;
    const progQ = m.meta_questoes > 0
      ? Math.min(Math.round((m.questoes_concluidas / m.meta_questoes) * 100), 100)
      : null;

    metas.push({
      id: m.id,
      nome: m.nome,
      meta_horas: metaH,
      meta_questoes: m.meta_questoes,
      horas_concluidas: feitoH,
      questoes_concluidas: m.questoes_concluidas,
      data_limite_formatada: String(m.data_limite).split("-").reverse().join("/"),
      progresso_horas: progH,
      progresso_questoes: progQ,
      progresso_total: progQ === null ? progH : Math.round((progH + progQ) / 2),
    });
  }
  return metas;
}

/* =========================
   DASHBOARD
========================= */
exports.dashboard = async (req, res) => {
  const userId = req.session.userId;

  const periodo = PERIODOS.some((p) => p.key === req.query.periodo)
    ? req.query.periodo
    : "total";

  /* ---- filtro de período ---- */
  const where = { user_id: userId };
  if (periodo === "hoje") where.data = todayISO();
  if (periodo === "semana") where.data = { [Op.between]: weekRange() };
  if (periodo === "mes") where.data = { [Op.between]: monthRange() };

  /* ---- totais ---- */
  const row = await StudyEntry.findOne({
    where,
    attributes: [
      [fn("SUM", col("horas")), "horas"],
      [fn("SUM", col("questoes")), "questoes"],
      [fn("SUM", col("acertos")), "acertos"],
      [fn("COUNT", fn("DISTINCT", col("data"))), "dias"],
    ],
    raw: true,
  });

  const horas = Number(row?.horas) || 0;
  const questoes = Number(row?.questoes) || 0;
  const acertos = Number(row?.acertos) || 0;

  const stats = {
    horas,
    questoes,
    acertos,
    erros: questoes - acertos,
    taxa: pct(acertos, questoes),
    dias: Number(row?.dias) || 0,
  };

  /* ---- por matéria ---- */
  const porMateriaRaw = await StudyEntry.findAll({
    where,
    attributes: [
      "subject_id",
      [fn("SUM", col("horas")), "horas"],
      [fn("SUM", col("questoes")), "questoes"],
      [fn("SUM", col("acertos")), "acertos"],
    ],
    group: ["subject_id"],
    raw: true,
  });

  const ids = porMateriaRaw.map((r) => r.subject_id);
  const subjects = ids.length
    ? await Subject.findAll({ where: { id: ids }, attributes: ["id", "nome"], raw: true })
    : [];
  const nomePorId = {};
  subjects.forEach((s) => { nomePorId[s.id] = s.nome; });

  const materias = porMateriaRaw
    .map((r) => {
      const h = Number(r.horas) || 0;
      const q = Number(r.questoes) || 0;
      const a = Number(r.acertos) || 0;
      return {
        id: r.subject_id,
        nome: nomePorId[r.subject_id] || "Sem matéria",
        horas: h,
        questoes: q,
        acertos: a,
        taxa: pct(a, q),
      };
    })
    .sort((x, y) => y.horas - x.horas);

  // mesma cor da matéria nos dois gráficos
  materias.forEach((m, i) => { m.cor = PALETA[i % PALETA.length]; });

  const fatia = (campo) => {
    const lista = materias
      .filter((m) => m[campo] > 0)
      .sort((x, y) => y[campo] - x[campo]);
    const total = lista.reduce((s, m) => s + m[campo], 0);
    return {
      total,
      itens: lista.map((m) => ({
        nome: m.nome,
        valor: m[campo],
        cor: m.cor,
        share: pct(m[campo], total),
      })),
    };
  };

  const pizzaHoras = fatia("horas");
  const pizzaQuestoes = fatia("questoes");

  const chartJson = JSON.stringify({
    horas: pizzaHoras.itens,
    questoes: pizzaQuestoes.itens,
  }).replace(/</g, "\\u003c");

  /* ---- extras ---- */
  const streak = await calcStreak(userId);
  const metas = await carregarMetas(userId);

  res.render("app/dashboard", {
    active: "dashboard",
    userNome: req.session.userNome,
    userFoto: req.session.userFoto,
    periodo,
    periodos: PERIODOS,
    stats,
    streak,
    materias,
    pizzaHoras,
    pizzaQuestoes,
    chartJson,
    metas,
  });
};