import { createContext, lazy, Suspense, useContext, useEffect, useState } from "react";
import { FaTrainSubway, FaLinkedinIn, FaFacebookF, FaInstagram, FaTiktok, FaHandshake, FaPeopleGroup, FaLightbulb, FaShieldHalved, FaAward } from "react-icons/fa6";
import "./styles/global.css";
import { defaultSiteSettings, getSiteThemeStyle, mergeSiteSettings, resolveSiteAssetUrl } from "./siteSettings.js";

const AuthPage = lazy(() => import("./portals/AuthPage.jsx"));
const AdminPortal = lazy(() => import("./portals/AdminPortal.jsx"));
const routeFallback = <div className="route-loading" role="status">Chargement…</div>;
const SiteSettingsContext = createContext(defaultSiteSettings);
const API = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

const paths = {
  accueil: "/",
  about: "/a-propos",
  jobs: "/offres-emploi",
  news: "/actualites",
  contact: "/contact",
  spontaneous: "/candidature-spontanee",
  legal: "/mentions-legales",
  privacy: "/confidentialite",
};

const siteName = "ferroLink";
const pageTitles = {
  [paths.about]: "À propos",
  [paths.jobs]: "Offres d’emploi",
  [paths.news]: "Actualités",
  [paths.contact]: "Contact",
  [paths.spontaneous]: "Candidature spontanée",
  [paths.legal]: "Mentions légales",
  [paths.privacy]: "Politique de confidentialité",
};

function usePageTitle(title) {
  useEffect(() => {
    if (title) document.title = `${title} | ${siteName}`;
  }, [title]);
}

function ExpertiseIcon({ number }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    viewBox: "0 0 48 48",
    "aria-hidden": true,
    focusable: "false",
  };
  const icons = [
    // Railway signalling: signal mast, signal heads and track indication
    <><path d="M12 42V7" /><path d="M12 10h16v19H12" /><circle cx="20" cy="16" r="3" /><circle cx="20" cy="23" r="3" /><path d="M7 42h10M28 14h7M28 24h7M30 29v6M25 35h10" /></>,
    // Rolling stock: front of a passenger train with windscreen, lights and rails
    <><path d="M12 34V15c0-5 5-8 12-8s12 3 12 8v19" /><path d="M12 18h24M17 18l2-7h10l2 7" /><path d="M16 27h4M28 27h4M16 34l-4 7M32 34l4 7M18 41h12" /><path d="M19 34v-4h10v4" /></>,
    // Traction power: overhead catenary and electrical supply
    <><path d="M6 13h36M10 13l5 7h18l5-7M24 5v8" /><path d="M27 16 17 29h8l-2 12 10-16h-8l2-9Z" /><path d="M8 43h32" /></>,
    // Railway civil engineering: rails, sleepers and ballast/track bed
    <><path d="M15 6 9 39M33 6l6 33" /><path d="M12 13h24M11 20h26M10 27h28M9 34h30M7 41h34" /><path d="M15 6h18" /></>,
    // Railway telecommunications: radio mast with signal waves and network nodes
    <><path d="M24 17 13 42M24 17l11 25M18 30h12M15 37h18M24 17V7" /><circle cx="24" cy="5" r="2" /><path d="M16 9a11 11 0 0 0 0 16M32 9a11 11 0 0 1 0 16M11 4a18 18 0 0 0 0 26M37 4a18 18 0 0 1 0 26" /></>
  ];
  return <svg {...common}>{icons[Number(number) - 1] || icons[0]}</svg>;
}

function Header({ current }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [jobsMenuOpen, setJobsMenuOpen] = useState(false);
  const siteSettings = useContext(SiteSettingsContext);
  const navItems = [
    [siteSettings.navigation.home, paths.accueil],
    [siteSettings.navigation.about, paths.about],
    [siteSettings.navigation.jobs, paths.jobs],
    [siteSettings.navigation.news, paths.news],
    [siteSettings.navigation.contact, paths.contact],
  ];
  const closeMenu = () => { setMenuOpen(false); setJobsMenuOpen(false); };
  return <header className="site-header">
    <div className="header-inner">
      <a className="brand" href={paths.accueil} aria-label="ferroLink, accueil">
        <img src={resolveSiteAssetUrl(siteSettings.brand.headerLogo, API)} alt="ferroLink" width="3473" height="490" />
      </a>
      <button className="menu-toggle" type="button" aria-expanded={menuOpen} aria-controls="main-navigation" aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"} onClick={() => setMenuOpen(!menuOpen)}>
        <span /><span />
      </button>
      <nav className={`main-navigation ${menuOpen ? "is-open" : ""}`} id="main-navigation" aria-label="Navigation principale">
        {navItems.map(([label, href]) => href === paths.jobs ? <div className={`nav-dropdown ${current === paths.jobs ? "is-active" : ""} ${jobsMenuOpen ? "is-open" : ""}`} key={href}>
          <div className="nav-dropdown-heading"><a className="nav-dropdown-link" href={href} onClick={closeMenu}>{label}</a><button className="nav-dropdown-trigger" type="button" aria-label={jobsMenuOpen ? "Fermer le sous-menu des offres d'emploi" : "Ouvrir le sous-menu des offres d'emploi"} aria-expanded={jobsMenuOpen} aria-haspopup="true" onClick={() => setJobsMenuOpen(!jobsMenuOpen)}><svg className="nav-chevron" viewBox="0 0 16 16" aria-hidden="true"><path d="m3 6 5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg></button></div>
          <div className="nav-dropdown-menu">
            <a href={paths.jobs} className={current === paths.jobs ? "is-active" : ""} aria-current={current === paths.jobs ? "page" : undefined} onClick={closeMenu}>{siteSettings.navigation.jobsOffers}</a>
            <a href={paths.spontaneous} onClick={closeMenu}>{siteSettings.navigation.spontaneous}</a>
          </div>
        </div> : <a key={href} className={current === href ? "is-active" : ""} aria-current={current === href ? "page" : undefined} href={href} onClick={closeMenu}>{label}</a>)}
        <a className="button button-small" href={paths.contact} onClick={closeMenu}>{siteSettings.navigation.cta}</a>
      </nav>
    </div>
  </header>;
}

