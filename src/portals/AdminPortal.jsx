import { useEffect, useMemo, useRef, useState } from "react";
import {
  FaArrowLeft,
  FaBars,
  FaBell,
  FaBriefcase,
  FaClock,
  FaFileLines,
  FaGear,
  FaHouse,
  FaPaintbrush,
  FaPen,
  FaTrainSubway,
  FaUsers,
} from "react-icons/fa6";
import SiteEditor from "./SiteEditor.jsx";
import { defaultSiteSettings, mergeSiteSettings } from "../siteSettings.js";
import "../styles/portals.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

const roleDetails = {
  SUPER_ADMIN: {
    label: "SuperAdmin",
    description: "Administration complète de la plateforme et des accès.",
    canManageJobs: true,
    canManageUsers: true,
    canManageSite: true,
  },
  RECRUITMENT_ADMIN: {
    label: "Business Manager",
    description: "Pilotage des offres, des candidatures et de l’activité recrutement.",
    canManageJobs: true,
    canManageUsers: false,
    canManageSite: true,
  },
  RECRUITER: {
    label: "Chargé de recrutement",
    description: "Suivi opérationnel des candidatures et des échanges avec les candidats.",
    canManageJobs: false,
    canManageUsers: false,
    canManageSite: false,
  },
};

async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    credentials: "include",
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const data = response.status === 204 ? {} : await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(data.error || "Erreur API."), { status: response.status });
  return data;
}

function formatDate(value, withTime = false) {
  return new Date(value).toLocaleString("fr-FR", withTime
    ? { dateStyle: "short", timeStyle: "short" }
    : { dateStyle: "medium" });
}

function Status({ value }) {
  const labels = {
    RECEIVED: "Reçue",
    UNDER_REVIEW: "En étude",
    INTERVIEW: "Entretien",
    ACCEPTED: "Acceptée",
    REJECTED: "Refusée",
    DRAFT: "Brouillon",
    PUBLISHED: "Publiée",
    CLOSED: "Fermée",
  };
  return <span className={`portal-status status-${value.toLowerCase()}`}>{labels[value] || value}</span>;
}

