// ============================================================
// src/lib/gamification.js
// Cérebro da Gamificação — "Trilha da Aprovação"
// Só funções puras + constantes. Não conversa com banco.
// ============================================================

// ------------------------------------------------------------
// 1. PATENTES (10 patentes, 1 a cada 10 níveis)
// ------------------------------------------------------------
const PATENTES = [
  { key: "ferro",     nome: "Ferro",     min: 1,   max: 10,  cor: "#8a8f98" },
  { key: "bronze",    nome: "Bronze",    min: 11,  max: 20,  cor: "#b87333" },
  { key: "prata",     nome: "Prata",     min: 21,  max: 30,  cor: "#c0c4cc" },
  { key: "ouro",      nome: "Ouro",      min: 31,  max: 40,  cor: "#e0b341" },
  { key: "platina",   nome: "Platina",   min: 41,  max: 50,  cor: "#7fd4c1" },
  { key: "esmeralda", nome: "Esmeralda", min: 51,  max: 60,  cor: "#2ecc71" },
  { key: "uranio",    nome: "Urânio",    min: 61,  max: 70,  cor: "#a6ff4d" },
  { key: "diamante",  nome: "Diamante",  min: 71,  max: 80,  cor: "#66d9ff" },
  { key: "brutal",    nome: "Brutal",    min: 81,  max: 90,  cor: "#ff5c5c" },
  { key: "celestial", nome: "Celestial", min: 91,  max: 100, cor: "#c084fc" }
];

function patenteDeNivel(nivel) {
  const n = Math.max(1, Math.min(100, Math.floor(nivel || 1)));
  return PATENTES.find(p => n >= p.min && n <= p.max) || PATENTES[0];
}

// ------------------------------------------------------------
// 2. CURVA DE NÍVEL (1 a 100)
// xpParaNivel(n) = XP ACUMULADO necessário para ALCANÇAR o nível n
// (nível 1 = 0 XP por definição)
// ------------------------------------------------------------
function xpParaNivel(n) {
  if (n <= 1) return 0;
  if (n > 100) n = 100;
  return Math.round(60 * Math.pow(n, 1.55));
}

// Dado um xpTotal, devolve em que nível o usuário está (1..100)
function nivelDeXp(xpTotal) {
  const xp = Math.max(0, Math.floor(xpTotal || 0));
  if (xp <= 0) return 1;
  // busca binária simples entre 1 e 100
  let lo = 1, hi = 100, melhor = 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (xp >= xpParaNivel(mid)) { melhor = mid; lo = mid + 1; }
    else { hi = mid - 1; }
  }
  return melhor;
}

// Progresso dentro do nível atual
function progressoNoNivel(xpTotal) {
  const xp = Math.max(0, Math.floor(xpTotal || 0));
  const nivel = nivelDeXp(xp);
  if (nivel >= 100) {
    return { nivel: 100, xpNoNivel: xp, xpNecessario: xp, xpParaProximo: 0, faltam: 0, pct: 100 };
  }
  const xpBase = xpParaNivel(nivel);
  const xpProx = xpParaNivel(nivel + 1);
  const xpNoNivel = xp - xpBase;
  const xpNecessario = xpProx - xpBase;
  const faltam = Math.max(0, xpProx - xp);
  const pct = Math.min(100, Math.round((xpNoNivel / xpNecessario) * 100));
  return { nivel, xpNoNivel, xpNecessario, xpParaProximo: xpProx, faltam, pct };
}

// ------------------------------------------------------------
// 3. FONTES DE XP
// ------------------------------------------------------------

// StudyEntry: 1 XP por questão + 1 XP por acerto
// (10 questões / 10 acertos = 20 XP; 10 questões / 0 acertos = 10 XP)
function xpDeEntry(entry) {
  if (!entry) return 0;
  const q = Math.max(0, parseInt(entry.questoes || 0, 10));
  const a = Math.max(0, parseInt(entry.acertos || 0, 10));
  return q + Math.min(a, q); // acertos nunca passam de questões
}

