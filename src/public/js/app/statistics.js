// =========================
// ELEMENTOS
// =========================
const materiasList = document.getElementById("materias-list");
const detailList = document.getElementById("detail-list");
const detailTitle = document.getElementById("detail-title");

// =========================
// HELPERS
// =========================
function itemTemplate(label, stats) {
  return `
    <div class="stats-item">
      <div class="label">${label}</div>
      <div class="value">
        ${stats.horas}h • ${stats.questoes} questões • ${stats.aproveitamento}%
      </div>
    </div>
  `;
}

function loading(target, text = "Carregando...") {
  target.innerHTML = `<div class="placeholder">${text}</div>`;
}

// =========================
// CARREGAR MATÉRIAS
// =========================
async function loadMaterias() {
  loading(materiasList);

  const res = await fetch("/estatisticas/materias");
  const materias = await res.json();

  if (!materias.length) {
    materiasList.innerHTML = `<div class="placeholder">Nenhuma matéria registrada</div>`;
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
}

// =========================
// CARREGAR TÓPICOS
// =========================
async function loadTopicos(subjectId, subjectNome) {
  loading(detailList, "Carregando tópicos...");
  detailTitle.textContent = `📘 ${subjectNome}`;

  const res = await fetch(`/estatisticas/materias/${subjectId}/topicos`);
  const topicos = await res.json();

  if (!topicos.length) {
    detailList.innerHTML = `<div class="placeholder">Nenhum tópico registrado</div>`;
    return;
  }

  detailList.innerHTML = "";
  topicos.forEach(t => {
    const el = document.createElement("div");
    el.innerHTML = itemTemplate(t.nome, t);
    el.firstElementChild.addEventListener("click", () => {
      loadAssuntos(t.id, t.nome, subjectNome);
    });
    detailList.appendChild(el.firstElementChild);
  });
}

// =========================
// CARREGAR ASSUNTOS
// =========================
async function loadAssuntos(topicId, topicNome, subjectNome) {
  loading(detailList, "Carregando assuntos...");
  detailTitle.textContent = `📘 ${subjectNome} › ${topicNome}`;

  const res = await fetch(`/estatisticas/topicos/${topicId}/assuntos`);
  const assuntos = await res.json();

  if (!assuntos.length) {
    detailList.innerHTML = `<div class="placeholder">Nenhum assunto registrado</div>`;
    return;
  }

  detailList.innerHTML = "";
  assuntos.forEach(a => {
    const el = document.createElement("div");
    el.innerHTML = itemTemplate(a.nome, a);
    detailList.appendChild(el.firstElementChild);
  });
}

// =========================
// INIT
// =========================
loadMaterias();
