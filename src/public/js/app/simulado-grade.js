(function () {
  const S = window.SIM;
  const PER = 45;
  const MOTIVO_LABEL = {
    falta_atencao: "Falta de atenção",
    falta_conteudo: "Falta de conteúdo",
    lacuna: "Lacuna de conhecimento",
  };
  const ICONE = { certa: "✓", errada: "✕", nao_feita: "—" };

  const $ = (id) => document.getElementById(id);

  /* =========================
     ESTADO: 180 posições, tudo "certa"
  ========================= */
  const state = {};
  for (let n = 1; n <= 180; n++) state[n] = { estado: "certa" };
  S.questoes.forEach((q) => { state[q.n] = Object.assign({}, q); });

  let modoNaoFeita = false;

  // área fechada = as 45 questões estão como "não feita"
  const locked = {};
  S.areas.forEach((a) => {
    let todas = true;
    for (let n = a.start; n < a.start + PER; n++) {
      if (state[n].estado !== "nao_feita") { todas = false; break; }
    }
    locked[a.key] = todas;
  });

  function areaOf(n) {
    return S.areas.find((a) => n >= a.start && n < a.start + PER);
  }

  /* =========================
     AUTOSAVE (fila + debounce)
  ========================= */
  let dirty = false;
  let timer = null;
  let chain = Promise.resolve();

  function markDirty() {
    dirty = true;
    $("msg-salvo").textContent = "● alterações pendentes...";
    clearTimeout(timer);
    timer = setTimeout(() => salvar(true), 800);
  }

  function buildPayload() {
    const payload = {
      nome: $("sim-nome").value,
      redacao_nota: $("sim-redacao").value,
      tempos: {},
      questoes: [],
    };

    S.areas.forEach((a) => { payload.tempos[a.key] = $("tempo-" + a.key).value; });

    for (let n = 1; n <= 180; n++) {
      const q = state[n];
      if (q.estado === "certa") continue;
      // errada ainda sem motivo = modal aberto, não envia
      if (q.estado === "errada" && !q.motivo) continue;
      payload.questoes.push({
        n,
        estado: q.estado,
        motivo: q.motivo || null,
        subject_id: q.subject_id || null,
        topic_id: q.topic_id || null,
        anotacao: q.anotacao || null,
      });
    }
    return payload;
  }

  async function doSave(silent) {
    if (!$("sim-nome").value.trim()) {
      $("msg-salvo").textContent = "⚠ Dê um nome ao simulado para salvar";
      if (!silent) alert("Dê um nome ao simulado.");
      return false;
    }

    dirty = false;
    $("msg-salvo").textContent = "Salvando...";

    try {
      const res = await fetch("/simulados/" + S.id + "/gabarito", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });
      const json = await res.json();

      if (!res.ok) {
        dirty = true;
        $("msg-salvo").textContent = "⚠ " + (json.error || "Erro ao salvar");
        if (!silent) alert(json.error || "Erro ao salvar.");
        return false;
      }

      if (!dirty) $("msg-salvo").textContent = "✓ Salvo automaticamente";
      return true;
    } catch (e) {
      dirty = true;
      $("msg-salvo").textContent = "⚠ Falha de conexão (tentando de novo na próxima alteração)";
      if (!silent) alert("Falha de conexão ao salvar.");
      return false;
    }
  }

  function salvar(silent) {
    clearTimeout(timer);
    chain = chain.then(() => doSave(silent));
    return chain;
  }

  /* =========================
     GRADE
  ========================= */
  S.areas.forEach((a) => {
    const box = $("grid-" + a.key);
    for (let i = 0; i < PER; i++) {
      const n = a.start + i;
      const b = document.createElement("button");
      b.type = "button";
      b.className = "cell certa";
      b.dataset.n = n;
      b.innerHTML = '<span class="cell-n">' + n + '</span><span class="cell-i">' + ICONE.certa + "</span>";
      box.appendChild(b);
    }
    box.addEventListener("click", (e) => {
      const b = e.target.closest(".cell");
      if (b) onCell(Number(b.dataset.n));
    });
  });

  function paintCell(n) {
    const b = document.querySelector('.cell[data-n="' + n + '"]');
    if (!b) return;
    const est = state[n].estado;
    b.className = "cell " + est;
    b.querySelector(".cell-i").textContent = ICONE[est];
  }

  function paintArea(a) {
    for (let n = a.start; n < a.start + PER; n++) paintCell(n);
  }

  function onCell(n) {
    if (locked[areaOf(n).key]) return;
    const q = state[n];

    /* ---- MODO "NÃO FEITA": um clique alterna ---- */
    if (modoNaoFeita) {
      state[n] = { estado: q.estado === "nao_feita" ? "certa" : "nao_feita" };
      paintCell(n);
      markDirty();
      refresh();
      return;
    }

    /* ---- CICLO NORMAL ---- */
    if (q.estado === "certa") {
      state[n] = { estado: "errada", motivo: null, subject_id: null, topic_id: null, anotacao: null };
      paintCell(n);
      openModal(n, true);
      return;
    }

    state[n] = { estado: q.estado === "errada" ? "nao_feita" : "certa" };
    paintCell(n);
    markDirty();
    refresh();
  }

  /* =========================
     MODO "NÃO FEITA"
  ========================= */
  $("btn-modo-nf").addEventListener("click", () => {
    modoNaoFeita = !modoNaoFeita;
    $("btn-modo-nf").classList.toggle("on", modoNaoFeita);
    $("btn-modo-nf").textContent = '🚫 Modo "não feita": ' + (modoNaoFeita ? "LIGADO" : "desligado");
  });

  /* =========================
     CADEADO POR ÁREA
  ========================= */
  function applyLockUI(a) {
    const isLocked = locked[a.key];
    $("grid-" + a.key).classList.toggle("locked", isLocked);
    $("closed-" + a.key).style.display = isLocked ? "block" : "none";
    $("lock-" + a.key).textContent = isLocked ? "🔒 Abrir área" : "🔓 Fechar área";
  }

  function toggleLock(a) {
    if (!locked[a.key]) {
      let erradas = 0;
      for (let n = a.start; n < a.start + PER; n++) {
        if (state[n].estado === "errada") erradas++;
      }
      if (erradas > 0 && !confirm("Esta área tem " + erradas + " questão(ões) errada(s). Fechar vai apagar esses erros. Continuar?")) {
        return;
      }
      for (let n = a.start; n < a.start + PER; n++) state[n] = { estado: "nao_feita" };
      locked[a.key] = true;
    } else {
      for (let n = a.start; n < a.start + PER; n++) state[n] = { estado: "certa" };
      locked[a.key] = false;
    }

    paintArea(a);
    applyLockUI(a);
    markDirty();
    refresh();
  }

  S.areas.forEach((a) => {
    $("lock-" + a.key).addEventListener("click", () => toggleLock(a));
  });

  /* =========================
     RESUMO AO VIVO
  ========================= */
  function updateSummary() {
    let totAcertos = 0;
    let totFeitas = 0;

    S.areas.forEach((a) => {
      let erradas = 0;
      let naoFeitas = 0;
      for (let n = a.start; n < a.start + PER; n++) {
        if (state[n].estado === "errada") erradas++;
        else if (state[n].estado === "nao_feita") naoFeitas++;
      }
      const feitas = PER - naoFeitas;
      const acertos = feitas - erradas;
      const pct = feitas > 0 ? Math.round((acertos / feitas) * 100) : 0;

      $("sum-" + a.key).textContent = acertos + "/" + feitas + " · " + pct + "%";
      totAcertos += acertos;
      totFeitas += feitas;
    });

    $("sum-acertos").textContent = totAcertos;
    $("sum-feitas").textContent = totFeitas;
    $("sum-pct").textContent = (totFeitas > 0 ? Math.round((totAcertos / totFeitas) * 100) : 0) + "%";
  }

  /* =========================
     LISTA DE ERRADAS
  ========================= */
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function renderLista() {
    const box = $("lista-erros");
    const itens = [];
    for (let n = 1; n <= 180; n++) {
      if (state[n].estado === "errada" && state[n].motivo) itens.push(n);
    }

    if (!itens.length) {
      box.innerHTML = '<p style="opacity:.7;">Nenhuma questão errada. 🎯</p>';
      return;
    }

    box.innerHTML = itens
      .map((n) => {
        const q = state[n];
        const area = areaOf(n);
        let detalhe = MOTIVO_LABEL[q.motivo] || "sem motivo";
        if (q.motivo === "lacuna" && q.subject_nome) {
          detalhe += " — " + escapeHtml(q.subject_nome) + (q.topic_nome ? " → " + escapeHtml(q.topic_nome) : "");
        }
        if (q.anotacao) detalhe += " · “" + escapeHtml(q.anotacao) + "”";
        return (
          '<div class="item"><strong>Q' + n + "</strong>" +
          "<span>" + area.label + " · " + detalhe + "</span>" +
          '<button type="button" data-edit="' + n + '">✏️ Editar</button></div>'
        );
      })
      .join("");
  }

  $("lista-erros").addEventListener("click", (e) => {
    const b = e.target.closest("[data-edit]");
    if (b) openModal(Number(b.dataset.edit), false);
  });

  function refresh() {
    updateSummary();
    renderLista();
  }

  /* =========================
     MODAL DE DIAGNÓSTICO
  ========================= */
  let modalN = null;
  let modalNew = false;
  let draft = { motivo: null };

  function showMotivo() {
    document.querySelectorAll("#m-motivos button").forEach((b) => {
      b.classList.toggle("active", b.dataset.motivo === draft.motivo);
    });
    $("m-lacuna").style.display = draft.motivo === "lacuna" ? "block" : "none";
  }

  async function loadTopics(subjectId, selected) {
    const sel = $("m-topic");
    sel.innerHTML = '<option value="">Tópico</option>';
    sel.disabled = true;
    if (!subjectId) return;

    try {
      const res = await fetch("/conteudos/api/topicos/" + subjectId);
      const topics = await res.json();
      topics.forEach((t) => {
        const o = document.createElement("option");
        o.value = t.id;
        o.textContent = t.nome;
        sel.appendChild(o);
      });
      sel.disabled = false;
      if (selected) sel.value = String(selected);
    } catch (e) {
      $("m-err").textContent = "Não foi possível carregar os tópicos.";
    }
  }

  async function openModal(n, isNew) {
    modalN = n;
    modalNew = isNew;
    const q = state[n];

    draft = { motivo: q.motivo || null };
    $("m-title").textContent = "Questão " + n + " — " + areaOf(n).label;
    $("m-anot").value = q.anotacao || "";
    $("m-err").textContent = "";
    $("m-subject").value = q.subject_id ? String(q.subject_id) : "";
    $("m-topic").innerHTML = '<option value="">Tópico</option>';
    $("m-topic").disabled = true;
    showMotivo();

    $("modal").classList.add("open");

    if (q.subject_id) await loadTopics(q.subject_id, q.topic_id);
  }

  function closeModal() {
    $("modal").classList.remove("open");
    modalN = null;
  }

  function cancelModal() {
    if (modalN === null) return;
    if (modalNew) {
      state[modalN] = { estado: "certa" };
      paintCell(modalN);
      refresh();
    }
    closeModal();
  }

  function confirmModal() {
    if (!draft.motivo) {
      $("m-err").textContent = "Escolha o motivo do erro.";
      return;
    }

    const item = {
      estado: "errada",
      motivo: draft.motivo,
      subject_id: null,
      topic_id: null,
      subject_nome: null,
      topic_nome: null,
      anotacao: $("m-anot").value.trim() || null,
    };

    if (draft.motivo === "lacuna") {
      const sId = $("m-subject").value;
      const tId = $("m-topic").value;
      if (!sId || !tId) {
        $("m-err").textContent = "Lacuna exige matéria e tópico.";
        return;
      }
      item.subject_id = Number(sId);
      item.topic_id = Number(tId);
      item.subject_nome = $("m-subject").selectedOptions[0].textContent;
      item.topic_nome = $("m-topic").selectedOptions[0].textContent;
    }

    state[modalN] = item;
    paintCell(modalN);
    markDirty();
    refresh();
    closeModal();
  }

  $("m-motivos").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-motivo]");
    if (!b) return;
    draft.motivo = b.dataset.motivo;
    $("m-err").textContent = "";
    showMotivo();
  });

  $("m-subject").addEventListener("change", () => loadTopics($("m-subject").value, null));
  $("m-ok").addEventListener("click", confirmModal);
  $("m-cancel").addEventListener("click", cancelModal);
  $("modal").addEventListener("click", (e) => { if (e.target.id === "modal") cancelModal(); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalN !== null) cancelModal();
  });

  /* =========================
     BOTÕES DO TOPO
  ========================= */
  $("btn-salvar").addEventListener("click", () => salvar(false));

  $("btn-status").addEventListener("click", async () => {
    const atual = $("btn-status").dataset.status;
    const novo = atual === "finalizado" ? "em_andamento" : "finalizado";

    if (!(await salvar(false))) return;

    const res = await fetch("/simulados/" + S.id + "/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: novo }),
    });

    if (res.ok) {
      dirty = false;
      location.reload();
    } else {
      alert("Não foi possível alterar o status.");
    }
  });

  ["sim-nome", "sim-redacao"].concat(S.areas.map((a) => "tempo-" + a.key)).forEach((id) => {
    $(id).addEventListener("input", markDirty);
  });

  window.addEventListener("beforeunload", (e) => {
    if (dirty) {
      e.preventDefault();
      e.returnValue = "";
    }
  });

  /* =========================
     INÍCIO
  ========================= */
  S.areas.forEach((a) => { paintArea(a); applyLockUI(a); });
  refresh();
})();