// +10 XP fixo por DIA com pelo menos 1 StudyEntry (não por entry)
function xpDeDiaCadastrado() {
  return 10;
}

// Horas: tabela progressiva 1h..12h (floor, teto 12h)
const TABELA_HORAS = [5, 15, 30, 50, 75, 105, 140, 180, 225, 275, 330, 400];
function xpDeHoras(horasDecimais) {
  const h = Math.floor(Number(horasDecimais) || 0);
  if (h <= 0) return 0;
  if (h >= 12) return TABELA_HORAS[11];
  return TABELA_HORAS[h - 1];
}

// Streak: valor por marco (uma vez por ciclo)
const MARCOS_STREAK = [
  { dias: 1,   xp: 10 },
  { dias: 3,   xp: 30 },
  { dias: 7,   xp: 70 },
  { dias: 15,  xp: 150 },
  { dias: 30,  xp: 300 },
  { dias: 60,  xp: 600 },
  { dias: 100, xp: 1000 },
  { dias: 150, xp: 1500 },
  { dias: 200, xp: 2000 },
  { dias: 250, xp: 2500 },
  { dias: 300, xp: 3000 }
];
function xpDeStreakMarco(dias) {
  const m = MARCOS_STREAK.find(x => x.dias === dias);
  return m ? m.xp : 0;
}
// Dado um streak (dias atuais), quais marcos ele JÁ atingiu?
function marcosStreakAtingidos(streakDias) {
  const s = Math.max(0, Math.floor(streakDias || 0));
  return MARCOS_STREAK.filter(m => s >= m.dias).map(m => m.dias);
}

// Simulado finalizado: 150 XP (uma vez por simulado com status='finalizado')
const XP_SIMULADO_FINALIZADO = 150;
function xpDeSimuladoFinalizado() {
  return XP_SIMULADO_FINALIZADO;
}

// Revisão de questão errada: 5 XP (só status='errada' AND revisada=true)
const XP_REVISAO = 5;
function xpDeRevisao() {
  return XP_REVISAO;
}

// Meta concluída: 200 XP (uma vez por meta com status='concluida')
const XP_META_CONCLUIDA = 200;
function xpDeMetaConcluida() {
  return XP_META_CONCLUIDA;
}

// ------------------------------------------------------------
// 4. TRILHAS (6 trilhas com 10 brasões + mini-marcos)
// Cada trilha: { key, nome, teto, marcos: [...] }
// Marco: { id, valor, tipo: 'brasao'|'mini', xpBonus, nivelBrasao? }
// ------------------------------------------------------------

