const { StudyEntry, Subject, Topic, Subtopic } = require("../models");
const { Op, fn, col } = require("sequelize");
const puppeteer = require("puppeteer");

// =====================================================
// HELPER: Calcular período based on type
// =====================================================
function getPeriodo(periodoTipo) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  
  let inicio, fim, label;
  
  switch (periodoTipo) {
    case 'dia':
      inicio = hoje;
      fim = hoje;
      label = 'Hoje';
      break;
    case 'semana':
      inicio = new Date(hoje);
      inicio.setDate(hoje.getDate() - hoje.getDay());
      fim = new Date(inicio);
      fim.setDate(inicio.getDate() + 6);
      label = 'Esta Semana';
      break;
    case 'mes':
      inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
      label = 'Este Mês';
      break;
    case 'total':
    default:
      inicio = null;
      fim = null;
      label = 'Total';
      break;
  }
  
  return { inicio, fim, label, tipo: periodoTipo };
}

// =====================================================
// HELPER: Calcular porcentagem
// =====================================================
function calcularPorcentagem(acertos, questoes) {
  if (!questoes || questoes === 0) return 0;
  return Math.round((acertos / questoes) * 100);
}

// =====================================================
// INDEX - Página de seleção do relatório
// =====================================================
exports.index = async (req, res) => {
  res.render("app/relatorio", {
    active: "relatorio",
    userNome: req.session.userNome,
    userFoto: req.session.userFoto
  });
};

// =====================================================
// GERAR RELATÓRIO PDF
// =====================================================
exports.gerarRelatorio = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { periodo: periodoTipo } = req.params;
    
    const periodoValido = ['dia', 'semana', 'mes', 'total'].includes(periodoTipo);
    if (!periodoValido) {
      return res.status(400).json({ success: false, message: 'Período inválido' });
    }
    
    const periodo = getPeriodo(periodoTipo);
    const whereClause = { user_id: userId };
    
    if (periodo.inicio && periodo.fim) {
      whereClause.data = { [Op.between]: [periodo.inicio, periodo.fim] };
    }
    
    // Consulta SQL agregada
    const entries = await StudyEntry.findAll({
      where: whereClause,
      attributes: [
        'subject_id', 'topic_id', 'subtopic_id',
        [fn('SUM', col('horas')), 'total_horas'],
        [fn('SUM', col('questoes')), 'total_questoes'],
        [fn('SUM', col('acertos')), 'total_acertos']
      ],
      include: [
        { model: Subject, as: 'subject', attributes: ['id', 'nome'] },
        { model: Topic, as: 'topic', attributes: ['id', 'nome'] },
        { model: Subtopic, as: 'subtopic', attributes: ['id', 'nome'] }
      ],
      group: ['subject_id', 'topic_id', 'subtopic_id'],
      raw: false
    });
    
    // Filtragem: apenas conteúdos com atividade
    const entriesComAtividade = entries.filter(e => {
      const horas = parseFloat(e.get('total_horas')) || 0;
      const questoes = parseInt(e.get('total_questoes')) || 0;
      return horas > 0 || questoes > 0;
    });
    
    // Estruturar dados hierárquicos
    const materiasMap = {};
    
    entriesComAtividade.forEach(entry => {
      const subjectId = entry.subject_id;
      const topicId = entry.topic_id;
      const subtopicId = entry.subtopic_id;
      const horas = parseFloat(entry.get('total_horas')) || 0;
      const questoes = parseInt(entry.get('total_questoes')) || 0;
      const acertos = parseInt(entry.get('total_acertos')) || 0;
      
      if (!materiasMap[subjectId]) {
        materiasMap[subjectId] = {
          id: subjectId,
          nome: entry.subject.nome,
          horas: 0, questoes: 0, acertos: 0,
          topicos: {}
        };
      }
      
      if (!materiasMap[subjectId].topicos[topicId]) {
        materiasMap[subjectId].topicos[topicId] = {
          id: topicId,
          nome: entry.topic.nome,
          horas: 0, questoes: 0, acertos: 0,
          assuntos: {}
        };
      }
      
      if (subtopicId && entry.subtopic) {
        if (!materiasMap[subjectId].topicos[topicId].assuntos[subtopicId]) {
          materiasMap[subjectId].topicos[topicId].assuntos[subtopicId] = {
            id: subtopicId,
            nome: entry.subtopic.nome,
            horas: 0, questoes: 0, acertos: 0
          };
        }
        const assunto = materiasMap[subjectId].topicos[topicId].assuntos[subtopicId];
        assunto.horas += horas;
        assunto.questoes += questoes;
        assunto.acertos += acertos;
      }
      
      const topico = materiasMap[subjectId].topicos[topicId];
      if (!subtopicId) {
        topico.horas += horas;
        topico.questoes += questoes;
        topico.acertos += acertos;
      }
      
      materiasMap[subjectId].horas += horas;
      materiasMap[subjectId].questoes += questoes;
      materiasMap[subjectId].acertos += acertos;
    });
    
    // Converter para array - CORRIGIDO: tópico agora soma os assuntos
    const materias = Object.values(materiasMap).map(materia => {
      const topicos = Object.values(materia.topicos).map(topico => {
        const assuntos = Object.values(topico.assuntos);
        
        if (assuntos.length === 0) {
          // Sem assuntos = tudo no tópico (Geral)
          return {
            ...topico,
            assuntos: [{ 
              id: null, 
              nome: 'Geral', 
              horas: topico.horas, 
              questoes: topico.questoes, 
              acertos: topico.acertos,
              porcentagem: calcularPorcentagem(topico.acertos, topico.questoes)
            }]
          };
        }
        
        // Com assuntos: somar assuntos para obter total do tópico
        const totalHorasTopico = assuntos.reduce((sum, a) => sum + a.horas, 0);
        const totalQuestoesTopico = assuntos.reduce((sum, a) => sum + a.questoes, 0);
        const totalAcertosTopico = assuntos.reduce((sum, a) => sum + a.acertos, 0);
        
        return {
          ...topico,
          horas: totalHorasTopico,
          questoes: totalQuestoesTopico,
          acertos: totalAcertosTopico,
          assuntos: assuntos.map(a => ({ ...a, porcentagem: calcularPorcentagem(a.acertos, a.questoes) }))
        };
      });
      materia.porcentagem = calcularPorcentagem(materia.acertos, materia.questoes);
      return { ...materia, topicos };
    });
    
    // Resumo geral
    const totalHoras = materias.reduce((sum, m) => sum + m.horas, 0);
    const totalQuestoes = materias.reduce((sum, m) => sum + m.questoes, 0);
    const totalAcertos = materias.reduce((sum, m) => sum + m.acertos, 0);
    const porcentagemGeral = calcularPorcentagem(totalAcertos, totalQuestoes);
    const resumo = { totalHoras, totalQuestoes, totalAcertos, porcentagemGeral };
    
    // Gerar HTML
    const html = renderRelatorioHTML({ periodo, resumo, materias, dataGeracao: new Date() });
    
    // Gerar PDF com Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 794, height: 1123 });
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' }
    });
    
    await browser.close();
    
    const nomeArquivo = `relatorio-estudos-${periodo.label.toLowerCase().replace(' ', '-')}-${Date.now()}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${nomeArquivo}"`);
    res.setHeader('Content-Length', pdfBuffer.length); res.end(pdfBuffer);
    
  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    res.status(500).json({ success: false, message: 'Erro ao gerar relatório: ' + error.message });
  }
};