function Footer() {
  const siteSettings = useContext(SiteSettingsContext);
  return <footer className="site-footer">
    <div className="page-width footer-main">
      <div className="footer-brand-column">
        <a className="footer-brand" href={paths.accueil} aria-label="ferroLink, retour à l'accueil">
          <img src={resolveSiteAssetUrl(siteSettings.brand.footerLogo, API)} alt="ferroLink" width="3472" height="490" loading="lazy" />
        </a>
        <p className="footer-tagline">{siteSettings.footer.tagline}</p>
        <p className="footer-description">{siteSettings.footer.description}</p>
      </div>
      <div className="footer-column">
        <h2>{siteSettings.footer.exploreTitle}</h2>
        <a href={paths.about}>{siteSettings.navigation.about}</a>
        <a href={paths.jobs}>{siteSettings.navigation.jobs}</a>
        <a href={paths.news}>{siteSettings.navigation.news}</a>
        <a href={paths.contact}>{siteSettings.navigation.contact}</a>
        <div className="footer-socials" aria-label="Réseaux sociaux ferroLink">
          {siteSettings.footer.socials.map((social, index) => {
            const Icon = { LinkedIn: FaLinkedinIn, Facebook: FaFacebookF, Instagram: FaInstagram, TikTok: FaTiktok }[social.name];
            return <a key={`${social.name}-${index}`} href={social.url} target="_blank" rel="noreferrer" aria-label={`${social.name} ferroLink`}>{Icon ? <Icon aria-hidden="true" /> : social.name}</a>;
          })}
        </div>
      </div>
      <div className="footer-column">
        <h2>{siteSettings.footer.expertiseTitle}</h2>
        {siteSettings.home.expertiseAreas.map((area) => <a href="/#expertises" key={area.title}>{area.title}</a>)}
      </div>
      <div className="footer-column footer-contact">
        <h2>{siteSettings.footer.contactTitle}</h2>
        <p>{siteSettings.footer.contactDescription}</p>
        <div className="footer-phone-links">
          {siteSettings.footer.phones.map((phone) => <a key={phone} href={`tel:${phone.replace(/[^\d+]/g, "")}`}>{phone}</a>)}
        </div>
        <a className="footer-contact-cta" href={paths.contact}>{siteSettings.footer.contactCta} <span aria-hidden="true">→</span></a>
        <a className="footer-admin-link" href="/acces-equipe">Accès espace admin</a>
      </div>
    </div>
    <div className="page-width footer-bottom">
      <span>© {new Date().getFullYear()} ferroLink. {siteSettings.footer.copyright}</span>
      <span>{siteSettings.footer.signature}</span>
      <span className="footer-legal-links"><a href={paths.legal}>Mentions légales</a><a href={paths.privacy}>Confidentialité</a></span>
      <a href={paths.accueil}>{siteSettings.footer.backToTop} ↑</a>
    </div>
  </footer>;
}
function PageBanner({ kicker, title, description }) {
  return <section className="page-banner">
    <div className="page-width page-banner-content">
      <p className="eyebrow eyebrow-light"><span /> {kicker}</p>
      <h1>{title}</h1>
      {description && <p className="page-banner-description">{description}</p>}
    </div>
  </section>;
}

function HomePage() {
  const siteSettings = useContext(SiteSettingsContext);
  const { home } = siteSettings;
  return <>
    <section className="hero" aria-labelledby="hero-title">
      {home.heroMediaType === "video"
        ? <video className="hero-video" autoPlay muted loop playsInline preload="auto" poster={resolveSiteAssetUrl(home.heroImage, API)} tabIndex="-1" aria-hidden="true">
          <source src="https://videos.pexels.com/video-files/19497508/19497508-sd_960_540_25fps.mp4" type="video/mp4" />
        </video>
        : <img className="hero-background-image" src={resolveSiteAssetUrl(home.heroImage, API)} alt="" />}
      <div className="hero-overlay" />
      <div className="hero-content page-width">
        <p className="eyebrow eyebrow-light"><span />{home.heroKicker}</p>
        <h1 id="hero-title">{home.heroTitle}</h1>
        <a className="button button-lime" href={paths.jobs}>{home.heroCta}</a>
      </div>
      <div className="hero-caption">{home.heroCaption}</div>
    </section>

    <section className="intro section page-width">
      <div className="presentation-layout">
        <div className="presentation-visual">
          <img src={resolveSiteAssetUrl(home.introImage, API)} alt={home.introImageAlt} loading="lazy" />
          <div className="presentation-image-caption"><span>ferroLink</span><span>{home.introImageCaption}</span></div>
        </div>
        <div className="presentation-copy">
          <p className="presentation-overline">{home.introKicker}</p>
          <h2>{home.introTitle}</h2>
          <p className="lead">{home.introLead}</p>
          <p>{home.introText}</p>
          <div className="presentation-actions">
            <a className="text-link" href={paths.about}>{home.introLink}</a>
            <div className="home-phone"><span>{home.introPhoneLabel}</span><a href={`tel:${home.introPhone.replace(/[^\d+]/g, "")}`}>{home.introPhone}</a></div>
          </div>
        </div>
      </div>
    </section>

    <section className="home-contact-band" style={{ "--home-band-image": `url("${resolveSiteAssetUrl(home.homeBandImage, API)}")` }}>
      <div className="page-width home-contact-inner">
        <div><p className="eyebrow"><span /> {home.contactKicker}</p><h2>{home.contactTitle}</h2></div>
        <a className="button button-lime" href={paths.contact}>{home.contactCta} <span aria-hidden="true">↗</span></a>
      </div>
    </section>

    <section className="home-expertise section" id="expertises">
      <div className="page-width home-split-layout">
        <div className="home-section-visual"><img src={resolveSiteAssetUrl(home.expertiseImage, API)} alt={home.expertiseImageAlt} loading="lazy" decoding="async" /><span className="visual-index">{home.expertiseKicker}</span></div>
        <div className="home-section-content">
          <h2>{home.expertiseTitle}</h2>
          <p className="home-section-lead">{home.expertiseText}</p>
          <div className="home-expertise-list">{home.expertiseAreas.map((area, index) => <div className="home-expertise-item" key={`${area.title}-${index}`}><span className="home-expertise-icon"><ExpertiseIcon number={String((index % 5) + 1)} /></span><span><strong>{area.title}</strong><small>{area.detail}</small></span></div>)}</div>
          <a className="text-link" href={paths.contact}>{home.expertiseLink}</a>
        </div>
      </div>
    </section>

    <section className="home-metiers section" id="metiers">
      <div className="page-width home-split-layout home-metiers-layout">
        <div className="home-section-content">
          <h2>{home.metiersTitle}</h2>
          <p className="home-section-lead">{home.metiersText}</p>
          <div className="home-metiers-grid">{home.metiers.map((metier,index)=><div className="home-metier-chip" key={`${metier}-${index}`}><FaTrainSubway className="train-icon" aria-hidden="true" />{metier}</div>)}</div>
          <a className="text-link" href={paths.contact}>{home.metiersLink}</a>
        </div>
        <div className="home-section-visual home-metiers-visual"><img src={resolveSiteAssetUrl(home.metiersImage, API)} alt={home.metiersImageAlt} loading="lazy" decoding="async" /><span className="visual-index">{home.metiersKicker}</span></div>
      </div>
    </section>

    <section className="references section">
      <div className="page-width"><div className="references-heading"><div><div className="section-kicker">{siteSettings.home.partnersKicker}</div><h2>{siteSettings.home.partnersTitle}</h2></div></div>
        <div className="partner-marquee" aria-label="Logos de nos partenaires"><div className="partner-track">
          {[...siteSettings.home.partners, ...siteSettings.home.partners].map((partner, index) => <div className="partner" key={`${partner.alt}-${index}`} aria-hidden={index >= siteSettings.home.partners.length ? "true" : undefined}><img src={resolveSiteAssetUrl(partner.src, API)} alt={index >= siteSettings.home.partners.length ? "" : partner.alt} loading="lazy" /></div>)}
        </div></div>
      </div>
    </section>
    <ContactCallout />
  </>;
}

