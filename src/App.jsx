import { useState } from "react";
import "./styles/global.css";

const paths = {
  accueil: "/",
  about: "/a-propos",
  competences: "/competences",
  jobs: "/offres-emploi",
  contact: "/contact",
};

const expertiseAreas = [
  { number: "01", title: "Signalisation & CBTC (Communication Based Train Control)", detail: "Les systèmes de signalisation et de contrôle des trains au service de la sécurité et de la performance du réseau." },
  { number: "02", title: "Matériel Roulant", detail: "L’accompagnement des projets liés aux trains, tramways et autres matériels ferroviaires." },
  { number: "03", title: "Courants forts & Energie", detail: "Les systèmes d’alimentation et les infrastructures énergétiques nécessaires à l’exploitation ferroviaire." },
  { number: "04", title: "Génie Civil & voie ferrée", detail: "Les études et travaux associés aux infrastructures et aux voies ferrées." },
  { number: "05", title: "Courants faibles & Télécoms", detail: "Les systèmes de communication et équipements courants faibles des infrastructures ferroviaires." },
];

const metiers = [
  "Assistance à Maîtrise d'œuvre",
  "Assistance à Maîtrise d'ouvrage",
  "Gestion de projet et coordination",
  "Spécification et études",
  "Conception et développement",
  "Architecture système et sous-système",
  "Sûreté de fonctionnement",
  "Suivi de travaux",
  "Exploitation et maintenance",
  "Vérification et validation",
  "Essais et mise en service",
];

const partners = [
  { src: "/images/partner-1.png", alt: "Egis" },
  { src: "/images/partner-2.png", alt: "Colas Rail" },
  { src: "/images/partner-3.jpeg", alt: "INEO, une marque d'Equans" },
  { src: "/images/partner-4.jpeg", alt: "Setec" },
  { src: "/images/partner-5.png", alt: "RATP" },
  { src: "/images/partner-6.png", alt: "Alstom" },
];

const navItems = [
  ["Accueil", paths.accueil],
  ["À propos de nous", paths.about],
  ["Nos compétences", paths.competences],
  ["Offres d'emploi", paths.jobs],
  ["Contactez-nous", paths.contact],
];

function Header({ current }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);
  return <header className="site-header">
    <div className="header-inner">
      <a className="brand" href={paths.accueil} aria-label="ferroLink, accueil">
        <img src="/images/ferrolink-logo.png" alt="ferroLink" width="995" height="157" />
      </a>
      <button className="menu-toggle" type="button" aria-expanded={menuOpen} aria-controls="main-navigation" aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"} onClick={() => setMenuOpen(!menuOpen)}>
        <span /><span />
      </button>
      <nav className={`main-navigation ${menuOpen ? "is-open" : ""}`} id="main-navigation" aria-label="Navigation principale">
        {navItems.map(([label, href]) => <a key={href} className={current === href ? "is-active" : ""} aria-current={current === href ? "page" : undefined} href={href} onClick={closeMenu}>{label}</a>)}
        <a className="button button-small" href={paths.jobs} onClick={closeMenu}>Rejoignez-nous <span aria-hidden="true">↗</span></a>
      </nav>
    </div>
  </header>;
}

