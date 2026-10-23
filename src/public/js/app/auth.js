(function () {

      /* ---------- saudação pelo horário (só no login) ---------- */
  const greet = document.getElementById("greet");
  if (greet) {
    const h = new Date().getHours();
    greet.textContent = h < 5 ? "Boa madrugada" : h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
  }

  /* ---------- fundo escolhido no Perfil (cookie) ---------- */
  const bg = document.getElementById("auth-bg");
  const m = document.cookie.match(/(?:^|; )kmed_bg=([^;]*)/);
  if (bg && m) {
    const url = decodeURIComponent(m[1]);
    if (url.indexOf("/public/uploads/login-bg/") === 0 && url.indexOf("..") === -1) {
      const img = new Image();
      img.onload = () => {
        bg.style.backgroundImage = 'url("' + url + '")';
        document.body.classList.add("has-img");
      };
      img.src = url;
    }
  }

  /* ---------- mostrar / ocultar senha ---------- */
  const OPEN = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
  const SHUT = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>';

  document.querySelectorAll("[data-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = document.getElementById(btn.dataset.toggle);
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      btn.querySelector("svg").innerHTML = show ? SHUT : OPEN;
    });
  });

  /* ---------- força da senha (cadastro) ---------- */
  const strength = document.getElementById("strength");
  const senha = document.getElementById("senha");
  if (strength && senha) {
    const labels = ["Digite uma senha", "Fraca", "Razoável", "Boa", "Forte"];
    senha.addEventListener("input", () => {
      const v = senha.value;
      let n = 0;
      if (v.length >= 6) n++;
      if (v.length >= 10) n++;
      if (/[A-Z]/.test(v) && /[a-z]/.test(v)) n++;
      if (/\d/.test(v) && /[^A-Za-z0-9]/.test(v)) n++;
      if (!v) n = 0;
      strength.dataset.level = n;
      document.getElementById("strength-text").textContent = labels[n];
    });
  }
})();