export default function AdminPortal() {
  const [user, setUser] = useState(null);
  const [active, setActive] = useState("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [siteSettings, setSiteSettings] = useState(defaultSiteSettings);
  const [siteSettingsUpdatedAt, setSiteSettingsUpdatedAt] = useState(null);
  const [siteSettingsLoadError, setSiteSettingsLoadError] = useState("");

  const permissions = user ? roleDetails[user.role] : null;
  const navItems = useMemo(() => {
    const items = [
      { id: "dashboard", label: "Tableau de bord", icon: FaHouse },
      { id: "applications", label: "Candidatures", icon: FaFileLines },
      { id: "offers", label: "Offres d’emploi", icon: FaBriefcase },
    ];
    if (permissions?.canManageUsers) items.push({ id: "users", label: "Utilisateurs & rôles", icon: FaUsers });
    if (permissions?.canManageSite) items.push({ id: "site", label: "Contenu du site", icon: FaPaintbrush });
    items.push({ id: "notifications", label: "Notifications", icon: FaBell });
    items.push({ id: "settings", label: "Mon compte", icon: FaGear });
    return items;
  }, [permissions]);

  useEffect(() => {
    let alive = true;
    async function loadPortal() {
      try {
        const { user: currentUser } = await api("/api/auth/me");
        if (!alive) return;
        if (!roleDetails[currentUser.role]) {
          location.replace("/acces-equipe");
          return;
        }
        setUser(currentUser);
        const requests = [
          api("/api/applications"),
          api("/api/jobs"),
          api("/api/notifications"),
          ...(currentUser.role === "SUPER_ADMIN" ? [api("/api/users")] : []),
          ...(roleDetails[currentUser.role].canManageSite
            ? [api("/api/site-settings").catch((settingsError) => {
              if (alive) setSiteSettingsLoadError(settingsError.message);
              return null;
            })]
            : []),
        ];
        const [applicationData, jobData, notificationData, ...additionalData] = await Promise.all(requests);
        if (!alive) return;
        setApplications(applicationData.applications || []);
        setJobs(jobData.jobs || []);
        setNotifications(notificationData.notifications || []);
        const userData = currentUser.role === "SUPER_ADMIN" ? additionalData.shift() : null;
        if (userData) setUsers(userData.users || []);
        const settingsData = roleDetails[currentUser.role].canManageSite ? additionalData[0] : null;
        if (settingsData) {
          setSiteSettings(mergeSiteSettings(settingsData.settings));
          setSiteSettingsUpdatedAt(settingsData.updatedAt);
          setSiteSettingsLoadError("");
        }
      } catch (loadError) {
        if (!alive) return;
        if (loadError.status === 401) location.replace("/acces-equipe");
        else setError(loadError.message);
      } finally {
        if (alive) setLoading(false);
      }
    }
    loadPortal();
    return () => { alive = false; };
  }, []);

  const selectPage = (page) => {
    setActive(page);
    setMenuOpen(false);
    setAccountOpen(false);
  };

  const logout = async () => {
    setError("");
    try {
      await api("/api/auth/logout", { method: "POST" });
      location.replace("/acces-equipe");
    } catch (logoutError) {
      setError(logoutError.message);
    }
  };

  const uploadAvatar = async (event) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 2 * 1024 * 1024) {
      setError("Choisissez une image PNG, JPEG ou WebP de 2 Mo maximum.");
      input.value = "";
      return;
    }
    setError("");
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const response = await fetch(`${API}/api/profile/avatar`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Impossible d’importer la photo de profil.");
      setUser((current) => ({ ...current, ...result.user }));
      setAccountOpen(false);
    } catch (uploadError) {
      setError(uploadError.message || "Impossible d’importer la photo de profil.");
    } finally {
      setAvatarUploading(false);
      input.value = "";
    }
  };

  const updateApplicationStatus = async (application, status) => {
    setError("");
    try {
      const { application: updated } = await api(`/api/applications/${application.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setApplications((previous) => previous.map((item) => item.id === application.id ? { ...item, ...updated } : item));
    } catch (updateError) {
      setError(updateError.message);
    }
  };

  const updateJobStatus = async (job, status) => {
    setError("");
    try {
      const { job: updated } = await api(`/api/jobs/${job.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setJobs((previous) => previous.map((item) => item.id === job.id ? updated : item));
    } catch (updateError) {
      setError(updateError.message);
    }
  };

  const publishJob = async () => {
    const title = window.prompt("Titre de l’offre");
    if (!title?.trim()) return;
    const description = window.prompt("Description de l’offre");
    if (!description?.trim()) return;
    setError("");
    try {
      const { job } = await api("/api/jobs", {
        method: "POST",
        body: JSON.stringify({ title: title.trim(), description: description.trim(), status: "PUBLISHED" }),
      });
      setJobs((previous) => [job, ...previous]);
    } catch (createError) {
      setError(createError.message);
    }
  };

  const updateUserRole = async (account, role) => {
    setError("");
    try {
      const { user: updated } = await api(`/api/users/${account.id}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      });
      setUsers((previous) => previous.map((item) => item.id === account.id ? { ...item, ...updated } : item));
    } catch (updateError) {
      setError(updateError.message);
    }
  };

  const markNotificationRead = async (notification) => {
    setError("");
    try {
      await api(`/api/notifications/${notification.id}/read`, { method: "PATCH" });
      setNotifications((previous) => previous.map((item) => item.id === notification.id
        ? { ...item, readAt: new Date().toISOString() }
        : item));
    } catch (updateError) {
      setError(updateError.message);
    }
  };

  if (loading) return <div className="portal-loading" role="status">Chargement de votre espace…</div>;
  if (!user || !permissions) {
    return <div className="portal-config-error">
      <h1>Connexion requise</h1>
      <p>{error || "Impossible de charger votre session."}</p>
      <a href="/acces-equipe">Se connecter</a>
    </div>;
  }

  const title = navItems.find((item) => item.id === active)?.label || "Tableau de bord";
  const pendingApplications = applications.filter((application) => ["RECEIVED", "UNDER_REVIEW"].includes(application.status)).length;
  const publishedJobs = jobs.filter((job) => job.status === "PUBLISHED").length;
  const filteredUsers = users.filter((account) => `${account.fullName} ${account.email}`.toLowerCase().includes(userSearch.toLowerCase()));
  const stats = [
    { label: "Candidatures à traiter", value: pendingApplications, icon: FaClock },
    { label: "Offres publiées", value: publishedJobs, icon: FaBriefcase },
    ...(permissions.canManageUsers ? [{ label: "Comptes utilisateurs", value: users.length, icon: FaUsers }] : []),
  ];

  return <div className="portal-shell">
    <aside className={`portal-sidebar ${menuOpen ? "open" : ""}`}>
      <a className="portal-sidebar-brand" href="/" aria-label="ferroLink, retour à l'accueil">
        <img src="/images/logo-pied-page.png" alt="ferroLink" width="3472" height="490" />
      </a>
      <p className="portal-side-label">ADMINISTRATION</p>
      <nav aria-label="Navigation de l’espace administration">
        {navItems.map(({ id, label, icon: Icon }) => <button
          type="button"
          key={id}
          className={active === id ? "selected" : ""}
          aria-current={active === id ? "page" : undefined}
          onClick={() => selectPage(id)}
        >
          <Icon aria-hidden="true" /><span>{label}</span>
        </button>)}
      </nav>
      <div className="portal-sidebar-bottom">
        <a href="/"><FaArrowLeft aria-hidden="true" /> Retour au site</a>
      </div>
    </aside>

    <div className="portal-main-column">
      <header className="portal-topbar">
        <button className="portal-mobile-menu" type="button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Ouvrir le menu">
          <FaBars aria-hidden="true" />
        </button>
        <div>
          <span className="portal-top-eyebrow">ESPACE ADMINISTRATION</span>
          <h1>{title}</h1>
        </div>
        <button
          className="portal-notification-button"
          type="button"
          aria-label={`Notifications${notifications.filter((notification) => !notification.readAt).length ? `, ${notifications.filter((notification) => !notification.readAt).length} non lue${notifications.filter((notification) => !notification.readAt).length > 1 ? "s" : ""}` : ""}`}
          onClick={() => selectPage("notifications")}
        >
          <FaBell aria-hidden="true" />
          {notifications.some((notification) => !notification.readAt) && <span className="portal-notification-count">{notifications.filter((notification) => !notification.readAt).length}</span>}
        </button>
        <div className="portal-account-wrap">
          <button className="portal-account" type="button" onClick={() => setAccountOpen(!accountOpen)} aria-expanded={accountOpen}>
            <span className="portal-avatar">
              <span>{user.fullName?.slice(0, 1).toUpperCase() || "U"}</span>
              {user.avatarUrl && <img src={user.avatarUrl.startsWith("/") ? `${API}${user.avatarUrl}` : user.avatarUrl} alt="" onError={(event) => { event.currentTarget.hidden = true; }} />}
            </span>
            <span className="portal-account-name">{user.fullName}</span>
            <span className="portal-account-caret" aria-hidden="true">⌄</span>
          </button>
          {accountOpen && <div className="portal-account-menu">
            <span className="portal-account-role">{permissions.label}</span>
            <button type="button" onClick={() => selectPage("settings")}>Mon compte</button>
            <button type="button" onClick={logout}>Déconnexion</button>
          </div>}
        </div>
      </header>

      <main className="portal-content">
        {error && <div className="portal-alert error" role="alert">{error}</div>}

        {active === "dashboard" && <>
          <section className="portal-welcome">
            <div>
              <span className="portal-eyebrow">PILOTAGE RECRUTEMENT</span>
              <h2>Bonjour {user.fullName?.split(" ")[0] || "et bienvenue"}.</h2>
              <p>{permissions.description}</p>
              <span className="portal-role-badge">{permissions.label}</span>
            </div>
            <span className="portal-welcome-icon"><FaTrainSubway aria-hidden="true" /></span>
          </section>
          <div className="portal-stats-grid">
            {stats.map(({ label, value, icon: Icon }) => <article className="portal-stat-card" key={label}>
              <span>{label}</span><strong>{value}</strong><i><Icon aria-hidden="true" /></i>
            </article>)}
          </div>
          <section className="portal-panel">
            <div className="portal-panel-heading">
              <div><span className="portal-eyebrow">ACTIVITÉ RÉCENTE</span><h3>Dernières candidatures</h3></div>
              <button type="button" onClick={() => selectPage("applications")} className="portal-text-button">Tout consulter →</button>
            </div>
            {applications.length === 0 ? <p className="portal-empty">Aucune candidature à afficher pour le moment.</p> : <div className="portal-table-wrap">
              <table className="portal-table">
                <thead><tr><th>Offre</th><th>Candidat</th><th>Statut</th><th>Reçue le</th></tr></thead>
                <tbody>{applications.slice(0, 8).map((application) => <tr key={application.id}>
                  <td>{application.jobTitle || application.job?.title || "Candidature"}</td>
                  <td>{application.applicantName || application.candidate?.fullName || "—"}</td>
                  <td><Status value={application.status} /></td>
                  <td>{formatDate(application.createdAt)}</td>
                </tr>)}</tbody>
              </table>
            </div>}
          </section>
        </>}

        {active === "applications" && <section className="portal-panel">
          <div className="portal-panel-heading">
            <div><span className="portal-eyebrow">SUIVI DES CANDIDATS</span><h3>Candidatures reçues</h3></div>
            <span className="portal-muted">{applications.length} candidature{applications.length > 1 ? "s" : ""}</span>
          </div>
          {applications.length === 0 ? <p className="portal-empty">Aucune candidature disponible.</p> : <div className="portal-table-wrap">
            <table className="portal-table">
              <thead><tr><th>Offre</th><th>Candidat</th><th>Statut</th><th>Date</th><th>CV</th><th>Action</th></tr></thead>
              <tbody>{applications.map((application) => <tr key={application.id}>
                <td>{application.jobTitle || application.job?.title || "Candidature spontanée"}</td>
                <td>{application.applicantName || application.candidate?.fullName || "—"}<br />
                  <small>{application.applicantEmail || application.candidate?.email || ""}</small><br />
                  <small>{application.applicantPhone || ""}{application.applicantCity ? ` · ${application.applicantCity}` : ""}</small>
                </td>
                <td><Status value={application.status} /></td>
                <td>{formatDate(application.createdAt)}</td>
                <td><a href={`${API}/api/applications/${application.id}/cv`} target="_blank" rel="noreferrer">Télécharger</a></td>
                <td><select aria-label={`Statut de la candidature de ${application.applicantName || "ce candidat"}`} value={application.status} onChange={(event) => updateApplicationStatus(application, event.target.value)}>
                  <option value="RECEIVED">Reçue</option><option value="UNDER_REVIEW">En étude</option><option value="INTERVIEW">Entretien</option><option value="ACCEPTED">Acceptée</option><option value="REJECTED">Refusée</option>
                </select></td>
              </tr>)}</tbody>
            </table>
          </div>}
        </section>}

        {active === "offers" && <section className="portal-panel">
          <div className="portal-panel-heading">
            <div><span className="portal-eyebrow">EMPLOI & RECRUTEMENT</span><h3>Offres d’emploi</h3></div>
            {permissions.canManageJobs && <button className="portal-primary-button portal-add-job" type="button" onClick={publishJob}>+ Publier une offre</button>}
          </div>
          {!permissions.canManageJobs && <p className="portal-muted portal-permission-note">Consultation des offres en lecture seule pour votre rôle.</p>}
          {jobs.length === 0 ? <p className="portal-empty">Aucune offre disponible.</p> : <div className="portal-table-wrap">
            <table className="portal-table">
              <thead><tr><th>Titre</th><th>Lieu</th><th>Contrat</th><th>Statut</th>{permissions.canManageJobs && <th>Modifier</th>}</tr></thead>
              <tbody>{jobs.map((job) => <tr key={job.id}>
                <td>{job.title}</td><td>{job.location || "—"}</td><td>{job.contractType || "—"}</td>
                <td><Status value={job.status} /></td>
                {permissions.canManageJobs && <td><select aria-label={`Statut de l’offre ${job.title}`} value={job.status} onChange={(event) => updateJobStatus(job, event.target.value)}>
                  <option value="DRAFT">Brouillon</option><option value="PUBLISHED">Publiée</option><option value="CLOSED">Fermée</option>
                </select></td>}
              </tr>)}</tbody>
            </table>
          </div>}
        </section>}

        {active === "site" && permissions.canManageSite && <SiteEditor
          settings={siteSettings}
          updatedAt={siteSettingsUpdatedAt}
          loadError={siteSettingsLoadError}
          onSaved={(savedSettings, savedAt) => {
            setSiteSettings(mergeSiteSettings(savedSettings));
            setSiteSettingsUpdatedAt(savedAt);
            setSiteSettingsLoadError("");
          }}
        />}

        {active === "users" && permissions.canManageUsers && <section className="portal-panel">
          <div className="portal-panel-heading">
            <div><span className="portal-eyebrow">ACCÈS À LA PLATEFORME</span><h3>Utilisateurs & rôles</h3></div>
            <span className="portal-muted">{users.length} compte{users.length > 1 ? "s" : ""}</span>
          </div>
          <label className="portal-search-label">Rechercher un utilisateur
            <input className="portal-search" type="search" value={userSearch} onChange={(event) => setUserSearch(event.target.value)} placeholder="Nom ou adresse e-mail" />
          </label>
          {filteredUsers.length === 0 ? <p className="portal-empty">Aucun utilisateur ne correspond à cette recherche.</p> : <div className="portal-table-wrap">
            <table className="portal-table">
              <thead><tr><th>Nom</th><th>E-mail</th><th>Rôle</th><th>Compte</th><th>Créé le</th></tr></thead>
              <tbody>{filteredUsers.map((account) => <tr key={account.id}>
                <td>{account.fullName}</td><td>{account.email}</td>
                <td><select aria-label={`Rôle de ${account.fullName}`} value={account.role} disabled={account.id === user.id} onChange={(event) => updateUserRole(account, event.target.value)}>
                  <option value="CANDIDATE">Candidat</option><option value="RECRUITER">Chargé de recrutement</option><option value="RECRUITMENT_ADMIN">Business Manager</option><option value="SUPER_ADMIN">SuperAdmin</option>
                </select></td>
                <td><span className={`portal-status ${account.isActive ? "status-accepted" : "status-rejected"}`}>{account.isActive ? "Actif" : "Désactivé"}</span></td>
                <td>{formatDate(account.createdAt)}</td>
              </tr>)}</tbody>
            </table>
          </div>}
        </section>}

        {active === "notifications" && <section className="portal-panel">
          <div className="portal-panel-heading"><div><span className="portal-eyebrow">INFORMATIONS</span><h3>Notifications</h3></div></div>
          {notifications.length === 0 ? <p className="portal-empty">Vous n’avez aucune nouvelle notification.</p> : notifications.map((notification) => <article className="portal-notification" key={notification.id}>
            <div><strong>{notification.title}</strong><p>{notification.message}</p><small>{formatDate(notification.createdAt, true)}</small></div>
            {!notification.readAt && <button className="portal-text-button" type="button" onClick={() => markNotificationRead(notification)}>Marquer comme lue</button>}
          </article>)}
        </section>}

        {active === "settings" && <section className="portal-panel">
          <span className="portal-eyebrow">VOTRE PROFIL</span><h3>Mon compte</h3>
          <div className="portal-profile-card">
            <div className="portal-profile-avatar-wrap">
              <span className="portal-profile-avatar">
                <span>{user.fullName?.slice(0, 1).toUpperCase() || "U"}</span>
                {user.avatarUrl && <img src={user.avatarUrl.startsWith("/") ? `${API}${user.avatarUrl}` : user.avatarUrl} alt="" onError={(event) => { event.currentTarget.hidden = true; }} />}
              </span>
              <button
                className="portal-profile-avatar-edit"
                type="button"
                aria-label={avatarUploading ? "Import de la photo en cours" : "Modifier la photo de profil"}
                title="Modifier la photo de profil"
                disabled={avatarUploading}
                onClick={() => avatarInputRef.current?.click()}
              >
                <FaPen aria-hidden="true" />
              </button>
              <input ref={avatarInputRef} className="portal-avatar-upload" type="file" accept="image/png,image/jpeg,image/webp" onChange={uploadAvatar} />
            </div>
            <div className="portal-profile-card-info">
              <strong>{user.fullName}</strong>
              <span>{avatarUploading ? "Import de la photo…" : user.email}</span>
              <small>PNG, JPEG ou WebP · 2 Mo maximum</small>
            </div>
          </div>
          <div className="portal-profile-details">
            <p><strong>Nom</strong><span>{user.fullName}</span></p>
            <p><strong>Adresse e-mail</strong><span>{user.email}</span></p>
            <p><strong>Rôle</strong><span className="portal-role-badge">{permissions.label}</span></p>
            <p><strong>Périmètre</strong><span>{permissions.description}</span></p>
          </div>
        </section>}
      </main>
    </div>
  </div>;
}