// =====================================================
// RENDERIZAR HTML DO RELATÓRIO
// =====================================================
function renderRelatorioHTML({ periodo, resumo, materias, dataGeracao }) {
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('pt-BR') : '-';
  const formatHoras = (h) => (parseFloat(h) || 0).toFixed(2).replace('.', ':');
  const calcPorc = (acertos, questoes) => (!questoes || questoes === 0) ? '0%' : Math.round((acertos / questoes) * 100) + '%';
  
  const materiasHTML = materias.map(materia => {
    const topicosHTML = materia.topicos.map(topico => {
      const assuntosHTML = topico.assuntos.map(assunto => `
        <tr class="assunto-row">
          <td class="assunto-name">${assunto.nome}</td>
          <td class="center">${formatHoras(assunto.horas)}</td>
          <td class="center">${assunto.questoes}</td>
          <td class="center">${assunto.acertos}</td>
          <td class="center ${assunto.porcentagem >= 70 ? 'success' : assunto.porcentagem >= 50 ? 'warning' : 'danger'}">${assunto.porcentagem}%</td>
        </tr>`).join('');
      
      return `
        <tr class="topico-header">
          <td><span class="bullet">•</span> ${topico.nome}</td>
          <td class="center">${formatHoras(topico.horas)}</td>
          <td class="center">${topico.questoes}</td>
          <td class="center">${topico.acertos}</td>
          <td class="center">${calcPorc(topico.acertos, topico.questoes)}</td>
        </tr>
        ${assuntosHTML}`;
    }).join('');
    
    return `
      <div class="materia-section">
        <h2 class="materia-title">${materia.nome}</h2>
        <table class="data-table">
          <thead>
            <tr><th>Conteúdo</th><th class="center">Horas</th><th class="center">Questões</th><th class="center">Acertos</th><th class="center">%</th></tr>
          </thead>
          <tbody>
            ${topicosHTML}
            <tr class="materia-total">
              <td><strong>Total ${materia.nome}</strong></td>
              <td class="center"><strong>${formatHoras(materia.horas)}</strong></td>
              <td class="center"><strong>${materia.questoes}</strong></td>
              <td class="center"><strong>${materia.acertos}</strong></td>
              <td class="center ${materia.porcentagem >= 70 ? 'success' : materia.porcentagem >= 50 ? 'warning' : 'danger'}"><strong>${materia.porcentagem}%</strong></td>
            </tr>
          </tbody>
        </table>
      </div>`;
  }).join('');
  
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Relatório de Estudos</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, sans-serif; font-size: 11pt; line-height: 1.4; color: #eaeaea; background: #0b0f17; }
    
    .capa {
      min-height: 100vh;
      padding: 60px 50px;
      background: radial-gradient(circle at top, #121826 0%, #0b0f17 45%, #080b12 100%);
      color: white;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      page-break-after: always;
    }
    
    .capa h1 { font-size: 42pt; font-weight: 700; margin-bottom: 30px; text-transform: uppercase; letter-spacing: 3px; }
    .capa .periodo { font-size: 18pt; margin-bottom: 40px; opacity: 0.9; }
    .capa .resumo-box { background: rgba(15,22,36,0.8); border: 1px solid rgba(255,255,255,0.1); border-radius: 15px; padding: 40px 60px; margin-top: 30px; }
    .capa .resumo-title { font-size: 16pt; margin-bottom: 25px; color: #3ee28a; }
    .capa .resumo-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 30px; }
    .capa .resumo-item { text-align: center; }
    .capa .resumo-value { font-size: 28pt; font-weight: 700; display: block; }
    .capa .resumo-label { font-size: 11pt; opacity: 0.85; margin-top: 5px; }
    .capa .data-geracao { position: absolute; bottom: 40px; font-size: 10pt; opacity: 0.7; }
    
    .conteudo { padding: 40px 50px; min-height: 100vh; background: #0b0f17; }
    .header { text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #3ee28a; }
    .header h1 { color: #ffffff; font-size: 24pt; margin-bottom: 10px; }
    .header .periodo-info { color: #aeb4c2; font-size: 12pt; }
    
    .materia-section { margin-bottom: 35px; page-break-inside: avoid; }
    .materia-title { background: linear-gradient(145deg, #0f1624, #0a0f1a); border-left: 4px solid #3ee28a; color: #ffffff; padding: 12px 20px; font-size: 14pt; border-radius: 8px; margin-bottom: 15px; }
    
    .data-table { width: 100%; border-collapse: collapse; font-size: 10pt; }
    .data-table th { background: #0f1624; padding: 10px 12px; text-align: left; font-weight: 600; color: #aeb4c2; border-bottom: 2px solid #1e3c72; }
    .data-table td { padding: 8px 12px; border-bottom: 1px solid #1f2a3a; color: #eaeaea; }
    .data-table .center { text-align: center; }
    .topico-header td { background: #0f1624; font-weight: 600; color: #3ee28a; }
    .assunto-row td { padding-left: 30px; }
    .assunto-name { color: #b5bccb; }
    .bullet { color: #3ee28a; font-weight: bold; margin-right: 8px; }
    .materia-total td { background: #0f1624; border-top: 2px solid #3ee28a; font-size: 11pt; color: #ffffff; }
    
    .success { color: #3ee28a; }
    .warning { color: #f0c75e; }
    .danger { color: #ff6b6b; }
  </style>
</head>
<body>
  <div class="capa">
    <h1>Relatório de Estudos</h1>
    <p class="periodo">Período: ${periodo.label}</p>
    <div class="resumo-box">
      <p class="resumo-title">Resumo Geral</p>
      <div class="resumo-grid">
        <div class="resumo-item">
          <span class="resumo-value">${formatHoras(resumo.totalHoras)}</span>
          <span class="resumo-label">Horas Estudadas</span>
        </div>
        <div class="resumo-item">
          <span class="resumo-value">${resumo.totalQuestoes}</span>
          <span class="resumo-label">Questões Feitas</span>
        </div>
        <div class="resumo-item">
          <span class="resumo-value">${resumo.totalAcertos}</span>
          <span class="resumo-label">Total de Acertos</span>
        </div>
        <div class="resumo-item">
          <span class="resumo-value">${resumo.porcentagemGeral}%</span>
          <span class="resumo-label">Aproveitamento</span>
        </div>
    </div>
    <p class="data-geracao">Gerado em: ${formatDate(dataGeracao)}</p>
  </div>
  
  <div class="conteudo">
    <div class="header">
      <h1>Organização dos Estudos</h1>
      <p class="periodo-info">Período: ${periodo.label}</p>
    </div>
    ${materiasHTML || '<p style="text-align:center;color:#666;padding:50px;">Nenhum registro de estudo encontrado no período selecionado.</p>'}
  </div>
</body>
</html>`;
}

module.exports = exports;
