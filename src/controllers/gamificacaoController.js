const sequelize = require("../config/database");
const { QueryTypes } = require("sequelize");

// =====================================================
// CONFIGURAÇÕES DE XP
// =====================================================

const XP_CONFIG = {
  POR_HORA: 100,
  POR_QUESTAO: 10,
  POR_QUESTAO_CORRETA: 15,
  POR_QUESTAO_ERRADA: 3,
  POR_REVISAO: 25,
  POR_SIMULADO: 50,
  POR_META: 100,
  multiplicadorXP: {
    'facil': 1,
    'medio': 1.5,
    'dificil': 2,
    'lendario': 3
  }
};

// =====================================================
// CÁLCULO DE NÍVEL
// =====================================================

function calcularNivel(xpTotal) {
  const niveis = [
    { nivel: 1, xpMin: 0 },
    { nivel: 2, xpMin: 500 },
    { nivel: 3, xpMin: 1200 },
    { nivel: 4, xpMin: 2500 },
    { nivel: 5, xpMin: 5000 },
    { nivel: 6, xpMin: 10000 },
    { nivel: 7, xpMin: 20000 },
    { nivel: 8, xpMin: 40000 },
    { nivel: 9, xpMin: 80000 },
    { nivel: 10, xpMin: 150000 }
  ];
  
  let xpNecessario = 150000;
  let nivel = 10;
  
  while (xpTotal >= xpNecessario) {
    nivel++;
    xpNecessario = Math.floor(xpNecessario * 1.5);
  }
  
  for (let i = niveis.length - 1; i >= 0; i--) {
    if (xpTotal >= niveis[i].xpMin) {
      return {
        nivel: Math.max(nivel, niveis[i].nivel),
        xpAtual: xpTotal - niveis[i].xpMin,
        xpProximoNivel: i < niveis.length - 1 ? niveis[i + 1].xpMin - niveis[i].xpMin : Math.floor(xpNecessario * 0.5),
        xpTotal: xpTotal
      };
    }
  }
  
  return { nivel: 1, xpAtual: xpTotal, xpProximoNivel: 500, xpTotal: xpTotal };
}

function getTitulo(nivel) {
  const titulos = {
    1: 'Iniciante', 2: 'Aprendiz', 3: 'Estudante', 4: 'Dedicado',
    5: 'Expert', 6: 'Mestre', 7: 'Veterano', 8: 'Lendário',
    9: 'Gênio', 10: 'Lenda'
  };
  if (nivel <= 10) return titulos[nivel] || 'Lenda';
  return 'Mítico';
}

// =====================================================
// OBTEM OU CRIA PROGRESSO
// =====================================================

async function getOrCreateProgress(userId) {
  const result = await sequelize.query(
    `SELECT * FROM user_progress WHERE user_id = ?`,
    { replacements: [userId], type: QueryTypes.SELECT }
  );
  
  if (result.length === 0) {
    await sequelize.query(
      `INSERT INTO user_progress (user_id, xp_total, nivel, xp_atual, xp_proximo_nivel, titulo, conquistas_desbloqueadas, streak_atual, streak_maior, created_at, updated_at) 
       VALUES (?, 0, 1, 0, 500, 'Iniciante', 0, 0, 0, NOW(), NOW())`,
      { replacements: [userId] }
    );
    return {
      user_id: userId, xp_total: 0, nivel: 1, xp_atual: 0,
      xp_proximo_nivel: 500, titulo: 'Iniciante', conquistas_desbloqueadas: 0, streak_atual: 0
    };
  }
  return result[0];
}

// =====================================================
// ADICIONAR XP
// =====================================================