// Gera mini-marcos uniformes entre os brasões (inclusive antes do 1º e depois do 10º)
// brasoes: array de valores onde ficam os 10 brasões
// qtdMiniEntre: quantos mini-marcos entre um brasão e outro
function gerarMarcos(trilhaKey, teto, brasoes, qtdMiniPorIntervalo) {
  const marcos = [];
  const passoMini = (a, b) => (b - a) / (qtdMiniPorIntervalo + 1);

  // mini-marcos ANTES do primeiro brasão (distribuídos de teto*0.02 até brasoes[0])
  const primeiroIni = Math.max(1, Math.round(teto * 0.01));
  const passoAntes = (brasoes[0] - primeiroIni) / (qtdMiniPorIntervalo + 1);
  for (let i = 1; i <= qtdMiniPorIntervalo; i++) {
    const v = Math.round(primeiroIni + passoAntes * (i - 1));
    if (v > 0 && v < brasoes[0]) {
      marcos.push({
        id: `${trilhaKey}_m_pre${i}`,
        valor: v,
        tipo: "mini",
        xpBonus: xpMiniCrescente(i, qtdMiniPorIntervalo, 1)
      });
    }
  }

  // brasões + mini-marcos entre eles
  for (let b = 0; b < brasoes.length; b++) {
    const nivelBrasao = b + 1;
    marcos.push({
      id: `${trilhaKey}_b${String(nivelBrasao).padStart(2, "0")}`,
      valor: brasoes[b],
      tipo: "brasao",
      nivelBrasao,
      xpBonus: xpBrasaoCrescente(nivelBrasao)
    });

    // mini-marcos entre este brasão e o próximo
    if (b < brasoes.length - 1) {
      const a = brasoes[b];
      const z = brasoes[b + 1];
      const passo = passoMini(a, z);
      for (let i = 1; i <= qtdMiniPorIntervalo; i++) {
        const v = Math.round(a + passo * i);
        if (v > a && v < z) {
          marcos.push({
            id: `${trilhaKey}_m${String(b + 1).padStart(2, "0")}_${i}`,
            valor: v,
            tipo: "mini",
            xpBonus: xpMiniCrescente(i, qtdMiniPorIntervalo, b + 1)
          });
        }
      }
    }
  }

  // mini-marcos DEPOIS do último brasão (se o teto for maior que o último brasão)
  const ultimoBrasao = brasoes[brasoes.length - 1];
  if (teto > ultimoBrasao) {
    const passoDepois = (teto - ultimoBrasao) / (qtdMiniPorIntervalo + 1);
    for (let i = 1; i <= qtdMiniPorIntervalo; i++) {
      const v = Math.round(ultimoBrasao + passoDepois * i);
      if (v > ultimoBrasao && v <= teto) {
        marcos.push({
          id: `${trilhaKey}_m_pos${i}`,
          valor: v,
          tipo: "mini",
          xpBonus: xpMiniCrescente(i, qtdMiniPorIntervalo, brasoes.length)
        });
      }
    }
  }

  marcos.sort((x, y) => x.valor - y.valor);
  return marcos;
}

// XP de mini-marco: cresce ao longo da trilha (10 → 80)
function xpMiniCrescente(iNoIntervalo, totalNoIntervalo, indiceIntervalo) {
  const base = 10 + (indiceIntervalo - 1) * 5;
  const fracao = totalNoIntervalo > 1 ? (iNoIntervalo - 1) / (totalNoIntervalo - 1) : 0;
  return Math.round(base + fracao * 20);
}

// XP de brasão: cresce 150 → 500 conforme o nível do brasão (1..10)
function xpBrasaoCrescente(nivelBrasao) {
  const n = Math.max(1, Math.min(10, nivelBrasao));
  return Math.round(150 + ((n - 1) / 9) * 350);
}

// --- Definição das 6 trilhas ---
// Teto define o último valor. Os 10 brasões ficam espaçados uniformemente até o teto.

const TRILHAS = [
  {
    key: "questoes_feitas",
    nome: "Questões Feitas",
    icone: "📝",
    teto: 25000,
    marcos: gerarMarcos(
      "questoes_feitas", 25000,
      [2500, 5000, 7500, 10000, 12500, 15000, 17500, 20000, 22500, 25000],
      5
    )
  },
  {
    key: "questoes_acertadas",
    nome: "Questões Acertadas",
    icone: "✅",
    teto: 20000,
    marcos: gerarMarcos(
      "questoes_acertadas", 20000,
      [2000, 4000, 6000, 8000, 10000, 12000, 14000, 16000, 18000, 20000],
      4
    )
  },
  {
    key: "dias_estudados",
    nome: "Dias Estudados",
    icone: "📅",
    teto: 300,
    marcos: gerarMarcos(
      "dias_estudados", 300,
      [30, 60, 90, 120, 150, 180, 210, 240, 270, 300],
      3
    )
  },
  {
    key: "horas_estudadas",
    nome: "Horas Estudadas",
    icone: "⏱️",
    teto: 2500,
    marcos: gerarMarcos(
      "horas_estudadas", 2500,
      [250, 500, 750, 1000, 1250, 1500, 1750, 2000, 2250, 2500],
      4
    )
  },
  {
    key: "simulados_completos",
    nome: "Simulados Completos",
    icone: "🧪",
    teto: 50,
    marcos: gerarMarcos(
      "simulados_completos", 50,
      [5, 10, 15, 20, 25, 30, 35, 40, 45, 50],
      1
    )
  },
  {
    key: "metas",
    nome: "Metas",
    icone: "🎯",
    teto: 40,
    marcos: gerarMarcos(
      "metas", 40,
      [4, 8, 12, 16, 20, 24, 28, 32, 36, 40],
      1
    )
  }
];

