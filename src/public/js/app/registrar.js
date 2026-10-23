(function () {
  const R = window.REG;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

  const subjById = {};
  R.subjects.forEach((s) => { subjById[s.id] = s; });

  const isGeral = (t) => t.nome.trim().toLowerCase() === "geral";
  const pct = (a, q) => (q > 0 ? Math.round((a / q) * 100) : null);
  const fmt = (min) => {
    const h = Math.floor(min / 60), m = min % 60;
    if (!h) return m + "min";
    return m ? h + "h " + m + "min" : h + "h";
  };

  /* =========================
     ESTADO
  ========================= */
  const st = {
    subject: null,
    topic: null, // null = Geral
    date: R.data,
    blocks: (R.entries || []).map((e) => ({
      subject_id: e.subject_id,
      topic_id: e.topic_id || null,
      min: e.minutos || 0,
      q: e.questoes || 0,
      a: e.acertos || 0,
    })),
  };
  const registered = new Set(R.registered || []);

  /* =========================
     MATÉRIA E TÓPICO
  ========================= */
  function renderSubjects() {
    if (!R.subjects.length) {
      $("subj-chips").innerHTML = '<p class="muted">Nenhuma matéria cadastrada. <a href="/conteudos/materias">Cadastre aqui</a>.</p>';
      return;
    }
    $("subj-chips").innerHTML = R.subjects
      .map((s) =>
        '<button type="button" class="pick' + (st.subject === s.id ? " on" : "") +
        '" style="--h:' + s.hue + '" data-id="' + s.id + '"><i></i>' + esc(s.nome) + "</button>"
      ).join("");
  }

  function renderTopics() {
    const s = subjById[st.subject];
    if (!s) {
      $("topic-chips").innerHTML = '<span class="hint">Escolha uma matéria para ver os tópicos</span>';
      return;
    }
    const lista = s.topics.filter((t) => !isGeral(t));
    let html =
      '<button type="button" class="pick' + (st.topic === null ? " on" : "") +
      '" style="--h:' + s.hue + '" data-id=""><i></i>Geral</button>';
    html += lista.map((t) =>
      '<button type="button" class="pick' + (st.topic === t.id ? " on" : "") +
      '" style="--h:' + s.hue + '" data-id="' + t.id + '"><i></i>' + esc(t.nome) + "</button>"
    ).join("");
    $("topic-chips").innerHTML = html;
  }

  function selectSubject(id) {
    st.subject = id;
    st.topic = null;
    renderSubjects();
    renderTopics();
    $("comp-fields").classList.remove("off");
  }

  $("subj-chips").addEventListener("click", (e) => {
    const b = e.target.closest(".pick");
    if (b) selectSubject(Number(b.dataset.id));
  });

  $("topic-chips").addEventListener("click", (e) => {
    const b = e.target.closest(".pick");
    if (!b) return;
    st.topic = b.dataset.id ? Number(b.dataset.id) : null;
    renderTopics();
  });

  /* =========================
     TEMPO
  ========================= */
  const tH = $("t-h"), tM = $("t-m");
  const getMin = () => (parseInt(tH.value, 10) || 0) * 60 + (parseInt(tM.value, 10) || 0);
  function setMin(v) {
    v = Math.max(0, v);
    tH.value = Math.floor(v / 60);
    tM.value = v % 60;
  }

  document.querySelectorAll("[data-add]").forEach((b) => {
    b.addEventListener("click", () => setMin(getMin() + Number(b.dataset.add)));
  });
  $("t-reset").addEventListener("click", () => setMin(0));
  tH.addEventListener("change", () => setMin(getMin()));
  tM.addEventListener("change", () => setMin(getMin()));

  /* =========================
     QUESTÕES
  ========================= */
  function updatePct() {
    const q = parseInt($("c-q").value, 10) || 0;
    const a = parseInt($("c-a").value, 10) || 0;
    const p = pct(a, q);
    const el = $("c-pct");
    el.textContent = p === null ? "—" : p + "%";
    el.className = "badge" + (p === null ? "" : p >= 70 ? " badge-ok" : p >= 50 ? " badge-warn" : " badge-err");
  }
  $("c-q").addEventListener("input", updatePct);
  $("c-a").addEventListener("input", updatePct);

  /* =========================
     ADICIONAR BLOCO
  ========================= */
  function cErr(msg) {
    const el = $("c-err");
    el.textContent = msg || "";
    el.hidden = !msg;
    return false;
  }

  function resetComposer() {
    setMin(0);
    $("c-q").value = "";
    $("c-a").value = "";
    st.topic = null;
    renderTopics();
    updatePct();
  }

  function addBlock() {
    cErr("");
    if (st.subject === null) return cErr("Escolha uma matéria.");
    const min = getMin();
    if (min <= 0) return cErr("Informe o tempo estudado.");
    const q = parseInt($("c-q").value, 10) || 0;
    const a = parseInt($("c-a").value, 10) || 0;
    if (a > q) return cErr("Os acertos não podem ser maiores que as questões.");

    st.blocks.push({ subject_id: st.subject, topic_id: st.topic, min, q, a });
    resetComposer();
    renderBlocks();
    return true;
  }

  $("c-add").addEventListener("click", addBlock);

  ["t-h", "t-m", "c-q", "c-a"].forEach((id) => {
    $(id).addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.ctrlKey) { e.preventDefault(); addBlock(); }
    });
  });

  /* =========================
     LISTA DE BLOCOS + RESUMO
  ========================= */
  function topicName(b) {
    if (!b.topic_id) return "Geral";
    const s = subjById[b.subject_id];
    const t = s && s.topics.find((x) => x.id === b.topic_id);
    return t ? t.nome : "Geral";
  }

  function renderBlocks() {
    $("count").textContent = st.blocks.length;

    if (!st.blocks.length) {
      $("blocks").innerHTML = '<p class="muted empty-note">Nenhum bloco ainda.</p>';
    } else {
      $("blocks").innerHTML = st.blocks.map((b, i) => {
        const s = subjById[b.subject_id] || { nome: "Matéria", hue: 245 };
        const p = pct(b.a, b.q);
        return (
          '<div class="block" style="--h:' + s.hue + '">' +
            '<div class="block-main">' +
              "<strong>" + esc(s.nome) + '</strong><span class="muted"> · ' + esc(topicName(b)) + "</span>" +
            "</div>" +
            '<span class="num">⏱ ' + fmt(b.min) + "</span>" +
            '<span class="num muted">' + (b.q > 0 ? b.a + "/" + b.q + " (" + p + "%)" : "sem questões") + "</span>" +
            '<div class="block-actions">' +
              '<button type="button" class="btn-ghost btn-sm" data-act="edit" data-i="' + i + '" title="Editar">✏️</button>' +
              '<button type="button" class="btn-ghost btn-sm" data-act="del" data-i="' + i + '" title="Remover">✕</button>' +
            "</div>" +
          "</div>"
        );
      }).join("");
    }

    const min = st.blocks.reduce((s, b) => s + b.min, 0);
    const q = st.blocks.reduce((s, b) => s + b.q, 0);
    const a = st.blocks.reduce((s, b) => s + b.a, 0);
    const p = pct(a, q);
    $("s-tempo").textContent = fmt(min);
    $("s-q").textContent = q;
    $("s-a").textContent = a;
    $("s-pct").textContent = p === null ? "—" : p + "%";
  }

  $("blocks").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    const i = Number(btn.dataset.i);

    if (btn.dataset.act === "del") {
      st.blocks.splice(i, 1);
      renderBlocks();
      return;
    }

    const b = st.blocks.splice(i, 1)[0];
    selectSubject(b.subject_id);
    const s = subjById[b.subject_id];
    const t = b.topic_id && s.topics.find((x) => x.id === b.topic_id);
    st.topic = t && !isGeral(t) ? t.id : null;
    renderTopics();
    setMin(b.min);
    $("c-q").value = b.q || "";
    $("c-a").value = b.a || "";
    updatePct();
    renderBlocks();
    $("c-q").focus();
  });

  /* =========================
     CALENDÁRIO (só no modo novo)
  ========================= */
  const isoOf = (y, m, d) => y + "-" + String(m + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0");
  const addDays = (iso, n) => {
    const [y, m, d] = iso.split("-").map(Number);
    const dt = new Date(y, m - 1, d + n);
    return isoOf(dt.getFullYear(), dt.getMonth(), dt.getDate());
  };

  function updateDateInfo() {
    const [y, m, d] = st.date.split("-").map(Number);
    $("date-label").textContent = new Date(y, m - 1, d).toLocaleDateString("pt-BR", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
    $("f-data").value = st.date;

    if (!R.editing) {
      const dup = registered.has(st.date);
      $("dup").hidden = !dup;
      $("dup-link").href = "/registrar/editar/" + st.date;
      $("btn-save").textContent = dup ? "💾 Substituir dia" : "💾 Salvar dia";
    }
  }

  if (!R.editing) {
    let [vy, vm] = st.date.split("-").map(Number);
    vm -= 1;

    function renderCal() {
      $("cal-title").textContent = MESES[vm] + " " + vy;
      const first = new Date(vy, vm, 1).getDay();
      const total = new Date(vy, vm + 1, 0).getDate();
      let html = "";
      for (let i = 0; i < first; i++) html += '<span class="cal-day empty"></span>';
      for (let d = 1; d <= total; d++) {
        const iso = isoOf(vy, vm, d);
        const cls = ["cal-day"];
        if (iso === R.hoje) cls.push("today");
        if (iso === st.date) cls.push("sel");
        if (registered.has(iso)) cls.push("has");
        html += '<button type="button" class="' + cls.join(" ") + '" data-d="' + iso + '"' +
                (iso > R.hoje ? " disabled" : "") + ">" + d + "</button>";
      }
      $("cal-days").innerHTML = html;
    }

    function setDate(iso) {
      st.date = iso;
      const [y, m] = iso.split("-").map(Number);
      vy = y; vm = m - 1;
      renderCal();
      updateDateInfo();
    }

    $("cal-days").addEventListener("click", (e) => {
      const b = e.target.closest("[data-d]");
      if (b && !b.disabled) setDate(b.dataset.d);
    });
    $("cal-prev").addEventListener("click", () => { vm--; if (vm < 0) { vm = 11; vy--; } renderCal(); });
    $("cal-next").addEventListener("click", () => { vm++; if (vm > 11) { vm = 0; vy++; } renderCal(); });
    $("q-hoje").addEventListener("click", () => setDate(R.hoje));
    $("q-ontem").addEventListener("click", () => setDate(addDays(R.hoje, -1)));

    renderCal();
  }

  /* =========================
     SALVAR
  ========================= */
  const form = $("form-dia");

  form.addEventListener("submit", (e) => {
    // sobrou algo preenchido? adiciona sozinho
    if (st.subject !== null && getMin() > 0) {
      if (!addBlock()) { e.preventDefault(); return; }
    }

    if (!st.blocks.length) {
      e.preventDefault();
      const el = $("f-err");
      el.textContent = "Adicione pelo menos um bloco de estudo.";
      el.hidden = false;
      return;
    }

    const box = $("hidden");
    box.innerHTML = "";
    const put = (name, value) => {
      const i = document.createElement("input");
      i.type = "hidden"; i.name = name; i.value = value;
      box.appendChild(i);
    };

    st.blocks.forEach((b, i) => {
      put("blocos[" + i + "][subject_id]", b.subject_id);
      put("blocos[" + i + "][topic_id]", b.topic_id || "");
      put("blocos[" + i + "][horas]", Math.floor(b.min / 60));
      put("blocos[" + i + "][minutos]", b.min % 60);
      put("blocos[" + i + "][questoes]", b.q);
      put("blocos[" + i + "][acertos]", b.a);
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.ctrlKey) { e.preventDefault(); form.requestSubmit(); }
  });

  /* =========================
     INÍCIO
  ========================= */
  renderSubjects();
  renderTopics();
  renderBlocks();
  updatePct();
  updateDateInfo();
})();