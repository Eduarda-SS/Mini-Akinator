import { useState } from "react";
import { Eye, EyeOff, PawPrint, ShieldCheck } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";
const DEMO_EMAIL = "admin@akinator.com";
const DEMO_PASSWORD = "Admin123!";

export default function AdminLogin({ onBack, onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    // Conta fixa apenas para testar o front localmente. Em produção, a
    // autenticação sempre passa pela API e nunca aceita essas credenciais.
    if (import.meta.env.DEV) {
      if (
        email.trim().toLowerCase() === DEMO_EMAIL &&
        password === DEMO_PASSWORD
      ) {
        onLogin?.();
      } else {
        setError("E-mail ou senha de demonstração incorretos.");
      }
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim(), senha: password }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.message || "E-mail ou senha incorretos.");
        return;
      }

      onLogin?.();
    } catch {
      setError("Não foi possível conectar à API. Confira se o servidor está ligado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page-shell">
      <section className="login-card" aria-labelledby="login-title">
        <button
          type="button"
          className="back-button"
          onClick={onBack}
        >
          ← Voltar para o início
        </button>
        
        <div className="brand-mark" aria-hidden="true"><PawPrint size={27} /></div>
        <div className="eyebrow"><ShieldCheck size={15} /> ÁREA RESTRITA</div>
        <h1 id="login-title">Login do admin</h1>
        <p className="intro">Entre para gerenciar o Akinator Animal.</p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="email">E-mail</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            placeholder="admin@exemplo.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label htmlFor="password">Senha</label>
          <div className="password-field">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Digite sua senha"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <button
              className="visibility-button"
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
          </div>

          {error && <p className="message error" role="alert">{error}</p>}
          <button className="submit-button" type="submit" disabled={loading}>
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>

        {import.meta.env.DEV ? (
          <p className="security-note demo-credentials">
            Conta de teste local<br />
            E-mail: <strong>{DEMO_EMAIL}</strong><br />
            Senha: <strong>{DEMO_PASSWORD}</strong>
          </p>
        ) : (
          <p className="security-note">Acesso exclusivo para administradores autorizados.</p>
        )}
      </section>
      <footer>AKINATOR ANIMAL <span>·</span> PAINEL ADMINISTRATIVO</footer>
    </main>
  );
}
