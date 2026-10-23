// ============================================================
// public/js/app/trilha.js
// ============================================================

(function () {
  "use strict";

  const $  = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  let scroller = null;
  let track = null;

  // ---------- Toast de celebração ----------
  function mostrarToast({ titulo, xp, subtitulo, sucesso }) {
    const toast = $("#trilhaToast");
    if (!toast) return;

    toast.innerHTML = `
      <div class="trilha-toast-icon">${sucesso ? "🎉" : "⚠️"}</div>
      <div class="trilha-toast-title" style="color:${sucesso ? "var(--ok)" : "var(--err)"}">
        ${titulo || (sucesso ? "RESGATADO!" : "Ops!")}
      </div>
      ${xp ? `<div class="trilha-toast-xp">+${xp} XP</div>` : ""}
      ${subtitulo ? `<div class="trilha-toast-sub">${subtitulo}</div>` : ""}
    `;

    toast.classList.remove("is-visible");
    void toast.offsetWidth;
    toast.classList.add("is-visible");

    if (sucesso) soltarConfetes(toast);

    clearTimeout(toast._hideTimer);
    toast._hideTimer = setTimeout(() => {
      toast.classList.remove("is-visible");
    }, 2600);
  }

  function soltarConfetes(container) {
    const cores = ["#6366f1", "#22c55e", "#f59e0b", "#ec4899", "#06b6d4", "#a855f7"];
    const qtd = 26;
    for (let i = 0; i < qtd; i++) {
      const c = document.createElement("div");
      c.className = "trilha-confete";
      c.style.background = cores[i % cores.length];
      c.style.left = "50%";
      c.style.top = "50%";
      const ang = (Math.PI * 2 * i) / qtd;
      const dist = 120 + Math.random() * 80;
      c.style.setProperty("--dx", Math.cos(ang) * dist + "px");
      c.style.setProperty("--dy", Math.sin(ang) * dist + "px");
      c.style.setProperty("--rot", Math.floor(Math.random() * 1440) + "deg");
      c.style.animationDelay = (Math.random() * 0.08) + "s";
      container.appendChild(c);
      setTimeout(() => c.remove(), 1500);
    }
  }

  // ---------- Calcular a linha de progresso (sem foto) ----------
  function posicionarLinhaProgresso() {
    if (!track) return;
    const marcos = $$(".trilha-marco", track);
    if (marcos.length === 0) return;

    const valorAtual = parseFloat(scroller.dataset.valorAtual || "0");
    const trackRect = track.getBoundingClientRect();

    // Pega as posições X dos marcos
    const centros = marcos.map(el => {
      const r = el.getBoundingClientRect();
      return {
        valor: parseFloat(el.dataset.valor || "0"),
        x: r.left + r.width / 2 - trackRect.left,
      };
    });

    const primeiroX = centros[0].x;
    const ultimoX = centros[centros.length - 1].x;
    const ultimoValor = centros[centros.length - 1].valor;

    let pct = 0;
    let pinX = primeiroX;

    // Se já bateu tudo, vai até o fim
    if (valorAtual >= ultimoValor) {
      pct = 100;
      pinX = ultimoX;
    } 
    // Se está no meio do caminho, interpola
    else {
      for (let i = 0; i < centros.length - 1; i++) {
        if (valorAtual >= centros[i].valor && valorAtual < centros[i+1].valor) {
          const faixaValor = centros[i+1].valor - centros[i].valor;
          const faixaX = centros[i+1].x - centros[i].x;
          const progresso = (valorAtual - centros[i].valor) / faixaValor;
          pinX = centros[i].x + (faixaX * progresso);
          
          const totalFaixa = ultimoX - primeiroX;
          pct = totalFaixa > 0 ? ((pinX - primeiroX) / totalFaixa) * 100 : 0;
          break;
        }
      }
    }

    // Aplica a largura da linha azul
    track.style.setProperty("--trilha-progresso", pct + "%");

    // Cria/atualiza o marcador (bolinha) na ponta
    let marker = $("#trilhaProgressMarker");
    if (!marker) {
      marker = document.createElement("div");
      marker.id = "trilhaProgressMarker";
      marker.className = "trilha-progress-marker";
      track.appendChild(marker);
    }
    marker.style.left = pinX + "px";
  }

  // ---------- Scroll lateral ----------
  function ligarScrollLateral() {
    scroller = $("#trilhaScroll");
    track = $(".trilha-track");
    const btnL = $(".trilha-scroll-btn--left");
    const btnR = $(".trilha-scroll-btn--right");
    if (!scroller || !btnL || !btnR) return;

    function passo() { return Math.max(240, scroller.clientWidth * 0.8); }
    btnL.addEventListener("click", () => scroller.scrollBy({ left: -passo(), behavior: "smooth" }));
    btnR.addEventListener("click", () => scroller.scrollBy({ left: passo(), behavior: "smooth" }));

    function atualizarBotoes() {
      const maxScroll = scroller.scrollWidth - scroller.clientWidth;
      btnL.disabled = scroller.scrollLeft <= 2;
      btnR.disabled = scroller.scrollLeft >= maxScroll - 2;
    }
    scroller.addEventListener("scroll", atualizarBotoes);
    window.addEventListener("resize", atualizarBotoes);
    atualizarBotoes();

    // Roda do mouse
    scroller.addEventListener("wheel", (e) => {
      const maxScroll = scroller.scrollWidth - scroller.clientWidth;
      if (maxScroll <= 0) return;
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        const vaiPraEsquerda = e.deltaY < 0 && scroller.scrollLeft <= 0;
        const vaiPraDireita  = e.deltaY > 0 && scroller.scrollLeft >= maxScroll;
        if (!vaiPraEsquerda && !vaiPraDireita) {
          e.preventDefault();
          scroller.scrollLeft += e.deltaY;
        }
      }
    }, { passive: false });
  }

  // ---------- Modais ----------
  function ligarModais() {
    const abrir = (nome) => {
      const modal = $("#modal" + nome.charAt(0).toUpperCase() + nome.slice(1));
      if (!modal) return;
      modal.classList.add("open");
      modal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    };
    const fechar = (nome) => {
      const modal = $("#modal" + nome.charAt(0).toUpperCase() + nome.slice(1));
      if (!modal) return;
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    };

    $$("[data-modal]").forEach(btn => btn.addEventListener("click", () => abrir(btn.dataset.modal)));
    $$("[data-close]").forEach(btn => btn.addEventListener("click", () => fechar(btn.dataset.close)));

    $$(".modal-bg").forEach(bg => {
      bg.addEventListener("click", (e) => {
        if (e.target === bg) {
          bg.classList.remove("open");
          bg.setAttribute("aria-hidden", "true");
          document.body.style.overflow = "";
        }
      });
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        $$(".modal-bg.open").forEach(bg => {
          bg.classList.remove("open");
          bg.setAttribute("aria-hidden", "true");
        });
        document.body.style.overflow = "";
      }
    });
  }

  // ---------- Resgatar marco ----------
  async function resgatarMarco(marcoEl) {
    if (!marcoEl) return;
    if (marcoEl.dataset.podeResgatar !== "true") return;

    const trilhaKey = marcoEl.dataset.trilha;
    const marcoId  = marcoEl.dataset.marcoId;
    const xpTexto  = marcoEl.dataset.xp;

    marcoEl.dataset.podeResgatar = "false";
    marcoEl.classList.remove("is-resgata-vel");
    marcoEl.classList.add("is-carregando");

    try {
      const resp = await fetch("/trilha/resgatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trilha_key: trilhaKey, marco_id: marcoId }),
      });
      const data = await resp.json();

      if (!data.ok) {
        mostrarToast({
          titulo: "Não foi possível resgatar",
          subtitulo: data.erro || "Tente novamente.",
          sucesso: false,
        });
        marcoEl.dataset.podeResgatar = "true";
        marcoEl.classList.remove("is-carregando");
        marcoEl.classList.add("is-resgata-vel");
        return;
      }

      marcoEl.classList.remove("is-carregando");
      marcoEl.classList.add("is-resgatado");

      atualizarHeaderComRetrato(data);

      const tabAtiva = $(".trilha-tab-shield.is-active .trilha-tab-shield-badge");
      if (tabAtiva) {
        const n = Math.max(0, parseInt(tabAtiva.textContent || "0", 10) - 1);
        if (n <= 0) tabAtiva.remove();
        else tabAtiva.textContent = n;
      }

      const resumoBonus = $(".trilha-resumo-bonus");
      if (resumoBonus) {
        if (data.xpBonusDisponivel > 0) {
          resumoBonus.innerHTML = `<span class="badge badge-ok">+${data.xpBonusDisponivel} XP disponível</span>`;
        } else {
          resumoBonus.innerHTML = "";
        }
      }

      mostrarToast({
        titulo: "RESGATADO!",
        xp: xpTexto,
        subtitulo: data.jaResgatado ? "Esse marco já estava resgatado." : "XP adicionado ao seu saldo.",
        sucesso: true,
      });
    } catch (err) {
      console.error("[trilha] erro no resgate:", err);
      mostrarToast({ titulo: "Erro de conexão", subtitulo: "Verifique e tente novamente.", sucesso: false });
      marcoEl.dataset.podeResgatar = "true";
      marcoEl.classList.remove("is-carregando");
      marcoEl.classList.add("is-resgata-vel");
    }
  }

  function atualizarHeaderComRetrato(data) {
    const { progresso, patente, nivel } = data;

    const xpAtualEl = $("#xpAtualTexto");
    const xpFaltamEl = $("#xpFaltamTexto");
    if (xpAtualEl && progresso) xpAtualEl.textContent = progresso.xpNoNivel.toLocaleString("pt-BR");
    if (xpFaltamEl && progresso) xpFaltamEl.textContent = progresso.faltam.toLocaleString("pt-BR");

    const fill = $(".trilha-xp-bar-fill");
    if (fill && progresso) fill.style.width = progresso.pct + "%";

    if (patente) {
      const elPatente = $(".trilha-patente");
      if (elPatente) {
        elPatente.textContent = patente.nome;
        elPatente.style.color = patente.cor;
      }
      const wrap = $(".trilha-avatar-wrap");
      if (wrap && wrap.dataset.patente !== patente.key) {
        wrap.dataset.patente = patente.key;
        mostrarToast({ titulo: "NOVA PATENTE!", subtitulo: patente.nome, sucesso: true });
      }
    }

    const nivelEl = $(".trilha-nivel strong");
    if (nivelEl && nivel) nivelEl.textContent = nivel;
  }

  // ---------- Init ----------
  document.addEventListener("DOMContentLoaded", () => {
    ligarModais();
    ligarScrollLateral();
    posicionarLinhaProgresso();

    document.addEventListener("click", (e) => {
      const marco = e.target.closest(".trilha-marco");
      if (marco && marco.dataset.podeResgatar === "true") {
        resgatarMarco(marco);
      }
    });

    window.addEventListener("resize", () => {
      clearTimeout(window.__trilhaResizeTimer);
      window.__trilhaResizeTimer = setTimeout(posicionarLinhaProgresso, 150);
    });
  });
})();