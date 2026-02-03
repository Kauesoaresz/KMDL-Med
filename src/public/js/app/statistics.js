let currentPeriod = "all";
let materiasChart = null;

document.addEventListener("DOMContentLoaded", () => {
  setupPeriodButtons();
  loadMaterias();
});

/* =========================
   FILTRO DE PERÍODO
========================= */
function setupPeriodButtons() {
  const buttons = document.querySelectorAll(".period-filter button");

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      currentPeriod = btn.dataset.period;
      loadMaterias();
    });
  });
}

/* =========================
   CARREGAR MATÉRIAS
========================= */
async function loadMaterias() {
  const list = document.getElementById("materias-list");
  const detail = document.getElementById("detail-list");

  list.innerHTML = `<div class="placeholder">Carregando matérias...</div>`;
  detail.innerHTML = `<div class="placeholder">Selecione uma matéria para ver tópicos</div>`;

  try {
    const res = await fetch(`/estatisticas/materias?period=${currentPeriod}`);
    const materias = await res.json();

    if (!materias.length) {
      list.innerHTML = `<div class="placeholder">Nenhum dado encontrado</div>`;
      updateChart([]);
      return;
    }

    renderMaterias(materias);
    updateChart(materias);

  } catch (err) {
    console.error(err);
    list.innerHTML = `<div class="placeholder error">Erro ao carregar matérias</div>`;
  }
}

/* =========================
   RENDER MATÉRIAS
========================= */
function renderMaterias(materias) {
  const list = document.getElementById("materias-list");

  list.innerHTML = "";

  materias.forEach(mat => {
    const div = document.createElement("div");
    div.className = "stats-item";
    div.innerHTML = `
      <strong>${mat.nome}</strong>
      <span>${mat.horas}h • ${mat.questoes} questões</span>
      <span>${mat.aproveitamento}%</span>
    `;

    div.addEventListener("click", () => loadTopicos(mat.id, mat.nome));
    list.appendChild(div);
  });
}

/* =========================
   CARREGAR TÓPICOS
========================= */
async function loadTopicos(subjectId, nome) {
  const detail = document.getElementById("detail-list");
  const title = document.getElementById("detail-title");

  title.textContent = `Tópicos – ${nome}`;
  detail.innerHTML = `<div class="placeholder">Carregando tópicos...</div>`;

  try {
    const res = await fetch(
      `/estatisticas/materias/${subjectId}/topicos?period=${currentPeriod}`
    );
    const topicos = await res.json();

    if (!topicos.length) {
      detail.innerHTML = `<div class="placeholder">Sem tópicos registrados</div>`;
      return;
    }

    detail.innerHTML = "";

    topicos.forEach(t => {
      const div = document.createElement("div");
      div.className = "stats-item";
      div.innerHTML = `
        <strong>${t.nome}</strong>
        <span>${t.horas}h • ${t.questoes} questões</span>
        <span>${t.aproveitamento}%</span>
      `;

      div.addEventListener("click", () => loadAssuntos(t.id, t.nome));
      detail.appendChild(div);
    });

  } catch (err) {
    console.error(err);
    detail.innerHTML = `<div class="placeholder error">Erro ao carregar tópicos</div>`;
  }
}

/* =========================
   CARREGAR ASSUNTOS
========================= */
async function loadAssuntos(topicId, nome) {
  const detail = document.getElementById("detail-list");
  const title = document.getElementById("detail-title");

  title.textContent = `Assuntos – ${nome}`;
  detail.innerHTML = `<div class="placeholder">Carregando assuntos...</div>`;

  try {
    const res = await fetch(
      `/estatisticas/topicos/${topicId}/assuntos?period=${currentPeriod}`
    );
    const assuntos = await res.json();

    if (!assuntos.length) {
      detail.innerHTML = `<div class="placeholder">Sem assuntos registrados</div>`;
      return;
    }

    detail.innerHTML = "";

    assuntos.forEach(a => {
      const div = document.createElement("div");
      div.className = "stats-item";
      div.innerHTML = `
        <strong>${a.nome}</strong>
        <span>${a.horas}h • ${a.questoes} questões</span>
        <span>${a.aproveitamento}%</span>
      `;
      detail.appendChild(div);
    });

  } catch (err) {
    console.error(err);
    detail.innerHTML = `<div class="placeholder error">Erro ao carregar assuntos</div>`;
  }
}

/* =========================
   GRÁFICO
========================= */
function updateChart(materias) {
  const ctx = document.getElementById("materiasChart");

  if (!ctx) return;

  if (materiasChart) materiasChart.destroy();

  materiasChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: materias.map(m => m.nome),
      datasets: [{
        label: "Aproveitamento (%)",
        data: materias.map(m => m.aproveitamento)
      }]
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
}
