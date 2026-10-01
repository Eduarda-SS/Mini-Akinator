import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import AdminLogin from "/adminLogin.jsx";
import GamePage from "./gamePage/gamePage.jsx";
import "./style.css";
import Animator from "./homepage/Animator";

function App() {
  const [page, setPage] = useState("home");

  if (page === "login") {
    return <AdminLogin onBack={() => setPage("home")} />;
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