function Footer() {
  return <footer className="site-footer">
    <div className="page-width footer-main">
      <a className="footer-brand" href={paths.accueil} aria-label="ferroLink, retour à l'accueil"><span className="footer-mark" aria-hidden="true">F<span>L</span></span><span className="footer-name">ferro<span>Link</span></span></a>
      <p className="footer-tagline">Une affaire de chemin de fer.</p>
      <nav className="footer-navigation" aria-label="Navigation de pied de page">
        {navItems.slice(1).map(([label, href]) => <a href={href} key={href}>{label}</a>)}
      </nav>
      <div className="footer-contact"><span>Appelez-nous aujourd'hui</span><a href="tel:+33633821507">+336-33-82-15-07</a><a href={paths.contact}>Nous contacter <span aria-hidden="true">↗</span></a></div>
    </div>
    <div className="page-width footer-bottom"><span>© {new Date().getFullYear()} ferroLink. Tous droits réservés.</span><a href={paths.accueil}>Retour à l’accueil ↑</a></div>
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
  return <>
    <section className="hero" aria-labelledby="hero-title">
      <iframe className="hero-video" src="https://www.youtube.com/embed/htTd2MiW4KY?autoplay=1&mute=1&controls=0&loop=1&playlist=htTd2MiW4KY&playsinline=1&start=1&end=30&rel=0" title="Train ferroviaire en mouvement" allow="autoplay; encrypted-media; picture-in-picture" referrerPolicy="strict-origin-when-cross-origin" tabIndex="-1" aria-hidden="true" />
      <div className="hero-overlay" />
      <div className="hero-content page-width">
        <p className="eyebrow eyebrow-light"><span /> Conseil & ingénierie ferroviaire</p>
        <h1 id="hero-title">Une affaire de<br />chemin de fer</h1>
        <a className="button button-lime" href={paths.jobs}>Rejoignez-nous <span aria-hidden="true">↗</span></a>
      </div>
      <div className="hero-caption"><span>01</span> ferroLink — Le ferroviaire en mouvement</div>
    </section>

    <section className="intro section page-width">
      <div className="section-kicker"><span>01</span> Présentation de notre entreprise ferroLink</div>
      <div className="presentation-layout">
        <div className="presentation-visual">
          <img src="https://avenirferro.com/wp-content/uploads/elementor/thumbs/pexels-sami-abdullah-7359564-pye0vq5d0s3a91h1ql0dvg48bua4xl4jr3ncu3juhs.jpg" alt="Infrastructure ferroviaire" loading="lazy" />
          <div className="presentation-image-caption"><span>100 %</span><span>du cycle du projet</span></div>
        </div>
        <div className="presentation-copy">
          <p className="presentation-overline">Conseil & ingénierie ferroviaire</p>
          <h2>PRÉSENTATION DE NOTRE ENTREPRISE FERROLINK</h2>
          <p className="lead"><strong>ferroLink</strong> est une société de conseil spécialisée dans l’industrie ferroviaire.</p>
          <p>Elle a pour rôle d’accompagner les clients grands comptes et industriels du ferroviaire dans la réalisation de leurs projets d’envergure et innovants allant des études jusqu’à l’industrialisation, la production, l’exploitation et la maintenance. Elle est donc présente sur l’ensemble du cycle du projet, de la définition jusqu’à la livraison.</p>
          <a className="text-link" href={paths.about}>Lire la suite <span aria-hidden="true">↗</span></a>
        </div>
      </div>
    </section>

    <section className="expertise section">
      <div className="page-width">
        <div className="section-heading"><div><div className="section-kicker"><span>02</span> Nos principaux domaines de compétences</div><h2>Nos principaux domaines de compétences</h2></div><a className="text-link" href={paths.competences}>Découvrir nos compétences <span aria-hidden="true">↗</span></a></div>
        <div className="expertise-grid">
          {expertiseAreas.map((area) => <article className="expertise-card" key={area.number}><span className="card-number">{area.number}</span><div className="card-mark" aria-hidden="true"><span className="rail-symbol">✳</span></div><h3>{area.title}</h3><p>{area.detail}</p></article>)}
        </div>
      </div>
    </section>

    <section className="approach section page-width">
      <div className="approach-heading"><div className="section-kicker"><span>03</span> Nos métiers</div><h2>Les métiers sur lesquels nous pouvons accompagner nos clients</h2><p>Nous intervenons à différentes étapes du cycle de vie des projets ferroviaires, des études à la mise en service.</p><a className="text-link" href={paths.competences}>Voir nos domaines d’intervention <span aria-hidden="true">↗</span></a></div>
      <div className="approach-steps">{metiers.slice(0, 5).map((metier, index) => <article className="approach-step" key={metier}><span className="step-index">{String(index + 1).padStart(2, "0")}</span><h3>{metier}</h3></article>)}</div>
    </section>

    <section className="references section">
      <div className="page-width"><div className="references-heading"><div><div className="section-kicker"><span>04</span> Ils nous font confiance</div><h2>ILS NOUS FONT CONFIANCE</h2></div></div>
        <div className="partner-marquee" aria-label="Logos de nos partenaires">
          <div className="partner-track">
            {[...partners, ...partners].map((partner, index) => <div className="partner" key={`${partner.alt}-${index}`} aria-hidden={index >= partners.length ? "true" : undefined}><img src={partner.src} alt={index >= partners.length ? "" : partner.alt} loading="lazy" /></div>)}
          </div>
        </div>
      </div>
    </section>
    <ContactCallout />
  </>;
}

