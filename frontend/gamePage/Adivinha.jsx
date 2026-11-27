import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Lightbulb, PawPrint, RotateCcw, Search, Trophy } from "lucide-react";
import "./gamePage.css";
import "./adivinha.css";
import AnimalPalpite from "./AnimalPalpite.jsx";

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
  const [attemptedAnimals, setAttemptedAnimals] = useState([]);
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
    setAttemptedAnimals([]);
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
    if (isBusy) return;
    setIsBusy(true);
    setMessage("");
    try {
      const data = await requestApi("/api/adivinha/hint", {
        method: "POST",
        body: JSON.stringify({ gameId }),
      });
      if (data.hint) setHints((current) => [...current, { ...data.hint, repeated: data.repeated }]);
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
        const attemptedAnimal = animals.find((animal) => String(animal.id) === selectedId);
        if (attemptedAnimal) {
          setAttemptedAnimals((current) => current.some((animal) => animal.id === attemptedAnimal.id)
            ? current
            : [...current, attemptedAnimal]);
        }
        setSearch("");
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

  const attemptedIds = new Set(attemptedAnimals.map((animal) => String(animal.id)));
  const filteredAnimals = animals
    .filter((animal) => normalizeText(animal.nome).includes(normalizeText(search)))
    .filter((animal) => !attemptedIds.has(String(animal.id)))
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
              <p>Peça pistas sem limite ou arrisque um palpite. Depois de revelar todas, as pistas se repetem; cada uma reduz sua pontuação.</p>
            </header>

            <div className="adivinha-scoreline">
              <span><Lightbulb size={17} /> {hints.length} características reveladas</span>
              <strong>{Math.max(0, totalHints - hints.length)} pontos possíveis</strong>
            </div>

            <section className="hint-list" aria-label="Características reveladas" aria-live="polite">
              {hints.length ? hints.map((hint, index) => (
                <div className="hint-row" key={`${index}-${hint.text}`}>
                  <span className="hint-number">{String(index + 1).padStart(2, "0")}</span>
                  <span>{hint.text}</span>
                  <strong>{hint.answer}</strong>
                  {hint.repeated && <small className="hint-repeated">Repetida</small>}
                </div>
              )) : <p className="empty-hints">Nenhuma característica revelada ainda.</p>}
            </section>

            <div className="adivinha-actions">
              <button type="button" className="secondary-button" onClick={getHint} disabled={isBusy || totalHints === 0}>
                <Lightbulb size={17} /> {isBusy ? "Revelando..." : "Revelar característica"}
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
              {search && !selectedId && (
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
                {isBusy ? "Verificando..." : selectedId ? "Confirmar palpite" : "Selecione um animal"}
              </button>
            </form>

            <section className="attempted-animals" aria-label="Animais já tentados" aria-live="polite">
              <h2>Animais já tentados</h2>
              {attemptedAnimals.length ? (
                <ul>
                  {attemptedAnimals.map((animal) => <li key={animal.id}>{animal.nome}</li>)}
                </ul>
              ) : <p>Você ainda não tentou nenhum animal.</p>}
            </section>
          </>
        ) : (
          <div className="adivinha-result">
            <div className="result-icon">{status === "won" ? <Trophy size={30} /> : <PawPrint size={30} />}</div>
            <span className="eyebrow accent">{status === "won" ? "Acertou" : "Resposta"}</span>
            <h1>{status === "won" ? "Você acertou!" : "Este era o animal secreto"}</h1>
            <AnimalPalpite nome={result?.animal ?? "Animal"} label="Animal revelado" />
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