function trilhaPorKey(key) {
  return TRILHAS.find(t => t.key === key) || null;
}

// Dado o valor atual do usuário em uma trilha, quais marcos já atingiu?
function marcosAtingidosNaTrilha(trilhaKey, valorAtual) {
  const t = trilhaPorKey(trilhaKey);
  if (!t) return [];
  const v = Math.max(0, Number(valorAtual) || 0);
  return t.marcos.filter(m => v >= m.valor);
}

// Próximo marco ainda não atingido (útil pro header da trilha)
function proximoMarcoDaTrilha(trilhaKey, valorAtual) {
  const t = trilhaPorKey(trilhaKey);
  if (!t) return null;
  const v = Math.max(0, Number(valorAtual) || 0);
  return t.marcos.find(m => v < m.valor) || null;
}

// ------------------------------------------------------------
// 5. ESCUDOS SVG (Desenho artesanal)
// ------------------------------------------------------------

const CORES_ESCUDO = {
  ferro:     { a: "#9aa0a6", b: "#5f6368", detalhe: "#e0e0e0", brilho: "rgba(255,255,255,0.2)" },
  bronze:    { a: "#cd7f32", b: "#8b5a1f", detalhe: "#f5c792", brilho: "rgba(255, 220, 180, 0.3)" },
  prata:     { a: "#d7dbe0", b: "#9aa0a6", detalhe: "#ffffff", brilho: "rgba(255,255,255,0.5)" },
  ouro:      { a: "#f1c40f", b: "#b8860b", detalhe: "#fff3b0", brilho: "rgba(255, 255, 150, 0.4)" },
  platina:   { a: "#b8f3e6", b: "#5bb3a0", detalhe: "#ffffff", brilho: "rgba(200, 255, 250, 0.5)" },
  esmeralda: { a: "#2ecc71", b: "#1a8f4c", detalhe: "#d1ffe0", brilho: "rgba(150, 255, 200, 0.4)" },
  uranio:    { a: "#a6ff4d", b: "#4f9e1a", detalhe: "#e8ffcc", brilho: "rgba(200, 255, 150, 0.5)" },
  diamante:  { a: "#8ce1ff", b: "#2a8fc4", detalhe: "#ffffff", brilho: "rgba(200, 240, 255, 0.6)" },
  brutal:    { a: "#ff5c5c", b: "#a11d1d", detalhe: "#ffd0d0", brilho: "rgba(255, 150, 150, 0.4)" },
  celestial: { a: "#c084fc", b: "#6b21a8", detalhe: "#f3e0ff", brilho: "rgba(220, 180, 255, 0.6)" }
};