function AboutPage() {
  const siteSettings = useContext(SiteSettingsContext);
  const valueIcons = [FaHandshake, FaPeopleGroup, FaLightbulb, FaShieldHalved, FaAward];
  return <>
    <PageBanner kicker={siteSettings.about.kicker} title={siteSettings.about.title} description={siteSettings.about.description} />
    <section className="section page-width about-intro">
      <div className="section-kicker">{siteSettings.about.visionKicker}</div>
      <div className="about-vision-layout">
        <div className="about-vision-copy">
          <p className="about-overline">{siteSettings.about.visionOverline}</p>
          <h2>{siteSettings.about.visionTitle}</h2>
          <p className="lead">{siteSettings.about.visionLead}</p>
          <p>{siteSettings.about.visionText}</p>
          <a className="text-link" href="/#expertises">{siteSettings.about.visionLink} <span aria-hidden="true">→</span></a>
        </div>
        <figure className="about-vision-visual">
          <img
            src={resolveSiteAssetUrl(siteSettings.about.visionImage, API)}
            alt={siteSettings.about.visionImageAlt}
            loading="lazy"
          />
          <figcaption><span>ferroLink</span><span>{siteSettings.about.visionCaption}</span></figcaption>
        </figure>
      </div>
    </section>
    <section className="about-gallery section" aria-labelledby="about-gallery-title">
      <div className="page-width">
        <div className="section-heading about-gallery-heading">
          <div>
            <div className="section-kicker">{siteSettings.about.galleryKicker}</div>
            <h2 id="about-gallery-title">{siteSettings.about.galleryTitle}</h2>
          </div>
          <p>{siteSettings.about.galleryDescription}</p>
        </div>
        <div className="about-gallery-grid">
          {siteSettings.about.gallery.map((image, index) => (
            <figure className={`about-photo about-photo-${index + 1}`} key={`${image.label}-${index}`}>
              <img src={resolveSiteAssetUrl(image.image, API)} alt={image.alt} loading="lazy" decoding="async" />
              <figcaption>
                <span>{image.label}</span>
                <strong>{image.title}</strong>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
    <section className="section values-section"><div className="page-width">
      <div className="section-heading"><div><div className="section-kicker">{siteSettings.about.valuesKicker}</div><h2>{siteSettings.about.valuesTitle}</h2></div><p>{siteSettings.about.valuesDescription}</p></div>
      <div className="values-grid">{siteSettings.about.values.map(({ title, detail, label }, index) => { const Icon = valueIcons[index % valueIcons.length]; return <article className="value-card" key={`${title}-${index}`}><div className="value-card-heading"><span className="value-card-icon"><Icon aria-hidden="true" /></span><span className="value-card-label">{label}</span></div><h3>{title}</h3><p>{detail}</p></article>; })}</div>
    </div></section>
    <ContactCallout />
  </>;
}

function ApplicationForm({ job, onCancel }) {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cvName, setCvName] = useState("");
  const [letterName, setLetterName] = useState("");
  const submitApplication = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    const form = event.currentTarget;
    const data = new FormData(form);
    const cv = data.get("cv");
    const letter = data.get("letter");
    if (!cv?.size) return setError("Merci de joindre votre CV.");
    if (cv.size + (letter?.size || 0) > 10 * 1024 * 1024) return setError("Le CV et la lettre ne doivent pas dépasser 10 Mo au total.");
    if (job) data.set("jobId", job.id);
    setSubmitting(true);
    try {
      const response = await fetch(`${API}/api/applications/public`, { method: "POST", body: data });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Impossible d'envoyer la candidature.");
      setSuccess("Votre candidature a bien été envoyée. Merci !");
      form.reset();
      setCvName("");
      setLetterName("");
    } catch (e) {
      setError(e.message || "Une erreur est survenue. Réessayez.");
    } finally {
      setSubmitting(false);
    }
  };
  return <form className="application-form" encType="multipart/form-data" onSubmit={submitApplication}>
    <input type="text" name="_honey" tabIndex="-1" autoComplete="off" aria-hidden="true" className="application-honeypot" />
    <label>Nom et prénom *<input name="name" autoComplete="name" required maxLength="120" /></label>
    <div className="application-form-row"><label>Adresse e-mail *<input type="email" name="email" autoComplete="email" required maxLength="160" /></label><label>Téléphone *<input type="tel" name="telephone" autoComplete="tel" required maxLength="30" /></label></div>
    <div className="application-form-row"><label>Ville de résidence *<input name="ville" autoComplete="address-level2" required maxLength="100" /></label><label>Expérience professionnelle<select name="experience" defaultValue=""><option value="">Sélectionner</option><option>Débutant</option><option>Moins de 2 ans</option><option>2 à 5 ans</option><option>5 à 10 ans</option><option>Plus de 10 ans</option></select></label></div>
    <label>Disponibilité<input name="disponibilite" placeholder="Ex. : immédiate, sous un mois…" maxLength="100" /></label>
    <label>Message de motivation *<textarea name="motivation" rows="5" required minLength="20" maxLength="3000" placeholder={job ? "Présentez brièvement votre parcours et votre intérêt pour ce poste." : "Présentez brièvement votre parcours et le type de mission que vous recherchez."} /></label>
    <div className="application-file-grid"><label className="application-file-field">CV (PDF, DOC ou DOCX) *<input name="cv" type="file" accept=".pdf,.doc,.docx" required onChange={(e) => setCvName(e.target.files?.[0]?.name || "")} /><small>{cvName || "Document obligatoire — 10 Mo maximum"}</small></label><label className="application-file-field">Lettre de motivation (facultatif)<input name="letter" type="file" accept=".pdf,.doc,.docx" onChange={(e) => setLetterName(e.target.files?.[0]?.name || "")} /><small>{letterName || "PDF, DOC ou DOCX"}</small></label></div>
    <label className="application-consent"><input type="checkbox" name="consentement" value="Oui" required /><span>J’accepte que mes informations soient utilisées par ferroLink pour examiner ma candidature et me recontacter. *</span></label>
    {error && <p className="application-error" role="alert">{error}</p>}
    {success && <p role="status">{success}</p>}
    <p className="application-privacy">Votre candidature est enregistrée dans la base ferroLink. Les documents restent privés, accessibles à l’équipe de recrutement autorisée et conservés 24 mois au plus. <a href={paths.privacy} target="_blank" rel="noreferrer">Politique de confidentialité</a></p>
    <div className="application-form-actions"><button className="button button-lime" type="submit" disabled={submitting}>{submitting ? "Envoi en cours…" : "Envoyer ma candidature"} <span aria-hidden="true">↗</span></button>{onCancel && <button className="button button-outline" type="button" onClick={onCancel}>Annuler</button>}</div>
  </form>;
}

function ApplicationModal({ job, onClose }) {
  return <div className="job-modal-backdrop application-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="job-modal application-modal" role="dialog" aria-modal="true" aria-labelledby="application-modal-title">
      <button className="job-modal-close application-close" type="button" aria-label="Fermer le formulaire" onClick={onClose}>×</button>
      <div className="application-modal-heading"><p className="section-kicker"><span>Candidature ferroLink</span></p><h2 id="application-modal-title">Postuler : {job.title}</h2><p>Pas besoin de créer un compte. Les champs marqués d’un * sont obligatoires.</p></div>
      <ApplicationForm job={job} onCancel={onClose} />
    </section>
  </div>;
}

function SpontaneousPage() {
  return <>
    <PageBanner kicker="Candidature spontanée" title="Proposez-nous votre profil." description="Aucune offre ne correspond à votre recherche ? Présentez votre parcours et le type de mission qui vous intéresse." />
    <section className="section page-width"><div className="spontaneous-form"><ApplicationForm /></div></section>
  </>;
}

function useApiData(path) {
  const [state, setState] = useState({ data: null, error: false, loading: true });
  useEffect(() => {
    let active = true;
    fetch(`${API}${path}`)
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (active) setState({ data, error: false, loading: false });
      })
      .catch(() => { if (active) setState({ data: null, error: true, loading: false }); });
    return () => { active = false; };
  }, [path]);
  return state;
}

