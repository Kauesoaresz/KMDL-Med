document.addEventListener("DOMContentLoaded", () => {

const sidebar = document.getElementById("sidebar")
const hamburger = document.getElementById("hamburger")
const overlay = document.getElementById("overlay")

// Função para abrir/fechar sidebar no mobile
const toggleSidebar = () => {
  sidebar.classList.toggle("active")
  overlay.classList.toggle("active")
  hamburger.classList.toggle("active")
}

// Função para fechar sidebar
const closeSidebar = () => {
  sidebar.classList.remove("active")
  overlay.classList.remove("active")
  hamburger.classList.remove("active")
}

// Evento do hamburger
hamburger.addEventListener("click", (e) => {
  e.stopPropagation()
  toggleSidebar()
})

// Evento do overlay
overlay.addEventListener("click", () => {
  closeSidebar()
})

// Fechar ao pressionar ESC
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeSidebar()
  }
})

// Prevenir clique dentro do sidebar de fechar
sidebar.addEventListener("click", (e) => {
  e.stopPropagation()
})

})
