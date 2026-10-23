(function () {
  const CAL = window.CAL;
  const $ = (id) => document.getElementById(id);
  const STORAGE_KEY = "kmed-cal-mode";
  const ATTR = { horas: "h", questoes: "q", lendario: "l" };
  const COLOR_CLASS = /^(zero|h\d+|lv\d)$/;

  const cells = Array.from(document.querySelectorAll("#cal-grid .kmed-cal-day"));
  const grid = $("cal-grid");

  function setMode(mode) {
    if (!ATTR[mode]) mode = "horas";

    cells.forEach((cell) => {
      Array.from(cell.classList).forEach((c) => {
        if (COLOR_CLASS.test(c)) cell.classList.remove(c);
      });
      cell.classList.add(cell.dataset[ATTR[mode]]);
    });

    grid.classList.remove("mode-horas", "mode-questoes", "mode-lendario");
    grid.classList.add("mode-" + mode);

    document.querySelectorAll("#cal-modes button").forEach((b) => {
      b.classList.toggle("active", b.dataset.mode === mode);
    });

    document.querySelectorAll(".kmed-calendar-legend").forEach((l) => {
      l.style.display = l.dataset.legend === mode ? "" : "none";
    });

    try { localStorage.setItem(STORAGE_KEY, mode); } catch (e) {}
  }

  $("cal-modes").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-mode]");
    if (b) setMode(b.dataset.mode);
  });

  let saved = "horas";
  try { saved = localStorage.getItem(STORAGE_KEY) || "horas"; } catch (e) {}
  setMode(saved);

  /* =========================
     MODAL DO DIA
  ========================= */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => (
      { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
    ));
  }

  function openDay(dia) {
    const d = CAL.dias.find((x) => x.dia === dia);
    if (!d) return;

    $("cal-m-title").textContent = d.data.split("-").reverse().join("/");

    const temDados = d.horasNum > 0 || d.questoes > 0;
    let html = "";

    if (!temDados) {
      html = '<p class="cal-empty">Nenhum estudo registrado neste dia.</p>';
      $("cal-m-edit").href = "/registrar/novo";
      $("cal-m-edit").textContent = "➕ Registrar estudo";
    } else {
      $("cal-m-edit").href = "/registrar/editar/" + d.data;
      $("cal-m-edit").textContent = "✏️ Editar dia";

      html +=
        '<div class="cal-m-kpis">' +
        "<div><small>Tempo</small><strong>" + esc(d.horas) + "</strong></div>" +
        "<div><small>Questões</small><strong>" + d.questoes + "</strong></div>" +
        "<div><small>Acertos</small><strong>" + d.acertos + "</strong></div>" +
        "<div><small>Aproveitamento</small><strong>" + d.acertoPct + "%</strong></div>" +
        "</div>";

      if (d.nivel) {
        html += '<p class="cal-m-nivel">' + esc(d.icone || "") + " Nível do dia: <strong>" + esc(d.nivel) + "</strong></p>";
      }

      if (d.materias && d.materias.length) {
        html +=
          '<table class="cal-m-table"><thead><tr>' +
          "<th>Matéria</th><th>Tempo</th><th>Questões</th><th>Acertos</th><th>%</th>" +
          "</tr></thead><tbody>" +
          d.materias.map((m) =>
            "<tr><td>" +
              '<span class="cal-m-dot" style="background: hsl(' + (m.hue != null ? m.hue : 245) + ' var(--chart-s) var(--chart-l))"></span>' +
              esc(m.nome) +
            "</td><td>" + esc(m.horas) + "</td><td>" +
            m.questoes + "</td><td>" + m.acertos + "</td><td>" + m.acertoPct + "%</td></tr>"
          ).join("") +
          "</tbody></table>";
      }
    }

    $("cal-m-body").innerHTML = html;
    $("cal-modal").classList.add("open");
  }

  function closeModal() {
    $("cal-modal").classList.remove("open");
  }

  $("cal-grid").addEventListener("click", (e) => {
    const cell = e.target.closest(".kmed-cal-day");
    if (cell && !cell.disabled) openDay(Number(cell.dataset.dia));
  });

  $("cal-modal-close").addEventListener("click", closeModal);
  $("cal-modal").addEventListener("click", (e) => {
    if (e.target.id === "cal-modal") closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });
})();