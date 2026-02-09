/* =========================
   ESTADO GLOBAL
========================= */
let periodoAtual = "all";
let nivelAtual = "materia"; // materia | topico | assunto
let contextoAtual = null;   // materiaId ou topicoId

/* =========================
   INIT
========================= */
document.addEventListener("DOMContentLoaded", () => {
  setupPeriodoButtons();
  carregarMaterias();
});

/* =========================
   CONTROLES – PERÍODO
========================= */
function setupPeriodoButtons() {
  const btns = document.querySelectorAll(".periodo-btn");

  btns.forEach(btn => {
    btn.addEventListener("click", () => {
      btns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      periodoAtual = btn.dataset.period;
      nivelAtual = "materia";
      contextoAtual = null;

      limparDetalhes();
      carregarMaterias();
    });
  });
}

/* =========================
   MATÉRIAS (LISTA PRINCIPAL)
========================= */
async function carregarMaterias() {
  nivelAtual = "materia";
  contextoAtual = null;

  const lista = document.getElementById("lista-itens");
  const tituloLista = document.getElementById("lista-titulo");

  tituloLista.textContent = "Matérias";
  lista.innerHTML = `<div class="placeholder">Carregando matérias...</div>`;

  const res = await fetch(`/estatisticas/materias?period=${periodoAtual}`);
  const materias = await res.json();

  if (!materias.length) {
    lista.innerHTML = `<div class="placeholder">Nenhum dado encontrado</div>`;
    atualizarResumoGeral([]);
    return;
  }

  renderizarLista(materias, "materia");
  atualizarResumoGeral(materias);
}

/* =========================
   TÓPICOS (DETALHES)
========================= */
async function carregarTopicos(materia) {
  nivelAtual = "topico";
  contextoAtual = materia.id;

  const detalhes = document.getElementById("detalhe-conteudo");
  const tituloDetalhe = document.getElementById("detalhe-titulo");

  tituloDetalhe.textContent = `Tópicos — ${materia.nome}`;
  detalhes.innerHTML = `<div class="placeholder">Carregando tópicos...</div>`;

  const res = await fetch(
    `/estatisticas/materias/${materia.id}/topicos?period=${periodoAtual}`
  );
  const topicos = await res.json();

  renderizarDetalhesLista(topicos, "topico");
}

/* =========================
   ASSUNTOS (DETALHES)
========================= */
async function carregarAssuntos(topico) {
  nivelAtual = "assunto";
  contextoAtual = topico.id;

  const detalhes = document.getElementById("detalhe-conteudo");
  const tituloDetalhe = document.getElementById("detalhe-titulo");

  tituloDetalhe.textContent = `Assuntos — ${topico.nome}`;
  detalhes.innerHTML = `<div class="placeholder">Carregando assuntos...</div>`;

  const res = await fetch(
    `/estatisticas/topicos/${topico.id}/assuntos?period=${periodoAtual}`
  );
  const assuntos = await res.json();

  renderizarDetalhesLista(assuntos, "assunto");
}

/* =========================
   RENDER LISTA PRINCIPAL
========================= */
function renderizarLista(dados, tipo) {
  const lista = document.getElementById("lista-itens");
  lista.innerHTML = "";

  dados.forEach(item => {
    const div = document.createElement("div");
    div.className = "item-conteudo";

    div.innerHTML = `
      <div class="item-header">
        <strong>${item.nome}</strong>
        <span class="badge">${item.aproveitamento}%</span>
      </div>
      <div class="item-sub">
        ${item.horas}h • ${item.questoes} questões • ${item.acertos} acertos
      </div>
    `;

    div.onclick = () => {
      renderizarDetalhes(item);
      renderizarDiagnostico(item);
      carregarTopicos(item);
    };

    lista.appendChild(div);
  });
}

