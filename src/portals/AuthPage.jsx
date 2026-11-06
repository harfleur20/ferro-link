import { useState } from "react";
import "../styles/portals.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";
const resetToken = new URLSearchParams(window.location.search).get("resetToken");

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [mode, setMode] = useState(resetToken ? "reset" : "login");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const clearFeedback = () => {
    setError("");
    setMessage("");
  };

  const changeMode = (nextMode) => {
    clearFeedback();
    setMode(nextMode);
    if (nextMode !== "reset" && resetToken) {
      window.history.replaceState({}, "", window.location.pathname);
    }
  };

  const submitLogin = async (event) => {
    event.preventDefault();
    clearFeedback();
    setLoading(true);
    try {
      const response = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, rememberMe }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Connexion impossible.");
      location.replace("/administration");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const submitForgotPassword = async (event) => {
    event.preventDefault();
    clearFeedback();
    setLoading(true);
    try {
      const response = await fetch(`${API}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Demande impossible.");
      setMessage(data.message);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const submitResetPassword = async (event) => {
    event.preventDefault();
    clearFeedback();
    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: resetToken, password: newPassword }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Réinitialisation impossible.");
      window.history.replaceState({}, "", window.location.pathname);
      setPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMode("login");
      setMessage("Votre mot de passe a été modifié. Vous pouvez vous connecter.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const isForgotMode = mode === "forgot";
  const isResetMode = mode === "reset";
  const submit = isForgotMode ? submitForgotPassword : isResetMode ? submitResetPassword : submitLogin;

  return (
    <main className="auth-page">
      <section className="auth-card" aria-label="Connexion à l’espace ferroLink">
        <a className="auth-logo-link" href="/" aria-label="ferroLink, retour à l’accueil">
          <img
            className="auth-logo"
            src="/images/logo-site.png"
            alt=""
            width="3473"
            height="490"
          />
        </a>
        {isForgotMode && <h1>Mot de passe oublié</h1>}
        {isResetMode && <h1>Nouveau mot de passe</h1>}
        <form className="auth-form" onSubmit={submit}>
          {(!isResetMode) && (
            <label>
              Adresse e-mail
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="username"
                placeholder="vous@ferrolink.fr"
                required
              />
            </label>
          )}
          {mode === "login" && (
            <label>
              Mot de passe
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                placeholder="Votre mot de passe"
                required
              />
            </label>
          )}
          {isResetMode && (
            <>
              <label>
                Nouveau mot de passe
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={128}
                  required
                />
              </label>
              <label>
                Confirmer le mot de passe
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={128}
                  required
                />
              </label>
            </>
          )}
          {mode === "login" && (
            <div className="auth-options">
              <label className="auth-remember">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                />
                <span>Se souvenir de moi</span>
              </label>
              <button
                className="auth-text-button"
                type="button"
                onClick={() => changeMode("forgot")}
              >
                Mot de passe oublié ?
              </button>
            </div>
          )}
          {error && <p className="auth-error" role="alert">{error}</p>}
          {message && <p className="auth-message" role="status">{message}</p>}
          <button className="button button-lime auth-submit" type="submit" disabled={loading}>
            {loading ? "Veuillez patienter…" : isForgotMode ? "Envoyer le lien" : isResetMode ? "Modifier le mot de passe" : "Se connecter"}
          </button>
        </form>
        {mode !== "login" && (
          <button className="auth-text-button auth-back-to-login" type="button" onClick={() => changeMode("login")}>
            Retour à la connexion
          </button>
        )}
      </section>
    </main>
  );
}
