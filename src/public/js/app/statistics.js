// =========================
// ESTADO GLOBAL
// =========================
let currentPeriod = "all";
let materiasChart = null;

// =========================
// ELEMENTOS
// =========================
const materiasList = document.getElementById("materias-list");
const detailList = document.getElementById("detail-list");
const detailTitle = document.getElementById("detail-title");
const filterButtons = document.querySelectorAll(".period-filter button");

// =========================
// HELPERS
// =========================
function itemTemplate(label, stats) {
  return `
    <div class="stats-item">
      <div class="stats-item-header">
        <strong>${label}</strong>
        <span class="stats-percent">${stats.aproveitamento}%</span>
      </div>
      <div class="stats-item-sub">
        ${stats.horas}h • ${stats.questoes} questões
      </div>
      <div class="stats-bar">
        <div class="stats-bar-fill" style="width:${stats.aproveitamento}%"></div>
      </div>
    </div>
  `;
}

function loading(target, text = "Carregando...") {
  target.innerHTML = `<div class="placeholder">${text}</div>`;
}

// =========================
// FILTRO DE PERÍODO
// =========================
filterButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    filterButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    currentPeriod = btn.dataset.period;

    loadMaterias();
    renderChart();
  });
});

// =========================
// BREADCRUMB
// =========================
function bindBreadcrumb() {
  const link = document.querySelector(".breadcrumb-link");
  if (!link) return;

  link.addEventListener("click", () => {
    const subjectId = link.dataset.subject;
    const subjectNome = link.dataset.nome;
    loadTopicos(subjectId, subjectNome);
  });
}

// =========================
// CARREGAR MATÉRIAS
// =========================
async function loadMaterias() {
  loading(materiasList, "Carregando matérias...");
  detailTitle.textContent = "Detalhes";
  detailList.innerHTML =
    `<div class="placeholder">Selecione uma matéria para ver tópicos</div>`;

  try {
    const res = await fetch(`/estatisticas/materias?period=${currentPeriod}`);
    const materias = await res.json();

    if (!materias.length) {
      materiasList.innerHTML =
        `<div class="placeholder">Nenhuma matéria registrada</div>`;
      return;
    }

    materiasList.innerHTML = "";
    materias.forEach(m => {
      const el = document.createElement("div");
      el.innerHTML = itemTemplate(m.nome, m);
      el.firstElementChild.addEventListener("click", () => {
        loadTopicos(m.id, m.nome);
      });
      materiasList.appendChild(el.firstElementChild);
    });
  } catch (err) {
    materiasList.innerHTML =
      `<div class="placeholder">Erro ao carregar matérias</div>`;
  }
}

// =========================
// CARREGAR TÓPICOS
// =========================
async function loadTopicos(subjectId, subjectNome) {
  loading(detailList, "Carregando tópicos...");

  detailTitle.innerHTML = `
    <span 
      class="breadcrumb-link" 
      data-subject="${subjectId}" 
      data-nome="${subjectNome}">
      📘 ${subjectNome}
    </span>
  `;

  try {
    const res = await fetch(
      `/estatisticas/materias/${subjectId}/topicos?period=${currentPeriod}`
    );
    const topicos = await res.json();

    if (!topicos.length) {
      detailList.innerHTML =
        `<div class="placeholder">Nenhum tópico registrado</div>`;
      bindBreadcrumb();
      return;
    }

    detailList.innerHTML = "";
    topicos.forEach(t => {
      const el = document.createElement("div");
      el.innerHTML = itemTemplate(t.nome, t);
      el.firstElementChild.addEventListener("click", () => {
        loadAssuntos(t.id, t.nome, subjectId, subjectNome);
      });
      detailList.appendChild(el.firstElementChild);
    });

    bindBreadcrumb();
  } catch (err) {
    detailList.innerHTML =
      `<div class="placeholder">Erro ao carregar tópicos</div>`;
  }
}

// =========================
// CARREGAR ASSUNTOS
// =========================
async function loadAssuntos(topicId, topicNome, subjectId, subjectNome) {
  loading(detailList, "Carregando assuntos...");

  detailTitle.innerHTML = `
    <span 
      class="breadcrumb-link" 
      data-subject="${subjectId}" 
      data-nome="${subjectNome}">
      📘 ${subjectNome}
    </span>
    <span class="breadcrumb-sep">›</span>
    <span>📄 ${topicNome}</span>
  `;

  try {
    const res = await fetch(
      `/estatisticas/topicos/${topicId}/assuntos?period=${currentPeriod}`
    );
    const assuntos = await res.json();

    if (!assuntos.length) {
      detailList.innerHTML =
        `<div class="placeholder">Nenhum assunto registrado</div>`;
      bindBreadcrumb();
      return;
    }

    detailList.innerHTML = "";
    assuntos.forEach(a => {
      const el = document.createElement("div");
      el.innerHTML = itemTemplate(a.nome, a);
      detailList.appendChild(el.firstElementChild);
    });

    bindBreadcrumb();
  } catch (err) {
    detailList.innerHTML =
      `<div class="placeholder">Erro ao carregar assuntos</div>`;
  }
}

// =========================
// GRÁFICO
// =========================
async function renderChart() {
  try {
    const res = await fetch(`/estatisticas/materias?period=${currentPeriod}`);
    const data = await res.json();

    const labels = data.map(m => m.nome);
    const values = data.map(m => m.aproveitamento);

    const ctx = document
      .getElementById("materiasChart")
      .getContext("2d");

    if (materiasChart) materiasChart.destroy();

    materiasChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Aproveitamento (%)",
            data: values,
            backgroundColor: "#22c55e"
          }
        ]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            max: 100
          }
        }
      }
    });
  } catch (err) {
    console.error("Erro ao renderizar gráfico", err);
  }
}

// =========================
// INIT
// =========================
loadMaterias();
renderChart();
