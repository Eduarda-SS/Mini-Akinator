import { useEffect, useState } from "react";
import { ArrowLeft, PawPrint, SlidersHorizontal } from "lucide-react";
import "./gamePage.css";
import "./personalizado.css";
import GamePage from "./gamePage.jsx";

const API_URL = (import.meta.env.VITE_GAME_API_URL ?? "http://localhost:8000").replace(/\/+$/, "");
const MIN_QUESTIONS = 3;

export default function Personalizado({ onBackHome }) {
  const [questions, setQuestions] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [status, setStatus] = useState("loading"); // loading | setup | error | playing
  const [error, setError] = useState("");

  async function loadQuestions() {
    setStatus("loading");
    setError("");
    try {
      const response = await fetch(`${API_URL}/api/admin/caracteristicas`);
      if (!response.ok) throw new Error();
      const data = await response.json();
      setQuestions(data);
      setSelected(new Set(data.map((q) => q.id))); // começa com todas marcadas
      setStatus("setup");
    } catch {
      setError(`Não foi possível carregar as perguntas em ${API_URL}. Confirme se o backend está ativo.`);
      setStatus("error");
    }
  }

  useEffect(() => {
    loadQuestions();
  }, []);

  function toggle(id) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (status === "playing") {
    return <GamePage onBackHome={onBackHome} characteristicIds={[...selected]} />;
  }

  const enough = selected.size >= MIN_QUESTIONS;

  return (
    <main className="game-page-shell">
      <section className="game-card personalizado-card">
        <div className="game-topbar">
          <button type="button" className="back-button" onClick={onBackHome}>
            <ArrowLeft size={16} /> Voltar ao início
          </button>
          <div className="brand-pill"><PawPrint size={16} /> Personalizado</div>
        </div>

        {status === "loading" && <p className="small-copy" aria-live="polite">Carregando perguntas...</p>}

        {status === "error" && (
          <>
            <p className="api-error" role="alert">{error}</p>
            <button type="button" className="primary-button" onClick={loadQuestions}>Tentar novamente</button>
          </>
        )}

        {status === "setup" && (
          <>
            <div className="learning-header">
              <span className="eyebrow accent">Modo personalizado</span>
              <h1>Escolha as perguntas</h1>
            </div>
            <p className="small-copy">
              Marque as características que o Animator pode perguntar e desmarque as que quiser excluir.
              Selecione pelo menos {MIN_QUESTIONS}.
            </p>

            <div className="personalizado-toolbar">
              <span><SlidersHorizontal size={16} /> {selected.size} de {questions.length} selecionadas</span>
              <div>
                <button type="button" className="ghost-button" onClick={() => setSelected(new Set(questions.map((q) => q.id)))}>
                  Marcar todas
                </button>
                <button type="button" className="ghost-button" onClick={() => setSelected(new Set())}>
                  Limpar
                </button>
              </div>
            </div>

            <ul className="personalizado-list">
              {questions.map((q) => (
                <li key={q.id}>
                  <label className={selected.has(q.id) ? "personalizado-item checked" : "personalizado-item"}>
                    <input type="checkbox" checked={selected.has(q.id)} onChange={() => toggle(q.id)} />
                    <span>{q.pergunta}</span>
                  </label>
                </li>
              ))}
            </ul>

            {!enough && (
              <p className="status-message" role="status">
                Faltam {MIN_QUESTIONS - selected.size} pergunta(s) para começar.
              </p>
            )}

            <button type="button" className="primary-button" disabled={!enough} onClick={() => setStatus("playing")}>
              Começar partida
            </button>
          </>
        )}
      </section>
    </main>
  );
}