const { StudyEntry, SimuladoQuestaoErro, Subject, Topic, ReviewHistory } = require("../models");
const { Op, fn, col, literal } = require("sequelize");
const sequelize = require("../config/database");
const gamificacao = require("../controllers/gamificacaoController");

// =====================================================
// CONFIGURAÇÕES DE INTERVALO DE REVISÃO
// =====================================================
const INTERVALOS_REVISAO = {
  muito_facil: 45,
  facil: 20,
  medio: 14,
  dificil: 7,
  muito_dificil: 3
};

// =====================================================
// HELPER: Calcular próxima revisão
// =====================================================
function calcularProximaRevisao(dificuldade) {
  const hoje = new Date();
  const intervalo = INTERVALOS_REVISAO[dificuldade] || 14;
  const proxima = new Date(hoje);
  proxima.setDate(proxima.getDate() + intervalo);
  return proxima.toISOString().split('T')[0];
}

// =====================================================
// HELPER: Determinar status da revisão
// =====================================================
function getStatusRevisao(proximaRevisao) {
  if (!proximaRevisao) return 'sem_revisao';
  
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const proxima = new Date(proximaRevisao);
  proxima.setHours(0, 0, 0, 0);
  
  const diffDays = Math.floor((proxima - hoje) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'atrasada';
  if (diffDays === 0) return 'hoje';
  if (diffDays <= 3) return 'em_dia';
  return 'em_dia';
}

// =====================================================
// INDEX - Lista principal de revisões
// =====================================================
exports.index = async (req, res) => {
  const userId = req.session.userId;
  const hoje = new Date();

  // 1. Buscar todas as matérias do usuário para filtros
  const materias = await Subject.findAll({
    where: { user_id: userId },
    attributes: ['id', 'nome'],
    order: [['nome', 'ASC']]
  });

  // 2. Agrupar estudos por matéria + tópico
  const estudos = await StudyEntry.findAll({
    where: { user_id: userId },
    attributes: [
      "subject_id",
      "topic_id",
      [fn("SUM", col("questoes")), "total_questoes"],
      [fn("SUM", col("acertos")), "total_acertos"],
      [fn("MAX", col("data")), "ultima_data"],
      [fn("AVG",
        literal(`
          CASE dificuldade
            WHEN 'MUITO_DIFICIL' THEN 5
            WHEN 'DIFICIL' THEN 4
            WHEN 'MEDIA' THEN 3
            WHEN 'FACIL' THEN 2
            WHEN 'MUITO_FACIL' THEN 1
          END
        `)
      ), "media_dificuldade"]
    ],
    include: [
      { model: Subject, as: "subject", attributes: ["id", "nome"] },
      { model: Topic, as: "topic", attributes: ["id", "nome", "ultima_revisao", "proxima_revisao"] }
    ],
    group: ["subject_id", "topic_id"],
    raw: false
  });

  // 3. Buscar erros não revisados
  const erros = await SimuladoQuestaoErro.findAll({
    where: {
      revisada: false,
      subject_id: { [Op.not]: null }
    },
    attributes: [
      "subject_id",
      "topic_id",
      [fn("COUNT", col("id")), "total_erros"]
    ],
    group: ["subject_id", "topic_id"],
    raw: true
  });

  const erroMap = {};
  erros.forEach(e => {
    erroMap[`${e.subject_id}-${e.topic_id}`] = parseInt(e.total_erros);
  });

  // 4. Buscar última revisão do histórico
  const ultimasRevisoes = await ReviewHistory.findAll({
    where: { user_id: userId },
    attributes: [
      "subject_id",
      "topic_id",
      [fn("MAX", col("data_revisao")), "ultima_revisao"]
    ],
    group: ["subject_id", "topic_id"],
    raw: true
  });

  const ultimaRevisaoMap = {};
  ultimasRevisoes.forEach(r => {
    ultimaRevisaoMap[`${r.subject_id}-${r.topic_id}`] = r.ultima_revisao;
  });

  // 5. Calcular score e compilar dados
  const revisoes = estudos.map(e => {
    const totalQuestoes = parseInt(e.get("total_questoes")) || 0;
    const totalAcertos = parseInt(e.get("total_acertos")) || 0;
    const ultimaData = new Date(e.get("ultima_data"));
    const mediaDificuldade = parseFloat(e.get("media_dificuldade")) || 0;

    const diasSemEstudar = Math.floor((hoje - ultimaData) / (1000 * 60 * 60 * 24));

    const erroPercentual = totalQuestoes > 0 ? 1 - (totalAcertos / totalQuestoes) : 0;
    const errosPendentes = erroMap[`${e.subject_id}-${e.topic_id}`] || 0;

    // Score original preservado
    const score = (mediaDificuldade * 2) + (erroPercentual * 5) + (diasSemEstudar * 0.3) + (errosPendentes * 2);

    // Dados de revisão do tópico
    const proximaRevisao = e.topic ? e.topic.proxima_revisao : null;
    const status = getStatusRevisao(proximaRevisao);
    const ultimaRevisao = e.topic ? e.topic.ultima_revisao : (ultimaRevisaoMap[`${e.subject_id}-${e.topic_id}`] || null);

    return {
      subjectId: e.subject_id,
      topicId: e.topic_id,
      subject: e.subject.nome,
      topic: e.topic.nome,
      diasSemEstudar,
      erroPercentual: (erroPercentual * 100).toFixed(1),
      errosPendentes,
      score: score.toFixed(2),
      ultimaRevisao,
      proximaRevisao,
      status,
      priority: score >= 15 ? 'alta' : score >= 8 ? 'media' : 'baixa'
    };
  });

  // 6. Separar em categorias
  const revisoesAtrasadas = revisoes.filter(r => r.status === 'atrasada');
  const revisoesHoje = revisoes.filter(r => r.status === 'hoje');
  const outrasRevisoes = revisoes.filter(r => r.status === 'em_dia' || r.status === 'sem_revisao');

  // Ordenar cada categoria por prioridade
  revisoesAtrasadas.sort((a, b) => b.score - a.score);
  revisoesHoje.sort((a, b) => b.score - a.score);
  outrasRevisoes.sort((a, b) => b.score - a.score);

  res.render("app/revisoes", {
    revisoes: [...revisoesAtrasadas, ...revisoesHoje, ...outrasRevisoes],
    revisoesAtrasadas,
    revisoesHoje,
    outrasRevisoes,
    materias,
    active: "revisoes",
    userNome: req.session.userNome,
    userFoto: req.session.userFoto
  });
};

// =====================================================
// REGISTRAR REVISÃO
// =====================================================
exports.registrarRevisao = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { subjectId, topicId, dificuldade, assunto } = req.body;

    if (!subjectId || !topicId || !dificuldade) {
      return res.status(400).json({ 
        success: false, 
        message: 'Preencha todos os campos obrigatórios' 
      });
    }

    const hoje = new Date().toISOString().split('T')[0];
    const proximaRevisao = calcularProximaRevisao(dificuldade);

    // 1. Criar registro no histórico
    await ReviewHistory.create({
      user_id: userId,
      subject_id: parseInt(subjectId),
      topic_id: parseInt(topicId),
      assunto: assunto || null,
      dificuldade: dificuldade,
      data_revisao: hoje
    });

    // 2. Atualizar campos no tópico
    await Topic.update(
      { ultima_revisao: hoje, proxima_revisao: proximaRevisao },
      { where: { id: topicId, user_id: userId } }
    );

    // ========== ADICIONAR XP E ATUALIZAR CONQUISTAS ==========
    const { XP_CONFIG } = gamificacao;
    
    // XP por revisão
    const xpRevisao = XP_CONFIG.POR_REVISAO;

    if (xpRevisao > 0) {
      // Adicionar XP
      await gamificacao.adicionarXP(
        userId, 
        xpRevisao, 
        `Revisão: ${assunto || 'Tópico'}`, 
        'revisao'
      );
      
      // Verificar conquistas
      await gamificacao.verificarEDesbloquearConquistas(userId);
    }

    res.json({ 
      success: true, 
      message: 'Revisão registrada com sucesso!',
      data: {
        ultimaRevisao: hoje,
        proximaRevisao: proximaRevisao
      }
    });

  } catch (error) {
    console.error('Erro ao registrar revisão:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao registrar revisão' 
    });
  }
};

