document.addEventListener("DOMContentLoaded", () => {
  const redacaoData = window.redacaoData || {};
  const avancado = redacaoData.avancado || {};

  const chartBase = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "top" } }
  };

  const hist = document.getElementById("notaHistogramChart");
  if (hist && avancado.distribution) {
    new Chart(hist, {
      type: "bar",
      data: {
        labels: ["<500", "500-599", "600-699", "700-799", "800-899", "900+"],
        datasets: [{
          label: "Redações",
          data: [
            avancado.distribution.lt500 || 0,
            avancado.distribution["500-599"] || 0,
            avancado.distribution["600-699"] || 0,
            avancado.distribution["700-799"] || 0,
            avancado.distribution["800-899"] || 0,
            avancado.distribution["900+"] || 0
          ],
          backgroundColor: ["#ef4444", "#f59e0b", "#84cc16", "#06b6d4", "#6366f1", "#a855f7"]
        }]
      },
      options: { ...chartBase, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } }
    });
  }

  const estilos = document.getElementById("topEstilosChart");
  if (estilos && Array.isArray(avancado.topEstilos) && avancado.topEstilos.length) {
    new Chart(estilos, {
      type: "doughnut",
      data: {
        labels: avancado.topEstilos.map((e) => e.estilo),
        datasets: [{ data: avancado.topEstilos.map((e) => e.total) }]
      },
      options: chartBase
    });
  }

  const scatter = document.getElementById("tempoNotaScatter");
  if (scatter && Array.isArray(redacaoData.ultimasRedacoes)) {
    const points = redacaoData.ultimasRedacoes
      .filter((r) => r.nota != null && r.horas != null)
      .map((r) => ({ x: Number(r.horas) * 60, y: Number(r.nota) }));

    new Chart(scatter, {
      type: "scatter",
      data: { datasets: [{ label: "Tempo x Nota", data: points, backgroundColor: "#3b82f6" }] },
      options: {
        ...chartBase,
        scales: {
          x: { title: { display: true, text: "Tempo (min)" } },
          y: { title: { display: true, text: "Nota" }, beginAtZero: true, max: 1000 }
        }
      }
    });
  }

  const evolucao = document.getElementById("evolucaoNotaChart");
  if (evolucao && Array.isArray(redacaoData.ultimasRedacoes) && redacaoData.ultimasRedacoes.length) {
    const base = [...redacaoData.ultimasRedacoes].slice(0, 10).reverse();
    new Chart(evolucao, {
      type: "line",
      data: {
        labels: base.map((r) => new Date(r.data).toLocaleDateString("pt-BR")),
        datasets: [{
          label: "Nota",
          data: base.map((r) => Number(r.nota || 0)),
          borderColor: "#6366f1",
          backgroundColor: "rgba(99, 102, 241, 0.15)",
          fill: true,
          tension: 0.35
        }]
      },
      options: { ...chartBase, scales: { y: { beginAtZero: true, max: 1000 } } }
    });
  }

  const modal = document.getElementById("redacaoDetailsModal");
  const closeModal = document.getElementById("closeModal");
  const modalContent = document.getElementById("modalContent");
  const rows = document.querySelectorAll(".redacao-table-row");

  rows.forEach((row) => {
    row.addEventListener("click", async (event) => {
      if (event.target.closest("button") || event.target.closest("textarea") || event.target.closest("a") || event.target.closest("form")) return;
      const id = row.dataset.entryId;
      if (!id) return;

      try {
        const response = await fetch(`/estatisticas/redacao/${id}`);
        const d = await response.json();
        if (!response.ok || d.error) throw new Error("Erro ao carregar");

        modalContent.innerHTML = `
          <h3>${new Date(d.data).toLocaleDateString("pt-BR")} - ${d.estilo || "Redação"}</h3>
          <p><strong>Tema:</strong> ${d.tema || "Não informado"}</p>
          <p><strong>Nota:</strong> ${d.nota ?? "—"} | <strong>Tempo:</strong> ${Math.floor(Number(d.horas || 0))}h ${Math.round((Number(d.horas || 0) % 1) * 60)}m</p>
          <p><strong>C1-C5:</strong> ${d.c1 ?? "—"}, ${d.c2 ?? "—"}, ${d.c3 ?? "—"}, ${d.c4 ?? "—"}, ${d.c5 ?? "—"}</p>
          <p><strong>Comentário:</strong> ${d.comentario || "Sem comentário"}</p>
        `;
        modal.classList.add("active");
      } catch (e) {
        alert("Não foi possível abrir os detalhes.");
      }
    });
  });

  if (closeModal) closeModal.addEventListener("click", () => modal.classList.remove("active"));
  if (modal) modal.addEventListener("click", (e) => { if (e.target === modal) modal.classList.remove("active"); });

  document.querySelectorAll(".btn-inline-save-comment").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.entryId;
      const input = document.querySelector(`.inline-comentario[data-entry-id="${id}"]`);
      if (!id || !input) return;
      const oldText = btn.textContent;
      btn.disabled = true;
      btn.textContent = "Salvando...";
      try {
        const response = await fetch(`/redacao/comentario/${id}`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ comentario: input.value || "" })
        });
        const payload = await response.json();
        if (!response.ok || !payload.ok) throw new Error("Falha");
        btn.textContent = "Salvo";
      } catch (e) {
        btn.textContent = "Erro";
      } finally {
        setTimeout(() => {
          btn.textContent = oldText;
          btn.disabled = false;
        }, 1200);
      }
    });
  });
});
