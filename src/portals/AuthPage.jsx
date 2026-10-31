import { useEffect, useState } from "react";
import { FaGoogle, FaArrowLeft, FaTrainSubway } from "react-icons/fa6";
import "../styles/portals.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

async function request(path, body) {
  const response = await fetch(API + path, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = response.status === 204 ? {} : await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Une erreur est survenue.");
  return data;
}

export default function AuthPage() {
  const [mode, setMode] = useState(window.location.pathname === "/inscription" ? "signup" : "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(API + "/api/auth/me", { credentials: "include" }).then(r => r.ok ? r.json() : null).then(data => {
      if (data?.user) window.location.replace(["CANDIDATE"].includes(data.user.role) ? "/espace-candidat" : "/administration");
    }).catch(() => {});
    if (!googleClientId || !window.google?.accounts?.id) return;
    window.google.accounts.id.initialize({ client_id: googleClientId, callback: handleGoogleCredential });
  }, []);

  async function handleGoogleCredential(response) {
    setBusy(true); setError(""); setNotice("");
    try {
      const data = await request("/api/auth/google", { credential: response.credential });
      window.location.assign(data.user.role === "CANDIDATE" ? "/espace-candidat" : "/administration");
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  const submit = async (event) => {
    event.preventDefault(); setError(""); setNotice(""); setBusy(true);
    try {
      const data = await request(mode === "signup" ? "/api/auth/register" : "/api/auth/login", mode === "signup" ? { email, password, fullName } : { email, password });
      window.location.assign(data.user.role === "CANDIDATE" ? "/espace-candidat" : "/administration");
    } catch (err) { setError(err.message || "Une erreur est survenue."); } finally { setBusy(false); }
  };
  const googleLogin = () => {
    setError("");
    if (!googleClientId || !window.google?.accounts?.id) {
      setError("La connexion Google n'est pas encore configurée. Ajoutez VITE_GOOGLE_CLIENT_ID et chargez Google Identity Services.");
      return;
    }
    window.google.accounts.id.prompt();
  };
  return <div className="portal-auth-page">
    <header className="portal-auth-top"><a href="/" className="portal-brand"><FaTrainSubway /> <span>ferro<span>Link</span></span></a><a href="/" className="portal-back"><FaArrowLeft /> Retour au site</a></header>
    <main className="portal-auth-main">
      <section className="portal-auth-intro"><span className="portal-eyebrow">CARRIÈRES FERROVIAIRES</span><h1>Construisons la suite de votre parcours.</h1><p>Retrouvez vos candidatures et suivez leur évolution depuis un espace personnel sécurisé.</p><div className="portal-auth-note"><span>01</span><div><strong>Un espace personnel</strong><p>Vos informations et vos candidatures au même endroit.</p></div></div><div className="portal-auth-note"><span>02</span><div><strong>Un suivi simplifié</strong><p>Consultez les étapes de traitement de vos dossiers.</p></div></div></section>
      <section className="portal-auth-card">
        <div className="portal-auth-tabs" role="tablist" aria-label="Accès au compte"><button type="button" role="tab" aria-selected={mode === "login"} className={mode === "login" ? "active" : ""} onClick={() => {setMode("login");setError("");setNotice("");}}>Connexion</button><button type="button" role="tab" aria-selected={mode === "signup"} className={mode === "signup" ? "active" : ""} onClick={() => {setMode("signup");setError("");setNotice("");}}>Inscription</button></div>
        <h2>{mode === "login" ? "Ravi de vous revoir" : "Créez votre compte candidat"}</h2><p className="portal-auth-subtitle">{mode === "login" ? "Connectez-vous pour accéder à votre espace." : "Quelques informations pour commencer."}</p>
        <button className="portal-google-button" type="button" onClick={googleLogin} disabled={busy}><FaGoogle /> Continuer avec Google</button>
        <div className="portal-divider"><span>ou avec votre e-mail</span></div>
        <form onSubmit={submit} className="portal-auth-form">
          {mode === "signup" && <label>Nom complet<input autoComplete="name" value={fullName} onChange={e=>setFullName(e.target.value)} required maxLength={100} placeholder="Prénom et nom" /></label>}
          <label>Adresse e-mail<input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="vous@exemple.fr" /></label>
          <label>Mot de passe<input type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={e=>setPassword(e.target.value)} required minLength={8} placeholder="8 caractères minimum" /></label>
          {error && <p className="portal-alert error" role="alert">{error}</p>}{notice && <p className="portal-alert success" role="status">{notice}</p>}
          <button className="portal-primary-button" type="submit" disabled={busy}>{busy ? "Veuillez patienter…" : mode === "login" ? "Se connecter" : "Créer mon compte"}</button>
        </form>
        <p className="portal-legal">En continuant, vous acceptez que ferroLink traite vos informations pour gérer votre compte et vos candidatures.</p>
      </section>
    </main><footer className="portal-auth-footer">© {new Date().getFullYear()} ferroLink · Ingénierie ferroviaire</footer>
  </div>;
}