// =====================================================
// LISTAR REVISÕES DE HOJE
// =====================================================
exports.listarRevisoesHoje = async (req, res) => {
  try {
    const userId = req.session.userId;

    const revisoes = await ReviewHistory.findAll({
      where: {
        user_id: userId,
        data_revisao: new Date().toISOString().split('T')[0]
      },
      include: [
        { model: Subject, as: 'subject', attributes: ['nome'] },
        { model: Topic, as: 'topic', attributes: ['nome'] }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({ success: true, revisoes });
  } catch (error) {
    console.error('Erro ao listar revisões de hoje:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar revisões' });
  }
};

// =====================================================
// HISTÓRICO DE REVISÃO POR TÓPICO
// =====================================================
exports.historicoRevisao = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { subjectId, topicId } = req.params;

    const historico = await ReviewHistory.findAll({
      where: {
        user_id: userId,
        subject_id: parseInt(subjectId),
        topic_id: parseInt(topicId)
      },
      attributes: ['id', 'dificuldade', 'data_revisao', 'assunto', 'created_at'],
      order: [['data_revisao', 'DESC']]
    });

    res.json({ success: true, historico });
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar histórico' });
  }
};

// =====================================================
// OBTER ERROS DE SIMULADO POR TÓPICO
// =====================================================
exports.obterErrosTopico = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { subjectId, topicId } = req.params;

    const erros = await SimuladoQuestaoErro.findAll({
      where: {
        subject_id: parseInt(subjectId),
        topic_id: parseInt(topicId),
        revisada: false
      },
      include: [
        { model: Subject, as: 'subject', attributes: ['nome'] },
        { model: Topic, as: 'topic', attributes: ['nome'] },
        {
          model: require("../models").SimuladoBloco,
          as: 'bloco',
          include: [
            {
              model: require("../models").Simulado,
              as: 'simulado',
              attributes: ['nome']
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']]
    });

    // Formatar dados para retornar
    const errosFormatados = erros.map(erro => ({
      id: erro.id,
      numero_questao: erro.numero_questao,
      motivo: erro.motivo,
      area: erro.area,
      subject: erro.subject ? erro.subject.nome : null,
      topic: erro.topic ? erro.topic.nome : null,
      simuladoNome: erro.bloco && erro.bloco.simulado ? erro.bloco.simulado.nome : 'Simulado'
    }));

    res.json({ success: true, erros: errosFormatados });
  } catch (error) {
    console.error('Erro ao buscar erros:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar erros' });
  }
};

// =====================================================
// MARCAR ERROS COMO REVISADOS
// =====================================================
exports.marcarErrosRevisados = async (req, res) => {
  try {
    const { erroIds } = req.body;
    
    if (!erroIds || erroIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Nenhum erro selecionado' });
    }

    await SimuladoQuestaoErro.update(
      { revisada: true, data_revisao: new Date() },
      { where: { id: { [Op.in]: erroIds } } }
    );

    res.json({ success: true, message: 'Erros marcados como revisados' });
  } catch (error) {
    console.error('Erro ao marcar erros como revisados:', error);
    res.status(500).json({ success: false, message: 'Erro ao atualizar erros' });
  }
};

