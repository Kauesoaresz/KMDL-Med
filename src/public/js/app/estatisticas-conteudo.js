(function () {
  const C = window.CONTEUDO || {};
  const charts = [];

  function cssVar(n) {
    return getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  }

  // mesma fórmula do resto do site: matiz estável por índice
  function hueFor(i) {
    return Math.round((245 + i * 137.508) % 360);
  }

  function hsl(h, s, l, a) {
    return a == null ? `hsl(${h} ${s} ${l})` : `hsl(${h} ${s} ${l} / ${a})`;
  }

  function draw() {
    charts.splice(0).forEach(c => c.destroy());

    const s = cssVar("--chart-s");
    const l = cssVar("--chart-l");
    const text = cssVar("--text-muted");
    const grid = cssVar("--border");
    const surface = cssVar("--surface");
    const ok = cssVar("--ok");
    const err = cssVar("--err");

    /* --- Distribuição (doughnut) --- */
    const elDist = document.getElementById("chartDistribuicao");
    if (elDist && C.materias.length) {
      const data = C.materias.map(m => Number(m.horas) || 0);
      charts.push(new Chart(elDist, {
        type: "doughnut",
        data: {
          labels: C.materias.map(m => m.nome),
          datasets: [{
            data,
            backgroundColor: C.materias.map((_, i) => hsl(hueFor(i), s, l, 0.85)),
            borderColor: surface,
            borderWidth: 3,
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "right",
              labels: { color: text, padding: 10, font: { size: 11 } },
            },
          },
        },
      }));
    }

    /* --- Acertos vs erros (top 5 por questões) --- */
    const elAE = document.getElementById("chartAcertosErros");
    if (elAE && C.materias.length) {
      const top = [...C.materias].sort((a, b) => b.questoes - a.questoes).slice(0, 5);
      charts.push(new Chart(elAE, {
        type: "bar",
        data: {
          labels: top.map(m => m.nome),
          datasets: [
            { label: "Acertos", data: top.map(m => m.acertos), backgroundColor: ok, borderRadius: 6 },
            { label: "Erros",   data: top.map(m => m.erros),   backgroundColor: err, borderRadius: 6 },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { labels: { color: text } } },
          scales: {
            x: { grid: { display: false }, ticks: { color: text } },
            y: { beginAtZero: true, grid: { color: grid }, ticks: { color: text } },
          },
        },
      }));
    }
  }

  draw();
  document.addEventListener("themechange", draw);
})();