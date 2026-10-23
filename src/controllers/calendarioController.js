const { StudyEntry, Subject } = require("../models");
const { Op, fn, col } = require("sequelize");

/* =========================
   HELPERS
========================= */
// Data LOCAL em YYYY-MM-DD (toISOString usa UTC e adianta o dia à noite)
function toISO(d) {
  return (
    d.getFullYear() + "-" +
    String(d.getMonth() + 1).padStart(2, "0") + "-" +
    String(d.getDate()).padStart(2, "0")
  );
}

function formatHoursMinutes(decimalHours) {
  if (!decimalHours || decimalHours <= 0) return "0h 0min";
  const horas = Math.floor(decimalHours);
  const minutos = Math.round((decimalHours - horas) * 60);
  if (horas === 0) return `${minutos}min`;
  if (minutos === 0) return `${horas}h`;
  return `${horas}h ${minutos}min`;
}

function pct(acertos, questoes) {
  return questoes > 0 ? Math.round((acertos / questoes) * 100) : 0;
}

/* =========================
   MODO 1 e 2: classes h1..h12
========================= */
const QUESTOES_POR_NIVEL = 10; // 1 nível a cada 10 questões (120+ = h12)

function classeHoras(horas) {
  const n = Math.min(Math.floor(horas), 12);
  return n >= 1 ? "h" + n : "zero";
}

function classeQuestoes(questoes) {
  const n = Math.min(Math.ceil(questoes / QUESTOES_POR_NIVEL), 12);
  return n >= 1 ? "h" + n : "zero";
}

/* =========================
   MODO 3: CALENDÁRIO LENDÁRIO
   Ajuste os limites aqui.
   modo "or"  = basta UM dos dois
   modo "and" = precisa dos DOIS
========================= */
const NIVEIS = [
  { nivel: 0, classe: "lv0", label: "Sem estudo",        icone: "",   modo: "none" },
  { nivel: 1, classe: "lv1", label: "Iniciado",          icone: "🌱", modo: "any" },
  { nivel: 2, classe: "lv2", label: "Leve",              icone: "🙂", modo: "or",  h: 2,  q: 30 },
  { nivel: 3, classe: "lv3", label: "Bom",               icone: "👍", modo: "and", h: 3,  q: 40 },
  { nivel: 4, classe: "lv4", label: "Médio (meta batida)", icone: "🎯", modo: "and", h: 4,  q: 50 },
  { nivel: 5, classe: "lv5", label: "Forte",             icone: "💪", modo: "and", h: 5,  q: 65 },
  { nivel: 6, classe: "lv6", label: "Épico",             icone: "⚡", modo: "and", h: 6,  q: 80 },
  { nivel: 7, classe: "lv7", label: "Lendário",          icone: "🔥", modo: "and", h: 8,  q: 80 },
  { nivel: 8, classe: "lv8", label: "Mítico",            icone: "👑", modo: "and", h: 10, q: 120 },
];

function calcNivelLendario(horas, questoes) {
  for (let i = NIVEIS.length - 1; i >= 1; i--) {
    const n = NIVEIS[i];
    let ok = false;
    if (n.modo === "any") ok = horas > 0 || questoes > 0;
    else if (n.modo === "or") ok = horas >= n.h || questoes >= n.q;
    else if (n.modo === "and") ok = horas >= n.h && questoes >= n.q;
    if (ok) return n;
  }
  return NIVEIS[0];
}

/* =========================
   STREAK (todos os dias, não só o mês)
========================= */
async function calcStreak(userId) {
  const rows = await StudyEntry.findAll({
    where: { user_id: userId },
    attributes: ["data"],
    group: ["data"],
    raw: true,
  });
  const dias = new Set(rows.map((r) => r.data));

  const hoje = new Date();
  let streak = 0;

  for (let i = 0; i < 3650; i++) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - i);
    if (dias.has(toISO(d))) {
      streak++;
    } else if (i === 0) {
      continue; // ainda não estudou hoje: conta a partir de ontem
    } else {
      break;
    }
  }
  return streak;
}