const jobImage = (job) => job.imageUrl ? resolveSiteAssetUrl(job.imageUrl, API) : "/images/access-team-background.webp";

function formatPublicationDate(date) {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(date));
}

function JobsPage() {
  const siteSettings = useContext(SiteSettingsContext);
  const { data, error: jobsError, loading: jobsLoading } = useApiData("/api/jobs");
  const jobOffers = data?.jobs || [];
  const [search, setSearch] = useState("");
  const [contract, setContract] = useState("Tous les contrats");
  const [location, setLocation] = useState("Toutes les localisations");
  const [currentPage, setCurrentPage] = useState(1);
  const [applicationJob, setApplicationJob] = useState(null);
  const pageSize = 6;
  const filteredJobs = jobOffers.filter((job) => {
    const query = search.trim().toLocaleLowerCase("fr");
    const matchesSearch = !query || [job.title, job.category, job.location, job.description].filter(Boolean).some((value) => value.toLocaleLowerCase("fr").includes(query));
    return matchesSearch && (contract === "Tous les contrats" || job.contractType === contract) && (location === "Toutes les localisations" || job.location === location);
  });
  const pageCount = Math.ceil(filteredJobs.length / pageSize);
  const visibleJobs = filteredJobs.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const pageButtons = [...new Set([1, pageCount, currentPage - 1, currentPage, currentPage + 1].filter((page) => page >= 1 && page <= pageCount))];
  const paginationItems = pageButtons.flatMap((page, index) => {
    const previousPage = pageButtons[index - 1];
    return previousPage && page - previousPage > 1 ? [`ellipsis-${page}`, page] : [page];
  });
  const resetPagination = () => setCurrentPage(1);

  return <>
    <PageBanner kicker="Carrières & opportunités" title="Trouvez votre prochaine mission." description="Rejoignez des équipes qui font avancer les projets ferroviaires. Explorez les opportunités et trouvez le poste qui correspond à votre expertise." />
    <section className="section page-width jobs-marketplace">
      <div className="jobs-marketplace-heading">
        <div><div className="section-kicker"><span>Carrières</span> / Offres d’emploi</div><h2>Les opportunités du moment</h2><p>Parcourez les postes et filtrez les annonces selon votre recherche.</p></div>
        <a className="button button-outline" href={paths.spontaneous}>Candidature spontanée <span aria-hidden="true">↗</span></a>
      </div>
      {jobOffers.length > 0 && <><div className="jobs-search-panel" role="search" aria-label="Filtrer les offres d’emploi">
        <label className="jobs-search-field"><span aria-hidden="true">⌕</span><span className="visually-hidden">Rechercher une offre</span><input type="search" placeholder="Intitulé, compétence, domaine…" value={search} onChange={(event) => { setSearch(event.target.value); resetPagination(); }} /></label>
        <label className="jobs-filter"><span className="visually-hidden">Type de contrat</span><select value={contract} onChange={(event) => { setContract(event.target.value); resetPagination(); }}><option>Tous les contrats</option><option>CDI</option><option>Mission</option><option>CDD</option><option>Stage</option><option>Alternance</option></select></label>
        <label className="jobs-filter"><span className="visually-hidden">Localisation</span><select value={location} onChange={(event) => { setLocation(event.target.value); resetPagination(); }}><option>Toutes les localisations</option>{[...new Set(jobOffers.map((job) => job.location).filter(Boolean))].map((place) => <option key={place}>{place}</option>)}</select></label>
        <button className="jobs-reset" type="button" onClick={() => { setSearch(""); setContract("Tous les contrats"); setLocation("Toutes les localisations"); resetPagination(); }}>Réinitialiser</button>
      </div>
      <div className="jobs-results-line"><p><strong>{filteredJobs.length}</strong> offre{filteredJobs.length > 1 ? "s" : ""} trouvée{filteredJobs.length > 1 ? "s" : ""}</p><span>{filteredJobs.length > 0 && `Affichage de ${(currentPage - 1) * pageSize + 1} à ${Math.min(currentPage * pageSize, filteredJobs.length)}`}</span></div></>}
      {jobsLoading ? <p className="jobs-empty-state" role="status">Chargement des offres…</p> : jobsError ? <div className="jobs-empty-state" role="alert"><h3>Les offres sont momentanément indisponibles.</h3><p>Merci de réessayer dans quelques instants.</p></div> : !jobOffers.length ? <div className="jobs-empty-state"><h3>Aucune offre n’est publiée pour le moment.</h3><p>Vous pouvez tout de même nous envoyer votre candidature.</p><a className="button button-lime" href={paths.spontaneous}>Candidature spontanée</a></div> : filteredJobs.length ? <div className="jobs-offer-grid">{visibleJobs.map((job) => <article className="job-card" key={job.id}>
        <a className="job-card-image-button" href={`${paths.jobs}/${job.slug}`} aria-label={`Voir le détail : ${job.title}`}><img src={jobImage(job)} alt={job.imageAlt || ""} loading="lazy" />{job.category && <span className="job-category">{job.category}</span>}<span className="job-image-arrow" aria-hidden="true">↗</span></a>
        <div className="job-card-content"><div className="job-card-meta"><span>{job.contractType}</span>{job.experience && <span>{job.experience}</span>}<span className="job-published-date">Publié le {formatPublicationDate(job.publishedAt)}</span></div><h3><a href={`${paths.jobs}/${job.slug}`}>{job.title}</a></h3><p className="job-card-summary">{job.description}</p><div className="job-card-location"><span className="job-location-icon" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="10" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.8"/></svg></span>{job.location}{job.salary && <span className="job-card-salary">{job.salary}</span>}</div><div className="job-card-actions"><a className="job-details-link" href={`${paths.jobs}/${job.slug}`}>Voir l’offre <span aria-hidden="true">→</span></a><button type="button" className="job-apply-link" onClick={() => setApplicationJob(job)} aria-label={`Candidater à ${job.title}`}>Postuler ↗</button></div></div>
      </article>)}</div> : <div className="jobs-empty-state"><h3>Aucune offre ne correspond à ces filtres.</h3><p>Modifiez votre recherche ou envoyez-nous une candidature spontanée.</p><button type="button" className="button button-lime" onClick={() => { setSearch(""); setContract("Tous les contrats"); setLocation("Toutes les localisations"); resetPagination(); }}>Voir toutes les offres</button><a className="text-link" href={paths.spontaneous}>Candidature spontanée</a></div>}
      {pageCount > 1 && <nav className="jobs-pagination" aria-label="Pagination des offres d’emploi">
        <button type="button" className="jobs-page-arrow" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1} aria-label="Page précédente">← <span>Précédent</span></button>
        <div className="jobs-page-numbers">{paginationItems.map((item) => typeof item === "number"
          ? <button type="button" key={item} className={`jobs-page-number ${item === currentPage ? "is-current" : ""}`} onClick={() => setCurrentPage(item)} aria-label={`Page ${item}`} aria-current={item === currentPage ? "page" : undefined}>{item}</button>
          : <span className="jobs-page-ellipsis" key={item} aria-hidden="true">…</span>)}</div>
        <button type="button" className="jobs-page-arrow" onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))} disabled={currentPage === pageCount} aria-label="Page suivante"><span>Suivant</span> →</button>
      </nav>}
    </section>
    <section className="jobs-spontaneous"><div className="page-width jobs-spontaneous-inner"><div><p className="eyebrow"><span /> Vous ne trouvez pas votre poste ?</p><h2>Votre parcours a aussi sa place chez ferroLink.</h2><p>Présentez-nous vos compétences et le type de mission que vous recherchez. Nous pourrons étudier votre candidature spontanée.</p></div><a className="button button-lime" href={paths.spontaneous}>Envoyer une candidature <span aria-hidden="true">↗</span></a></div></section>
    <section className="section page-width jobs-values-section"><div className="section-heading"><div><div className="section-kicker"><span>Pourquoi ferroLink ?</span></div><h2>Des métiers au cœur du ferroviaire</h2></div><a className="text-link" href="/#expertises">{siteSettings.about.visionLink}</a></div><div className="jobs-domain-list">{siteSettings.home.expertiseAreas.map((area) => <div key={area.title}><FaTrainSubway className="train-icon" aria-hidden="true" /><strong>{area.title}</strong></div>)}</div></section>
    {applicationJob && <ApplicationModal job={applicationJob} onClose={() => setApplicationJob(null)} />}
  </>;
}

