import "./homepage.css";

function Animator({ onLogin, onPlay }) {
  return (
    <div className="animator-page">
      <header className="navbar">
        <div className="logo">
          🐾 <span>Animator</span>
        </div>

        <button className="login-button" onClick={onLogin}>
          Entrar
        </button>
      </header>

      <main className="hero">
        <div className="hero-content">
          <span className="subtitle">ADIVINHE O ANIMAL</span>

          <h1>
            Pense em um animal.
            <br />
            <span>O Animator descobre qual é.</span>
          </h1>

          <p>
            Escolha um animal, responda algumas perguntas sobre suas
            características e veja se o Animator consegue adivinhar.
          </p>

          <button className="play-button" onClick={onPlay}>
            Jogar agora
            <span>→</span>
          </button>
        </div>

        <div className="animal-decoration">
          <div className="circle circle-one"></div>
          <div className="circle circle-two"></div>

          <span className="animal animal-one">🦁</span>
          <span className="animal animal-two">🦋</span>
          <span className="animal animal-three">🐼</span>
          <span className="animal animal-four">🦊</span>
          <span className="animal animal-five">🐸</span>
        </div>
      </main>

      <section className="how-it-works">
        <h2>Como funciona?</h2>

        <div className="steps">
          <div className="step">
            <span>01</span>
            <h3>Pense</h3>
            <p>Pense em qualquer animal.</p>
          </div>

          <div className="step">
            <span>02</span>
            <h3>Responda</h3>
            <p>Responda perguntas sobre ele.</p>
          </div>

          <div className="step">
            <span>03</span>
            <h3>Descubra</h3>
            <p>Veja se o Animator acertou!</p>
          </div>
        </div>
      </section>
    </div>

  );
}

export default Animator;