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
     MODAL DE DIAGNÓSTICO (chips)
  ========================= */
  let modalN = null;
  let modalNew = false;
  let draft = { motivo: null, subject_id: null, topic_id: null };

  // cache de tópicos por matéria (evita fetch repetido)
  const topicsCache = {};

  function showMotivo() {
    document.querySelectorAll("#m-motivos button").forEach((b) => {
      b.classList.toggle("active", b.dataset.motivo === draft.motivo);
    });
    $("m-lacuna").style.display = draft.motivo === "lacuna" ? "block" : "none";
  }

  function renderSubjChips() {
    const box = $("m-subj-chips");
    if (!S.subjects || !S.subjects.length) {
      box.innerHTML = '<span class="muted">Nenhuma matéria cadastrada.</span>';
      return;
    }
    box.innerHTML = S.subjects
      .map((s) =>
        '<button type="button" class="pick' + (draft.subject_id === s.id ? " on" : "") +
        '" style="--h:' + s.hue + '" data-id="' + s.id + '"><i></i>' + escapeHtml(s.nome) + "</button>"
      )
      .join("");
  }

  function renderTopicChips(topics) {
    const box = $("m-topic-chips");
    if (!topics || !topics.length) {
      box.innerHTML = '<span class="muted">Escolha uma matéria primeiro.</span>';
      return;
    }
    box.innerHTML = topics
      .filter((t) => t.nome.trim().toLowerCase() !== "geral")
      .map((t) =>
        '<button type="button" class="pick' + (draft.topic_id === t.id ? " on" : "") +
        '" data-id="' + t.id + '"><i></i>' + escapeHtml(t.nome) + "</button>"
      )
      .join("") || '<span class="muted">Esta matéria não tem tópicos.</span>';
  }

  async function loadTopicsForSubject(subjectId) {
    if (topicsCache[subjectId]) {
      renderTopicChips(topicsCache[subjectId]);
      return;
    }
    $("m-topic-chips").innerHTML = '<span class="muted">Carregando tópicos…</span>';
    try {
      const res = await fetch("/conteudos/api/topicos/" + subjectId);
      const topics = await res.json();
      topicsCache[subjectId] = topics;
      renderTopicChips(topics);
    } catch (e) {
      $("m-err").textContent = "Não foi possível carregar os tópicos.";
      $("m-topic-chips").innerHTML = "";
    }
  }

  $("m-subj-chips").addEventListener("click", (e) => {
    const b = e.target.closest(".pick");
    if (!b) return;
    const id = Number(b.dataset.id);
    draft.subject_id = id;
    draft.topic_id = null;
    renderSubjChips();
    loadTopicsForSubject(id);
    $("m-err").textContent = "";
  });

  $("m-topic-chips").addEventListener("click", (e) => {
    const b = e.target.closest(".pick");
    if (!b) return;
    draft.topic_id = Number(b.dataset.id);
    // repinta só o "on" dos chips
    $("m-topic-chips").querySelectorAll(".pick").forEach((el) => {
      el.classList.toggle("on", Number(el.dataset.id) === draft.topic_id);
    });
    $("m-err").textContent = "";
  });

  async function openModal(n, isNew) {
    modalN = n;
    modalNew = isNew;
    const q = state[n];

    draft = {
      motivo: q.motivo || null,
      subject_id: q.subject_id || null,
      topic_id: q.topic_id || null,
    };

    $("m-title").textContent = "Questão " + n + " — " + areaOf(n).label;
    $("m-anot").value = q.anotacao || "";
    $("m-err").textContent = "";

    renderSubjChips();
    if (draft.subject_id) await loadTopicsForSubject(draft.subject_id);
    else $("m-topic-chips").innerHTML = '<span class="muted">Escolha uma matéria primeiro.</span>';

    showMotivo();
    $("modal").classList.add("open");
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
      if (!draft.subject_id || !draft.topic_id) {
        $("m-err").textContent = "Lacuna exige matéria e tópico.";
        return;
      }
      const subj = S.subjects.find((s) => s.id === draft.subject_id);
      const topics = topicsCache[draft.subject_id] || [];
      const top = topics.find((t) => t.id === draft.topic_id);

      item.subject_id = draft.subject_id;
      item.topic_id = draft.topic_id;
      item.subject_nome = subj ? subj.nome : null;
      item.topic_nome = top ? top.nome : null;
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