function JobDetailPage({ slug }) {
  const [applicationOpen, setApplicationOpen] = useState(false);
  const { data, loading } = useApiData(`/api/jobs/${encodeURIComponent(slug)}`);
  const job = data?.job;
  usePageTitle(job?.title);
  if (loading) return <section className="section page-width job-not-found"><p role="status">Chargement de l’offre…</p></section>;
  if (!job) return <section className="section page-width job-not-found"><p className="section-kicker"><span>Carrières</span> / Offres d’emploi</p><h1>Cette offre n’est pas disponible.</h1><p>L’offre recherchée n’existe pas ou n’est plus accessible.</p><a className="button button-lime" href={paths.jobs}>Retour aux offres d’emploi</a></section>;
  return <>
    <section className="job-detail-hero">
      <img src={jobImage(job)} alt={job.imageAlt || ""} />
      <div className="job-detail-hero-overlay" />
      <div className="page-width job-detail-hero-content">
        <a href={paths.jobs} className="job-back-link">← Toutes les offres</a>
        {job.category && <p className="section-kicker"><span>{job.category}</span></p>}
        <h1>{job.title}</h1>
        <div className="job-modal-tags">{[job.contractType, job.location, job.experience, job.salary].filter(Boolean).map((tag) => <span key={tag}>{tag}</span>)}</div>
      </div>
    </section>
    <section className="section page-width job-detail-layout">
      <article className="job-detail-content">
        <p className="job-detail-lead">{job.description}</p>
        {job.missions.length > 0 && <section><h2>Vos missions</h2><ul>{job.missions.map((mission) => <li key={mission}>{mission}</li>)}</ul></section>}
        {job.requirements && <section><h2>Votre profil</h2><p>{job.requirements}</p></section>}
        <section><h2>Informations sur le poste</h2><dl className="job-detail-facts"><div><dt>Contrat</dt><dd>{job.contractType}</dd></div><div><dt>Localisation</dt><dd>{job.location}</dd></div>{job.experience && <div><dt>Expérience</dt><dd>{job.experience}</dd></div>}{job.salary && <div><dt>Rémunération</dt><dd>{job.salary}</dd></div>}<div><dt>Date de publication</dt><dd>{formatPublicationDate(job.publishedAt)}</dd></div></dl></section>
        <div className="job-detail-apply-mobile"><button className="button button-lime" type="button" onClick={() => setApplicationOpen(true)}>Postuler à cette offre <span aria-hidden="true">↗</span></button></div>
      </article>
      <aside className="job-detail-sidebar"><p className="section-kicker"><span>Votre prochaine étape</span></p><h2>Ce poste vous intéresse ?</h2><p>Envoyez votre candidature avec vos coordonnées, votre CV et un message de motivation.</p><button className="button button-lime" type="button" onClick={() => setApplicationOpen(true)}>Postuler maintenant <span aria-hidden="true">↗</span></button><a className="job-sidebar-back" href={paths.jobs}>← Consulter les autres offres</a></aside>
    </section>
    {applicationOpen && <ApplicationModal job={job} onClose={() => setApplicationOpen(false)} />}
  </>;
}

