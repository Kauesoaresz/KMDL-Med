// ============================================================
// src/services/gamificationService.js
// Ponte entre o banco e o cérebro (lib/gamification.js).
// Consulta o banco, calcula XP, nível, patente, trilhas e streak.
// ============================================================

const { Op, QueryTypes } = require("sequelize");
const sequelize = require("../config/database");
const {
  StudyEntry,
  Simulado,
  SimuladoQuestaoErro,
  StudyGoal,
} = require("../models");

const G = require("../lib/gamification");

// Modelos das tabelas novas (serão criados no SQL mais adiante)
// Import dinâmico para o service não quebrar antes do SQL rodar
let RewardUnlock, StreakCredit;
function lazyModels() {
  if (!RewardUnlock) {
    try { RewardUnlock = require("../models/RewardUnlock"); } catch (_) {}
  }
  if (!StreakCredit) {
    try { StreakCredit = require("../models/StreakCredit"); } catch (_) {}
  }
}

// ------------------------------------------------------------
// HELPERS DE DATA (fuso local, sem toISOString)
// ------------------------------------------------------------
function toISO(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

// Recebe "YYYY-MM-DD" e devolve um Date local à meia-noite
function parseISO(iso) {
  if (!iso) return null;
  const [y, m, d] = String(iso).split("-").map(Number);
  return new Date(y, m - 1, d);
}

// Diferença em dias entre duas datas ISO (b - a)
function diffDias(aISO, bISO) {
  const a = parseISO(aISO);
  const b = parseISO(bISO);
  if (!a || !b) return 0;
  return Math.round((b - a) / 86400000);
}

// ------------------------------------------------------------
// 1. AGREGAÇÕES BASE (o que o banco já tem)
// ------------------------------------------------------------

// Retorna {
//   questoesFeitas, questoesAcertadas, horasTotais,
//   diasEstudados (count distinct data),
//   diasComEntry: Set de ISO,
//   simuladosFinalizados, revisoesFeitas, metasConcluidas
// }
async function agregarBase(userId) {
  // StudyEntry agregado
  const [entryAgg] = await sequelize.query(
    `SELECT
       COALESCE(SUM(questoes), 0) AS questoes,
       COALESCE(SUM(acertos), 0)  AS acertos,
       COALESCE(SUM(horas), 0)    AS horas,
       COUNT(DISTINCT data)       AS dias
     FROM study_entries
     WHERE user_id = :userId`,
    { replacements: { userId }, type: QueryTypes.SELECT }
  );

  // Datas distintas (pra streak)
  const datasRaw = await sequelize.query(
    `SELECT DISTINCT data FROM study_entries
     WHERE user_id = :userId
     ORDER BY data ASC`,
    { replacements: { userId }, type: QueryTypes.SELECT }
  );
  const dias = datasRaw.map(r => String(r.data).slice(0, 10));

  // Simulados finalizados
  const [simAgg] = await sequelize.query(
    `SELECT COUNT(*) AS total FROM simulados
     WHERE user_id = :userId AND status = 'finalizado'`,
    { replacements: { userId }, type: QueryTypes.SELECT }
  );

  // Revisões feitas (só status='errada' AND revisada=true)
  const [revAgg] = await sequelize.query(
    `SELECT COUNT(*) AS total
     FROM simulado_questao_erros qe
     JOIN simulado_blocos sb ON sb.id = qe.simulado_bloco_id
     JOIN simulados s ON s.id = sb.simulado_id
     WHERE s.user_id = :userId
       AND qe.status = 'errada'
       AND qe.revisada = 1`,
    { replacements: { userId }, type: QueryTypes.SELECT }
  );

  // Metas concluídas
  const [metaAgg] = await sequelize.query(
    `SELECT COUNT(*) AS total FROM study_goals
     WHERE user_id = :userId AND status = 'concluida'`,
    { replacements: { userId }, type: QueryTypes.SELECT }
  );

  return {
    questoesFeitas: Number(entryAgg.questoes || 0),
    questoesAcertadas: Number(entryAgg.acertos || 0),
    horasTotais: Number(entryAgg.horas || 0),
    diasEstudados: Number(entryAgg.dias || 0),
    diasSet: dias,
    simuladosFinalizados: Number(simAgg.total || 0),
    revisoesFeitas: Number(revAgg.total || 0),
    metasConcluidas: Number(metaAgg.total || 0),
  };
}

// ------------------------------------------------------------
// 2. STREAK (atual + recorde + ciclos)
// ------------------------------------------------------------
// Streak atual = quantos dias consecutivos terminando hoje (ou ontem)
// Recorde = maior sequência já registrada
function calcularStreaks(diasISO) {
  if (!diasISO || diasISO.length === 0) {
    return { streakAtual: 0, recorde: 0 };
  }
  const ordenado = [...new Set(diasISO)].sort();
  let recorde = 1, atual = 1;
  for (let i = 1; i < ordenado.length; i++) {
    const d = diffDias(ordenado[i - 1], ordenado[i]);
    if (d === 1) {
      atual += 1;
      if (atual > recorde) recorde = atual;
    } else if (d > 1) {
      atual = 1;
    }
  }

  // streakAtual de verdade = sequência terminando hoje ou ontem
  const hojeISO = toISO(new Date());
  const ontemISO = toISO(new Date(Date.now() - 86400000));
  let streakAtualReal = 0;
  if (ordenado.includes(hojeISO) || ordenado.includes(ontemISO)) {
    // conta de trás pra frente a partir do último dia
    const ultimo = ordenado[ordenado.length - 1];
    streakAtualReal = 1;
    for (let i = ordenado.length - 2; i >= 0; i--) {
      if (diffDias(ordenado[i], ordenado[i + 1]) === 1) streakAtualReal++;
      else break;
    }
  }
  return { streakAtual: streakAtualReal, recorde };
}

// ------------------------------------------------------------
// 3. STREAK CREDITS (Opção Z — XP de streak por ciclo)
// ------------------------------------------------------------
// Regras:
// - Detecta quantos "ciclos" o usuário já teve (quebras + 1)
// - Em cada ciclo, credita os marcos de streak atingidos NAQUELE ciclo
// - Creditado uma única vez por (user, marco, ciclo)
//
// Vamos simplificar: o "ciclo atual" é o número de quebras + 1.
// Percorremos o histórico e, a cada quebra, incrementamos o ciclo.
// Em cada ciclo, olhamos até onde o streak chegou e creditamos os marcos.
async function sincronizarStreakCredits(userId, diasISO) {
  lazyModels();
  if (!StreakCredit) return { xpStreakTotal: 0 };

  const ordenado = [...new Set(diasISO || [])].sort();
  if (ordenado.length === 0) return { xpStreakTotal: 0 };

  // Reconstrói os "ciclos" e o streak máximo em cada um
  const ciclos = []; // [{ ciclo: 1, streakMax: N }, ...]
  let streak = 0;
  let cicloAtual = 1;
  let streakMax = 0;

  for (let i = 0; i < ordenado.length; i++) {
    if (i === 0) {
      streak = 1;
    } else {
      const d = diffDias(ordenado[i - 1], ordenado[i]);
      if (d === 1) streak += 1;
      else {
        // quebrou: fecha o ciclo anterior
        ciclos.push({ ciclo: cicloAtual, streakMax });
        cicloAtual += 1;
        streak = 1;
        streakMax = 0;
      }
    }
    if (streak > streakMax) streakMax = streak;
  }
  ciclos.push({ ciclo: cicloAtual, streakMax });

  // Busca o que já foi creditado
  const jaCreditados = await StreakCredit.findAll({
    where: { user_id: userId },
    attributes: ["marco", "ciclo"],
    raw: true,
  });
  const chave = (m, c) => `${m}:${c}`;
  const setCreditado = new Set(jaCreditados.map(r => chave(r.marco, r.ciclo)));

  // Pra cada ciclo, credita marcos atingidos ainda não creditados
  const novos = [];
  for (const c of ciclos) {
    const marcosAtingidos = G.marcosStreakAtingidos(c.streakMax);
    for (const dias of marcosAtingidos) {
      if (!setCreditado.has(chave(dias, c.ciclo))) {
        novos.push({
          user_id: userId,
          marco: dias,
          ciclo: c.ciclo,
          creditado_em: new Date(),
        });
        setCreditado.add(chave(dias, c.ciclo));
      }
    }
  }
  if (novos.length > 0) {
    await StreakCredit.bulkCreate(novos, { ignoreDuplicates: true });
  }

  // XP total de streak = soma dos marcos já creditados (com seus valores atuais)
  const todos = await StreakCredit.findAll({
    where: { user_id: userId },
    attributes: ["marco"],
    raw: true,
  });
  const xpStreakTotal = todos.reduce((s, r) => s + G.xpDeStreakMarco(r.marco), 0);

  return { xpStreakTotal };
}

// ------------------------------------------------------------
// 4. RESGATES (reward_unlocks)
// ------------------------------------------------------------
async function carregarResgates(userId) {
  lazyModels();
  if (!RewardUnlock) return [];
  return RewardUnlock.findAll({
    where: { user_id: userId },
    attributes: ["trilha_key", "marco_id", "resgatado_em"],
    raw: true,
  });
}

// Dado o valor atual da trilha + marcos atingidos + resgates,
// devolve a lista de marcos já enriquecida com estado
function montarEstadoDaTrilha(trilhaKey, valorAtual, resgatesSet) {
  const t = G.trilhaPorKey(trilhaKey);
  if (!t) return { trilha: null, marcos: [], xpBonusAtivo: 0, xpBonusTotalResgatado: 0 };

  let xpBonusAtivo = 0;
  let xpBonusTotalResgatado = 0;

  const marcos = t.marcos.map(m => {
    const atingido = valorAtual >= m.valor;
    const resgatado = resgatesSet.has(`${trilhaKey}:${m.id}`);
    const ativo = atingido && resgatado; // XP só conta se marco ainda atingido
    if (ativo) xpBonusAtivo += m.xpBonus;
    if (resgatado) xpBonusTotalResgatado += m.xpBonus;
    return {
      ...m,
      atingido,
      resgatado,
      ativo,
      podeResgatar: atingido && !resgatado,
    };
  });

  return {
    trilha: {
      key: t.key,
      nome: t.nome,
      icone: t.icone,
      teto: t.teto,
      valorAtual,
    },
    marcos,
    xpBonusAtivo,
    xpBonusTotalResgatado,
  };
}

// ------------------------------------------------------------
// 5. RETRATO COMPLETO (o que a tela vai usar)
// ------------------------------------------------------------
async function retratoGamificacao(userId) {
  const base = await agregarBase(userId);
  const streaks = calcularStreaks(base.diasSet);
  const { xpStreakTotal } = await sincronizarStreakCredits(userId, base.diasSet);
  const resgates = await carregarResgates(userId);
  const resgatesSet = new Set(resgates.map(r => `${r.trilha_key}:${r.marco_id}`));

  // Valores atuais de cada trilha
  const valores = {
    questoes_feitas: base.questoesFeitas,
    questoes_acertadas: base.questoesAcertadas,
    dias_estudados: base.diasEstudados,
    horas_estudadas: base.horasTotais,
    simulados_completos: base.simuladosFinalizados,
    metas: base.metasConcluidas,
  };

  // XP por fonte
  const xpQuestoes = base.questoesFeitas + base.questoesAcertadas;
  const xpDiasCadastrados = base.diasEstudados * G.xpDeDiaCadastrado();
  // horas: soma progressiva POR DIA (não pelo total — a tabela é diária)
  const xpHoras = await calcularXpHorasPorDia(userId);
  const xpSimulados = base.simuladosFinalizados * G.xpDeSimuladoFinalizado();
  const xpRevisoes = base.revisoesFeitas * G.xpDeRevisao();
  const xpMetas = base.metasConcluidas * G.xpDeMetaConcluida();

  // Trilhas (estado completo)
  const trilhas = {};
  let xpBonusAtivo = 0;
  for (const key of Object.keys(valores)) {
    const estado = montarEstadoDaTrilha(key, valores[key], resgatesSet);
    trilhas[key] = estado;
    xpBonusAtivo += estado.xpBonusAtivo;
  }

  // XP total (tudo)
  const xpTotal =
    xpQuestoes +
    xpDiasCadastrados +
    xpHoras +
    xpSimulados +
    xpRevisoes +
    xpMetas +
    xpStreakTotal +
    xpBonusAtivo;

  const progresso = G.progressoNoNivel(xpTotal);
  const patente = G.patenteDeNivel(progresso.nivel);

  return {
    xpTotal,
    xpDetalhado: {
      questoes: xpQuestoes,
      diasCadastrados: xpDiasCadastrados,
      horas: xpHoras,
      simulados: xpSimulados,
      revisoes: xpRevisoes,
      metas: xpMetas,
      streak: xpStreakTotal,
      bonusTrilha: xpBonusAtivo,
    },
    nivel: progresso.nivel,
    progresso,
    patente,
    streak: streaks,
    base,
    trilhas,
  };
}

// XP de horas: soma por DIA (cada dia usa a tabela progressiva separadamente)
async function calcularXpHorasPorDia(userId) {
  const linhas = await sequelize.query(
    `SELECT data, SUM(horas) AS horas
     FROM study_entries
     WHERE user_id = :userId
     GROUP BY data`,
    { replacements: { userId }, type: QueryTypes.SELECT }
  );
  return linhas.reduce((s, r) => s + G.xpDeHoras(Number(r.horas || 0)), 0);
}

// ------------------------------------------------------------
// 6. AÇÕES (resgatar / estornar)
// ------------------------------------------------------------
async function resgatarMarco(userId, trilhaKey, marcoId) {
  lazyModels();
  if (!RewardUnlock) throw new Error("RewardUnlock ainda não existe no banco. Rode o SQL primeiro.");
  const t = G.trilhaPorKey(trilhaKey);
  if (!t) throw new Error("Trilha inválida.");
  const marco = t.marcos.find(m => m.id === marcoId);
  if (!marco) throw new Error("Marco inválido.");

  const retrato = await retratoGamificacao(userId);
  const valorAtual = retrato.trilhas[trilhaKey].trilha.valorAtual;
  if (valorAtual < marco.valor) throw new Error("Marco ainda não atingido.");

  const existe = await RewardUnlock.findOne({
    where: { user_id: userId, trilha_key: trilhaKey, marco_id: marcoId },
  });
  if (existe) return { ok: true, jaResgatado: true };

  await RewardUnlock.create({
    user_id: userId,
    trilha_key: trilhaKey,
    marco_id: marcoId,
    resgatado_em: new Date(),
  });
  return { ok: true, jaResgatado: false };
}

async function estornarMarco(userId, trilhaKey, marcoId) {
  lazyModels();
  if (!RewardUnlock) return { ok: true };
  await RewardUnlock.destroy({
    where: { user_id: userId, trilha_key: trilhaKey, marco_id: marcoId },
  });
  return { ok: true };
}

module.exports = {
  agregarBase,
  calcularStreaks,
  sincronizarStreakCredits,
  retratoGamificacao,
  resgatarMarco,
  estornarMarco,
  montarEstadoDaTrilha,
  calcularXpHorasPorDia,
  // helpers de data (úteis em outros lugares)
  toISO,
  parseISO,
  diffDias,
};