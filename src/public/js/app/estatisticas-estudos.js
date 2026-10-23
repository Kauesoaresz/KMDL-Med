(function () {
  const S = window.STATS || {};
  const charts = [];

  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function draw() {
    charts.splice(0).forEach((c) => c.destroy());

    const text = cssVar("--text-muted");
    const grid = cssVar("--border");
    const chart1 = cssVar("--chart-1");
    const chart2 = cssVar("--chart-2");
    const chart3 = cssVar("--chart-3");
    const chart4 = cssVar("--chart-4");
    const accent = cssVar("--accent");
    const surface = cssVar("--surface");

    /* ---- Evolução ---- */
    const elEv = document.getElementById("chartEvolucao");
    if (elEv && S.evolucao.length) {
      charts.push(new Chart(elEv, {
        type: "line",
        data: {
          labels: S.evolucao.map(e => e.label),
          datasets: [
            {
              label: "Horas",
              data: S.evolucao.map(e => e.horas),
              borderColor: chart1,
              backgroundColor: hexToRgba(chart1, 0.12),
              fill: true, tension: 0.35, pointRadius: 2,
              yAxisID: "y",
            },
            {
              label: "Questões",
              data: S.evolucao.map(e => e.questoes),
              borderColor: chart2,
              backgroundColor: hexToRgba(chart2, 0.12),
              fill: true, tension: 0.35, pointRadius: 2,
              yAxisID: "y1",
            },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          interaction: { mode: "index", intersect: false },
          plugins: { legend: { labels: { color: text } } },
          scales: {
            x: { grid: { color: grid }, ticks: { color: text, maxRotation: 0 } },
            y: { beginAtZero: true, position: "left", grid: { color: grid }, ticks: { color: text } },
            y1: { beginAtZero: true, position: "right", grid: { drawOnChartArea: false }, ticks: { color: text } },
          },
        },
      }));
    }

    /* ---- Padrão semanal ---- */
    const elSem = document.getElementById("chartSemana");
    if (elSem) {
      charts.push(new Chart(elSem, {
        type: "bar",
        data: {
          labels: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"],
          datasets: [{
            label: "Horas",
            data: S.horasPorDia,
            backgroundColor: [
              hexToRgba(chart4, 0.85),
              hexToRgba(chart1, 0.85),
              hexToRgba(chart1, 0.85),
              hexToRgba(chart1, 0.85),
              hexToRgba(chart1, 0.85),
              hexToRgba(chart1, 0.85),
              hexToRgba(chart4, 0.85),
            ],
            borderRadius: 6,
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, ticks: { color: text } },
            y: { beginAtZero: true, grid: { color: grid }, ticks: { color: text } },
          },
        },
      }));
    }
  }

  // hex (#rrggbb) -> rgba. Se o token não for hex, devolve com alpha via color-mix alternativo.
  function hexToRgba(color, alpha) {
    const m = color.match(/^#?([0-9a-f]{6})$/i);
    if (!m) return color;
    const n = parseInt(m[1], 16);
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return `rgba(${r},${g},${b},${alpha})`;
  }

  draw();
  document.addEventListener("themechange", draw);
})();