function ContactPage() {
  const siteSettings = useContext(SiteSettingsContext);
  const { contact } = siteSettings;
  const emptyForm = { name: "", email: "", subject: "", message: "", website: "" };
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });
  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitted(false);
    setSending(true);
    try {
      const response = await fetch(`${API}/api/contact`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Impossible d’envoyer votre message.");
      setSubmitted(true);
      setForm(emptyForm);
    } catch (e) {
      setError(e.message || "Une erreur est survenue. Réessayez.");
    } finally {
      setSending(false);
    }
  };
  return <>
    <PageBanner kicker={contact.kicker} title={contact.title} description={contact.description} />
    <section className="section page-width contact-page-layout">
      <div className="contact-info-column">
        <div className="section-kicker">{contact.infoTitle}</div>
        <h2>{contact.infoHeading}</h2>
        <div className="contact-info-item"><span className="contact-info-label">{contact.phoneLabel}</span>{contact.phones.map((phone, index) => <a key={`${phone}-${index}`} href={`tel:${contact.phoneLinks[index]}`}>{phone}</a>)}</div>
        <div className="contact-info-item"><span className="contact-info-label">{contact.emailLabel}</span>{contact.emails.map((email) => <a key={email} href={`mailto:${email}`}>{email}</a>)}</div>
        <div className="contact-info-item"><span className="contact-info-label">{contact.addressLabel}</span><p>{contact.addressLines.map((line) => <span key={line}>{line}<br /></span>)}</p></div>
        <div className="contact-info-item"><span className="contact-info-label">{contact.socialsLabel}</span><a href={contact.socialUrl} target="_blank" rel="noreferrer">{contact.socialName} ↗</a></div>
      </div>
      <form className="contact-form" onSubmit={submit}>
        <input type="text" name="website" value={form.website} onChange={update} tabIndex="-1" autoComplete="off" aria-hidden="true" className="application-honeypot" />
        <div className="section-kicker">{contact.formKicker}</div><h2>{contact.formTitle}</h2>
        <label>{contact.nameLabel}<input name="name" value={form.name} onChange={update} autoComplete="name" required /></label>
        <label>{contact.emailFieldLabel}<input name="email" type="email" value={form.email} onChange={update} autoComplete="email" required /></label>
        <label>{contact.subjectLabel}<input name="subject" value={form.subject} onChange={update} maxLength="180" required /></label>
        <label>{contact.messageLabel}<textarea name="message" rows="5" value={form.message} onChange={update} maxLength="5000" required /></label>
        <button className="button button-lime" type="submit" disabled={sending}>{sending ? "Envoi en cours…" : contact.submitLabel} <span aria-hidden="true">↗</span></button>
        {error && <p className="application-error" role="alert">{error}</p>}
        {submitted && <p className="form-feedback" role="status">{contact.successText}</p>}
        <p className="form-note">{contact.privacyText} <a href={paths.privacy} target="_blank" rel="noreferrer">Politique de confidentialité</a></p>
      </form>
    </section>
  </>;
}

function formatArticleDate(date) {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(date));
}

const newsFallbackImage = "/images/train-hero-poster.jpg";

// Images stay on the publisher's server; a broken one gives way to a ferroLink visual.
function NewsCover({ article, className }) {
  return <img
    className={className}
    src={article.imageUrl || newsFallbackImage}
    alt=""
    loading="lazy"
    referrerPolicy="no-referrer"
    onError={(event) => { if (!event.currentTarget.src.endsWith(newsFallbackImage)) event.currentTarget.src = newsFallbackImage; }}
  />;
}

