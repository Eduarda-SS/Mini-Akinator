import { useState } from "react";
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

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";
const QUESTIONS_PER_ATTEMPT = 5;
const MAX_QUESTIONS = 10;
const UNANSWERED = "unanswered";
const UNKNOWN = "unknown";

const QUESTION_BANK = [
  "O animal é mamífero?",
  "Ele vive na água?",
  "Ele costuma ser um animal de estimação?",
  "Ele voa?",
  "Ele é selvagem?",
  "Ele tem pele de pelo ou penas?",
  "Ele é de grande porte?",
  "Ele se movimenta principalmente em terra firme?",
  "Ele é conhecido por viver em grupos ou em família?",
  "Ele costuma ser encontrado em ambientes frios?",
];

const ANIMALS = [
  { name: "Cachorro", icon: "🐶", answers: { 0: true, 1: false, 2: true, 3: false, 4: false } },
  { name: "Gato", icon: "🐱", answers: { 0: true, 1: false, 2: true, 3: false, 4: false } },
  { name: "Panda", icon: "🐼", answers: { 0: true, 1: false, 2: false, 3: false, 4: true } },
  { name: "Golfinho", icon: "🐬", answers: { 0: true, 1: true, 2: false, 3: false, 4: false } },
  { name: "Tubarão", icon: "🦈", answers: { 0: false, 1: true, 2: false, 3: false, 4: true } },
  { name: "Pássaro", icon: "🐦", answers: { 0: false, 1: false, 2: false, 3: true, 4: true } },
  { name: "Borboleta", icon: "🦋", answers: { 0: false, 1: false, 2: false, 3: true, 4: false } },
  { name: "Sapo", icon: "🐸", answers: { 0: false, 1: true, 2: false, 3: false, 4: false } },
  { name: "Leão", icon: "🦁", answers: { 0: true, 1: false, 2: false, 3: false, 4: true } },
  { name: "Elefante", icon: "🐘", answers: { 0: true, 1: false, 2: false, 3: false, 4: true } },
];

function buildEmptyAnswers() {
  return Object.fromEntries(QUESTION_BANK.map((_, index) => [index, UNANSWERED]));
}

function getAnimalGuess(answers) {
  const scored = ANIMALS.map((animal) => {
    let score = 0;

    Object.entries(animal.answers).forEach(([key, value]) => {
      const answer = answers[Number(key)];

      if (answer === UNANSWERED || answer === UNKNOWN) {
        score += 0.5;
      } else if (answer === value) {
        score += 2;
      } else {
        score -= 1.5;
      }
    });

    return { animal, score };
  });

  return scored.sort((left, right) => right.score - left.score)[0].animal;
}

