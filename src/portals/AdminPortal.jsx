import { useEffect, useMemo, useRef, useState } from "react";
import {
  FaArrowLeft,
  FaBars,
  FaBell,
  FaBriefcase,
  FaChevronDown,
  FaClock,
  FaEnvelope,
  FaFileLines,
  FaGear,
  FaHouse,
  FaNewspaper,
  FaPaintbrush,
  FaPen,
  FaTrainSubway,
  FaUsers,
} from "react-icons/fa6";
import ApplicationDetail from "./ApplicationDetail.jsx";
import ContactMessages from "./ContactMessages.jsx";
import JobEditor from "./JobEditor.jsx";
import NewsAdmin from "./NewsAdmin.jsx";
import SiteEditor from "./SiteEditor.jsx";
import UsersAdmin from "./UsersAdmin.jsx";
import { toast, Toaster } from "./toast.jsx";
import { defaultSiteSettings, mergeSiteSettings } from "../siteSettings.js";
import "../styles/portals.css";
import { serverFetch } from "../serverFetch.js";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

const candidateEmailLabels = { INTERVIEW: "d’entretien", ACCEPTED: "d’acceptation", REJECTED: "de refus" };
const notificationRefreshDelay = 60 * 1000;
// Each request extends the session, so an unattended page must stop refreshing.
const notificationIdleLimit = 30 * 60 * 1000;

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
  const response = await serverFetch(`${API}${path}`, {
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
  const accountRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [jobEditor, setJobEditor] = useState(null);
  const [selectedApplicationId, setSelectedApplicationId] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [users, setUsers] = useState([]);
  const [siteSettings, setSiteSettings] = useState(defaultSiteSettings);
  const [siteSettingsUpdatedAt, setSiteSettingsUpdatedAt] = useState(null);
  const [siteSettingsLoadError, setSiteSettingsLoadError] = useState("");

  const permissions = user ? roleDetails[user.role] : null;
  const navItems = useMemo(() => {
    const items = [
      { id: "dashboard", label: "Tableau de bord", icon: FaHouse },
      { id: "applications", label: "Candidatures", icon: FaFileLines },
      { id: "offers", label: "Offres d’emploi", icon: FaBriefcase },
      { id: "messages", label: "Messages", icon: FaEnvelope },
    ];
    if (permissions?.canManageUsers) items.push({ id: "users", label: "Utilisateurs & rôles", icon: FaUsers });
    if (permissions?.canManageSite) items.push({ id: "news", label: "Actualités", icon: FaNewspaper });
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
          api("/api/staff/jobs"),
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

  useEffect(() => {
    if (!accountOpen) return undefined;
    const closeOutside = (event) => {
      if (!accountRef.current?.contains(event.target)) setAccountOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setAccountOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [accountOpen]);

  const userId = user?.id;
  useEffect(() => {
    if (!userId) return undefined;
    let lastActivity = Date.now();
    const markActive = () => { lastActivity = Date.now(); };
    const refresh = async () => {
      if (document.hidden || Date.now() - lastActivity > notificationIdleLimit) return;
      try {
        const data = await api("/api/notifications");
        setNotifications(data.notifications || []);
      } catch (refreshError) {
        if (refreshError.status === 401) location.replace("/acces-equipe");
      }
    };
    const refreshOnReturn = () => {
      if (document.hidden) return;
      markActive();
      refresh();
    };
    const timer = setInterval(refresh, notificationRefreshDelay);
    window.addEventListener("pointerdown", markActive);
    window.addEventListener("keydown", markActive);
    document.addEventListener("visibilitychange", refreshOnReturn);
    return () => {
      clearInterval(timer);
      window.removeEventListener("pointerdown", markActive);
      window.removeEventListener("keydown", markActive);
      document.removeEventListener("visibilitychange", refreshOnReturn);
    };
  }, [userId]);

  const selectPage = (page) => {
    setActive(page);
    setJobEditor(null);
    setSelectedApplicationId(null);
    setMenuOpen(false);
    setAccountOpen(false);
  };

  const logout = async () => {
    try {
      await api("/api/auth/logout", { method: "POST" });
      location.replace("/acces-equipe");
    } catch (logoutError) {
      toast.error(logoutError.message);
    }
  };

  const uploadAvatar = async (event) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 2 * 1024 * 1024) {
      toast.error("Choisissez une image PNG, JPEG ou WebP de 2 Mo maximum.");
      input.value = "";
      return;
    }
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const response = await serverFetch(`${API}/api/profile/avatar`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Impossible d’importer la photo de profil.");
      setUser((current) => ({ ...current, ...result.user }));
      setAccountOpen(false);
      toast.success("Photo de profil mise à jour.");
    } catch (uploadError) {
      toast.error(uploadError.message || "Impossible d’importer la photo de profil.");
    } finally {
      setAvatarUploading(false);
      input.value = "";
    }
  };

  const saveApplication = async (application, changes) => {
    const emailLabel = changes.status !== application.status && candidateEmailLabels[changes.status];
    if (emailLabel && !window.confirm(`Un e-mail ${emailLabel} sera envoyé à ${application.applicantName}. Il ne pourra pas être annulé. Continuer ?`)) return { cancelled: true };
    const { application: updated, candidateEmail } = await api(`/api/applications/${application.id}/status`, {
      method: "PATCH",
      body: JSON.stringify(changes),
    });
    setApplications((previous) => previous.map((item) => item.id === application.id ? { ...item, ...updated } : item));
    return {
      notice: candidateEmail === "sent" ? `E-mail envoyé à ${application.applicantName}.` : "",
      warning: candidateEmail === "failed" ? `Statut enregistré, mais l’e-mail n’a pas pu être envoyé à ${application.applicantName}. Prévenez cette personne directement.` : "",
    };
  };

  const updateApplicationStatus = async (application, status) => {
    try {
      const result = await saveApplication(application, { status });
      if (result.cancelled) return;
      toast.success(result.notice || "Statut de la candidature mis à jour.");
      if (result.warning) toast.error(result.warning);
    } catch (updateError) {
      toast.error(updateError.message);
    }
  };

  const deleteApplication = async (application) => {
    await api(`/api/applications/${application.id}`, { method: "DELETE" });
    setApplications((previous) => previous.filter((item) => item.id !== application.id));
    setSelectedApplicationId(null);
    toast.success("Candidature supprimée.");
  };

  const updateJobStatus = async (job, status) => {
    try {
      const { job: updated } = await api(`/api/jobs/${job.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setJobs((previous) => previous.map((item) => item.id === job.id ? updated : item));
      toast.success("Statut de l’offre mis à jour.");
    } catch (updateError) {
      toast.error(updateError.message);
    }
  };

  const saveJob = async (payload) => {
    const current = jobEditor.job;
    const { job } = await api(current ? `/api/jobs/${current.id}` : "/api/jobs", {
      method: current ? "PATCH" : "POST",
      body: JSON.stringify(payload),
    });
    setJobs((previous) => current ? previous.map((item) => item.id === job.id ? job : item) : [job, ...previous]);
    setJobEditor(null);
    toast.success(current ? "Offre enregistrée." : "Offre créée.");
  };

  const markNotificationRead = async (notification) => {
    try {
      await api(`/api/notifications/${notification.id}/read`, { method: "PATCH" });
      setNotifications((previous) => previous.map((item) => item.id === notification.id
        ? { ...item, readAt: new Date().toISOString() }
        : item));
    } catch (updateError) {
      toast.error(updateError.message);
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
  const selectedApplication = applications.find((application) => application.id === selectedApplicationId);
  const publishedJobs = jobs.filter((job) => job.status === "PUBLISHED").length;
  const stats = [
    { label: "Candidatures à traiter", value: pendingApplications, icon: FaClock },
    { label: "Offres publiées", value: publishedJobs, icon: FaBriefcase },
    ...(permissions.canManageUsers ? [{ label: "Comptes utilisateurs", value: users.length, icon: FaUsers }] : []),
  ];

  return <div className="portal-shell">
    <Toaster />
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
    {menuOpen && <button className="portal-sidebar-backdrop" type="button" aria-label="Fermer le menu" onClick={() => setMenuOpen(false)} />}

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
        <div className="portal-account-wrap" ref={accountRef}>
          <button className="portal-account" type="button" onClick={() => setAccountOpen(!accountOpen)} aria-expanded={accountOpen}>
            <span className="portal-avatar">
              <span>{user.fullName?.slice(0, 1).toUpperCase() || "U"}</span>
              {user.avatarUrl && <img src={user.avatarUrl.startsWith("/") ? `${API}${user.avatarUrl}` : user.avatarUrl} alt="" onError={(event) => { event.currentTarget.hidden = true; }} />}
            </span>
            <span className="portal-account-identity">
              <span className="portal-account-name" title={user.fullName}>{user.fullName}</span>
              <span className="portal-account-label">{permissions.label}</span>
            </span>
            <FaChevronDown className="portal-account-caret" aria-hidden="true" />
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

        {active === "applications" && selectedApplication && <ApplicationDetail key={selectedApplication.id} application={selectedApplication} onSave={saveApplication} onDelete={permissions.canManageSite ? deleteApplication : null} onBack={() => setSelectedApplicationId(null)} />}

        {active === "applications" && !selectedApplication && <section className="portal-panel">
          <div className="portal-panel-heading">
            <div><span className="portal-eyebrow">SUIVI DES CANDIDATS</span><h3>Candidatures reçues</h3></div>
            <span className="portal-muted">{applications.length} candidature{applications.length > 1 ? "s" : ""}</span>
          </div>
          {applications.length === 0 ? <p className="portal-empty">Aucune candidature disponible.</p> : <div className="portal-table-wrap">
            <table className="portal-table">
              <thead><tr><th>Offre</th><th>Candidat</th><th>Statut</th><th>Date</th><th>Changer le statut</th><th>Dossier</th></tr></thead>
              <tbody>{applications.map((application) => <tr key={application.id}>
                <td>{application.jobTitle || application.job?.title || "Candidature spontanée"}</td>
                <td>{application.applicantName || application.candidate?.fullName || "—"}<br />
                  <small>{application.applicantEmail || application.candidate?.email || ""}</small><br />
                  <small>{application.applicantPhone || ""}{application.applicantCity ? ` · ${application.applicantCity}` : ""}</small>
                </td>
                <td><Status value={application.status} /></td>
                <td>{formatDate(application.createdAt)}</td>
                <td><select aria-label={`Statut de la candidature de ${application.applicantName || "ce candidat"}`} value={application.status} onChange={(event) => updateApplicationStatus(application, event.target.value)}>
                  <option value="RECEIVED">Reçue</option><option value="UNDER_REVIEW">En étude</option><option value="INTERVIEW">Entretien</option><option value="ACCEPTED">Acceptée</option><option value="REJECTED">Refusée</option>
                </select></td>
                <td><button className="portal-text-button" type="button" onClick={() => setSelectedApplicationId(application.id)}>Voir le dossier</button></td>
              </tr>)}</tbody>
            </table>
          </div>}
        </section>}

        {active === "offers" && jobEditor && <JobEditor job={jobEditor.job} onSave={saveJob} onCancel={() => setJobEditor(null)} />}

        {active === "offers" && !jobEditor && <section className="portal-panel">
          <div className="portal-panel-heading">
            <div><span className="portal-eyebrow">EMPLOI & RECRUTEMENT</span><h3>Offres d’emploi</h3></div>
            {permissions.canManageJobs && <button className="portal-primary-button portal-add-job" type="button" onClick={() => setJobEditor({ job: null })}>+ Nouvelle offre</button>}
          </div>
          {!permissions.canManageJobs && <p className="portal-muted portal-permission-note">Consultation des offres en lecture seule pour votre rôle.</p>}
          {jobs.length === 0 ? <p className="portal-empty">Aucune offre disponible.</p> : <div className="portal-table-wrap">
            <table className="portal-table">
              <thead><tr><th>Titre</th><th>Lieu</th><th>Contrat</th><th>Statut</th>{permissions.canManageJobs && <th>Changer le statut</th>}{permissions.canManageJobs && <th>Action</th>}</tr></thead>
              <tbody>{jobs.map((job) => <tr key={job.id}>
                <td>{job.title}</td><td>{job.location || "—"}</td><td>{job.contractType || "—"}</td>
                <td><Status value={job.status} /></td>
                {permissions.canManageJobs && <td><select aria-label={`Statut de l’offre ${job.title}`} value={job.status} onChange={(event) => updateJobStatus(job, event.target.value)}>
                  <option value="DRAFT">Brouillon</option><option value="PUBLISHED">Publiée</option><option value="CLOSED">Fermée</option>
                </select></td>}
                {permissions.canManageJobs && <td><button className="portal-text-button" type="button" onClick={() => setJobEditor({ job })}>Modifier</button></td>}
              </tr>)}</tbody>
            </table>
          </div>}
        </section>}

        {active === "messages" && <ContactMessages api={api} canDelete={permissions.canManageSite} />}

        {active === "news" && permissions.canManageSite && <NewsAdmin api={api} />}

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

        {active === "users" && permissions.canManageUsers && <UsersAdmin api={api} currentUser={user} users={users} setUsers={setUsers} />}

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
