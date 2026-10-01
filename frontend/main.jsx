import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import AdminLogin from "/adminLogin.jsx";
import GamePage from "./gamePage/gamePage.jsx";
import "./style.css";
import Animator from "./homepage/Animator";

function App() {
  const paginaInicial = new URLSearchParams(window.location.search).get("page");
  const [page, setPage] = useState(paginaInicial === "admin" ? "admin" : "home");

  if (page === "login") {
    return (
      <AdminLogin
        onBack={() => setPage("home")}
        onLogin={() => setPage("admin")}
      />
    );
  }

  if (page === "admin") {
    return (
      <main className="page-shell">
        <section className="login-card admin-hub" aria-labelledby="admin-title">
          <p className="eyebrow">PAINEL ADMINISTRATIVO</p>
          <h1 id="admin-title">O que deseja gerenciar?</h1>
          <p className="intro">Escolha uma área para continuar.</p>
          <nav className="admin-links" aria-label="Áreas administrativas">
            <a href="/animais.html">Gerenciar animais</a>
            <a href="/perguntas.html">Gerenciar perguntas</a>
          </nav>
          <button className="back-button" type="button" onClick={() => setPage("home")}>
            Sair do painel
          </button>
        </section>
      </main>
    );
  }

  if (page === "game") {
    return <GamePage onBackHome={() => setPage("home")} />;
  }

  return <Animator onLogin={() => setPage("login")} onPlay={() => setPage("game")} />;
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