async function adicionarXP(userId, quantidade, motivo, tipo) {
  try {
    // 1. Obter progresso atual
    const progress = await getOrCreateProgress(userId);
    
    // 2. Calcular novo XP total
    const novoXpTotal = (progress.xp_total || 0) + quantidade;
    
    // 3. Calcular novo nível
    const nivelInfo = calcularNivel(novoXpTotal);
    const novoNivel = nivelInfo.nivel;
    const novoTitulo = getTitulo(novoNivel);
    
    // 4. Atualizar progresso no banco
    await sequelize.query(
      `UPDATE user_progress 
       SET xp_total = ?, nivel = ?, xp_atual = ?, xp_proximo_nivel = ?, titulo = ?, updated_at = NOW()
       WHERE user_id = ?`,
      { replacements: [novoXpTotal, novoNivel, nivelInfo.xpAtual, nivelInfo.xpProximoNivel, novoTitulo, userId] }
    );
    
    // 5. Registrar no histórico de XP
    await sequelize.query(
      `INSERT INTO xp_history (user_id, xp_ganho, motivo, tipo, data_ganho) VALUES (?, ?, ?, ?, NOW())`,
      { replacements: [userId, quantidade, motivo, tipo] }
    );
    
    // 6. Verificar se subiu de nível
    const nivelSubiu = novoNivel > (progress.nivel || 1);
    
    console.log(`[XP] Usuário ${userId}: +${quantidade} XP (${motivo}). Total: ${novoXpTotal}, Nível: ${novoNivel}`);
    
    return {
      sucesso: true,
      xpAdicionado: quantidade,
      xpTotal: novoXpTotal,
      nivelAtual: novoNivel,
      nivelSubiu: nivelSubiu,
      titulo: novoTitulo
    };
    
  } catch (error) {
    console.error('[XP] Erro ao adicionar XP:', error);
    return { sucesso: false, erro: error.message };
  }
}

// =====================================================
// VERIFICAR E DESBLOQUEAR CONQUISTAS
// =====================================================