function NewsPage() {
  const [page, setPage] = useState(1);
  const [language, setLanguage] = useState("");
  const { data, error, loading } = useApiData(`/api/news?page=${page}${language ? `&language=${language}` : ""}`);
  const articles = data?.articles || [];
  return <>
    <PageBanner kicker="Veille ferroviaire" title="L’actualité du rail." description="Une sélection d’articles de la presse ferroviaire. Chaque article reste la propriété de sa source." />
    <section className="section page-width news-section">
      <div className="news-toolbar">
        <p><strong>{data?.total ?? "…"}</strong> article{data?.total > 1 ? "s" : ""}</p>
        <label className="jobs-filter"><span className="visually-hidden">Langue des articles</span><select value={language} onChange={(event) => { setLanguage(event.target.value); setPage(1); }}><option value="">Toutes les langues</option><option value="fr">Français</option><option value="en">Anglais</option></select></label>
      </div>
      {loading ? <p className="jobs-empty-state" role="status">Chargement des actualités…</p> : error ? <div className="jobs-empty-state" role="alert"><h3>Les actualités sont momentanément indisponibles.</h3><p>Merci de réessayer dans quelques instants.</p></div> : !articles.length ? <div className="jobs-empty-state"><h3>Aucun article pour le moment.</h3></div> : <div className="news-grid">{articles.map((article) => <article className="news-card" key={article.id}>
        <a className="news-card-image" href={`${paths.news}/${article.slug}`} tabIndex="-1" aria-hidden="true"><NewsCover article={article} /></a>
        <div className="news-card-body">
          <div className="news-card-meta"><span>{article.sourceName}</span>{article.language === "en" && <span className="news-language">EN</span>}<time dateTime={article.publishedAt}>{formatArticleDate(article.publishedAt)}</time></div>
          <h2 lang={article.language}><a href={`${paths.news}/${article.slug}`}>{article.title}</a></h2>
          {article.excerpt && <p lang={article.language}>{article.excerpt}</p>}
          <a className="button button-lime news-card-button" href={article.sourceUrl} target="_blank" rel="noopener noreferrer" aria-label={`Consulter l’article complet sur ${article.sourceName} : ${article.title}`}>Consulter <span aria-hidden="true">↗</span></a>
        </div>
      </article>)}</div>}
      {data?.pageCount > 1 && <nav className="jobs-pagination" aria-label="Pagination des actualités">
        <button type="button" className="jobs-page-arrow" onClick={() => setPage(page - 1)} disabled={page === 1}>← <span>Précédent</span></button>
        <span className="news-page-count">Page {page} sur {data.pageCount}</span>
        <button type="button" className="jobs-page-arrow" onClick={() => setPage(page + 1)} disabled={page === data.pageCount}><span>Suivant</span> →</button>
      </nav>}
    </section>
  </>;
}

function NewsDetailPage({ slug }) {
  const { data, loading } = useApiData(`/api/news/${encodeURIComponent(slug)}`);
  const article = data?.article;
  usePageTitle(article?.title);
  if (loading) return <section className="section page-width job-not-found"><p role="status">Chargement de l’article…</p></section>;
  if (!article) return <section className="section page-width job-not-found"><h1>Cet article n’est pas disponible.</h1><p>Il n’existe pas ou n’est plus accessible.</p><a className="button button-lime" href={paths.news}>Retour aux actualités</a></section>;
  return <section className="section page-width news-detail">
    <a className="news-back-link" href={paths.news}>← Toutes les actualités</a>
    <div className="news-card-meta"><span>{article.sourceName}</span>{article.language === "en" && <span className="news-language">EN</span>}<time dateTime={article.publishedAt}>{formatArticleDate(article.publishedAt)}</time></div>
    <h1 lang={article.language}>{article.title}</h1>
    <NewsCover article={article} className="news-detail-image" />
    {article.excerpt && <p className="news-detail-excerpt" lang={article.language}>{article.excerpt}</p>}
    <a className="button button-lime" href={article.sourceUrl} target="_blank" rel="noopener noreferrer">Consulter l’article complet <span aria-hidden="true">↗</span></a>
    <p className="news-detail-note">Extrait et image publiés par {article.sourceName}. ferroLink n’est pas l’auteur de cet article.</p>
  </section>;
}

function ContactCallout() {
  const siteSettings = useContext(SiteSettingsContext);
  return <section className="contact section page-width" style={{ "--contact-panel-image": `url("${resolveSiteAssetUrl(siteSettings.callout.backgroundImage, API)}")` }}><div className="contact-panel">
    <div className="contact-content"><div className="section-kicker section-kicker-light"><span>{siteSettings.callout.kicker}</span></div><h2>{siteSettings.callout.title}</h2><p>{siteSettings.callout.description}</p><a className="button button-lime" href={paths.contact}>{siteSettings.callout.button} <span aria-hidden="true">↗</span></a></div>
  </div></section>;
}

function LegalNoticePage() {
  const { legal, contact } = useContext(SiteSettingsContext);
  return <>
    <PageBanner kicker="Informations légales" title="Mentions légales" />
    <section className="section page-width legal-page">
      <h2>Éditeur du site</h2>
      <dl>
        <div><dt>Dénomination</dt><dd>{legal.companyName}</dd></div>
        <div><dt>Forme juridique</dt><dd>{legal.legalForm}</dd></div>
        <div><dt>SIRET</dt><dd>{legal.siret}</dd></div>
        <div><dt>Siège social</dt><dd>{contact.addressLines.join(", ")}</dd></div>
        <div><dt>Téléphone</dt><dd>{contact.phones[0]}</dd></div>
        <div><dt>E-mail</dt><dd>{contact.emails[0]}</dd></div>
        <div><dt>Directeur de la publication</dt><dd>{legal.publicationDirector}</dd></div>
      </dl>
      <h2>Hébergement</h2>
      <dl>
        <div><dt>Hébergeur</dt><dd>{legal.hostName}</dd></div>
        <div><dt>Coordonnées</dt><dd>{legal.hostAddress}</dd></div>
      </dl>
      <h2>Propriété intellectuelle</h2>
      <p>Les textes, images et logos de ce site appartiennent à {legal.companyName} ou à leurs titulaires. Toute reproduction sans autorisation est interdite.</p>
      <p>La rubrique Actualités présente le titre, l’image de couverture et un court extrait d’articles publiés par des médias tiers, avec un lien vers leur source. Ces contenus restent la propriété de leurs éditeurs, qui peuvent demander leur retrait à {contact.emails[0]}.</p>
      <h2>Données personnelles</h2>
      <p>Le traitement de vos données est décrit dans notre <a href={paths.privacy}>politique de confidentialité</a>.</p>
    </section>
  </>;
}