function AboutPage() {
  const values = [
    ["Le respect", "Écouter les personnes, respecter les engagements et construire des relations de confiance."],
    ["Le partage", "Favoriser la coopération, la transmission des connaissances et le travail en équipe."],
    ["L’innovation", "Rechercher des solutions adaptées aux évolutions et aux enjeux du secteur ferroviaire."],
    ["La responsabilité", "Agir avec sérieux, transparence et attention à la qualité du travail réalisé."],
    ["L’excellence", "Viser un haut niveau d’exigence dans les études, les projets et l’accompagnement des clients."],
  ];
  return <>
    <PageBanner kicker="À propos de nous" title="Une affaire de chemin de fer" description="Découvrez notre vision, nos valeurs et les personnes qui portent notre engagement dans le secteur ferroviaire." />
    <section className="section page-width about-intro">
      <div className="section-kicker"><span>01</span> Notre vision</div>
      <div className="intro-grid"><h2>NOTRE VISION</h2><div className="intro-copy">
        <p className="lead">Accompagner les acteurs du ferroviaire dans la réussite de leurs projets.</p>
        <p>ferroLink est une société de conseil spécialisée dans l’industrie ferroviaire. Elle accompagne les clients grands comptes et les industriels dans leurs projets, depuis les études jusqu’à l’industrialisation, la production, l’exploitation et la maintenance.</p>
        <p>Présente sur l’ensemble du cycle du projet, de la définition jusqu’à la livraison, l’entreprise mobilise ses compétences pour répondre aux besoins de ses clients.</p>
      </div></div>
    </section>
    <section className="section values-section"><div className="page-width">
      <div className="section-heading"><div><div className="section-kicker"><span>02</span> Nos valeurs</div><h2>NOS VALEURS</h2></div><p>Des principes qui guident notre manière de collaborer et d’accompagner les projets.</p></div>
      <div className="values-grid">{values.map(([title, detail], index) => <article className="value-card" key={title}><span className="card-number">{String(index + 1).padStart(2, "0")}</span><h3>{title}</h3><p>{detail}</p></article>)}</div>
    </div></section>
    <section className="section page-width founders-section">
      <div className="section-heading"><div><div className="section-kicker"><span>03</span> Présentation des fondateurs</div><h2>PRÉSENTATION DES FONDATEURS</h2></div></div>
      <div className="founders-grid">
        <article className="founder-card"><div className="founder-monogram">GA</div><div><p className="founder-role">Fondateur</p><h3>Grégory ALINE</h3><p>Contribue au développement d’ferroLink et à l’accompagnement des projets de ses clients dans le secteur ferroviaire.</p></div></article>
        <article className="founder-card"><div className="founder-monogram">FN</div><div><p className="founder-role">Fondateur</p><h3>François NOUEDOUI</h3><p>Participe au développement de l’entreprise et à la mobilisation des compétences nécessaires aux projets ferroviaires.</p></div></article>
      </div>
      <p className="content-note">Les biographies détaillées des fondateurs peuvent être complétées avec le texte exact et les portraits du site de référence.</p>
    </section>
    <ContactCallout />
  </>;
}

function CompetencesPage() {
  return <>
    <PageBanner kicker="Expertises ferroviaires" title="Nos principaux domaines de compétences" description="Des compétences mobilisables tout au long du cycle de vie des projets ferroviaires, des études à l’exploitation." />
    <section className="section expertise-page-section"><div className="page-width">
      <div className="section-kicker"><span>01</span> Nos domaines d’expertise</div>
      <div className="expertise-detail-grid">{expertiseAreas.map((area) => <article className="expertise-detail-card" key={area.number}><span className="card-number">{area.number}</span><div className="card-mark" aria-hidden="true"><span className="rail-symbol">✳</span></div><h2>{area.title}</h2><p>{area.detail}</p></article>)}</div>
    </div></section>
    <section className="section page-width"><div className="section-heading"><div><div className="section-kicker"><span>02</span> Nos métiers</div><h2>Les métiers sur lesquels nous pouvons accompagner nos clients</h2></div></div>
      <div className="metiers-grid">{metiers.map((metier, index) => <article className="metier-tile" key={metier}><span>{String(index + 1).padStart(2, "0")}</span><h3>{metier}</h3></article>)}</div>
    </section>
    <ContactCallout />
  </>;
}

function JobsPage() {
  return <>
    <PageBanner kicker="Carrières" title="Rejoignez-nous" description="Vous souhaitez contribuer à des projets d’envergure dans l’industrie ferroviaire ? Découvrez les opportunités et prenez contact avec notre équipe." />
    <section className="section page-width jobs-content">
      <div className="jobs-callout">
        <div className="section-kicker"><span>01</span> Offres d’emploi</div>
        <h2>Construisons ensemble les projets ferroviaires de demain.</h2>
        <p>Les offres actualisées sont publiées sur le site de référence ferroLink. Consultez les annonces disponibles pour connaître les postes ouverts et les modalités de candidature.</p>
        <a className="button button-lime" href="https://avenirferro.com/offres-demploi/" target="_blank" rel="noreferrer">Consulter les offres d’emploi <span aria-hidden="true">↗</span></a>
      </div>
      <div className="jobs-contact-card"><h3>Vous souhaitez nous transmettre votre candidature ?</h3><p>Vous pouvez contacter l’équipe pour présenter votre profil et votre projet professionnel.</p><a className="text-link" href={paths.contact}>Accéder à la page contact <span aria-hidden="true">↗</span></a><a className="text-link" href="mailto:gregory.aline@avenirferro.com">Écrire par e-mail <span aria-hidden="true">↗</span></a></div>
    </section>
    <section className="section values-section"><div className="page-width"><div className="section-heading"><div><div className="section-kicker"><span>02</span> Nos domaines</div><h2>Des projets au cœur du ferroviaire</h2></div><a className="text-link" href={paths.competences}>Découvrir nos compétences <span aria-hidden="true">↗</span></a></div><div className="jobs-domain-list">{expertiseAreas.map((area) => <div key={area.number}><span>{area.number}</span><strong>{area.title}</strong></div>)}</div></div></section>
  </>;
}

