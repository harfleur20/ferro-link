import { useEffect, useState } from "react";
import { FaGoogle, FaArrowLeft, FaTrainSubway } from "react-icons/fa6";
import { supabase, supabaseConfigured } from "../lib/supabase.js";
import "../styles/portals.css";

export default function AuthPage() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) window.location.replace("/espace-candidat");
    });
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setError(""); setNotice("");
    if (!supabaseConfigured) {
      setError("La connexion n’est pas encore configurée. Ajoutez les variables Supabase dans le fichier .env.local puis activez Google OAuth dans Supabase.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error: authError } = await supabase.auth.signUp({
          email, password,
          options: {
            data: { full_name: fullName.trim() },
            emailRedirectTo: window.location.origin + "/connexion",
          },
        });
        if (authError) throw authError;
        setNotice("Compte créé. Consultez votre boîte e-mail pour confirmer votre adresse avant de vous connecter.");
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
        window.location.assign("/espace-candidat");
      }
    } catch (err) {
      setError(err.message || "Une erreur est survenue. Réessayez.");
    } finally { setBusy(false); }
  };

  const googleLogin = async () => {
    setError(""); setNotice("");
    if (!supabaseConfigured) {
      setError("Google OAuth nécessite la configuration Supabase et l’activation du fournisseur Google.");
      return;
    }
    setBusy(true);
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/auth/callback" },
    });
    if (authError) { setError(authError.message); setBusy(false); }
  };

  const resetPassword = async () => {
    setError(""); setNotice("");
    if (!email) { setError("Saisissez votre adresse e-mail pour recevoir le lien de réinitialisation."); return; }
    if (!supabaseConfigured) { setError("La récupération du mot de passe sera disponible après configuration de Supabase."); return; }
    setBusy(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + "/reinitialiser-mot-de-passe" });
    setBusy(false);
    if (resetError) setError(resetError.message);
    else setNotice("Si cette adresse correspond à un compte, un e-mail de réinitialisation va être envoyé.");
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
          {mode === "login" && <button className="portal-forgot" type="button" onClick={resetPassword}>Mot de passe oublié ?</button>}
          {error && <p className="portal-alert error" role="alert">{error}</p>}{notice && <p className="portal-alert success" role="status">{notice}</p>}
          <button className="portal-primary-button" type="submit" disabled={busy}>{busy ? "Veuillez patienter…" : mode === "login" ? "Se connecter" : "Créer mon compte"}</button>
        </form>
        <p className="portal-legal">En continuant, vous acceptez que ferroLink traite vos informations pour gérer votre compte et vos candidatures.</p>
      </section>
    </main>
    <footer className="portal-auth-footer">© {new Date().getFullYear()} ferroLink · Ingénierie ferroviaire</footer>
  </div>;
}