async function verificarEDesbloquearConquistas(userId) {
  try {
    const progress = await getOrCreateProgress(userId);
    const stats = await getEstatisticas(userId);
    
    // Buscar todas conquistas base
    const conquistasBase = await sequelize.query(
      `SELECT * FROM conquistas_base`,
      { type: QueryTypes.SELECT }
    );
    
    // Buscar conquistas já desbloqueadas
    const conquistadas = await sequelize.query(
      `SELECT conquista_key FROM user_conquistas WHERE user_id = ?`,
      { replacements: [userId], type: QueryTypes.SELECT }
    );
    const keysConquistadas = new Set(conquistadas.map(c => c.conquista_key));
    
    const novasConquistas = [];
    
    for (const conquista of conquistasBase) {
      if (keysConquistadas.has(conquista.conquista_key)) continue;
      
      let progressoAtual = 0;
      let conquistaDesbloqueada = false;
      
      switch (conquista.tipo_valor) {
        case 'horas':
          progressoAtual = Math.floor(stats.horas);
          conquistaDesbloqueada = progressoAtual >= conquista.meta;
          break;
        case 'questoes':
          progressoAtual = stats.questoes;
          conquistaDesbloqueada = progressoAtual >= conquista.meta;
          break;
        case 'acertos':
          progressoAtual = stats.acertos;
          conquistaDesbloqueada = progressoAtual >= conquista.meta;
          break;
        case 'dias':
          progressoAtual = stats.dias;
          conquistaDesbloqueada = progressoAtual >= conquista.meta;
          break;
        case 'streak':
          progressoAtual = progress.streak_atual || 0;
          conquistaDesbloqueada = progressoAtual >= conquista.meta;
          break;
        case 'simulados':
          progressoAtual = stats.simulados;
          conquistaDesbloqueada = progressoAtual >= conquista.meta;
          break;
        case 'revisoes':
          progressoAtual = stats.revisoes;
          conquistaDesbloqueada = progressoAtual >= conquista.meta;
          break;
        case 'metas':
          progressoAtual = stats.metas;
          conquistaDesbloqueada = progressoAtual >= conquista.meta;
          break;
        case 'taxa':
          progressoAtual = stats.taxaGeral;
          conquistaDesbloqueada = progressoAtual >= conquista.meta;
          break;
        case 'nivel':
          progressoAtual = progress.nivel || 1;
          conquistaDesbloqueada = progressoAtual >= conquista.meta;
          break;
        case 'materias':
          progressoAtual = stats.materias || 0;
          conquistaDesbloqueada = progressoAtual >= conquista.meta;
          break;
        case 'topicos':
          progressoAtual = stats.topicos || 0;
          conquistaDesbloqueada = progressoAtual >= conquista.meta;
          break;
        case 'blocos':
          progressoAtual = stats.blocos || 0;
          conquistaDesbloqueada = progressoAtual >= conquista.meta;
          break;
        case 'erros_revisados':
          progressoAtual = stats.erros_revisados || 0;
          conquistaDesbloqueada = progressoAtual >= conquista.meta;
          break;
        case 'fds':
          progressoAtual = stats.fds || 0;
          conquistaDesbloqueada = progressoAtual >= conquista.meta;
          break;
        case 'maratonas':
          progressoAtual = stats.maratonas || 0;
          conquistaDesbloqueada = progressoAtual >= conquista.meta;
          break;
        case 'perfeitos':
          progressoAtual = stats.perfeitos || 0;
          conquistaDesbloqueada = progressoAtual >= conquista.meta;
          break;
        case 'volume':
          progressoAtual = stats.volume || 0;
          conquistaDesbloqueada = progressoAtual >= conquista.meta;
          break;
        case 'estudo_diario':
          progressoAtual = stats.dias || 0;
          conquistaDesbloqueada = progressoAtual >= conquista.meta;
          break;
        case 'diversidade':
          progressoAtual = stats.diversidade || 0;
          conquistaDesbloqueada = progressoAtual >= conquista.meta;
          break;
        case 'consistencia_semanal':
          progressoAtual = stats.consistencia_semanal || 0;
          conquistaDesbloqueada = progressoAtual >= conquista.meta;
          break;
        case 'consistencia_mensal':
          progressoAtual = stats.consistencia_mensal || 0;
          conquistaDesbloqueada = progressoAtual >= conquista.meta;
          break;
        case 'highscore':
          progressoAtual = stats.highscore || 0;
          conquistaDesbloqueada = progressoAtual >= conquista.meta;
          break;
        case 'nota_simulado':
          progressoAtual = stats.nota_simulado || 0;
          conquistaDesbloqueada = progressoAtual >= conquista.meta;
          break;
        case 'notas_consecutivas':
          progressoAtual = stats.notas_consecutivas || 0;
          conquistaDesbloqueada = progressoAtual >= conquista.meta;
          break;
        case 'segunda':
        case 'terca':
        case 'quarta':
        case 'quinta':
        case 'sexta':
        case 'sabado':
        case 'domingo':
          progressoAtual = stats.dias_semana?.[conquista.tipo_valor] || 0;
          conquistaDesbloqueada = progressoAtual >= conquista.meta;
          break;
        default:
          // Categoria não tratada ainda
          continue;
      }
      
      if (conquistaDesbloqueada) {
        // Inserir conquista desbloqueada
        await sequelize.query(
          `INSERT INTO user_conquistas (user_id, conquista_key, titulo, descricao, icone, xp_bonus, dificuldade, progresso, meta, data_conquista)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          { replacements: [
            userId,
            conquista.conquista_key,
            conquista.titulo,
            conquista.descricao,
            conquista.icone,
            conquista.xp_bonus,
            conquista.dificuldade,
            progressoAtual,
            conquista.meta
          ]}
        );
        
        // Adicionar bônus de XP da conquista
        await adicionarXP(userId, conquista.xp_bonus, `Conquista: ${conquista.titulo}`, 'conquista');
        
        // Atualizar contador de conquistas
        await sequelize.query(
          `UPDATE user_progress SET conquistas_desbloqueadas = conquistas_desbloqueadas + 1 WHERE user_id = ?`,
          { replacements: [userId] }
        );
        
        novasConquistas.push({
          titulo: conquista.titulo,
          icone: conquista.icone,
          xp_bonus: conquista.xp_bonus
        });
        
        console.log(`[CONQUISTA] Usuário ${userId} desbloqueou: ${conquista.titulo}`);
      }
    }
    
    return {
      sucesso: true,
      conquistasDesbloqueadas: novasConquistas
    };
    
  } catch (error) {
    console.error('[CONQUISTA] Erro ao verificar conquistas:', error);
    return { sucesso: false, erro: error.message };
  }
}

// =====================================================
// ATUALIZAR STREAK
// =====================================================

async function atualizarStreak(userId) {
  try {
    const progress = await getOrCreateProgress(userId);
    
    // Buscar dias estudados
    const diasEstudados = await sequelize.query(
      `SELECT DISTINCT \`data\` FROM study_entries WHERE user_id = ? ORDER BY \`data\` DESC`,
      { replacements: [userId], type: QueryTypes.SELECT }
    );
    
    if (diasEstudados.length === 0) {
      return { sucesso: true, streakAtual: 0 };
    }
    
    const hoje = new Date().toISOString().slice(0, 10);
    const ontem = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    
    const diasSet = new Set(diasEstudados.map(d => d.data));
    
    // Se não estudou hoje nem ontem, streak zerou
    if (!diasSet.has(hoje) && !diasSet.has(ontem)) {
      await sequelize.query(
        `UPDATE user_progress SET streak_atual = 0 WHERE user_id = ?`,
        { replacements: [userId] }
      );
      return { sucesso: true, streakAtual: 0 };
    }
    
    // Calcular streak atual
    let streak = 0;
    const dataAtual = new Date();
    
    for (let i = 0; i < 365; i++) {
      const d = new Date(dataAtual);
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      
      if (diasSet.has(iso)) {
        streak++;
      } else if (i > 0) {
        // Se não é hoje (i=0) e não tem estudo, quebra streak
        break;
      }
    }
    
    // Atualizar streak maior se necessário
    const streakMaior = Math.max(streak, progress.streak_maior || 0);
    
    await sequelize.query(
      `UPDATE user_progress SET streak_atual = ?, streak_maior = ?, ultimo_estudo = ?, updated_at = NOW() WHERE user_id = ?`,
      { replacements: [streak, streakMaior, diasEstudados[0].data, userId] }
    );
    
    return { sucesso: true, streakAtual: streak };
    
  } catch (error) {
    console.error('[STREAK] Erro ao atualizar streak:', error);
    return { sucesso: false, erro: error.message };
  }
}

// =====================================================
// ESTATÍSTICAS COMPLETAS
// =====================================================

async function getEstatisticas(userId) {
  // Estatísticas básicas
  const horasResult = await sequelize.query(
    `SELECT SUM(horas) as total FROM study_entries WHERE user_id = ?`,
    { replacements: [userId], type: QueryTypes.SELECT }
  );
  
  const questoesResult = await sequelize.query(
    `SELECT SUM(questoes) as total, SUM(acertos) as acertos FROM study_entries WHERE user_id = ?`,
    { replacements: [userId], type: QueryTypes.SELECT }
  );
  
  const diasResult = await sequelize.query(
    `SELECT COUNT(DISTINCT \`data\`) as total FROM study_entries WHERE user_id = ?`,
    { replacements: [userId], type: QueryTypes.SELECT }
  );
  
  const simuladoResult = await sequelize.query(
    `SELECT COUNT(*) as total FROM simulados WHERE user_id = ? AND status = 'finalizado'`,
    { replacements: [userId], type: QueryTypes.SELECT }
  );
  
  const revisaoResult = await sequelize.query(
    `SELECT COUNT(*) as total FROM review_history WHERE user_id = ?`,
    { replacements: [userId], type: QueryTypes.SELECT }
  );
  
  const metaResult = await sequelize.query(
    `SELECT COUNT(*) as total FROM study_goals WHERE user_id = ? AND status = 'concluida'`,
    { replacements: [userId], type: QueryTypes.SELECT }
  );
  
  const conquistasResult = await sequelize.query(
    `SELECT SUM(xp_bonus) as total FROM user_conquistas WHERE user_id = ?`,
    { replacements: [userId], type: QueryTypes.SELECT }
  );
  
  // Matérias únicas estudadas
  const materiasResult = await sequelize.query(
    `SELECT COUNT(DISTINCT subject_id) as total FROM study_entries WHERE user_id = ? AND subject_id IS NOT NULL`,
    { replacements: [userId], type: QueryTypes.SELECT }
  );
  
  // Tópicos únicos estudados
  const topicosResult = await sequelize.query(
    `SELECT COUNT(DISTINCT topic_id) as total FROM study_entries WHERE user_id = ? AND topic_id IS NOT NULL`,
    { replacements: [userId], type: QueryTypes.SELECT }
  );
  
  // Blocos de simulado
  const blocosResult = await sequelize.query(
    `SELECT COUNT(*) as total FROM simulado_blocos sb 
     JOIN simulados s ON sb.simulado_id = s.id 
     WHERE s.user_id = ? AND s.status = 'finalizado'`,
    { replacements: [userId], type: QueryTypes.SELECT }
  );
  
  // Erros revisados - precisa fazer JOIN com simulado_blocos e simulados
  const errosRevisadosResult = await sequelize.query(
    `SELECT COUNT(*) as total FROM simulado_questao_erros sqe 
     JOIN simulado_blocos sb ON sqe.simulado_bloco_id = sb.id 
     JOIN simulados s ON sb.simulado_id = s.id 
     WHERE s.user_id = ? AND sqe.revisada = 1`,
    { replacements: [userId], type: QueryTypes.SELECT }
  );
  
  // Fim de semana (estudos em sábado ou domingo)
  const fdsResult = await sequelize.query(
    `SELECT COUNT(DISTINCT \`data\`) as total FROM study_entries 
     WHERE user_id = ? AND DAYOFWEEK(\`data\`) IN (1, 7)`,
    { replacements: [userId], type: QueryTypes.SELECT }
  );
  
  // Maratonas (sessões de 4+ horas)
  const maratonasResult = await sequelize.query(
    `SELECT COUNT(*) as total FROM study_entries WHERE user_id = ? AND horas >= 4`,
    { replacements: [userId], type: QueryTypes.SELECT }
  );
  
  // Perfeitos (sessões com 100% de acertos)
  const perfeitosResult = await sequelize.query(
    `SELECT COUNT(*) as total FROM study_entries 
     WHERE user_id = ? AND questoes > 0 AND acertos = questoes`,
    { replacements: [userId], type: QueryTypes.SELECT }
  );
  
  // Volume diário (maior número de questões em um dia)
  const volumeResult = await sequelize.query(
    `SELECT MAX(questoes) as maximo FROM study_entries WHERE user_id = ?`,
    { replacements: [userId], type: QueryTypes.SELECT }
  );
  
  // Highscore (maior nota em simulado) - calculado a partir dos blocos
  const highscoreResult = await sequelize.query(
    `SELECT MAX(nota) as maximo FROM (
      SELECT s.id, ROUND(SUM(sb.acertos) * 100.0 / SUM(sb.total_questoes), 1) as nota 
      FROM simulados s 
      JOIN simulado_blocos sb ON s.id = sb.simulado_id 
      WHERE s.user_id = ? AND s.status = 'finalizado'
      GROUP BY s.id
    ) as notas_simulados`,
    { replacements: [userId], type: QueryTypes.SELECT }
  );
  
  // Nota do último simulado - calculada a partir dos blocos
  const ultimaNotaResult = await sequelize.query(
    `SELECT ROUND(SUM(sb.acertos) * 100.0 / SUM(sb.total_questoes), 1) as nota 
     FROM simulados s 
     JOIN simulado_blocos sb ON s.id = sb.simulado_id 
     WHERE s.user_id = ? AND s.status = 'finalizado' 
     GROUP BY s.id 
     ORDER BY s.data_realizacao DESC LIMIT 1`,
    { replacements: [userId], type: QueryTypes.SELECT }
  );
  
  // Dias da semana estudados
  const diasSemanaResult = await sequelize.query(
    `SELECT DAYOFWEEK(\`data\`) as dia, COUNT(DISTINCT \`data\`) as total 
     FROM study_entries WHERE user_id = ? GROUP BY DAYOFWEEK(\`data\`)`,
    { replacements: [userId], type: QueryTypes.SELECT }
  );
  
  // Consistência semanal (semanas com pelo menos 1 dia de estudo)
  const consistenciaSemanalResult = await sequelize.query(
`SELECT COUNT(DISTINCT YEARWEEK(data, 1)) as total FROM study_entries WHERE user_id = ?`,
    { replacements: [userId], type: QueryTypes.SELECT }
  );
  
  // Diversidade (materias únicas com horas > 0)
  const diversidadeResult = await sequelize.query(
    `SELECT COUNT(DISTINCT subject_id) as total FROM study_entries 
     WHERE user_id = ? AND horas > 0 AND subject_id IS NOT NULL`,
    { replacements: [userId], type: QueryTypes.SELECT }
  );
  
  const questoesTotal = parseInt(questoesResult[0]?.total || 0);
  const acertosTotal = parseInt(questoesResult[0]?.acertos || 0);
  
  // Processar dias da semana
  const diasSemana = {
    domingo: 0,
    segunda: 0,
    terca: 0,
    quarta: 0,
    quinta: 0,
    sexta: 0,
    sabado: 0
  };
  const diaMap = {
    1: 'domingo',
    2: 'segunda',
    3: 'terca',
    4: 'quarta',
    5: 'quinta',
    6: 'sexta',
    7: 'sabado'
  };
  diasSemanaResult.forEach(d => {
    const diaNome = diaMap[d.dia];
    if (diaNome) {
      diasSemana[diaNome] = parseInt(d.total) || 0;
    }
  });
  
  return {
    horas: parseFloat(horasResult[0]?.total || 0),
    questoes: questoesTotal,
    acertos: acertosTotal,
    erros: Math.max(0, questoesTotal - acertosTotal),
    dias: parseInt(diasResult[0]?.total || 0),
    simulados: parseInt(simuladoResult[0]?.total || 0),
    revisoes: parseInt(revisaoResult[0]?.total || 0),
    metas: parseInt(metaResult[0]?.total || 0),
    conquistasXp: parseInt(conquistasResult[0]?.total || 0),
    taxaGeral: questoesTotal > 0 ? Math.round((acertosTotal / questoesTotal) * 100) : 0,
    
    // Novas estatísticas
    materias: parseInt(materiasResult[0]?.total || 0),
    topicos: parseInt(topicosResult[0]?.total || 0),
    blocos: parseInt(blocosResult[0]?.total || 0),
    erros_revisados: parseInt(errosRevisadosResult[0]?.total || 0),
    fds: parseInt(fdsResult[0]?.total || 0),
    maratonas: parseInt(maratonasResult[0]?.total || 0),
    perfeitos: parseInt(perfeitosResult[0]?.total || 0),
    volume: parseInt(volumeResult[0]?.maximo || 0),
    highscore: parseInt(highscoreResult[0]?.maximo || 0),
    nota_simulado: parseInt(ultimaNotaResult[0]?.nota || 0),
    consistencia_semanal: parseInt(consistenciaSemanalResult[0]?.total || 0),
    diversidade: parseInt(diversidadeResult[0]?.total || 0),
    dias_semana: diasSemana
  };
}

// =====================================================
// DETALHAMENTO DE XP POR CATEGORIA
// =====================================================

async function getDetalhamentoXP(userId) {
  const stats = await getEstatisticas(userId);
  
  const detalhamento = {
    horas: {
      valor: Math.floor(stats.horas),
      xp: Math.floor(stats.horas) * XP_CONFIG.POR_HORA,
      icon: '⏰',
      label: 'Horas Estudo'
    },
    questoesCertas: {
      valor: stats.acertos,
      xp: stats.acertos * XP_CONFIG.POR_QUESTAO_CORRETA,
      icon: '✅',
      label: 'Questões Certas'
    },
    questoesErradas: {
      valor: stats.erros,
      xp: stats.erros * XP_CONFIG.POR_QUESTAO_ERRADA,
      icon: '❌',
      label: 'Questões Erradas'
    },
    simulados: {
      valor: stats.simulados,
      xp: stats.simulados * XP_CONFIG.POR_SIMULADO,
      icon: '📋',
      label: 'Simulados'
    },
    revisoes: {
      valor: stats.revisoes,
      xp: stats.revisoes * XP_CONFIG.POR_REVISAO,
      icon: '🔄',
      label: 'Revisões'
    },
    metas: {
      valor: stats.metas,
      xp: stats.metas * XP_CONFIG.POR_META,
      icon: '🎯',
      label: 'Metas'
    },
    conquistas: {
      valor: 0, // Será calculado
      xp: stats.conquistasXp,
      icon: '🏆',
      label: 'Conquistas'
    }
  };
  
  return detalhamento;
}

// =====================================================
// PÁGINA DE CONQUISTAS
// =====================================================

async function conquistasPage(req, res) {
  const userId = req.session.userId;
  
  try {
    // Primeiro, calcular XP histórico para usuários existentes
    const xpHistoricoResult = await calcularXPHistorico(userId);
    
    // Atualizar streak também
    await atualizarStreak(userId);
    
    // Obter progresso - garantir que não seja null
    let progress = await getOrCreateProgress(userId);
    if (!progress || !progress.user_id) {
      progress = { 
        user_id: userId, 
        xp_total: 0, 
        nivel: 1, 
        xp_atual: 0, 
        xp_proximo_nivel: 500, 
        titulo: 'Iniciante', 
        conquistas_desbloqueadas: 0,
        streak_atual: 0,
        streak_maior: 0
      };
    }
    
    const conquistadas = await sequelize.query(
      `SELECT uc.*, cb.categoria 
       FROM user_conquistas uc 
       LEFT JOIN conquistas_base cb ON uc.conquista_key = cb.conquista_key 
       WHERE uc.user_id = ? 
       ORDER BY uc.data_conquista DESC`,
      { replacements: [userId], type: QueryTypes.SELECT }
    );
    
    const todasBase = await sequelize.query(
      `SELECT * FROM conquistas_base ORDER BY categoria, meta`,
      { type: QueryTypes.SELECT }
    );
    
    const keysConquistadas = conquistadas.map(c => c.conquista_key);
    const naoConquistadas = todasBase.filter(c => !keysConquistadas.includes(c.conquista_key));
    
    const stats = await getEstatisticas(userId);
    const naoConquistadasComProgresso = naoConquistadas.map(c => {
      let progresso = 0;
      switch (c.tipo_valor) {
        case 'horas': progresso = Math.floor(stats.horas); break;
        case 'questoes': progresso = stats.questoes; break;
        case 'acertos': progresso = stats.acertos; break;
        case 'dias': progresso = stats.dias; break;
        case 'streak': progresso = progress.streak_atual || 0; break;
        case 'simulados': progresso = stats.simulados; break;
        case 'revisoes': progresso = stats.revisoes; break;
        case 'metas': progresso = stats.metas; break;
        case 'taxa': progresso = stats.taxaGeral; break;
        case 'nivel': progresso = progress.nivel; break;
        case 'materias': progresso = stats.materias || 0; break;
        case 'topicos': progresso = stats.topicos || 0; break;
        case 'blocos': progresso = stats.blocos || 0; break;
        case 'erros_revisados': progresso = stats.erros_revisados || 0; break;
        case 'fds': progresso = stats.fds || 0; break;
        case 'maratonas': progresso = stats.maratonas || 0; break;
        case 'perfeitos': progresso = stats.perfeitos || 0; break;
        case 'volume': progresso = stats.volume || 0; break;
        case 'estudo_diario': progresso = stats.dias || 0; break;
        case 'diversidade': progresso = stats.diversidade || 0; break;
        case 'consistencia_semanal': progresso = stats.consistencia_semanal || 0; break;
        case 'highscore': progresso = stats.highscore || 0; break;
        case 'nota_simulado': progresso = stats.nota_simulado || 0; break;
        case 'segunda': progresso = stats.dias_semana?.segunda || 0; break;
        case 'terca': progresso = stats.dias_semana?.terca || 0; break;
        case 'quarta': progresso = stats.dias_semana?.quarta || 0; break;
        case 'quinta': progresso = stats.dias_semana?.quinta || 0; break;
        case 'sexta': progresso = stats.dias_semana?.sexta || 0; break;
        case 'sabado': progresso = stats.dias_semana?.sabado || 0; break;
        case 'domingo': progresso = stats.dias_semana?.domingo || 0; break;
        default: progresso = 0;
      }
      const percentual = Math.min(100, Math.round((progresso / c.meta) * 100));
      return { ...c, progresso, percentual };
    });
    
    const xpInfo = calcularNivel(progress.xp_total || 0);
    
    // Obter detalhamento de XP por categoria
    const detalhamentoXP = await getDetalhamentoXP(userId);
    
    // Obter categorias únicas das conquistas para o filtro
    const categorias = [...new Set(todasBase.map(c => c.categoria))];
    
    res.render("app/conquistas", {
      active: "conquistas",
      userNome: req.session.userNome,
      userFoto: req.session.userFoto,
      progress: { ...progress, ...xpInfo },
      detalhamentoXP,
      conquistadas,
      naoConquistadas: naoConquistadasComProgresso,
      totalConquistas: todasBase.length,
      conquistadasCount: conquistadas.length,
      categorias
    });
  } catch (error) {
    console.error('[Conquistas Page] Erro ao carregar página de conquistas:', error);
    res.status(500).render("app/conquistas", {
      active: "conquistas",
      userNome: req.session.userNome,
      userFoto: req.session.userFoto,
      progress: { 
        xp_total: 0, 
        nivel: 1, 
        xp_atual: 0, 
        xp_proximo_nivel: 500, 
        titulo: 'Iniciante',
        conquistas_desbloqueadas: 0,
        streak_atual: 0
      },
      detalhamentoXP: {},
      conquistadas: [],
      naoConquistadas: [],
      totalConquistas: 0,
      conquistadasCount: 0,
      categorias: [],
      erro: 'Erro ao carregar conquistas. Por favor, tente novamente.'
    });
  }
}

// =====================================================
// API: OBTER PROGRESSO
// =====================================================

async function getProgress(req, res) {
  const userId = req.session.userId;
  let progress = await getOrCreateProgress(userId);
  if (!progress) {
    progress = { xp_total: 0, nivel: 1, xp_atual: 0, xp_proximo_nivel: 500, titulo: 'Iniciante' };
  }
  const xpInfo = calcularNivel(progress.xp_total || 0);
  res.json({ success: true, progress: { ...progress, ...xpInfo } });
}

// =====================================================
// CALCULAR XP HISTÓRICO (para usuários existentes)
// =====================================================

async function calcularXPHistorico(userId) {
  try {
    // Buscar todas as estatísticas históricas
    const stats = await getEstatisticas(userId);
    const progress = await getOrCreateProgress(userId);
    
    // Calcular XP total baseado no histórico
    // XP por horas (100 XP/hora)
    const xpHoras = Math.floor(stats.horas) * XP_CONFIG.POR_HORA;
    
    // XP por questões corretas (15 XP cada)
    const xpQuestoesCorretas = stats.acertos * XP_CONFIG.POR_QUESTAO_CORRETA;
    
    // XP por questões erradas (3 XP cada)
    const questoesErradas = stats.questoes - stats.acertos;
    const xpQuestoesErradas = Math.max(0, questoesErradas) * XP_CONFIG.POR_QUESTAO_ERRADA;
    
    // XP por simulados finalizados (50 XP cada)
    const xpSimulados = stats.simulados * XP_CONFIG.POR_SIMULADO;
    
    // XP por revisões (25 XP cada)
    const xpRevisoes = stats.revisoes * XP_CONFIG.POR_REVISAO;
    
    // XP por metas concluídas (100 XP cada)
    const xpMetas = stats.metas * XP_CONFIG.POR_META;
    

    // XP total calculado
    const xpTotal = xpHoras + xpQuestoesCorretas + xpQuestoesErradas + xpSimulados + xpRevisoes + xpMetas;
    
    // Se já tem XP no banco e é maior que o calculado, não sobrescreve o XP
    // mas ainda assim verifica as conquistas
    if (progress.xp_total > 0 && progress.xp_total > xpTotal) {
      console.log(`[XP Historico] Usuário ${userId} já tem ${progress.xp_total} XP, mantém valor atual`);
      // Mesmo mantendo o XP, ainda verifica as conquistas
      await verificarEDesbloquearConquistas(userId);
      return progress;
    }
    
    // Calcular novo nível
    const nivelInfo = calcularNivel(xpTotal);
    const novoTitulo = getTitulo(nivelInfo.nivel);
    
    // Atualizar no banco
    await sequelize.query(
      `UPDATE user_progress 
       SET xp_total = ?, nivel = ?, xp_atual = ?, xp_proximo_nivel = ?, titulo = ?, updated_at = NOW()
       WHERE user_id = ?`,
      { replacements: [xpTotal, nivelInfo.nivel, nivelInfo.xpAtual, nivelInfo.xpProximoNivel, novoTitulo, userId] }
    );
    
    console.log(`[XP Historico] Usuário ${userId}: XP Histórico calculado = ${xpTotal}`);
    console.log(`  - Horas: ${stats.horas.toFixed(1)}h = ${xpHoras} XP`);
    console.log(`  - Questões corretas: ${stats.acertos} = ${xpQuestoesCorretas} XP`);
    console.log(`  - Questões erradas: ${questoesErradas} = ${xpQuestoesErradas} XP`);
    console.log(`  - Simulados: ${stats.simulados} = ${xpSimulados} XP`);
    console.log(`  - Revisões: ${stats.revisoes} = ${xpRevisoes} XP`);
    console.log(`  - Metas: ${stats.metas} = ${xpMetas} XP`);
    console.log(`  - Nível: ${nivelInfo.nivel}`);
    
    // Verificar conquistas baseadas no histórico
    await verificarEDesbloquearConquistas(userId);
    
    return {
      ...progress,
      xp_total: xpTotal,
      nivel: nivelInfo.nivel,
      xp_atual: nivelInfo.xpAtual,
      xp_proximo_nivel: nivelInfo.xpProximoNivel,
      titulo: novoTitulo
    };
    
  } catch (error) {
    console.error('[XP Historico] Erro ao calcular XP histórico:', error);
    return null;
  }
}

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  conquistasPage,
  getProgress,
  getOrCreateProgress,
  getEstatisticas,
  calcularNivel,
  adicionarXP,
  verificarEDesbloquearConquistas,
  atualizarStreak,
  calcularXPHistorico,
  XP_CONFIG
};