function PrivacyPage() {
  const { legal, contact } = useContext(SiteSettingsContext);
  return <>
    <PageBanner kicker="Informations légales" title="Politique de confidentialité" />
    <section className="section page-width legal-page">
      <h2>Responsable du traitement</h2>
      <p>{legal.companyName}, {contact.addressLines.join(", ")}. Pour toute question sur vos données : {legal.privacyEmail}.</p>
      <h2>Données collectées et finalités</h2>
      <ul>
        <li><strong>Candidatures :</strong> nom, e-mail, téléphone, ville, expérience, disponibilité, message, CV et lettre de motivation. Ces données servent à étudier votre candidature et à vous recontacter. Le traitement repose sur les démarches que vous engagez avant une éventuelle embauche.</li>
        <li><strong>Formulaire de contact :</strong> nom, e-mail, sujet et message. Ces données servent à vous répondre. Le traitement repose sur notre intérêt légitime à traiter vos demandes.</li>
        <li><strong>Espace équipe :</strong> nom, e-mail et rôle des membres de l’équipe, pour sécuriser l’accès à l’administration.</li>
      </ul>
      <h2>Destinataires</h2>
      <p>Vos données sont accessibles uniquement aux membres habilités de l’équipe {legal.companyName}, à notre hébergeur et à notre prestataire d’envoi d’e-mails (Brevo). Elles ne sont ni vendues ni cédées.</p>
      <h2>Durée de conservation</h2>
      <p>Les candidatures et leurs documents sont supprimés 24 mois après la dernière mise à jour du dossier. Les messages de contact sont supprimés 24 mois après leur réception.</p>
      <h2>Vos droits</h2>
      <p>Vous pouvez demander l’accès à vos données, leur rectification, leur effacement, leur limitation ou leur portabilité, et vous opposer à leur traitement, en écrivant à {legal.privacyEmail}. Vous pouvez aussi adresser une réclamation à la CNIL (cnil.fr).</p>
      <h2>Cookies et services tiers</h2>
      <p>Ce site n’utilise ni cookie publicitaire ni mesure d’audience. Un cookie de session, nécessaire au fonctionnement, est déposé uniquement lorsqu’un membre de l’équipe se connecte.</p>
      <p>Les polices de caractères sont fournies par Google Fonts, la vidéo de la page d’accueil par Pexels et les images de la rubrique Actualités par les médias qui les publient : votre navigateur transmet votre adresse IP à ces services lors du chargement des pages. Les liens de la rubrique Actualités mènent vers des sites tiers, soumis à leur propre politique.</p>
    </section>
  </>;
}

function NotFoundPage() {
  return <section className="section page-width job-not-found"><h1>Cette page n’existe pas.</h1><p>Le lien est peut-être incorrect ou la page a été déplacée.</p><a className="button button-lime" href={paths.accueil}>Retour à l’accueil</a></section>;
}

const notFoundRoute = "not-found";

function getRoute() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  if (path.startsWith(paths.jobs + "/")) return paths.jobs;
  if (path.startsWith(paths.news + "/")) return paths.news;
  return Object.values(paths).includes(path) ? path : notFoundRoute;
}

function PublicSite({ current, pages, preview = false }) {
  const [siteSettings, setSiteSettings] = useState(defaultSiteSettings);
  usePageTitle(pageTitles[current]);
  useEffect(() => {
    if (preview) {
      const receivePreview = (event) => {
        if (event.origin !== window.location.origin
          || event.source !== window.parent
          || event.data?.type !== "ferrolink:site-preview") return;
        setSiteSettings(mergeSiteSettings(event.data.settings));
      };
      window.addEventListener("message", receivePreview);
      return () => window.removeEventListener("message", receivePreview);
    }

    let active = true;
    fetch(`${API}/api/site-settings`)
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "Impossible de charger les réglages du site.");
        if (active && data.settings) setSiteSettings(mergeSiteSettings(data.settings));
      })
      .catch((error) => console.error("Chargement des réglages publics du site impossible :", error))
      .finally(() => { active = false; });
    return () => { active = false; };
  }, [preview]);

  return <SiteSettingsContext.Provider value={siteSettings}>
    <div className="public-site" style={getSiteThemeStyle(siteSettings.theme, siteSettings.home)}>
      <a className="skip-link" href="#contenu">Aller au contenu</a>
      <Header current={current} />
      <main id="contenu">{pages[current]}</main>
      <Footer />
    </div>
  </SiteSettingsContext.Provider>;
}

export default function App() {
  const pathname = window.location.pathname.replace(/\/+$/, "") || "/";
  if (pathname === "/acces-equipe") return <Suspense fallback={routeFallback}><AuthPage /></Suspense>;
  if (pathname === "/administration") return <Suspense fallback={routeFallback}><AdminPortal /></Suspense>;
  const current = getRoute();
  const pages = {
    [paths.accueil]: <HomePage />,
    [paths.about]: <AboutPage />,
    [paths.jobs]: window.location.pathname.replace(/\/+$/, "") === paths.jobs ? <JobsPage /> : <JobDetailPage slug={decodeURIComponent(window.location.pathname.replace(/\/+$/, "").split("/").pop())} />,
    [paths.news]: pathname === paths.news ? <NewsPage /> : <NewsDetailPage slug={decodeURIComponent(pathname.split("/").pop())} />,
    [paths.contact]: <ContactPage />,
    [paths.spontaneous]: <SpontaneousPage />,
    [paths.legal]: <LegalNoticePage />,
    [paths.privacy]: <PrivacyPage />,
    [notFoundRoute]: <NotFoundPage />,
  };
  const preview = new URLSearchParams(window.location.search).get("sitePreview") === "1";
  return <PublicSite current={current} pages={pages} preview={preview} />;
}