/* =========================
   RENDER DETALHES LISTA
========================= */
function renderizarDetalhesLista(dados, tipo) {
  const box = document.getElementById("detalhe-conteudo");
  box.innerHTML = "";
  box.classList.add("scroll");

  if (!dados.length) {
    box.innerHTML = `<div class="placeholder">Nenhum dado encontrado</div>`;
    return;
  }

  dados.forEach(item => {
    const div = document.createElement("div");
    div.className = "item-conteudo";

    div.innerHTML = `
      <div class="item-header">
        <strong>${item.nome}</strong>
        <span class="badge">${item.aproveitamento}%</span>
      </div>
      <div class="item-sub">
        ${item.horas}h • ${item.questoes} questões • ${item.acertos} acertos
      </div>
    `;

    div.onclick = () => {
      renderizarDetalhes(item);
      renderizarDiagnostico(item);

      if (tipo === "topico") {
        carregarAssuntos(item);
      }
    };

    box.appendChild(div);
  });
}

/* =========================
   RESUMO GERAL
========================= */
function atualizarResumoGeral(dados) {
  let horas = 0, questoes = 0, acertos = 0;

  dados.forEach(d => {
    horas += Number(d.horas || 0);
    questoes += Number(d.questoes || 0);
    acertos += Number(d.acertos || 0);
  });

  const erros = questoes - acertos;
  const aproveitamento = questoes > 0
    ? Math.round((acertos / questoes) * 100)
    : 0;

  document.getElementById("resumo-horas").textContent = `${horas}h`;
  document.getElementById("resumo-questoes").textContent = questoes;
  document.getElementById("resumo-acertos").textContent = acertos;
  document.getElementById("resumo-erros").textContent = erros;
  document.getElementById("resumo-aproveitamento").textContent = `${aproveitamento}%`;
}

/* =========================
   DETALHES NUMÉRICOS
========================= */
function renderizarDetalhes(item) {
  const box = document.getElementById("detalhe-conteudo");
  const erros = item.questoes - item.acertos;

  box.innerHTML = `
    <div class="detalhe-grid">
      <div class="detalhe-card">
        <span>Horas estudadas</span>
        <strong>${item.horas}h</strong>
      </div>
      <div class="detalhe-card">
        <span>Questões</span>
        <strong>${item.questoes}</strong>
      </div>
      <div class="detalhe-card">
        <span>Acertos</span>
        <strong>${item.acertos}</strong>
      </div>
      <div class="detalhe-card">
        <span>Erros</span>
        <strong>${erros}</strong>
      </div>
      <div class="detalhe-card destaque">
        <span>Aproveitamento</span>
        <strong>${item.aproveitamento}%</strong>
      </div>
    </div>
  `;
}

/* =========================
   DIAGNÓSTICO
========================= */
function renderizarDiagnostico(item) {
  const box = document.getElementById("diagnostico-box");

  if (item.questoes === 0) {
    box.innerHTML = `
      <p>⚠️ Nenhum estudo registrado nesse período.</p>
      <p>Conteúdo completamente negligenciado.</p>
    `;
    return;
  }

  if (item.aproveitamento >= 85) {
    box.innerHTML = `
      <p>✅ Conteúdo consolidado.</p>
      <p>Mantenha com revisões espaçadas.</p>
    `;
    return;
  }

  if (item.aproveitamento >= 65) {
    box.innerHTML = `
      <p>⚠️ Desempenho intermediário.</p>
      <p>Possível lacuna pontual ou falta de atenção.</p>
    `;
    return;
  }

  box.innerHTML = `
    <p>🚨 Baixo aproveitamento.</p>
    <p>Alta chance de falta de base teórica.</p>
    <p>Recomenda-se voltar à teoria.</p>
  `;
}

/* =========================
   LIMPAR
========================= */
function limparDetalhes() {
  document.getElementById("detalhe-conteudo").innerHTML = `
    <div class="placeholder">
      Clique em um item para ver a análise completa.
    </div>
  `;

  document.getElementById("diagnostico-box").innerHTML = `
    <p class="placeholder">
      O diagnóstico aparecerá aqui.
    </p>
  `;
}