function escudoSVG(patenteKey, size = 40) {
  const c = CORES_ESCUDO[patenteKey] || CORES_ESCUDO.ferro;
  const s = Number(size) || 40;
  const id = `g_${patenteKey}_${Math.random().toString(36).slice(2, 8)}`;
  
  // Base path para todos os escudos (um escudo clássico)
  const basePath = "M20 2 L36 8 V20 C36 30 28 37 20 40 C12 37 4 30 4 20 V8 Z";
  
  // Elementos extras para diferenciar os formatos (as ordens são de baixo pra cima, então a ordem aqui é da base pro topo)
  // Os números romanos (I a X) serão usados nas trilhas, mas as patentes vão ter formas únicas.
  
  let extras = "";

  switch (patenteKey) {
    case "ferro":
      // Básico: só uma linha cruzando
      extras = `<path d="M8 16 H32 M20 8 V32" stroke="${c.detalhe}" stroke-width="1.5" opacity="0.6"/>`;
      break;
    case "bronze":
      // Chevron + uma estrela
      extras = `
        <path d="M10 20 L20 26 L30 20" fill="none" stroke="${c.detalhe}" stroke-width="2" opacity="0.8"/>
        <circle cx="20" cy="14" r="2.5" fill="${c.detalhe}"/>
      `;
      break;
    case "prata":
      // Duas estrelas + linha dupla
      extras = `
        <path d="M8 14 H32 M8 18 H32" stroke="${c.detalhe}" stroke-width="1.5" opacity="0.7"/>
        <circle cx="15" cy="26" r="2" fill="${c.detalhe}"/>
        <circle cx="25" cy="26" r="2" fill="${c.detalhe}"/>
      `;
      break;
    case "ouro":
      // Coroa em cima + detalhes centrais
      extras = `
        <path d="M12 8 L15 12 L20 7 L25 12 L28 8" fill="none" stroke="${c.detalhe}" stroke-width="1.5"/>
        <path d="M10 18 H30 M15 23 H25" stroke="${c.detalhe}" stroke-width="2" opacity="0.8"/>
        <circle cx="20" cy="18" r="2" fill="${c.detalhe}"/>
      `;
      break;
    case "platina":
      // Asas laterais + estrela central
      extras = `
        <path d="M4 14 Q0 20 4 26" fill="none" stroke="${c.detalhe}" stroke-width="2"/>
        <path d="M36 14 Q40 20 36 26" fill="none" stroke="${c.detalhe}" stroke-width="2"/>
        <path d="M20 12 L24 20 L20 28 L16 20 Z" fill="${c.detalhe}" opacity="0.9"/>
      `;
      break;
    case "esmeralda":
      // Folha/diamante grande no centro + linhas
      extras = `
        <path d="M20 6 L28 16 L20 34 L12 16 Z" fill="none" stroke="${c.detalhe}" stroke-width="2"/>
        <path d="M12 16 H28" stroke="${c.detalhe}" stroke-width="1.5"/>
        <circle cx="20" cy="16" r="2" fill="${c.detalhe}"/>
      `;
      break;
    case "uranio":
      // Raios saindo do centro
      extras = `
        <path d="M20 15 L14 10 M20 15 L26 10 M20 15 L20 6 M20 15 L12 18 M20 15 L28 18" stroke="${c.detalhe}" stroke-width="2" stroke-linecap="round"/>
        <circle cx="20" cy="15" r="3" fill="${c.detalhe}"/>
        <path d="M10 28 L14 24 M30 28 L26 24" stroke="${c.detalhe}" stroke-width="1.5"/>
      `;
      break;
    case "diamante":
      // Coroa superior e base lapidada
      extras = `
        <path d="M14 6 L17 10 L20 6 L23 10 L26 6" fill="none" stroke="${c.detalhe}" stroke-width="2"/>
        <path d="M10 24 L20 34 L30 24" fill="none" stroke="${c.detalhe}" stroke-width="2"/>
        <path d="M10 24 L20 18 L30 24" fill="none" stroke="${c.detalhe}" stroke-width="1" opacity="0.6"/>
        <circle cx="20" cy="24" r="1.5" fill="${c.detalhe}"/>
      `;
      break;
    case "brutal":
      // Chamas + caveira estilizada
      extras = `
        <path d="M8 28 Q4 22 10 18" fill="none" stroke="${c.detalhe}" stroke-width="2"/>
        <path d="M32 28 Q36 22 30 18" fill="none" stroke="${c.detalhe}" stroke-width="2"/>
        <path d="M14 14 L20 8 L26 14" fill="none" stroke="${c.detalhe}" stroke-width="2"/>
        <circle cx="16" cy="20" r="2" fill="${c.detalhe}"/>
        <circle cx="24" cy="20" r="2" fill="${c.detalhe}"/>
        <path d="M16 26 L20 30 L24 26" fill="none" stroke="${c.detalhe}" stroke-width="2"/>
      `;
      break;
    case "celestial":
      // Estrela, anéis orbitais e brilho central
      extras = `
        <circle cx="20" cy="20" r="14" fill="none" stroke="${c.detalhe}" stroke-width="1" stroke-dasharray="2 3" opacity="0.6"/>
        <circle cx="20" cy="20" r="10" fill="none" stroke="${c.detalhe}" stroke-width="1.5" opacity="0.8"/>
        <path d="M20 4 L22 14 L32 20 L22 26 L20 36 L18 26 L8 20 L18 14 Z" fill="${c.detalhe}" opacity="0.9"/>
        <circle cx="20" cy="20" r="3" fill="#fff"/>
      `;
      break;
  }

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 42" width="${s}" height="${s}" role="img" aria-label="Escudo ${patenteKey}">
  <defs>
    <linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${c.a}"/>
      <stop offset="100%" stop-color="${c.b}"/>
    </linearGradient>
  </defs>
  <path d="${basePath}" fill="url(#${id})" stroke="${c.detalhe}" stroke-width="1.2"/>
  ${extras}
</svg>`.trim();
}

// ------------------------------------------------------------
// 6. ESCUDOS DAS TRILHAS (Formatos por família + Evolução I a X)
// ------------------------------------------------------------
// trilhaKey: 'questoes_feitas', 'questoes_acertadas', 'dias_estudados', 'horas_estudadas', 'simulados_completos', 'metas'
// estagio: 1 a 10
// ------------------------------------------------------------

const CORES_TRILHA_ESCUDO = {
  questoes:  { a: "#6366f1", b: "#3730a3", d: "#e0e7ff" },
  acertos:   { a: "#34d399", b: "#065f46", d: "#d1fae5" },
  dias:      { a: "#fbbf24", b: "#b45309", d: "#fef3c7" },
  horas:     { a: "#60a5fa", b: "#1e3a8a", d: "#dbeafe" },
  simulados: { a: "#f472b6", b: "#831843", d: "#fce7f3" },
  metas:     { a: "#a78bfa", b: "#4c1d95", d: "#ede9fe" }
};

function escudoTrilhaSVG(trilhaKey, estagio = 1, size = 52) {
  const s = Number(size) || 52;
  const n = Math.max(1, Math.min(10, Number(estagio) || 1));
  const id = `gt_${trilhaKey}_${n}_${Math.random().toString(36).slice(2, 6)}`;
  
  const cores = CORES_TRILHA_ESCUDO[
    trilhaKey === "questoes_feitas" ? "questoes" :
    trilhaKey === "questoes_acertadas" ? "acertos" :
    trilhaKey === "dias_estudados" ? "dias" :
    trilhaKey === "horas_estudadas" ? "horas" :
    trilhaKey === "simulados_completos" ? "simulados" : "metas"
  ] || CORES_TRILHA_ESCUDO.questoes;

  const basePath = "M20 2 L36 8 V20 C36 30 28 37 20 40 C12 37 4 30 4 20 V8 Z";
  
  let miolo = "";
  let ornamentos = "";

  // --- 1. QUESTÕES: Pergaminho -> Tomo ---
  if (trilhaKey === "questoes_feitas") {
    let linhas = "";
    for (let i = 0; i < Math.min(n, 5); i++) {
       linhas += `<line x1="12" y1="${12 + i*4}" x2="${28 - (n % 2 === 0 ? 4 : 0)}" y2="${12 + i*4}" stroke="${cores.d}" stroke-width="1.5" opacity="0.8"/>`;
    }
    miolo = `<rect x="10" y="8" width="20" height="26" rx="2" fill="${cores.a}" opacity="0.2"/>${linhas}`;
    if (n >= 4) ornamentos += `<path d="M8 16 H32 M8 24 H32" stroke="${cores.d}" stroke-width="2" opacity="0.6"/>`;
    if (n >= 7) ornamentos += `<path d="M6 10 L10 14 M34 10 L30 14" stroke="${cores.d}" stroke-width="1.5"/>`;
    if (n === 10) ornamentos += `<circle cx="20" cy="20" r="14" fill="none" stroke="${cores.d}" stroke-width="1" stroke-dasharray="1 4"/>`;
  }
  // --- 2. ACERTOS: Troféu -> Coroa ---
  else if (trilhaKey === "questoes_acertadas") {
    miolo = `
      <path d="M14 14 H26 L24 28 H16 Z" fill="${cores.a}" opacity="0.5"/>
      <path d="M14 14 C10 14 12 20 16 20" fill="none" stroke="${cores.d}" stroke-width="1.5"/>
      <path d="M26 14 C30 14 28 20 24 20" fill="none" stroke="${cores.d}" stroke-width="1.5"/>
    `;
    if (n >= 3) ornamentos += `<circle cx="20" cy="20" r="3" fill="${cores.d}"/>`;
    if (n >= 5) ornamentos += `<path d="M12 8 L16 12 M28 8 L24 12" stroke="${cores.d}" stroke-width="1.5"/>`;
    if (n >= 8) ornamentos += `<path d="M8 30 L12 26 M32 30 L28 26" stroke="${cores.d}" stroke-width="1.5"/>`;
    if (n === 10) ornamentos += `<circle cx="20" cy="20" r="15" fill="none" stroke="${cores.d}" stroke-width="1.5" opacity="0.7"/>`;
  }
  // --- 3. DIAS: Calendário -> Sol ---
  else if (trilhaKey === "dias_estudados") {
    miolo = `<circle cx="20" cy="20" r="${4 + n * 0.8}" fill="${cores.a}" opacity="0.5"/>`;
    if (n >= 2) ornamentos += `<path d="M20 10 V12 M20 28 V30 M10 20 H12 M28 20 H30" stroke="${cores.d}" stroke-width="1.5"/>`;
    if (n >= 5) ornamentos += `<path d="M13 13 L15 15 M27 13 L25 15 M13 27 L15 25 M27 27 L25 25" stroke="${cores.d}" stroke-width="1.5"/>`;
    if (n >= 8) ornamentos += `<circle cx="20" cy="20" r="14" fill="none" stroke="${cores.d}" stroke-width="1" stroke-dasharray="2 3"/>`;
    if (n === 10) ornamentos += `<path d="M20 4 L22 10 L28 8 L24 14 L30 18 L24 20 L28 26 L22 26 L20 32 L18 26 L12 26 L16 20 L10 18 L16 14 L12 8 L18 10 Z" fill="${cores.a}" opacity="0.4"/>`;
  }
  // --- 4. HORAS: Ampulheta -> Relógio Cósmico ---
  else if (trilhaKey === "horas_estudadas") {
    miolo = `
      <path d="M14 10 H26 L20 20 Z" fill="${cores.d}" opacity="0.6"/>
      <path d="M14 30 H26 L20 20 Z" fill="${cores.d}" opacity="0.6"/>
    `;
    if (n >= 4) ornamentos += `<circle cx="20" cy="20" r="1.5" fill="${cores.d}"/><path d="M20 20 L24 16 M20 20 L16 16" stroke="${cores.d}" stroke-width="1"/>`;
    if (n >= 7) ornamentos += `<path d="M8 10 H12 M28 10 H32 M8 30 H12 M28 30 H32" stroke="${cores.d}" stroke-width="1.5"/>`;
    if (n === 10) ornamentos += `<circle cx="20" cy="20" r="14" fill="none" stroke="${cores.d}" stroke-width="1.5"/><circle cx="20" cy="20" r="12" fill="none" stroke="${cores.d}" stroke-width="0.5" opacity="0.5"/>`;
  }
  // --- 5. SIMULADOS: Frasco -> Orbe ---
  else if (trilhaKey === "simulados_completos") {
    miolo = `<path d="M16 12 V24 C16 28 24 28 24 24 V12 Z" fill="${cores.a}" opacity="0.5"/>`;
    if (n >= 3) ornamentos += `<path d="M16 12 H24 M14 24 H26" stroke="${cores.d}" stroke-width="1.5"/>`;
    if (n >= 6) ornamentos += `<circle cx="20" cy="20" r="2" fill="${cores.d}"/><circle cx="20" cy="10" r="1" fill="${cores.d}"/>`;
    if (n >= 8) ornamentos += `<path d="M8 16 Q4 20 8 24 M32 16 Q36 20 32 24" fill="none" stroke="${cores.d}" stroke-width="1.5"/>`;
    if (n === 10) ornamentos += `<circle cx="20" cy="20" r="15" fill="none" stroke="${cores.d}" stroke-width="1" stroke-dasharray="2 4"/>`;
  }
  // --- 6. METAS: Alvo -> Mira Estelar ---
  else if (trilhaKey === "metas") {
    miolo = `<circle cx="20" cy="20" r="8" fill="none" stroke="${cores.d}" stroke-width="1.5"/><circle cx="20" cy="20" r="4" fill="none" stroke="${cores.d}" stroke-width="1.5"/><circle cx="20" cy="20" r="1.5" fill="${cores.d}"/>`;
    if (n >= 4) ornamentos += `<path d="M20 4 V8 M20 32 V36 M4 20 H8 M32 20 H36" stroke="${cores.d}" stroke-width="1.5"/>`;
    if (n >= 7) ornamentos += `<path d="M10 10 L14 14 M30 10 L26 14 M10 30 L14 26 M30 30 L26 26" stroke="${cores.d}" stroke-width="1.5"/>`;
    if (n === 10) ornamentos += `<path d="M20 6 L22 14 L30 10 L24 18 L34 20 L24 22 L30 30 L22 26 L20 34 L18 26 L10 30 L16 22 L6 20 L16 18 L10 10 L18 14 Z" fill="${cores.a}" opacity="0.3"/>`;
  }

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 42" width="${s}" height="${s}" role="img" aria-label="Escudo ${trilhaKey} Nível ${n}">
  <defs>
    <linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${cores.a}"/>
      <stop offset="100%" stop-color="${cores.b}"/>
    </linearGradient>
  </defs>
  <path d="${basePath}" fill="url(#${id})" stroke="${cores.d}" stroke-width="1.2"/>
  ${miolo}
  ${ornamentos}
</svg>`.trim();
}

// ------------------------------------------------------------
// EXPORTS
// ------------------------------------------------------------
module.exports = {
  // Patentes
  PATENTES,
  patenteDeNivel,
  // Curva
  xpParaNivel,
  nivelDeXp,
  progressoNoNivel,
  // Fontes de XP
  xpDeEntry,
  xpDeDiaCadastrado,
  xpDeHoras,
  xpDeStreakMarco,
  marcosStreakAtingidos,
  MARCOS_STREAK,
  xpDeSimuladoFinalizado,
  xpDeRevisao,
  xpDeMetaConcluida,
  // Trilhas
  TRILHAS,
  trilhaPorKey,
  marcosAtingidosNaTrilha,
  proximoMarcoDaTrilha,
  // Escudos
  escudoSVG,
  escudoTrilhaSVG,
};