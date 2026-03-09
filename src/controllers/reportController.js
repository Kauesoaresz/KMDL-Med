const { StudyEntry, Subject, Topic, Subtopic } = require("../models");
const { Op, fn, col } = require("sequelize");
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
    
    // Converter para array
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
// RENDERIZAR HTML DO RELATÓRIO - NOVO DESIGN
// =====================================================
function renderRelatorioHTML({ periodo, resumo, materias, dataGeracao }) {
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('pt-BR') : '-';
  
  // Formatar horas como "Xh Ymin"
  const formatHoras = (h) => {
    const horas = Math.floor(parseFloat(h) || 0);
    const minutos = Math.round((parseFloat(h) || 0) * 60 - horas * 60);
    if (horas === 0) return `${minutos}min`;
    if (minutos === 0) return `${horas}h`;
    return `${horas}h ${minutos}min`;
  };
  
  const calcPorc = (acertos, questoes) => (!questoes || questoes === 0) ? '0%' : Math.round((acertos / questoes) * 100) + '%';

  // Gerar seções de matérias
  const materiasHTML = materias.map(materia => {
    const topicosHTML = materia.topicos.map(topico => {
      const assuntosHTML = topico.assuntos.map(assunto => `
        <tr class="assunto-row">
          <td class="nome">▸ ${assunto.nome}</td>
          <td class="tempo">${formatHoras(assunto.horas)}</td>
          <td class="numero">${assunto.questoes}</td>
          <td class="numero">${assunto.acertos}</td>
          <td class="porcentagem ${assunto.porcentagem >= 70 ? 'alta' : assunto.porcentagem >= 50 ? 'media' : 'baixa'}">${assunto.porcentagem}%</td>
        </tr>`).join('');
      
      return `
        <tr class="topico-row">
          <td class="nome"><strong>◆ ${topico.nome}</strong></td>
          <td class="tempo"><strong>${formatHoras(topico.horas)}</strong></td>
          <td class="numero"><strong>${topico.questoes}</strong></td>
          <td class="numero"><strong>${topico.acertos}</strong></td>
          <td class="porcentagem"><strong>${calcPorc(topico.acertos, topico.questoes)}</strong></td>
        </tr>
        ${assuntosHTML}`;
    }).join('');

    return `
      <div class="materia-bloco">
        <div class="materia-cabecalho">
          <div class="materia-titulo">📚 ${materia.nome}</div>
          <div class="materia-resumo">
            <span class="resumo-item">⏱️ ${formatHoras(materia.horas)}</span>
            <span class="resumo-item">📝 ${materia.questoes}</span>
            <span class="resumo-item ${materia.porcentagem >= 70 ? 'alta' : materia.porcentagem >= 50 ? 'media' : 'baixa'}">${materia.porcentagem}%</span>
          </div>
        </div>
        <table class="tabela-conteudo">
          <thead>
            <tr>
              <th class="col-nome">Tópico / Assunto</th>
              <th class="col-tempo">Tempo</th>
              <th class="col-num">Qts</th>
              <th class="col-num">Acertos</th>
              <th class="col-porc">%</th>
            </tr>
          </thead>
          <tbody>
            ${topicosHTML}
            <tr class="materia-total">
              <td class="nome"><strong>► TOTAL ${materia.nome.toUpperCase()}</strong></td>
              <td class="tempo"><strong>${formatHoras(materia.horas)}</strong></td>
              <td class="numero"><strong>${materia.questoes}</strong></td>
              <td class="numero"><strong>${materia.acertos}</strong></td>
              <td class="porcentagem ${materia.porcentagem >= 70 ? 'alta' : materia.porcentagem >= 50 ? 'media' : 'baixa'}"><strong>${materia.porcentagem}%</strong></td>
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
    body { 
      font-family: 'Arial', sans-serif; 
      font-size: 10pt; 
      line-height: 1.4; 
      color: #1a1a2e; 
      background: #ffffff; 
    }
    
    /* ============ CAPA ============ */
    .capa {
      min-height: 100vh;
      padding: 60px;
      background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
      color: #ffffff;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      page-break-after: always;
    }
    
    .capa .logo {
      font-size: 60px;
      margin-bottom: 20px;
    }
    
    .capa h1 { 
      font-size: 36pt; 
      font-weight: bold;
      margin-bottom: 10px; 
      text-transform: uppercase; 
      letter-spacing: 3px;
    }
    
    .capa .subtitulo {
      font-size: 16pt;
      color: #94a3b8;
      margin-bottom: 50px;
      font-weight: 300;
    }
    
    .capa .periodo-destaque {
      font-size: 24pt;
      color: #38bdf8;
      font-weight: bold;
      margin-bottom: 40px;
      padding: 15px 40px;
      border: 2px solid #38bdf8;
      border-radius: 8px;
    }
    
    .resumo-capa {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      width: 100%;
      max-width: 700px;
    }
    
    .resumo-item-capa {
      background: rgba(255,255,255,0.1);
      border-radius: 12px;
      padding: 20px;
      text-align: center;
    }
    
    .resumo-item-capa .icon { font-size: 28px; display: block; margin-bottom: 8px; }
    .resumo-item-capa .valor { font-size: 24pt; font-weight: bold; display: block; }
    .resumo-item-capa .rotulo { font-size: 9pt; color: #94a3b8; margin-top: 5px; }
    
    .resumo-item-capa .valor.alta { color: #22c55e; }
    .resumo-item-capa .valor.media { color: #eab308; }
    .resumo-item-capa .valor.baixa { color: #ef4444; }
    
    .data-rodape {
      position: absolute;
      bottom: 40px;
      font-size: 10pt;
      color: #64748b;
    }
    
    /* ============ PÁGINA DE CONTEÚDO ============ */
    .pagina-conteudo {
      padding: 40px 50px;
      min-height: 100vh;
      background: #ffffff;
    }
    
    .cabecalho-pagina {
      text-align: center;
      margin-bottom: 35px;
      padding-bottom: 20px;
      border-bottom: 3px solid #1a1a2e;
    }
    
    .cabecalho-pagina h1 {
      font-size: 22pt;
      color: #1a1a2e;
      margin-bottom: 5px;
    }
    
    .cabecalho-pagina .periodo {
      font-size: 12pt;
      color: #64748b;
    }
    
    /* ============ BLOCO DE MATÉRIA ============ */
    .materia-bloco {
      margin-bottom: 30px;
      page-break-inside: avoid;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
    }
    
    .materia-cabecalho {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      color: #ffffff;
      padding: 18px 25px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .materia-titulo {
      font-size: 16pt;
      font-weight: bold;
    }
    
    .materia-resumo {
      display: flex;
      gap: 25px;
    }
    
    .materia-resumo .resumo-item {
      font-size: 11pt;
    }
    
    .materia-resumo .resumo-item.alta { color: #22c55e; }
    .materia-resumo .resumo-item.media { color: #eab308; }
    .materia-resumo .resumo-item.baixa { color: #ef4444; }
    
    /* ============ TABELA ============ */
    .tabela-conteudo {
      width: 100%;
      border-collapse: collapse;
      font-size: 9pt;
    }
    
    .tabela-conteudo thead {
      background: #f1f5f9;
    }
    
    .tabela-conteudo th {
      padding: 12px 15px;
      text-align: left;
      font-weight: bold;
      color: #475569;
      border-bottom: 2px solid #cbd5e1;
      font-size: 8pt;
      text-transform: uppercase;
    }
    
    .tabela-conteudo td {
      padding: 10px 15px;
      border-bottom: 1px solid #e2e8f0;
      color: #334155;
    }
    
    .tabela-conteudo .col-nome { width: 45%; }
    .tabela-conteudo .col-tempo { width: 18%; text-align: center; }
    .tabela-conteudo .col-num { width: 12%; text-align: center; }
    .tabela-conteudo .col-porc { width: 13%; text-align: center; }
    
    .tabela-conteudo .tempo { text-align: center; font-weight: 500; }
    .tabela-conteudo .numero { text-align: center; }
    
    /* Linhas diferenciadas */
    .topico-row {
      background: #f8fafc;
    }
    
    .topico-row td {
      font-weight: 600;
      color: #1e293b;
    }
    
    .assunto-row td {
      padding-left: 30px;
      color: #64748b;
    }
    
    .materia-total {
      background: #1a1a2e !important;
    }
    
    .materia-total td {
      color: #ffffff !important;
      font-size: 10pt;
    }
    
    /* Porcentagens coloridas */
    .porcentagem.alta { color: #16a34a; font-weight: bold; }
    .porcentagem.media { color: #ca8a04; font-weight: bold; }
    .porcentagem.baixa { color: #dc2626; font-weight: bold; }
    
    /* ============ RODAPÉ ============ */
    .rodape {
      text-align: center;
      padding: 20px;
      font-size: 9pt;
      color: #94a3b8;
      border-top: 1px solid #e2e8f0;
      margin-top: 30px;
    }
    
    /* ============ IMPRESSÃO ============ */
    @media print {
      .capa, .pagina-conteudo { min-height: auto; }
      .materia-bloco { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <!-- CAPA -->
  <div class="capa">
    <div class="logo">📖</div>
    <h1>Relatório de Estudos</h1>
    <p class="subtitulo">Resumo detalhado do seu desempenho</p>
    
    <div class="periodo-destaque">📅 ${periodo.label}</div>
    
    <div class="resumo-capa">
      <div class="resumo-item-capa">
        <span class="icon">⏱️</span>
        <span class="valor">${formatHoras(resumo.totalHoras)}</span>
        <span class="rotulo">Tempo Total</span>
      </div>
      <div class="resumo-item-capa">
        <span class="icon">📝</span>
        <span class="valor">${resumo.totalQuestoes}</span>
        <span class="rotulo">Questões</span>
      </div>
      <div class="resumo-item-capa">
        <span class="icon">✅</span>
        <span class="valor">${resumo.totalAcertos}</span>
        <span class="rotulo">Acertos</span>
      </div>
      <div class="resumo-item-capa">
        <span class="icon">📊</span>
        <span class="valor ${resumo.porcentagemGeral >= 70 ? 'alta' : resumo.porcentagemGeral >= 50 ? 'media' : 'baixa'}">${resumo.porcentagemGeral}%</span>
        <span class="rotulo">Aproveitamento</span>
      </div>
    </div>
    
    <p class="data-rodape">Gerado em: ${formatDate(dataGeracao)}</p>
  </div>
  
  <!-- CONTEÚDO -->
  <div class="pagina-conteudo">
    <div class="cabecalho-pagina">
      <h1>📋 Detalhamento por Matéria</h1>
      <p class="periodo">Período: ${periodo.label}</p>
    </div>
    
    ${materiasHTML || '<p style="text-align:center;color:#666;padding:50px;">Nenhum registro de estudo encontrado no período selecionado.</p>'}
    
    <div class="rodape">
      Relatório gerado automaticamente pelo sistema KMDL-Med
    </div>
  </div>
</body>
</html>`;
}

module.exports = exports;

