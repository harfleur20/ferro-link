import { useEffect, useState } from "react";
import { FaTrainSubway, FaHouse, FaBriefcase, FaFileLines, FaBell, FaUser, FaGear, FaShieldHalved, FaUsers, FaArrowRightFromBracket, FaArrowLeft, FaBars, FaCheckCircle, FaClock, FaCircleExclamation } from "react-icons/fa6";
import { supabase, supabaseConfigured } from "../lib/supabase.js";
import "../styles/portals.css";

const candidateItems = [
  { id:"dashboard", label:"Tableau de bord", icon:FaHouse },
  { id:"offers", label:"Offres d’emploi", icon:FaBriefcase },
  { id:"applications", label:"Mes candidatures", icon:FaFileLines },
  { id:"notifications", label:"Notifications", icon:FaBell },
  { id:"profile", label:"Mon profil", icon:FaUser },
];
const adminItems = [
  { id:"dashboard", label:"Tableau de bord", icon:FaHouse },
  { id:"applications", label:"Candidatures", icon:FaFileLines },
  { id:"offers", label:"Gestion des offres", icon:FaBriefcase },
  { id:"users", label:"Utilisateurs & rôles", icon:FaUsers },
  { id:"notifications", label:"Notifications", icon:FaBell },
  { id:"settings", label:"Paramètres", icon:FaGear },
];