function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });
  const submit = (event) => {
    event.preventDefault();
    const body = `Nom : ${form.name}\nE-mail : ${form.email}\nSujet : ${form.subject}\n\n${form.message}`;
    window.location.href = `mailto:gregory.aline@avenirferro.com?subject=${encodeURIComponent(form.subject || "Prise de contact depuis ferroLink")}&body=${encodeURIComponent(body)}`;
    setSubmitted(true);
  };
  return <>
    <PageBanner kicker="Nous contacter" title="Contactez-nous" description="Vous avez un besoin, une question ou souhaitez échanger sur un projet ferroviaire ? Écrivez-nous ou contactez directement notre équipe." />
    <section className="section page-width contact-page-layout">
      <div className="contact-info-column">
        <div className="section-kicker"><span>01</span> Informations de contact</div>
        <h2>Parlons de votre projet.</h2>
        <div className="contact-info-item"><span className="contact-info-label">Appelez-nous</span><a href="tel:+33633821507">00336-33-82-15-07</a><a href="tel:+33650142309">00336-50-14-23-09</a></div>
        <div className="contact-info-item"><span className="contact-info-label">E-mail</span><a href="mailto:gregory.aline@avenirferro.com">gregory.aline@avenirferro.com</a><a href="mailto:francois.nouedoui@avenirferro.com">francois.nouedoui@avenirferro.com</a></div>
        <div className="contact-info-item"><span className="contact-info-label">Siège social</span><p>1 Rue Marcel Duchamp<br />94260 Fresnes, France</p></div>
        <div className="contact-info-item"><span className="contact-info-label">Suivez-nous</span><a href="https://www.linkedin.com/" target="_blank" rel="noreferrer">LinkedIn ↗</a></div>
      </div>
      <form className="contact-form" onSubmit={submit}>
        <div className="section-kicker"><span>02</span> Envoyez-nous un message</div><h2>Envoyez-nous un message</h2>
        <label>Nom complet<input name="name" value={form.name} onChange={update} autoComplete="name" required /></label>
        <label>Adresse e-mail<input name="email" type="email" value={form.email} onChange={update} autoComplete="email" required /></label>
        <label>Sujet<input name="subject" value={form.subject} onChange={update} required /></label>
        <label>Votre message<textarea name="message" rows="5" value={form.message} onChange={update} required /></label>
        <button className="button button-lime" type="submit">Préparer le message <span aria-hidden="true">↗</span></button>
        {submitted && <p className="form-feedback" role="status">Votre application e-mail devrait s’ouvrir avec le message préparé. Aucun message n’est envoyé depuis le site.</p>}
        <p className="form-note">Le formulaire prépare un e-mail dans votre application de messagerie ; il ne transmet pas les données à un serveur.</p>
      </form>
    </section>
  </>;
}

function ContactCallout() {
  return <section className="contact section page-width"><div className="contact-panel">
    <div className="contact-content"><div className="section-kicker section-kicker-light"><span>Parlons de votre projet</span></div><h2>Confiez-nous vos besoins</h2><p>Contactez notre équipe pour échanger sur vos projets et vos besoins en ingénierie ferroviaire.</p><a className="button button-lime" href={paths.contact}>Contactez-nous <span aria-hidden="true">↗</span></a></div>
    <div className="contact-orbit" aria-hidden="true"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="orbit-core"><span>FL</span></div><span className="orbit-node" /></div>
  </div></section>;
}

function getRoute() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  return Object.values(paths).includes(path) ? path : paths.accueil;
}

export default function App() {
  const current = getRoute();
  const pages = {
    [paths.accueil]: <HomePage />,
    [paths.about]: <AboutPage />,
    [paths.competences]: <CompetencesPage />,
    [paths.jobs]: <JobsPage />,
    [paths.contact]: <ContactPage />,
  };
  return <>
    <a className="skip-link" href="#contenu">Aller au contenu</a>
    <Header current={current} />
    <main id="contenu">{pages[current]}</main>
    <Footer />
  </>;
}
