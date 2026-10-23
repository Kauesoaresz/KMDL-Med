(function () {
  const S = window.SIMSTATS || {};
  const charts = [];

  function cssVar(n) {
    return getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  }

  function draw() {
    charts.splice(0).forEach(c => c.destroy());

    const text = cssVar("--text-muted");
    const grid = cssVar("--border");
    const ok = cssVar("--ok");
    const err = cssVar("--err");
    const chart1 = cssVar("--chart-1");
    const chart5 = cssVar("--chart-5");

    /* --- Áreas --- */
    const elArea = document.getElementById("chartArea");
    if (elArea) {
      const labels = { linguagens: "Linguagens", humanas: "Humanas", naturezas: "Naturezas", matematica: "Matemática" };
      const keys = Object.keys(S.porArea);
      charts.push(new Chart(elArea, {
        type: "bar",
        data: {
          labels: keys.map(k => labels[k]),
          datasets: [
            { label: "Acertos", data: keys.map(k => S.porArea[k].acertos), backgroundColor: ok, borderRadius: 6 },
            { label: "Erros",   data: keys.map(k => S.porArea[k].erros),   backgroundColor: err, borderRadius: 6 },
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

    /* --- Evolução --- */
    const elEv = document.getElementById("chartEvolucao");
    if (elEv && S.evolucao.length) {
      charts.push(new Chart(elEv, {
        type: "line",
        data: {
          labels: S.evolucao.map(e => e.nome),
          datasets: [
            {
              label: "Aproveitamento",
              data: S.evolucao.map(e => e.percentual),
              borderColor: chart1,
              backgroundColor: "transparent",
              tension: 0.35, pointRadius: 4,
            },
            {
              label: "Média móvel (3)",
              data: S.evolucao.map(e => e.mediaMovel),
              borderColor: chart5,
              borderDash: [6, 4],
              backgroundColor: "transparent",
              tension: 0.35, pointRadius: 0,
            },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { labels: { color: text } } },
          scales: {
            x: { grid: { display: false }, ticks: { color: text, maxRotation: 45, minRotation: 0 } },
            y: {
              beginAtZero: true, max: 100,
              grid: { color: grid },
              ticks: { color: text, callback: v => v + "%" },
            },
          },
        },
      }));
    }
  }

  draw();
  document.addEventListener("themechange", draw);
})();