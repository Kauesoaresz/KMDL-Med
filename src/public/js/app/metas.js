(function () {
  const GOALS = window.GOALS || {};
  const HOJE = window.HOJE;
  const $ = (id) => document.getElementById(id);

  /* =========================
     ABAS (lembra pela URL)
  ========================= */
  function showTab(key) {
    document.querySelectorAll("#tabs .tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === key));
    document.querySelectorAll(".panel").forEach((p) => { p.hidden = p.dataset.panel !== key; });
    history.replaceState(null, "", "#" + key);
  }

  $("tabs").addEventListener("click", (e) => {
    const t = e.target.closest(".tab");
    if (t) showTab(t.dataset.tab);
  });

  const initial = location.hash.replace("#", "");
  if (["ativas", "concluidas", "vencidas"].includes(initial)) showTab(initial);

  /* =========================
     API
  ========================= */
  async function api(method, url, body) {
    try {
      const res = await fetch(url, {
        method,
        headers: body ? { "Content-Type": "application/json" } : {},
        body: body ? JSON.stringify(body) : undefined,
      });
      let data = {};
      try { data = await res.json(); } catch (e) {}
      return { ok: res.ok, data };
    } catch (e) {
      return { ok: false, data: { erro: "Falha de conexão." } };
    }
  }

  /* =========================
     DATAS
  ========================= */
  const isoOf = (d) =>
    d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  const parse = (iso) => { const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d); };
  const addDays = (iso, n) => { const d = parse(iso); d.setDate(d.getDate() + n); return isoOf(d); };
  const endOfMonth = (iso) => { const d = parse(iso); return isoOf(new Date(d.getFullYear(), d.getMonth() + 1, 0)); };

  /* =========================
     MODAL
  ========================= */
  let editingId = null;

  function err(msg) {
    $("m-err").textContent = msg || "";
    $("m-err").hidden = !msg;
  }

  function openModal(id) {
    editingId = id || null;
    err("");
    const g = id ? GOALS[id] : null;

    $("m-title").textContent = g ? "Editar meta" : "Nova meta";
    $("f-nome").value = g ? g.nome : "";
    $("f-horas").value = g ? g.meta_horas : "";
    $("f-quest").value = g && g.meta_questoes ? g.meta_questoes : "";
    $("f-ini").value = g ? g.data_inicio : HOJE;
    $("f-lim").value = g ? g.data_limite : addDays(HOJE, 30);
    $("f-princ").checked = g ? g.eh_principal : false;

    $("modal").classList.add("open");
    setTimeout(() => $("f-nome").focus(), 50);
  }

  function closeModal() { $("modal").classList.remove("open"); }

  $("btn-new").addEventListener("click", () => openModal(null));
  document.querySelectorAll("[data-new]").forEach((b) => b.addEventListener("click", () => openModal(null)));
  $("m-cancel").addEventListener("click", closeModal);
  $("modal").addEventListener("click", (e) => { if (e.target.id === "modal") closeModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

  // atalhos de preenchimento
  document.querySelectorAll("[data-add-h]").forEach((b) => b.addEventListener("click", () => {
    $("f-horas").value = (parseFloat($("f-horas").value) || 0) + Number(b.dataset.addH);
  }));
  document.querySelectorAll("[data-add-q]").forEach((b) => b.addEventListener("click", () => {
    $("f-quest").value = (parseInt($("f-quest").value, 10) || 0) + Number(b.dataset.addQ);
  }));
  document.querySelectorAll("[data-add-d]").forEach((b) => b.addEventListener("click", () => {
    $("f-lim").value = addDays($("f-ini").value || HOJE, Number(b.dataset.addD));
  }));
  $("q-eom").addEventListener("click", () => { $("f-lim").value = endOfMonth($("f-ini").value || HOJE); });

  // salvar
  async function save() {
    err("");
    const body = {
      nome: $("f-nome").value,
      meta_horas: $("f-horas").value,
      meta_questoes: $("f-quest").value || 0,
      data_inicio: $("f-ini").value,
      data_limite: $("f-lim").value,
      eh_principal: $("f-princ").checked,
    };

    $("m-save").disabled = true;
    const r = editingId
      ? await api("PUT", "/api/metas/" + editingId, body)
      : await api("POST", "/api/metas/criar", body);
    $("m-save").disabled = false;

    if (!r.ok) return err(r.data.erro || "Erro ao salvar.");
    location.hash = "ativas";
    location.reload();
  }

  $("m-save").addEventListener("click", save);
  ["f-nome", "f-horas", "f-quest"].forEach((id) => {
    $(id).addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); save(); } });
  });

  /* =========================
     AÇÕES DO CARD
  ========================= */
  document.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    const card = btn.closest(".goal");
    if (!card) return;
    const id = card.dataset.id;

    if (btn.dataset.act === "edit") return openModal(id);

    if (btn.dataset.act === "star") {
      const r = await api("POST", "/api/metas/" + id + "/principal");
      if (!r.ok) return alert(r.data.erro || "Erro.");
      return location.reload();
    }

    if (btn.dataset.act === "done") {
      if (!confirm("Marcar esta meta como concluída?")) return;
      const r = await api("POST", "/api/metas/" + id + "/finalizar");
      if (!r.ok) return alert(r.data.erro || "Erro.");
      location.hash = "concluidas";
      return location.reload();
    }

    if (btn.dataset.act === "del") {
      if (!confirm("Excluir esta meta? Isso não apaga seus estudos.")) return;
      const r = await api("DELETE", "/api/metas/" + id);
      if (!r.ok) return alert(r.data.erro || "Erro.");
      return location.reload();
    }
  });
})();