export default function PortalApp({ admin = false }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [active, setActive] = useState("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);
  const navItems = admin ? adminItems : candidateItems;

  useEffect(() => {
    let mounted = true;
    if (!supabaseConfigured) { setError("Le service de compte n’est pas configuré. Renseignez les variables Supabase avant d’ouvrir cet espace."); setLoading(false); return; }
    supabase.auth.getSession().then(async ({data, error: sessionError}) => {
      if (!mounted) return;
      if (sessionError || !data.session) { window.location.replace("/connexion"); return; }
      const user = data.session.user;
      const { data: row, error: profileError } = await supabase.from("profiles").select("id,full_name,role,avatar_url").eq("id", user.id).maybeSingle();
      if (!mounted) return;
      if (profileError) setError("Impossible de charger votre profil. Vérifiez que le schéma SQL Supabase a été appliqué.");
      const role = row?.role || "candidate";
      if (admin && !["super_admin","recruitment_admin","recruiter"].includes(role)) { window.location.replace("/espace-candidat"); return; }
      if (!admin && role !== "candidate") { window.location.replace("/administration"); return; }
      setSession(data.session); setProfile(row || {full_name:user.user_metadata?.full_name || user.email, role}); setLoading(false);
      supabase.auth.onAuthStateChange((_event, nextSession) => {
        if (!nextSession) window.location.replace("/connexion");
      });
    });
    return () => { mounted = false; };
  }, [admin]);

  useEffect(() => {
    if (!session || !supabaseConfigured) return;
    let query = supabase.from(admin ? "applications_admin_view" : "applications").select("*").order("created_at", {ascending:false}).limit(10);
    query.then(({data,error:queryError}) => { if (queryError) setError("Les données métier ne sont pas encore disponibles. Appliquez le schéma SQL et les vues prévues."); else setItems(data || []); });
  }, [session, admin]);

  const logout = async () => { if (supabase) await supabase.auth.signOut(); window.location.replace("/connexion"); };
  const title = navItems.find(item=>item.id===active)?.label || "Tableau de bord";
  if (loading) return <div className="portal-loading">Chargement de votre espace…</div>;
  if (!supabaseConfigured) return <div className="portal-config-error"><h1>Configuration requise</h1><p>{error}</p><a href="/">Retour au site</a></div>;

  return <div className="portal-shell">
    <aside className={`portal-sidebar ${menuOpen ? "open" : ""}`}>
      <a className="portal-sidebar-brand" href="/"><FaTrainSubway/><span>ferro<span>Link</span></span></a>
      <p className="portal-side-label">{admin ? "ADMINISTRATION" : "ESPACE CANDIDAT"}</p>
      <nav aria-label="Navigation de l’espace">{navItems.map(item=><button type="button" key={item.id} className={active===item.id?"selected":""} onClick={()=>{setActive(item.id);setMenuOpen(false);}}><item.icon/><span>{item.label}</span></button>)}</nav>
      <div className="portal-sidebar-bottom"><a href="/"><FaArrowLeft/> Retour au site</a><button type="button" onClick={logout}><FaArrowRightFromBracket/> Déconnexion</button></div>
    </aside>
    <div className="portal-main-column">
      <header className="portal-topbar"><button className="portal-mobile-menu" onClick={()=>setMenuOpen(!menuOpen)} aria-label="Ouvrir le menu"><FaBars/></button><div><span className="portal-top-eyebrow">{admin?"ESPACE ADMINISTRATION":"ESPACE PERSONNEL"}</span><h1>{title}</h1></div><div className="portal-account-wrap"><button className="portal-account" onClick={()=>setAccountOpen(!accountOpen)} aria-expanded={accountOpen}><span className="portal-avatar">{(profile?.full_name || "U").slice(0,1).toUpperCase()}</span><span className="portal-account-name">{profile?.full_name || session?.user?.email?.split("@")[0]}</span><span className="portal-account-caret">⌄</span></button>{accountOpen&&<div className="portal-account-menu"><button onClick={()=>{setActive("profile");setAccountOpen(false);}}>Mon profil</button><button onClick={()=>{setActive("settings");setAccountOpen(false);}}>Paramètres</button><button onClick={logout}>Déconnexion</button></div>}</div></header>
      <main className="portal-content">
        {error && <div className="portal-alert error" role="alert">{error}</div>}
        {active==="dashboard" && <><div className="portal-welcome"><div><span className="portal-eyebrow">{admin?"PILOTAGE RECRUTEMENT":"VOTRE PARCOURS"}</span><h2>Bonjour {profile?.full_name?.split(" ")[0] || "et bienvenue"}.</h2><p>{admin?"Retrouvez les candidatures et les actions de recrutement.":"Retrouvez ici les dernières informations sur votre recherche et vos candidatures."}</p></div><span className="portal-welcome-icon"><FaTrainSubway/></span></div><div className="portal-stats-grid">{(admin?[["Candidatures à traiter",items.length,FaClock],["Offres publiées","—",FaBriefcase],["Comptes utilisateurs","—",FaUsers]]:[["Mes candidatures",items.length,FaFileLines],["En cours",items.filter(x=>!["rejected","accepted"].includes(x.status)).length,FaClock],["Réponses reçues",items.filter(x=>["rejected","accepted"].includes(x.status)).length,FaCheckCircle]]).map(([label,value,Icon])=><article className="portal-stat-card" key={label}><span>{label}</span><strong>{value}</strong><i><Icon/></i></article>)}</div><section className="portal-panel"><div className="portal-panel-heading"><div><span className="portal-eyebrow">{admin?"ACTIVITÉ RÉCENTE":"SUIVI"}</span><h3>{admin?"Dernières candidatures":"Mes dernières candidatures"}</h3></div><button onClick={()=>setActive("applications")} className="portal-text-button">Tout consulter →</button></div>{items.length===0?<p className="portal-empty">Aucune candidature à afficher pour le moment.</p>:<div className="portal-table-wrap"><table className="portal-table"><thead><tr><th>Référence</th><th>Statut</th><th>Reçue le</th></tr></thead><tbody>{items.map(item=><tr key={item.id}><td>{item.job_title || item.reference || item.id}</td><td><span className={`portal-status status-${item.status||"pending"}`}>{item.status||"En attente"}</span></td><td>{item.created_at?new Date(item.created_at).toLocaleDateString("fr-FR"):"—"}</td></tr>)}</tbody></table></div>}</section></>}
        {active==="applications" && <section className="portal-panel"><div className="portal-panel-heading"><div><span className="portal-eyebrow">SUIVI DES DOSSIERS</span><h3>{admin?"Candidatures reçues":"Mes candidatures"}</h3></div></div>{items.length===0?<p className="portal-empty">Aucune candidature disponible.</p>:<div className="portal-table-wrap"><table className="portal-table"><thead><tr><th>Offre / référence</th>{admin&&<th>Candidat</th>}<th>Statut</th><th>Date</th></tr></thead><tbody>{items.map(item=><tr key={item.id}><td>{item.job_title||item.reference||item.id}</td>{admin&&<td>{item.candidate_name||"Candidat"}</td>}<td><span className={`portal-status status-${item.status||"pending"}`}>{item.status||"En attente"}</span></td><td>{item.created_at?new Date(item.created_at).toLocaleDateString("fr-FR"):"—"}</td></tr>)}</tbody></table></div>}</section>}
        {active==="offers" && <section className="portal-panel"><span className="portal-eyebrow">RECRUTEMENT</span><h3>{admin?"Gestion des offres":"Offres d’emploi"}</h3><p className="portal-empty">{admin?"La gestion complète des offres nécessite de relier les formulaires de publication à la table jobs.":"Les offres seront affichées ici dès que le catalogue sera connecté à la base de données."}</p><a className="portal-inline-link" href="/offres-emploi">Consulter les offres publiques →</a></section>}
        {active==="profile" && <section className="portal-panel"><span className="portal-eyebrow">COMPTE PERSONNEL</span><h3>Mon profil</h3><p><strong>Nom :</strong> {profile?.full_name||"Non renseigné"}</p><p><strong>E-mail :</strong> {session?.user?.email}</p><p><strong>Rôle :</strong> {profile?.role}</p><p className="portal-muted">L’adresse e-mail du compte est gérée par le fournisseur d’authentification.</p></section>}
        {active==="notifications" && <section className="portal-panel"><span className="portal-eyebrow">CENTRE DE NOTIFICATIONS</span><h3>Notifications</h3><p className="portal-empty">Vous n’avez aucune nouvelle notification.</p></section>}
        {active==="users" && <section className="portal-panel"><span className="portal-eyebrow">ACCÈS ET AUTORISATIONS</span><h3>Utilisateurs & rôles</h3><p className="portal-empty">La gestion des rôles est réservée au super administrateur et doit être effectuée côté serveur.</p></section>}
        {active==="settings" && <section className="portal-panel"><span className="portal-eyebrow">PRÉFÉRENCES</span><h3>Paramètres</h3><p>Connecté avec {session?.user?.email}</p><button className="portal-secondary-button" onClick={logout}>Se déconnecter</button></section>}
      </main>
    </div>
  </div>;
}
