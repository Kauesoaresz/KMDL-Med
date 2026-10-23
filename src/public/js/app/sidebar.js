(function () {
  const html = document.documentElement;
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");
  const burger = document.getElementById("hamburger");
  const toggle = document.getElementById("themeToggle");

  /* ---------- menu (janela estreita) ---------- */
  function setMenu(open) {
    sidebar.classList.toggle("open", open);
    overlay.classList.toggle("show", open);
  }
  if (burger) burger.addEventListener("click", () => setMenu(!sidebar.classList.contains("open")));
  if (overlay) overlay.addEventListener("click", () => setMenu(false));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

  /* ---------- tema (escuro é o padrão) ---------- */
  function paint() {
    const light = html.getAttribute("data-theme") === "light";
    if (!toggle) return;
    toggle.querySelector(".theme-icon").textContent = light ? "☀️" : "🌙";
    toggle.querySelector(".theme-label").textContent = light ? "Tema claro" : "Tema escuro";
  }

  if (toggle) {
    toggle.addEventListener("click", () => {
      const light = html.getAttribute("data-theme") === "light";
      if (light) html.removeAttribute("data-theme");
      else html.setAttribute("data-theme", "light");
      try { localStorage.setItem("kmed-theme", light ? "dark" : "light"); } catch (e) {}
      paint();
      document.dispatchEvent(new Event("themechange")); // gráficos podem escutar isto
    });
  }
  paint();
})();