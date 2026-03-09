const { StudyEntry, Subject, Topic, Subtopic, Simulado, SimuladoBloco } = require("../models");
const { Op, fn, col, literal } = require("sequelize");
const puppeteer = require("puppeteer");

// =====================================================
// HELPER: Calcular período
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
      label = 'Total Geral';
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
    
    // =====================================================
    // 1. Consulta principal - Study Entries
    // =====================================================
    const entries = await StudyEntry.findAll({
      where: whereClause,
      attributes: [
        'subject_id', 'topic_id', 'subtopic_id', 'data',
        [fn('SUM', col('horas')), 'total_horas'],
        [fn('SUM', col('questoes')), 'total_questoes'],
        [fn('SUM', col('acertos')), 'total_acertos']
      ],
      include: [
        { model: Subject, as: 'subject', attributes: ['id', 'nome'] },
        { model: Topic, as: 'topic', attributes: ['id', 'nome'] },
        { model: Subtopic, as: 'subtopic', attributes: ['id', 'nome'] }
      ],
      group: ['subject_id', 'topic_id', 'subtopic_id', 'data'],
      raw: false
    });
    
    // Filtragem: apenas conteúdos com atividade
    const entriesComAtividade = entries.filter(e => {
      const horas = parseFloat(e.get('total_horas')) || 0;
      const questoes = parseInt(e.get('total_questoes')) || 0;
      return horas > 0 || questoes > 0;
    });
    
    // =====================================================
    // 2. Calcular dias estudados
    // =====================================================
    const diasEstudadosSet = new Set(entriesComAtividade.map(e => e.data));
    const diasEstudados = diasEstudadosSet.size;
    
    // =====================================================
    // 3. Estruturar dados hierárquicos
    // =====================================================
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
    
    // Converter para array e ordenar por horas
    const materias = Object.values(materiasMap).map(materia => {
      const topicos = Object.values(materia.topicos).map(topico => {
        const assuntos = Object.values(topico.assuntos);
        
        if (assuntos.length === 0) {
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
    
    // Ordenar por horas (mais estudada primeiro)
    materias.sort((a, b) => b.horas - a.horas);
    
    // =====================================================
    // 4. Resumo geral
    // =====================================================
    const totalHoras = materias.reduce((sum, m) => sum + m.horas, 0);
    const totalQuestoes = materias.reduce((sum, m) => sum + m.questoes, 0);
    const totalAcertos = materias.reduce((sum, m) => sum + m.acertos, 0);
    const porcentagemGeral = calcularPorcentagem(totalAcertos, totalQuestoes);
    const mediaHorasDia = diasEstudados > 0 ? (totalHoras / diasEstudados) : 0;
    
    const resumo = { 
      totalHoras, 
      totalQuestoes, 
      totalAcertos, 
      porcentagemGeral,
      diasEstudados,
      mediaHorasDia
    };
    
    // =====================================================
    // 5. Consultar Simulados
    // =====================================================
    const whereSimulados = { 
      user_id: userId,
      status: 'finalizado'
    };
    
    if (periodo.inicio && periodo.fim) {
      whereSimulados.data_realizacao = { [Op.between]: [periodo.inicio, periodo.fim] };
    }
    
    // Buscar simulados com seus blocos
    const simulados = await Simulado.findAll({
      where: whereSimulados,
      include: [{
        model: SimuladoBloco,
        as: 'blocos',
        attributes: ['id', 'total_questoes', 'acertos']
      }],
      raw: false
    });
    
    // Processar simulados - calcular totais manualmente
    const simuladosFormatados = simulados.map(simulado => {
      const blocos = simulado.blocos || [];
      const totalQuestoesSimulado = blocos.reduce((sum, b) => sum + (parseInt(b.total_questoes) || 0), 0);
      const totalAcertosSimulado = blocos.reduce((sum, b) => sum + (parseInt(b.acertos) || 0), 0);
      
      return {
        id: simulado.id,
        nome: simulado.nome,
        data: simulado.data_realizacao,
        questoes: totalQuestoesSimulado,
        acertos: totalAcertosSimulado,
        porcentagem: calcularPorcentagem(totalAcertosSimulado, totalQuestoesSimulado)
      };
    }).filter(s => s.questoes > 0);
    
    // =====================================================
    // 6. Gerar HTML
    // =====================================================
    const html = renderRelatorioHTML({ 
      periodo, 
      resumo, 
      materias, 
      simulados: simuladosFormatados,
      dataGeracao: new Date() 
    });
    
    // =====================================================
    // 7. Gerar PDF com Puppeteer
    // =====================================================
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
      margin: {
        top: '20mm',
        bottom: '20mm',
        left: '15mm',
        right: '15mm'
      }
    });
    
    await browser.close();
    
    const nomeArquivo = `relatorio-estudos-${periodo.label.toLowerCase().replace(' ', '-')}-${Date.now()}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${nomeArquivo}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.end(pdfBuffer);
    
  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    res.status(500).json({ success: false, message: 'Erro ao gerar relatório: ' + error.message });
  }
};

// =====================================================
// RENDERIZAR HTML DO RELATÓRIO - NOVO DESIGN PROFISSIONAL
// =====================================================
function renderRelatorioHTML({ periodo, resumo, materias, simulados, dataGeracao }) {
  // =====================================================
  // HELPERS
  // =====================================================
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }) : '-';
  
  const formatDateShort = (d) => d ? new Date(d).toLocaleDateString('pt-BR') : '-';
  
  // Formatar horas como "Xh Ymin"
  const formatHoras = (h) => {
    const horas = Math.floor(parseFloat(h) || 0);
    const minutos = Math.round((parseFloat(h) || 0) * 60 - horas * 60);
    if (horas === 0) return `${minutos}min`;
    if (minutos === 0) return `${horas}h`;
    return `${horas}h ${minutos}min`;
  };
  
  const calcPorc = (acertos, questoes) => (!questoes || questoes === 0) ? '0%' : Math.round((acertos / questoes) * 100) + '%';
  
  const getPorcClass = (porc) => {
    if (porc >= 70) return 'alta';
    if (porc >= 50) return 'media';
    return 'baixa';
  };
  
  // =====================================================
  // 1. DASHBOARD - Cards de estatísticas
  // =====================================================
  const dashboardCards = `
    <div class="dashboard-grid">
      <div class="stat-card">
        <div class="stat-icon">⏱️</div>
        <div class="stat-value">${formatHoras(resumo.totalHoras)}</div>
        <div class="stat-label">Total de Horas</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📝</div>
        <div class="stat-value">${resumo.totalQuestoes}</div>
        <div class="stat-label">Questões Feitas</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">✅</div>
        <div class="stat-value">${resumo.totalAcertos}</div>
        <div class="stat-label">Questões Acertadas</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📊</div>
        <div class="stat-value ${getPorcClass(resumo.porcentagemGeral)}">${resumo.porcentagemGeral}%</div>
        <div class="stat-label">Taxa de Acertos</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📅</div>
        <div class="stat-value">${resumo.diasEstudados}</div>
        <div class="stat-label">Dias Estudados</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📈</div>
        <div class="stat-value">${formatHoras(resumo.mediaHorasDia)}</div>
        <div class="stat-label">Média por Dia</div>
      </div>
    </div>
  `;
  
  // =====================================================
  // 2. Tabela de Matérias (resumo)
  // =====================================================
  const materiasTabela = materias.map(materia => `
    <tr>
      <td class="materia-nome">${materia.nome}</td>
      <td class="center">${formatHoras(materia.horas)}</td>
      <td class="center">${materia.questoes}</td>
      <td class="center">${materia.acertos}</td>
      <td class="center ${getPorcClass(materia.porcentagem)}"><strong>${materia.porcentagem}%</strong></td>
    </tr>
  `).join('');
  
  // =====================================================
  // 3. Detalhamento por Matéria > Tópico > Assunto
  // =====================================================
  const materiasDetalhadas = materias.map(materia => {
    const topicosHTML = materia.topicos.map(topico => {
      const assuntosHTML = topico.assuntos.map(assunto => `
        <tr class="assunto-row">
          <td class="topic-name">▸ ${assunto.nome}</td>
          <td class="center">${formatHoras(assunto.horas)}</td>
          <td class="center">${assunto.questoes}</td>
          <td class="center">${assunto.acertos}</td>
          <td class="center ${getPorcClass(assunto.porcentagem)}">${assunto.porcentagem}%</td>
        </tr>
      `).join('');
      
      return `
        <tr class="topico-row">
          <td class="topic-name"><strong>◆ ${topico.nome}</strong></td>
          <td class="center"><strong>${formatHoras(topico.horas)}</strong></td>
          <td class="center"><strong>${topico.questoes}</strong></td>
          <td class="center"><strong>${topico.acertos}</strong></td>
          <td class="center"><strong>${calcPorc(topico.acertos, topico.questoes)}</strong></td>
        </tr>
        ${assuntosHTML}
      `;
    }).join('');
    
    return `
      <div class="subject-section" style="page-break-inside: avoid;">
        <div class="subject-header">
          <h2 class="subject-title">📚 ${materia.nome}</h2>
          <div class="subject-summary">
            <span class="summary-item">⏱️ ${formatHoras(materia.horas)}</span>
            <span class="summary-item">📝 ${materia.questoes}</span>
            <span class="summary-item ${getPorcClass(materia.porcentagem)}">${materia.porcentagem}%</span>
          </div>
        </div>
        <table class="detail-table">
          <thead>
            <tr>
              <th style="width: 40%;">Tópico / Assunto</th>
              <th style="width: 18%;">Horas</th>
              <th style="width: 14%;">Questões</th>
              <th style="width: 14%;">Acertos</th>
              <th style="width: 14%;">Taxa</th>
            </tr>
          </thead>
          <tbody>
            ${topicosHTML}
            <tr class="subject-total">
              <td><strong>► TOTAL ${materia.nome.toUpperCase()}</strong></td>
              <td class="center"><strong>${formatHoras(materia.horas)}</strong></td>
              <td class="center"><strong>${materia.questoes}</strong></td>
              <td class="center"><strong>${materia.acertos}</strong></td>
              <td class="center ${getPorcClass(materia.porcentagem)}"><strong>${materia.porcentagem}%</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }).join('');
  
  // =====================================================
  // 4. Simulados
  // =====================================================
  let simuladosHTML = '';
  if (simulados && simulados.length > 0) {
    const simuladosRows = simulados.map(simulado => `
      <tr>
        <td>${simulado.nome}</td>
        <td class="center">${formatDateShort(simulado.data)}</td>
        <td class="center">${simulado.questoes}</td>
        <td class="center">${simulado.acertos}</td>
        <td class="center ${getPorcClass(simulado.porcentagem)}"><strong>${simulado.porcentagem}%</strong></td>
      </tr>
    `).join('');
    
    simuladosHTML = `
      <div class="section">
        <h2 class="section-title">📋 Simulados Realizados</h2>
        <table class="detail-table">
          <thead>
            <tr>
              <th style="width: 35%;">Simulado</th>
              <th style="width: 18%;">Data</th>
              <th style="width: 15%;">Questões</th>
              <th style="width: 15%;">Acertos</th>
              <th style="width: 17%;">Taxa</th>
            </tr>
          </thead>
          <tbody>
            ${simuladosRows}
          </tbody>
        </table>
      </div>
    `;
  }
  
  // =====================================================
  // RETORNO DO HTML COMPLETO
  // =====================================================
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relatório de Desempenho de Estudos</title>
  <style>
    /* =====================================================
       RESET E BASE
       ===================================================== */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    @page {
      size: A4;
      margin: 20mm 15mm 20mm 15mm;
    }
    
    body {
      font-family: 'Arial', 'Helvetica', sans-serif;
      font-size: 10pt;
      line-height: 1.5;
      color: #1a1a2e;
      background: #ffffff;
    }
    
    /* =====================================================
       CABEÇALHO
       ===================================================== */
    .header {
      text-align: center;
      padding: 30px 20px 25px;
      border-bottom: 3px solid #1e3a5f;
      margin-bottom: 30px;
    }
    
    .header h1 {
      font-size: 22pt;
      font-weight: 700;
      color: #1e3a5f;
      letter-spacing: 1px;
      margin-bottom: 5px;
      text-transform: uppercase;
    }
    
    .header .subtitle {
      font-size: 12pt;
      color: #64748b;
      margin-bottom: 10px;
    }
    
    .header .meta {
      font-size: 9pt;
      color: #94a3b8;
    }
    
    .header-line {
      height: 3px;
      background: linear-gradient(90deg, #1e3a5f 0%, #3b82f6 50%, #1e3a5f 100%);
      margin-top: 15px;
    }
    
    /* =====================================================
       DASHBOARD - Cards de Estatísticas
       ===================================================== */
    .dashboard {
      margin-bottom: 35px;
    }
    
    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
    }
    
    .stat-card {
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 18px 15px;
      text-align: center;
      page-break-inside: avoid;
    }
    
    .stat-icon {
      font-size: 20px;
      margin-bottom: 8px;
    }
    
    .stat-value {
      font-size: 22pt;
      font-weight: 700;
      color: #1e3a5f;
      margin-bottom: 4px;
    }
    
    .stat-value.alta { color: #16a34a; }
    .stat-value.media { color: #ca8a04; }
    .stat-value.baixa { color: #dc2626; }
    
    .stat-label {
      font-size: 9pt;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    /* =====================================================
       TABELAS
       ===================================================== */
    .detail-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9pt;
      margin-bottom: 25px;
    }
    
    .detail-table thead {
      background: #1e3a5f;
    }
    
    .detail-table th {
      padding: 12px 10px;
      text-align: left;
      font-weight: 600;
      color: #ffffff;
      border-bottom: 2px solid #1e3a5f;
      font-size: 8pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .detail-table td {
      padding: 10px;
      border-bottom: 1px solid #e2e8f0;
      color: #334155;
    }
    
    .detail-table .center { text-align: center; }
    
    /* Linhas diferenciadas */
    .topico-row {
      background: #f8fafc;
    }
    
    .topico-row td {
      font-weight: 600;
      color: #1e293b;
    }
    
    .assunto-row td {
      padding-left: 25px;
      color: #64748b;
      font-size: 8.5pt;
    }
    
    .subject-total {
      background: #1e3a5f !important;
    }
    
    .subject-total td {
      color: #ffffff !important;
      font-size: 9.5pt;
    }
    
    /* Porcentagens coloridas */
    .alta { color: #16a34a !important; font-weight: 600; }
    .media { color: #ca8a04 !important; font-weight: 600; }
    .baixa { color: #dc2626 !important; font-weight: 600; }
    
    /* =====================================================
       SEÇÕES
       ===================================================== */
    .section {
      margin-bottom: 30px;
      page-break-before: auto;
    }
    
    .section-title {
      font-size: 14pt;
      font-weight: 700;
      color: #1e3a5f;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e2e8f0;
    }
    
    /* =====================================================
       DETALHAMENTO POR MATÉRIA
       ===================================================== */
    .subject-section {
      margin-bottom: 30px;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
      page-break-inside: avoid;
    }
    
    .subject-header {
      background: linear-gradient(135deg, #1e3a5f 0%, #2d4a6f 100%);
      color: #ffffff;
      padding: 16px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .subject-title {
      font-size: 13pt;
      font-weight: 700;
    }
    
    .subject-summary {
      display: flex;
      gap: 20px;
    }
    
    .summary-item {
      font-size: 10pt;
    }
    
    .summary-item.alta { color: #4ade80; }
    .summary-item.media { color: #facc15; }
    .summary-item.baixa { color: #f87171; }
    
    /* =====================================================
       TABELA RESUMO DE MATÉRIAS
       ===================================================== */
    .materias-resumo {
      margin-bottom: 35px;
    }
    
    .materias-resumo-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9pt;
      border: 2px solid #e2e8f0;
      border-radius: 10px;
      overflow: hidden;
    }
    
    .materias-resumo-table thead {
      background: #1e3a5f;
    }
    
    .materias-resumo-table th {
      padding: 14px 12px;
      text-align: left;
      font-weight: 600;
      color: #ffffff;
      font-size: 8pt;
      text-transform: uppercase;
    }
    
    .materias-resumo-table td {
      padding: 12px;
      border-bottom: 1px solid #e2e8f0;
      color: #334155;
    }
    
    .materias-resumo-table .center { text-align: center; }
    
    .materias-resumo-table .materia-nome {
      font-weight: 600;
      color: #1e293b;
    }
    
    .materias-resumo-table tbody tr:hover {
      background: #f8fafc;
    }
    
    /* =====================================================
       RODAPÉ
       ===================================================== */
    .footer {
      text-align: center;
      padding: 20px;
      font-size: 8pt;
      color: #94a3b8;
      border-top: 1px solid #e2e8f0;
      margin-top: 30px;
    }
    
    /* =====================================================
       IMPRESSÃO
       ===================================================== */
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .subject-section, .stat-card { break-inside: avoid; }
    }
  </style>
</head>
<body>

  <!-- CABEÇALHO -->
  <div class="header">
    <h1>Relatório de Desempenho de Estudos</h1>
    <p class="subtitle">Preparação para Vestibular de Medicina</p>
    <p class="meta">Período: ${periodo.label} | Gerado em: ${formatDate(dataGeracao)}</p>
    <div class="header-line"></div>
  </div>

  <!-- DASHBOARD -->
  <div class="dashboard">
    ${dashboardCards}
  </div>

  <!-- RESUMO POR MATÉRIA -->
  <div class="materias-resumo">
    <h2 class="section-title">📊 Desempenho por Matéria</h2>
    <table class="materias-resumo-table">
      <thead>
        <tr>
          <th style="width: 40%;">Matéria</th>
          <th style="width: 18%;">Horas</th>
          <th style="width: 14%;">Questões</th>
          <th style="width: 14%;">Acertos</th>
          <th style="width: 14%;">Taxa</th>
        </tr>
      </thead>
      <tbody>
        ${materiasTabela || '<tr><td colspan="5" class="center" style="padding: 30px;">Nenhum registro de estudo encontrado.</td></tr>'}
      </tbody>
    </table>
  </div>

  <!-- DETALHAMENTO POR MATÉRIA -->
  <div class="section">
    <h2 class="section-title">📚 Detalhamento por Matéria, Tópico e Assunto</h2>
    ${materiasDetalhadas || '<p style="text-align: center; color: #64748b; padding: 30px;">Nenhum detalhamento disponível.</p>'}
  </div>

  <!-- SIMULADOS -->
  ${simuladosHTML}

  <!-- RODAPÉ -->
  <div class="footer">
    Relatório gerado automaticamente pelo sistema KMDL-Med | Prepare-se para a Medicina com excelência
  </div>

</body>
</html>`;
}

module.exports = exports;

