import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Lightbulb, PawPrint, RotateCcw, Search, Trophy } from "lucide-react";
import "./gamePage.css";
import "./adivinha.css";

const API_URL = (import.meta.env.VITE_GAME_API_URL ?? "http://localhost:8000").replace(/\/+$/, "");

async function requestApi(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...options.headers },
    });
  } catch {
    throw new Error(`Não foi possível acessar a API em ${API_URL}.`);
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof data.detail === "string" ? data.detail : "Não foi possível comunicar com a API.");
  }
  return data;
}

function normalizeText(text) {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
}

export default function Adivinha({ onBackHome }) {
  const [gameId, setGameId] = useState("");
  const [animals, setAnimals] = useState([]);
  const [totalHints, setTotalHints] = useState(0);
  const [hints, setHints] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState(null);
  const [isBusy, setIsBusy] = useState(false);
  const didInitialize = useRef(false);

  async function startGame() {
    setStatus("loading");
    setMessage("");
    setResult(null);
    setHints([]);
    setSearch("");
    setSelectedId("");
    try {
      const [animalList, game] = await Promise.all([
        requestApi("/api/adivinha/animais"),
        requestApi("/api/adivinha/start", { method: "POST" }),
      ]);
      setAnimals(animalList);
      setGameId(game.gameId);
      setTotalHints(game.totalCaracteristicas);
      setStatus("playing");
    } catch (requestError) {
      setMessage(requestError.message);
      setStatus("error");
    }
  }

  useEffect(() => {
    if (didInitialize.current) return;
    didInitialize.current = true;
    startGame();
  }, []);

  async function getHint() {
    if (isBusy || hints.length >= totalHints) return;
    setIsBusy(true);
    setMessage("");
    try {
      const data = await requestApi("/api/adivinha/hint", {
        method: "POST",
        body: JSON.stringify({ gameId }),
      });
      if (data.hint) setHints((current) => [...current, data.hint]);
    } catch (requestError) {
      setMessage(requestError.message);
    } finally {
      setIsBusy(false);
    }
  }

  async function submitGuess(event) {
    event.preventDefault();
    if (!selectedId || isBusy) return;
    setIsBusy(true);
    setMessage("");
    try {
      const data = await requestApi("/api/adivinha/guess", {
        method: "POST",
        body: JSON.stringify({ gameId, animalId: Number(selectedId) }),
      });
      if (data.correct) {
        setResult({ animal: data.animal, score: data.score, used: hints.length });
        setStatus("won");
      } else {
        setMessage("Ainda não! Escolha outro animal e tente novamente.");
        setSelectedId("");
      }
    } catch (requestError) {
      setMessage(requestError.message);
    } finally {
      setIsBusy(false);
    }
  }

  async function giveUp() {
    if (isBusy) return;
    setIsBusy(true);
    setMessage("");
    try {
      const data = await requestApi("/api/adivinha/give-up", {
        method: "POST",
        body: JSON.stringify({ gameId }),
      });
      setResult({ animal: data.animal, used: data.used });
      setStatus("lost");
    } catch (requestError) {
      setMessage(requestError.message);
    } finally {
      setIsBusy(false);
    }
  }

  const filteredAnimals = animals
    .filter((animal) => normalizeText(animal.nome).includes(normalizeText(search)))
    .slice(0, 8);

  return (
    <main className="game-page-shell adivinha-shell">
      <section className="game-card adivinha-card">
        <div className="game-topbar">
          <button type="button" className="back-button" onClick={onBackHome}>
            <ArrowLeft size={16} /> Voltar ao início
          </button>
          <div className="brand-pill"><PawPrint size={16} /> Adivinha</div>
        </div>

        {status === "loading" ? (
          <div className="adivinha-loading" aria-live="polite">Preparando uma surpresa...</div>
        ) : status === "error" ? (
          <div className="adivinha-result">
            <h1>Não foi possível iniciar</h1>
            <p className="api-error" role="alert">{message}</p>
            <button type="button" className="primary-button" onClick={startGame}>Tentar novamente</button>
          </div>
        ) : status === "playing" ? (
          <>
            <header className="adivinha-heading">
              <span className="eyebrow accent">Descubra o animal</span>
              <h1>Qual animal estou pensando?</h1>
              <p>Peça pistas ou arrisque um palpite. Cada pista usada reduz sua pontuação.</p>
            </header>

            <div className="adivinha-scoreline">
              <span><Lightbulb size={17} /> {hints.length} de {totalHints} características reveladas</span>
              <strong>{Math.max(0, totalHints - hints.length)} pontos possíveis</strong>
            </div>

            <section className="hint-list" aria-label="Características reveladas" aria-live="polite">
              {hints.length ? hints.map((hint, index) => (
                <div className="hint-row" key={`${index}-${hint.text}`}>
                  <span className="hint-number">{String(index + 1).padStart(2, "0")}</span>
                  <span>{hint.text}</span>
                  <strong>{hint.answer}</strong>
                </div>
              )) : <p className="empty-hints">Nenhuma característica revelada ainda.</p>}
            </section>

            <div className="adivinha-actions">
              <button type="button" className="secondary-button" onClick={getHint} disabled={isBusy || hints.length >= totalHints}>
                <Lightbulb size={17} /> {hints.length >= totalHints ? "Sem mais pistas" : "Revelar característica"}
              </button>
              <button type="button" className="give-up-button" onClick={giveUp} disabled={isBusy}>
                Desistir
              </button>
            </div>

            <form className="animal-search-form" onSubmit={submitGuess}>
              <label htmlFor="adivinha-search">Seu palpite</label>
              <div className="animal-search-input">
                <Search size={18} aria-hidden="true" />
                <input
                  id="adivinha-search"
                  type="search"
                  value={search}
                  onChange={(event) => { setSearch(event.target.value); setSelectedId(""); }}
                  placeholder="Pesquise um animal..."
                  autoComplete="off"
                />
              </div>
              {search && (
                <div className="animal-search-results" role="listbox" aria-label="Animais disponíveis">
                  {filteredAnimals.map((animal) => (
                    <button
                      type="button"
                      role="option"
                      aria-selected={selectedId === String(animal.id)}
                      key={animal.id}
                      onClick={() => { setSelectedId(String(animal.id)); setSearch(animal.nome); }}
                    >
                      {animal.nome}
                    </button>
                  ))}
                  {!filteredAnimals.length && <p>Nenhum animal encontrado.</p>}
                </div>
              )}
              <button type="submit" className="primary-button guess-submit" disabled={!selectedId || isBusy}>
                {isBusy ? "Verificando..." : "Confirmar palpite"}
              </button>
            </form>
          </>
        ) : (
          <div className="adivinha-result">
            <div className="result-icon">{status === "won" ? <Trophy size={30} /> : <PawPrint size={30} />}</div>
            <span className="eyebrow accent">{status === "won" ? "Acertou" : "Resposta"}</span>
            <h1>{result?.animal}</h1>
            {status === "won" ? (
              <p>Você descobriu usando {result.used} {result.used === 1 ? "característica" : "características"} e fez <strong>{result.score} pontos</strong>.</p>
            ) : (
              <p>Você usou {result?.used} {result?.used === 1 ? "característica" : "características"} antes de desistir.</p>
            )}
            <button type="button" className="primary-button" onClick={startGame}>
              <RotateCcw size={17} /> Jogar novamente
            </button>
          </div>
        )}

        {message && status === "playing" && <p className="status-message" role="status">{message}</p>}
      </section>
    </main>
  );
}