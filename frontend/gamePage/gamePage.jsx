import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  Check,
  PawPrint,
  Sparkles,
  X,
} from "lucide-react";
import "./gamePage.css";

const API_URL = (import.meta.env.VITE_GAME_API_URL ?? "http://localhost:8000").replace(/\/+$/, "");

async function requestApi(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  } catch {
    throw new Error(`Não foi possível acessar a API em ${API_URL}. Confirme se o backend está ativo e se o endereço está acessível pelo navegador.`);
  }
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const detail = typeof data.detail === "string" ? data.detail : "Não foi possível comunicar com a API.";
    throw new Error(detail);
  }

  return data;
}

export default function GamePage({ onBackHome }) {
  const [step, setStep] = useState("loading");
  const [gameId, setGameId] = useState("");
  const [questionHistory, setQuestionHistory] = useState([]);
  const [questionPosition, setQuestionPosition] = useState(0);
  const [roundNumber, setRoundNumber] = useState(1);
  const [answers, setAnswers] = useState({});
  const [guess, setGuess] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [animalName, setAnimalName] = useState("");
  const [differentiatingQuestion, setDifferentiatingQuestion] = useState("");
  const [differentiatingAnswer, setDifferentiatingAnswer] = useState("yes");
  const [saveMessage, setSaveMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const hasStarted = useRef(false);
  const currentQuestion = questionHistory[questionPosition] ?? null;
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;

  function applyGameStep(data, { answer, newRound = false } = {}) {
    if (answer !== undefined && currentQuestion) {
      setAnswers((previous) => ({ ...previous, [currentQuestion.id]: answer }));
    }
    setFeedback(data.message ?? "");

    if (data.status === "playing") {
      if (newRound) {
        setRoundNumber((previous) => previous + 1);
        setQuestionHistory([data.question]);
        setQuestionPosition(0);
      } else {
        const existingPosition = questionHistory.findIndex((item) => item.id === data.question.id);
        if (existingPosition >= 0) {
          setQuestionPosition(existingPosition);
        } else {
          const updatedHistory = [
            ...questionHistory.slice(0, questionPosition + 1),
            data.question,
          ];
          setQuestionHistory(updatedHistory);
          setQuestionPosition(updatedHistory.length - 1);
        }
      }
      setStep("questions");
    } else if (data.status === "guessing") {
      setGuess(data.guess);
      setStep("guess");
    } else if (data.status === "limit_reached") {
      setGuess(data.guess);
      setStep("learning");
    } else if (data.status === "finished") {
      setStep("success");
    } else {
      throw new Error("A API retornou uma etapa de jogo desconhecida.");
    }
  }

  async function startGame() {
    setStep("loading");
    setError("");
    setIsSubmitting(true);

    try {
      const data = await requestApi("/api/start", { method: "POST" });
      setGameId(data.gameId);
      setQuestionHistory([data.question]);
      setQuestionPosition(0);
      setRoundNumber(1);
      setAnswers({});
      setGuess(null);
      setFeedback("");
      setAnimalName("");
      setDifferentiatingQuestion("");
      setDifferentiatingAnswer("yes");
      setSaveMessage("");
      setStep("questions");
    } catch (requestError) {
      setError(requestError.message);
      setStep("error");
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;
    startGame();
  }, []);

  async function submitAnswer(answer) {
    if (!currentQuestion || isSubmitting) return;
    setIsSubmitting(true);
    setError("");

    try {
      const data = await requestApi("/api/answer", {
        method: "POST",
        body: JSON.stringify({ gameId, questionId: currentQuestion.id, answer }),
      });
      applyGameStep(data, { answer });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGuessResult(accepted) {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError("");

    try {
      const data = await requestApi("/api/guess-feedback", {
        method: "POST",
        body: JSON.stringify({ gameId, accepted }),
      });
      applyGameStep(data, { newRound: !accepted && data.status === "playing" });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleLearningSubmit(event) {
    event.preventDefault();

    if (!animalName.trim() || !differentiatingQuestion.trim()) {
      setSaveMessage("Informe o nome do animal e uma característica que o diferencie.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSaveMessage("");

    try {
      const data = await requestApi("/api/learn", {
        method: "POST",
        body: JSON.stringify({
          gameId,
          animalName: animalName.trim(),
          differentiatingQuestionText: differentiatingQuestion.trim(),
          differentiatingQuestionAnswerForNewAnimal: differentiatingAnswer,
        }),
      });
      setFeedback(data.message ?? "Animal aprendido com sucesso!");
      setStep("learned");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function resetGame() {
    startGame();
  }

  if (step === "loading") {
    return (
      <main className="game-page-shell">
        <section className="game-card loading-state" aria-live="polite">
          <PawPrint size={28} />
          <p>Conectando ao Animator...</p>
        </section>
      </main>
    );
  }

  if (step === "error") {
    return (
      <main className="game-page-shell">
        <section className="game-card error-state">
          <div className="game-topbar">
            <button type="button" className="back-button" onClick={onBackHome}>
              <ArrowLeft size={16} /> Voltar ao início
            </button>
            <div className="brand-pill"><PawPrint size={16} /> Animator</div>
          </div>
          <p className="api-error" role="alert">{error}</p>
          <button type="button" className="primary-button" onClick={startGame} disabled={isSubmitting}>
            Tentar novamente
          </button>
        </section>
      </main>
    );
  }

  if (step === "guess") {
    return (
      <main className="game-page-shell">
        <section className="game-card guess-card">
          <div className="game-topbar">
            <button type="button" className="back-button" onClick={onBackHome}>
              <ArrowLeft size={16} /> Voltar ao início
            </button>

            <div className="brand-pill">
              <PawPrint size={16} /> Animator
            </div>
          </div>

          <div className="guess-header">
            <span className="eyebrow accent">Tentativa</span>
            <h1>Será que acertei?</h1>
          </div>

          <div className="guess-animal">
            <span className="guess-icon" aria-hidden="true">🐾</span>
            <div>
              <p className="guess-label">Meu palpite</p>
              <h2>{guess?.name ?? "Animal"}</h2>
            </div>
          </div>

          <div className="answer-actions split-actions">
            <button type="button" className="success-button" onClick={() => handleGuessResult(true)} disabled={isSubmitting}>
              <Check size={18} /> Acertou
            </button>
            <button type="button" className="danger-button" onClick={() => handleGuessResult(false)} disabled={isSubmitting}>
              <X size={18} /> Errou
            </button>
          </div>
          {error && <p className="api-error" role="alert">{error}</p>}
        </section>
      </main>
    );
  }

  if (step === "success" || step === "learned") {
    return (
      <main className="game-page-shell">
        <section className="game-card success-card">
          <div className="game-topbar">
            <button type="button" className="back-button" onClick={onBackHome}>
              <ArrowLeft size={16} /> Voltar ao início
            </button>

            <div className="brand-pill">
              <Sparkles size={16} /> Vitórias
            </div>
          </div>

          <div className="success-visual"><span role="img" aria-label="animal">🐾</span></div>

          <h1>{step === "learned" ? "Animal aprendido!" : "Excelente! Eu acertei."}</h1>
          <p className="result-message">{feedback}</p>

          <button type="button" className="primary-button" onClick={resetGame}>
            Jogar de novo
          </button>
        </section>
      </main>
    );
  }

  if (step === "learning") {
    return (
      <main className="game-page-shell">
        <section className="game-card learning-card">
          <div className="game-topbar">
            <button type="button" className="back-button" onClick={onBackHome}>
              <ArrowLeft size={16} /> Voltar ao início
            </button>

            <div className="brand-pill">
              <BrainCircuit size={16} /> Aprendizado
            </div>
          </div>

          <div className="learning-header">
            <span className="eyebrow accent">Última etapa</span>
            <h1>Qual animal você pensou?</h1>
          </div>

          <p className="small-copy">
            Eu não consegui adivinhar desta vez. Ajude o Animator a aprender e a melhorar nas próximas partidas.
          </p>

          <form className="learning-form" onSubmit={handleLearningSubmit}>
            <label htmlFor="animal-name">Nome do animal</label>
            <input
              id="animal-name"
              value={animalName}
              onChange={(event) => setAnimalName(event.target.value)}
              placeholder="Ex.: Hipopótamo"
              required
            />

            <label htmlFor="differentiating-question">Uma característica que o diferencia</label>
            <input
              id="differentiating-question"
              value={differentiatingQuestion}
              onChange={(event) => setDifferentiatingQuestion(event.target.value)}
              placeholder="Ex.: Ele tem listras?"
              required
            />

            <label htmlFor="differentiating-answer">Resposta para esse animal</label>
            <select
              id="differentiating-answer"
              value={differentiatingAnswer}
              onChange={(event) => setDifferentiatingAnswer(event.target.value)}
            >
              <option value="yes">Sim</option>
              <option value="no">Não</option>
            </select>

            {saveMessage && <p className="save-message">{saveMessage}</p>}

            {error && <p className="api-error" role="alert">{error}</p>}

            <button type="submit" className="primary-button" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar animal"}
            </button>
          </form>

          <button type="button" className="secondary-button" onClick={resetGame}>
            Jogar novamente
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="game-page-shell">
      <section className="game-card">
        <div className="game-topbar">
          <button type="button" className="back-button" onClick={onBackHome}>
            <ArrowLeft size={16} /> Voltar ao início
          </button>

          <div className="brand-pill">
            <PawPrint size={16} /> Animator
          </div>
        </div>

        <div className="question-counter">
          <span className="eyebrow">Rodada {roundNumber} · Pergunta {questionPosition + 1} de 5</span>
        </div>

        <div className="question-box">
          <p className="question-label">Pergunta atual</p>
          <h1>{currentQuestion?.text}</h1>
        </div>

        <div className="answer-actions">
          <button
            type="button"
            className={currentAnswer === "yes" ? "answer-button yes active" : "answer-button yes"}
            onClick={() => submitAnswer("yes")}
            disabled={isSubmitting}
          >
            Sim
          </button>
          <button
            type="button"
            className={currentAnswer === "no" ? "answer-button no active" : "answer-button no"}
            onClick={() => submitAnswer("no")}
            disabled={isSubmitting}
          >
            Não
          </button>
          <button
            type="button"
            className={currentAnswer === "dont_know" ? "answer-button neutral active" : "answer-button neutral"}
            onClick={() => submitAnswer("dont_know")}
            disabled={isSubmitting}
          >
            Não sei
          </button>
        </div>

        <div className="navigation-actions">
          <button
            type="button"
            className="ghost-button"
            onClick={() => setQuestionPosition((position) => Math.max(0, position - 1))}
            disabled={questionPosition === 0 || isSubmitting}
          >
            <ArrowLeft size={16} /> Anterior
          </button>
          <button
            type="button"
            className="primary-button"
            onClick={() => setQuestionPosition((position) => Math.min(questionHistory.length - 1, position + 1))}
            disabled={!currentAnswer || questionPosition >= questionHistory.length - 1 || isSubmitting}
          >
            Próxima <ArrowRight size={16} />
          </button>
        </div>

        {feedback && <p className="status-message">{feedback}</p>}
        {error && <p className="api-error" role="alert">{error}</p>}
        {isSubmitting && <p className="small-copy" aria-live="polite">Processando resposta...</p>}
      </section>
    </main>
  );
}