export default function GamePage({ onBackHome }) {
  const [step, setStep] = useState("questions");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState(buildEmptyAnswers);
  const [guess, setGuess] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [animalName, setAnimalName] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [wrongAttempts, setWrongAttempts] = useState(0);

  const attemptStart = wrongAttempts === 0 ? 0 : QUESTIONS_PER_ATTEMPT;
  const attemptEnd = Math.min(attemptStart + QUESTIONS_PER_ATTEMPT, QUESTION_BANK.length);

  const currentQuestion = QUESTION_BANK[questionIndex];
  const answeredCount = Object.entries(answers)
    .filter(([key, value]) => Number(key) >= attemptStart && Number(key) < attemptEnd && value !== UNANSWERED)
    .length;
  const progressValue = (answeredCount / QUESTIONS_PER_ATTEMPT) * 100;
  const currentAnswer = answers[questionIndex];

  function getNextQuestionIndex(currentValue) {
    const candidateIndexes = [];

    for (let index = attemptStart; index < attemptEnd; index += 1) {
      if (answers[index] === UNANSWERED || answers[index] === UNKNOWN) {
        candidateIndexes.push(index);
      }
    }

    if (candidateIndexes.length === 0) {
      return Math.min(currentValue, attemptEnd - 1);
    }

    const nextIndex = candidateIndexes.find((index) => index > currentValue) ?? candidateIndexes[0];
    return nextIndex;
  }

  function setAnswer(value) {
    const updatedAnswers = {
      ...answers,
      [questionIndex]: value,
    };

    setAnswers(updatedAnswers);
    setFeedback("");

    const nextQuestionIndex = getNextQuestionIndex(questionIndex);
    if (nextQuestionIndex > questionIndex) {
      setQuestionIndex(nextQuestionIndex);
      return;
    }

    const nextGuess = getAnimalGuess(updatedAnswers);
    setGuess(nextGuess);
    setStep("guess");
  }

  function handleBackQuestion() {
    if (questionIndex === 0) {
      return;
    }

    setQuestionIndex((previous) => previous - 1);
    setFeedback("");
  }

  function handleNextQuestion() {
    const nextQuestionIndex = getNextQuestionIndex(questionIndex);

    if (nextQuestionIndex > questionIndex) {
      setQuestionIndex(nextQuestionIndex);
      return;
    }

    const nextGuess = getAnimalGuess(answers);
    setGuess(nextGuess);
    setStep("guess");
  }

  function handleGuessResult(isCorrect) {
    if (isCorrect) {
      setFeedback(`Acertou! Eu sabia que era ${guess.name}!`);
      setStep("success");
      return;
    }

    if (wrongAttempts >= 1) {
      setFeedback("Não consegui identificar o animal desta vez.");
      setStep("learning");
      return;
    }

    setWrongAttempts((previous) => previous + 1);
    setFeedback("Poxa, vou tentar outra vez com novas perguntas para chegar mais perto do seu animal.");
    setQuestionIndex(QUESTIONS_PER_ATTEMPT);
    setStep("questions");
  }

  async function handleLearningSubmit(event) {
    event.preventDefault();

    if (!animalName.trim()) {
      setSaveMessage("Informe o nome do animal para continuar.");
      return;
    }

    const payload = {
      animal: animalName.trim(),
      respostas: QUESTION_BANK.map((question, index) => {
        const value = answers[index];

        return {
          pergunta: question,
          resposta: value === UNANSWERED || value === UNKNOWN ? "nao-sei" : value ? "sim" : "nao",
        };
      }),
      data: new Date().toISOString(),
    };

    setIsSaving(true);
    setSaveMessage("");

    try {
      const response = await fetch(`${API_URL}/api/animals/learn`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("A API não respondeu como esperado.");
      }

      setSaveMessage("Ótimo! Esse animal foi salvo no banco de conhecimento do Animator.");
    } catch {
      const savedAnimals = JSON.parse(localStorage.getItem("animator_animals") ?? "[]");
      localStorage.setItem(
        "animator_animals",
        JSON.stringify([...savedAnimals, payload]),
      );
      setSaveMessage("A API não está disponível, então o animal foi salvo localmente para continuar a aprendizagem.");
    } finally {
      setIsSaving(false);
    }
  }

  function resetGame() {
    setStep("questions");
    setQuestionIndex(0);
    setAnswers(buildEmptyAnswers());
    setGuess(null);
    setFeedback("");
    setAnimalName("");
    setSaveMessage("");
    setWrongAttempts(0);
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
            <span className="guess-icon" aria-hidden="true">{guess?.icon ?? "🐾"}</span>
            <div>
              <p className="guess-label">Meu palpite</p>
              <h2>{guess?.name ?? "Animal"}</h2>
            </div>
          </div>

          <div className="answer-actions split-actions">
            <button type="button" className="success-button" onClick={() => handleGuessResult(true)}>
              <Check size={18} /> Acertou
            </button>
            <button type="button" className="danger-button" onClick={() => handleGuessResult(false)}>
              <X size={18} /> Errou
            </button>
          </div>
        </section>
      </main>
    );
  }

  if (step === "success") {
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

          <div className="success-visual">
            <span role="img" aria-label="animal vencedor">{guess?.icon ?? "🐾"}</span>
          </div>

          <h1>Excelente! Eu acertei.</h1>
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
            />

            {saveMessage && <p className="save-message">{saveMessage}</p>}

            <button type="submit" className="primary-button" disabled={isSaving}>
              {isSaving ? "Salvando..." : "Salvar animal"}
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
          <span className="eyebrow">Pergunta {questionIndex + 1}</span>
        </div>

        <div className="question-box">
          <p className="question-label">Pergunta atual</p>
          <h1>{currentQuestion}</h1>
        </div>

        <div className="answer-actions">
          <button
            type="button"
            className={currentAnswer === true ? "answer-button active yes" : "answer-button yes"}
            onClick={() => setAnswer(true)}
          >
            Sim
          </button>
          <button
            type="button"
            className={currentAnswer === false ? "answer-button active no" : "answer-button no"}
            onClick={() => setAnswer(false)}
          >
            Não
          </button>
          <button
            type="button"
            className={currentAnswer === UNKNOWN ? "answer-button active neutral" : "answer-button neutral"}
            onClick={() => setAnswer(UNKNOWN)}
          >
            Não sei
          </button>
        </div>

        {feedback && <p className="status-message">{feedback}</p>}

        <div className="navigation-actions">
          <button type="button" className="ghost-button" onClick={handleBackQuestion} disabled={questionIndex === 0}>
            <ArrowLeft size={16} /> Voltar
          </button>

          <button type="button" className="primary-button" onClick={handleNextQuestion}>
            Próxima <ArrowRight size={16} />
          </button>
        </div>
      </section>
    </main>
  );
}