/* =========================
   DIAGNÓSTICO DA MATÉRIA MAIS ESTUDADA
========================= */
function montarDiagnostico(materiasMes, totalHorasMes) {
  if (!materiasMes.length || totalHorasMes <= 0) return null;

  const top = [...materiasMes].sort((a, b) => b.horasNum - a.horasNum)[0];
  const share = Math.round((top.horasNum / totalHorasMes) * 100);

  let nivel, texto;
  if (top.questoes === 0) {
    nivel = "neutro";
    texto = "Você estudou bastante essa matéria, mas sem resolver questões. Que tal praticar?";
  } else if (top.acertoPct >= 75) {
    nivel = "bom";
    texto = "Ótimo aproveitamento! O tempo investido está se convertendo em acertos.";
  } else if (top.acertoPct >= 60) {
    nivel = "medio";
    texto = "Aproveitamento razoável. Revise os erros para subir mais.";
  } else {
    nivel = "alerta";
    texto = "Muito tempo investido, mas poucos acertos. Vale revisar a teoria e o método de estudo.";
  }

  return {
    materia: top.nome,
    horas: top.horas,
    share,
    questoes: top.questoes,
    acertos: top.acertos,
    acertoPct: top.acertoPct,
    nivel,
    texto,
  };
}

/* =========================
   CONTROLLER
========================= */
exports.calendario = async (req, res) => {
  try {
    const userId = req.session.userId;

    const hoje = new Date();
    const hojeISO = toISO(hoje);

    const ano = parseInt(req.query.ano) || hoje.getFullYear();
    const mes = parseInt(req.query.mes) || hoje.getMonth() + 1;

    const inicioMes = new Date(ano, mes - 1, 1);
    const fimMes = new Date(ano, mes, 0);
    const faixa = { [Op.between]: [toISO(inicioMes), toISO(fimMes)] };

    /* ---- totais por dia ---- */
    const registros = await StudyEntry.findAll({
      where: { user_id: userId, data: faixa },
      attributes: [
        "data",
        [fn("SUM", col("horas")), "horas_dia"],
        [fn("SUM", col("questoes")), "questoes_dia"],
        [fn("SUM", col("acertos")), "acertos_dia"],
      ],
      group: ["data"],
      raw: true,
    });

    const mapa = {};
    registros.forEach((r) => {
      mapa[r.data] = {
        horas: Number(r.horas_dia) || 0,
        questoes: Number(r.questoes_dia) || 0,
        acertos: Number(r.acertos_dia) || 0,
      };
    });

    /* ---- detalhe por dia e matéria (para o modal) ---- */
    const porMateriaRaw = await StudyEntry.findAll({
      where: { user_id: userId, data: faixa },
      attributes: [
        "data",
        "subject_id",
        [fn("SUM", col("horas")), "horas"],
        [fn("SUM", col("questoes")), "questoes"],
        [fn("SUM", col("acertos")), "acertos"],
      ],
      group: ["data", "subject_id"],
      raw: true,
    });

    const subjectIds = [...new Set(porMateriaRaw.map((r) => r.subject_id))];
    const subjects = subjectIds.length
      ? await Subject.findAll({
          where: { id: subjectIds },
          attributes: ["id", "nome"],
          raw: true,
        })
      : [];
    const nomePorId = {};
    subjects.forEach((s) => { nomePorId[s.id] = s.nome; });

    const materiasPorDia = {}; // data -> [materias]
    const materiasMesMap = {}; // subject_id -> acumulado do mês

    porMateriaRaw.forEach((r) => {
      const horas = Number(r.horas) || 0;
      const questoes = Number(r.questoes) || 0;
      const acertos = Number(r.acertos) || 0;
      const nome = nomePorId[r.subject_id] || "Sem matéria";

      (materiasPorDia[r.data] = materiasPorDia[r.data] || []).push({
        nome,
        horasNum: horas,
        horas: formatHoursMinutes(horas),
        questoes,
        acertos,
        erros: questoes - acertos,
        acertoPct: pct(acertos, questoes),
      });

      const m = (materiasMesMap[r.subject_id] = materiasMesMap[r.subject_id] || {
        nome, horasNum: 0, questoes: 0, acertos: 0,
      });
      m.horasNum += horas;
      m.questoes += questoes;
      m.acertos += acertos;
    });

    /* ---- monta os dias ---- */
    const diasMes = [];
    let totalHorasMes = 0;
    let totalQuestoesMes = 0;
    let totalAcertosMes = 0;
    let diasEstudados = 0;

    for (let d = 1; d <= fimMes.getDate(); d++) {
      const iso = toISO(new Date(ano, mes - 1, d));
      const info = mapa[iso] || { horas: 0, questoes: 0, acertos: 0 };
      const { horas, questoes, acertos } = info;

      if (horas > 0 || questoes > 0) diasEstudados++;
      totalHorasMes += horas;
      totalQuestoesMes += questoes;
      totalAcertosMes += acertos;

      const lendario = calcNivelLendario(horas, questoes);
      const acertoPct = pct(acertos, questoes);

      const materias = (materiasPorDia[iso] || []).sort((a, b) => b.horasNum - a.horasNum);

      diasMes.push({
        dia: d,
        dataISO: iso,

        // ---- campos que já existiam (a view atual continua funcionando) ----
        horas: formatHoursMinutes(horas),
        questoes,
        acertos,
        acertoPct,
        cor: classeHoras(horas), // modo 1
        perfeito: horas >= 6 && questoes >= 30 && acertoPct >= 80,
        isHoje: iso === hojeISO,
        futuro: iso > hojeISO,

        // ---- novos ----
        horasNum: horas,
        corQuestoes: classeQuestoes(questoes), // modo 2
        corLendario: lendario.classe,          // modo 3
        nivelLendario: lendario.nivel,
        labelLendario: lendario.label,
        iconeLendario: lendario.icone,
        erros: questoes - acertos,
        materias, // para o modal
      });
    }

    const materiasMes = Object.values(materiasMesMap).map((m) => ({
      nome: m.nome,
      horasNum: m.horasNum,
      horas: formatHoursMinutes(m.horasNum),
      questoes: m.questoes,
      acertos: m.acertos,
      acertoPct: pct(m.acertos, m.questoes),
    }));

    const streak = await calcStreak(userId);

    const mesLabel = inicioMes.toLocaleString("pt-BR", { month: "long", year: "numeric" });

    res.render("app/calendario", {
      active: "calendario",
      userNome: req.session.userNome,
      userFoto: req.session.userFoto,

      diasMes,
      mesLabel,
      anoAnterior: mes === 1 ? ano - 1 : ano,
      mesAnterior: mes === 1 ? 12 : mes - 1,
      anoProximo: mes === 12 ? ano + 1 : ano,
      mesProximo: mes === 12 ? 1 : mes + 1,

      // ---- resumo (campos antigos mantidos) ----
      totalHorasMes,
      diasEstudados,
      mediaDiaria: diasEstudados > 0 ? totalHorasMes / diasEstudados : 0,

      // ---- resumo (novos) ----
      streak,
      totalQuestoesMes,
      totalAcertosMes,
      acertoPctMes: pct(totalAcertosMes, totalQuestoesMes),
      mediaDiariaQuestoes: diasEstudados > 0 ? Math.round(totalQuestoesMes / diasEstudados) : 0,
      diagnostico: montarDiagnostico(materiasMes, totalHorasMes),

      // ---- legenda do modo lendário ----
      niveisLendario: NIVEIS.map((n) => ({
        nivel: n.nivel,
        classe: n.classe,
        label: n.label,
        icone: n.icone,
        regra:
          n.modo === "or" ? `${n.h}h ou ${n.q} questões`
          : n.modo === "and" ? `${n.h}h e ${n.q} questões`
          : n.modo === "any" ? "qualquer registro"
          : "—",
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro no calendário");
  }
};