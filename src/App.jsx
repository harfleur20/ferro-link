import { useState } from "react";
import { FaTrainSubway } from "react-icons/fa6";
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
  const [jobsMenuOpen, setJobsMenuOpen] = useState(false);
  const closeMenu = () => { setMenuOpen(false); setJobsMenuOpen(false); };
  return <header className="site-header">
    <div className="header-inner">
      <a className="brand" href={paths.accueil} aria-label="ferroLink, accueil">
        <img src="/images/ferrolink-logo.png" alt="ferroLink" width="995" height="157" />
      </a>
      <button className="menu-toggle" type="button" aria-expanded={menuOpen} aria-controls="main-navigation" aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"} onClick={() => setMenuOpen(!menuOpen)}>
        <span /><span />
      </button>
      <nav className={`main-navigation ${menuOpen ? "is-open" : ""}`} id="main-navigation" aria-label="Navigation principale">
        {navItems.map(([label, href]) => href === paths.jobs ? <div className={`nav-dropdown ${current === paths.jobs ? "is-active" : ""} ${jobsMenuOpen ? "is-open" : ""}`} key={href}>
          <button className="nav-dropdown-trigger" type="button" aria-expanded={jobsMenuOpen} aria-haspopup="true" onClick={() => setJobsMenuOpen(!jobsMenuOpen)}>{label}<span className="nav-chevron" aria-hidden="true">⌄</span></button>
          <div className="nav-dropdown-menu">
            <a href={paths.jobs} className={current === paths.jobs ? "is-active" : ""} aria-current={current === paths.jobs ? "page" : undefined} onClick={closeMenu}>Offres d'emploi</a>
            <a href={paths.contact} onClick={closeMenu}>Candidature spontanée</a>
          </div>
        </div> : <a key={href} className={current === href ? "is-active" : ""} aria-current={current === href ? "page" : undefined} href={href} onClick={closeMenu}>{label}</a>)}
        <a className="button button-small" href={paths.jobs} onClick={closeMenu}>Rejoignez-nous</a>
      </nav>
    </div>
  </header>;
}

function Footer() {
  return <footer className="site-footer">
    <div className="page-width footer-main">
      <div className="footer-brand-column">
        <a className="footer-brand" href={paths.accueil} aria-label="ferroLink, retour à l'accueil">
          <img src="/images/ferrolink-logo.png" alt="ferroLink" width="995" height="157" loading="lazy" />
        </a>
        <p className="footer-tagline">Une affaire de chemin de fer.</p>
        <p className="footer-description">Conseil et ingénierie ferroviaire : nous accompagnons les acteurs du secteur dans leurs projets, des études à la mise en service, en passant par la conception, les travaux, l’exploitation et la maintenance.</p>
      </div>
      <div className="footer-column">
        <h2>Découvrir ferroLink</h2>
        <a href={paths.about}>À propos de nous</a>
        <a href={paths.competences}>Nos compétences</a>
        <a href={paths.jobs}>Offres d’emploi</a>
        <a href={paths.contact}>Candidature spontanée</a>
      </div>
      <div className="footer-column">
        <h2>Nos expertises</h2>
        {expertiseAreas.map((area) => <a href={paths.competences} key={area.title}>{area.title}</a>)}
      </div>
      <div className="footer-column footer-contact">
        <h2>Parlons de votre projet</h2>
        <p>Vous avez un besoin en ingénierie ferroviaire ou souhaitez rejoindre nos équipes ? Échangeons sur votre projet.</p>
        <a href="tel:+33633821507">+33 6 33 82 15 07</a>
        <a href="tel:+33650142309">+33 6 50 14 23 09</a>
        <a href="mailto:gregory.aline@avenirferro.com">Nous écrire ↗</a>
        <a className="footer-contact-cta" href={paths.contact}>Contacter l’équipe <span aria-hidden="true">→</span></a>
      </div>
    </div>
    <div className="page-width footer-bottom">
      <span>© {new Date().getFullYear()} ferroLink. Tous droits réservés.</span>
      <span>Conseil · Ingénierie · Projets ferroviaires</span>
      <a href={paths.accueil}>Retour en haut ↑</a>
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
  return <>
    <section className="hero" aria-labelledby="hero-title">
      <video className="hero-video" autoPlay muted loop playsInline preload="metadata" tabIndex="-1" aria-hidden="true"><source src="https://videos.pexels.com/video-files/19497508/19497508-hd_1920_1080_25fps.mp4" type="video/mp4" /></video>
      <div className="hero-overlay" />
      <div className="hero-content page-width">
        <p className="eyebrow eyebrow-light"><span /> Conseil & ingénierie ferroviaire</p>
        <h1 id="hero-title">Une affaire de<br />chemin de fer</h1>
        <a className="button button-lime" href={paths.jobs}>Rejoignez-nous</a>
      </div>
      <div className="hero-caption">ferroLink — Le ferroviaire en mouvement</div>
    </section>

    <section className="intro section page-width">
      <div className="presentation-layout">
        <div className="presentation-visual">
          <img src="https://commons.wikimedia.org/wiki/Special:FilePath/Railway_work_crew_-_Seattle_04A.jpg" alt="Équipe américaine de maintenance ferroviaire travaillant sur les voies à Seattle" loading="lazy" />
          <div className="presentation-image-caption"><span>ferroLink</span><span>Conseil & ingénierie</span></div>
        </div>
        <div className="presentation-copy">
          <p className="presentation-overline">Une expertise dédiée au rail</p>
          <h2>Accompagner les projets ferroviaires, de l’idée à la mise en service.</h2>
          <p className="lead"><strong>ferroLink</strong> est une société de conseil spécialisée dans l’industrie ferroviaire.</p>
          <p>Nous accompagnons les clients grands comptes et les industriels dans leurs projets, des études à l’industrialisation, la production, l’exploitation et la maintenance. Nos compétences s’inscrivent dans l’ensemble du cycle de vie des projets.</p>
          <div className="presentation-actions">
            <a className="text-link" href={paths.about}>Découvrir ferroLink</a>
            <div className="home-phone"><span>Un projet à discuter ?</span><a href="tel:+33633821507">+33 6 33 82 15 07</a></div>
          </div>
        </div>
      </div>
    </section>

    <section className="home-contact-band">
      <div className="page-width home-contact-inner">
        <div><p className="eyebrow"><span /> Parlons de votre projet</p><h2>Vos enjeux ferroviaires méritent une réponse adaptée.</h2></div>
        <a className="button button-lime" href={paths.contact}>Échanger avec notre équipe <span aria-hidden="true">↗</span></a>
      </div>
    </section>

    <section className="home-expertise section">
      <div className="page-width home-split-layout">
        <div className="home-section-visual"><img src="https://cdn.mbta.com/sites/default/files/styles/max_2600x2600/public/media/2024-11/MBTA_OL_Diversion_MaldenCen_OakGrove%20103124-6445.jpg?itok=AhOC2zmw" alt="Techniciens de maintenance du réseau ferroviaire américain" loading="lazy" /><span className="visual-index">01 / EXPERTISES</span></div>
        <div className="home-section-content">
          <h2>Des compétences au service de toute la chaîne ferroviaire.</h2>
          <p className="home-section-lead">Des expertises complémentaires pour répondre aux exigences techniques et opérationnelles des projets.</p>
          <div className="home-expertise-list">{expertiseAreas.map((area) => <div className="home-expertise-item" key={area.number}><span className="home-expertise-icon"><ExpertiseIcon number={area.number} /></span><span><strong>{area.title}</strong><small>{area.detail}</small></span></div>)}</div>
          <a className="text-link" href={paths.competences}>Toutes nos compétences</a>
        </div>
      </div>
    </section>

    <section className="home-metiers section">
      <div className="page-width home-split-layout home-metiers-layout">
        <div className="home-section-content">
          <h2>De l’étude au terrain, nous accompagnons les étapes clés de vos projets.</h2>
          <p className="home-section-lead">Nos équipes peuvent intervenir en appui de vos métiers et de vos opérations, selon les besoins de chaque mission.</p>
          <div className="home-metiers-grid">{metiers.map((metier,index)=><div className="home-metier-chip" key={metier}><FaTrainSubway className="train-icon" aria-hidden="true" />{metier}</div>)}</div>
          <a className="text-link" href={paths.competences}>Explorer nos domaines d’intervention</a>
        </div>
        <div className="home-section-visual home-metiers-visual"><img src="https://www.bnsf.com/news-media/images/rt-mow-4.jpg" alt="Technicien américain inspectant une voie ferrée" loading="lazy" /><span className="visual-index">02 / MÉTIERS</span></div>
      </div>
    </section>

    <section className="references section">
      <div className="page-width"><div className="references-heading"><div><div className="section-kicker">Ils nous font confiance</div><h2>Des partenaires engagés à nos côtés.</h2></div></div>
        <div className="partner-marquee" aria-label="Logos de nos partenaires"><div className="partner-track">
          {[...partners, ...partners].map((partner, index) => <div className="partner" key={`${partner.alt}-${index}`} aria-hidden={index >= partners.length ? "true" : undefined}><img src={partner.src} alt={index >= partners.length ? "" : partner.alt} loading="lazy" /></div>)}
        </div></div>
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
      <div className="expertise-detail-grid">{expertiseAreas.map((area) => <div className="expertise-detail-card" key={area.number}><div className="card-mark" aria-hidden="true"><ExpertiseIcon number={area.number} /></div><h2>{area.title}</h2><p>{area.detail}</p></div>)}</div>
    </div></section>
    <section className="section page-width"><div className="section-heading"><div><div className="section-kicker"><span>02</span> Nos métiers</div><h2>Les métiers sur lesquels nous pouvons accompagner nos clients</h2></div></div>
      <div className="metiers-grid">{metiers.map((metier, index) => <article className="metier-tile" key={metier}><FaTrainSubway className="train-icon" aria-hidden="true" /><h3>{metier}</h3></article>)}</div>
    </section>
    <ContactCallout />
  </>;
}

const jobOffers = [
  {
    id: "ingenieur-signalisation",
    title: "Ingénieur signalisation ferroviaire H/F",
    category: "Signalisation & CBTC",
    contract: "CDI",
    location: "Île-de-France",
    experience: "3 à 5 ans",
    salary: "42–52 k€ brut/an",
    date: "Publication récente",
    image: "https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=1200&q=85",
    imageAlt: "Voies ferrées traversant un paysage",
    summary: "Participez aux études et à la validation de systèmes de signalisation qui contribuent à la sécurité et à la performance des réseaux.",
    missions: ["Contribuer aux études de signalisation et à la rédaction des livrables techniques.", "Coordonner les interfaces avec les équipes systèmes, travaux et essais.", "Participer aux revues techniques, à la vérification et à la validation."],
    profile: "Formation ingénieur ou équivalent en systèmes ferroviaires, automatique ou électronique. Une expérience en signalisation ferroviaire est appréciée."
  },
  {
    id: "chef-projet-travaux",
    title: "Chef de projet travaux ferroviaires H/F",
    category: "Génie civil & voie ferrée",
    contract: "CDI",
    location: "Lyon",
    experience: "5 ans et +",
    salary: "45–58 k€ brut/an",
    date: "Publication récente",
    image: "https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=1200&q=85",
    imageAlt: "Infrastructure ferroviaire et lignes de rails",
    summary: "Pilotez la préparation et le suivi d’opérations ferroviaires en lien avec les équipes terrain, les partenaires et le client.",
    missions: ["Planifier les phases de travaux et suivre les jalons du projet.", "Coordonner les entreprises et les parties prenantes.", "Suivre la qualité, les risques, la sécurité et le reporting d’avancement."],
    profile: "Expérience en conduite de projets d’infrastructure, travaux publics ou ferroviaires. Organisation, communication et culture sécurité indispensables."
  },
  {
    id: "technicien-essais",
    title: "Technicien essais & mise en service H/F",
    category: "Essais & validation",
    contract: "Mission",
    location: "Lille",
    experience: "1 à 3 ans",
    salary: "Selon profil",
    date: "Publication récente",
    image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=85",
    imageAlt: "Infrastructure de transport et équipements techniques",
    summary: "Contribuez aux essais sur site et à la mise en service d’équipements ferroviaires, dans le respect des procédures et exigences de sécurité.",
    missions: ["Préparer les séquences d’essais et les moyens de contrôle.", "Réaliser les vérifications et consigner les résultats.", "Remonter les écarts et participer à leur résolution avec les équipes projet."],
    profile: "Formation technique en électrotechnique, électronique ou systèmes industriels. Mobilité sur site et rigueur documentaire attendues."
  },
  {
    id: "ingenieur-materiel",
    title: "Ingénieur matériel roulant H/F",
    category: "Matériel roulant",
    contract: "CDI",
    location: "Île-de-France",
    experience: "3 à 5 ans",
    salary: "40–50 k€ brut/an",
    date: "Publication récente",
    image: "https://images.unsplash.com/photo-1532105956626-9569c03602f6?auto=format&fit=crop&w=1200&q=85",
    imageAlt: "Train de voyageurs sur une ligne ferroviaire",
    summary: "Accompagnez les équipes dans l’analyse technique, la fiabilité et le suivi des évolutions du matériel roulant.",
    missions: ["Analyser les exigences et les dossiers techniques.", "Assurer le suivi des anomalies et des modifications.", "Participer aux échanges entre fournisseurs, exploitants et équipes d’ingénierie."],
    profile: "Formation ingénieur en mécanique, électromécanique ou systèmes embarqués. Une expérience ferroviaire constitue un atout."
  },
  {
    id: "ingenieur-energie",
    title: "Ingénieur énergie & traction électrique H/F",
    category: "Courants forts & énergie",
    contract: "CDI",
    location: "Bordeaux",
    experience: "3 à 5 ans",
    salary: "40–52 k€ brut/an",
    date: "Publication récente",
    image: "https://images.unsplash.com/photo-1494515843206-f3117d3f51b7?auto=format&fit=crop&w=1200&q=85",
    imageAlt: "Réseau de transport et infrastructure électrique",
    summary: "Intervenez sur les études d’alimentation électrique et les interfaces énergie des projets ferroviaires.",
    missions: ["Réaliser ou vérifier les études techniques et notes de calcul.", "Analyser les interfaces entre alimentation, équipements et exploitation.", "Participer aux réunions de coordination et au suivi des livrables."],
    profile: "Diplôme en génie électrique ou électrotechnique. Connaissance des installations de traction ou des réseaux électriques appréciée."
  },
  {
    id: "ingenieur-telecom",
    title: "Ingénieur systèmes télécoms ferroviaires H/F",
    category: "Courants faibles & télécoms",
    contract: "CDI",
    location: "Marseille",
    experience: "3 à 5 ans",
    salary: "40–50 k€ brut/an",
    date: "Publication récente",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=85",
    imageAlt: "Équipements et technologies de communication",
    summary: "Contribuez à la conception et à l’intégration des systèmes de communication et de sûreté des infrastructures ferroviaires.",
    missions: ["Analyser les besoins et exigences systèmes.", "Suivre les interfaces entre réseaux, équipements et lots techniques.", "Préparer les essais d’intégration et la documentation associée."],
    profile: "Formation ingénieur ou universitaire en télécoms, réseaux ou systèmes. Une expérience dans les transports est appréciée."
  }
];

function JobsPage() {
  const [search, setSearch] = useState("");
  const [contract, setContract] = useState("Tous les contrats");
  const [location, setLocation] = useState("Toutes les localisations");
  const [selectedJob, setSelectedJob] = useState(null);
  const filteredJobs = jobOffers.filter((job) => {
    const query = search.trim().toLocaleLowerCase("fr");
    const matchesSearch = !query || [job.title, job.category, job.location, job.summary].some((value) => value.toLocaleLowerCase("fr").includes(query));
    return matchesSearch && (contract === "Tous les contrats" || job.contract === contract) && (location === "Toutes les localisations" || job.location === location);
  });
  const applyLink = (job) => `mailto:gregory.aline@avenirferro.com?subject=${encodeURIComponent("Candidature — " + job.title)}&body=${encodeURIComponent("Bonjour,\\n\\nJe souhaite vous proposer ma candidature pour le poste « " + job.title + " ».\\n\\nVous trouverez mon CV en pièce jointe.\\n\\nCordialement,")}`;
  return <>
    <PageBanner kicker="Carrières & opportunités" title="Trouvez votre prochaine mission." description="Rejoignez des équipes qui font avancer les projets ferroviaires. Explorez les opportunités et trouvez le poste qui correspond à votre expertise." />
    <section className="jobs-intro-strip">
      <div className="page-width jobs-intro-inner">
        <div><span className="jobs-live-dot" /> Opportunités ferroviaires</div>
        <p>Ingénierie · Études · Travaux · Essais · Mise en service</p>
      </div>
    </section>
    <section className="section page-width jobs-marketplace">
      <div className="jobs-marketplace-heading">
        <div><div className="section-kicker"><span>Carrières</span> / Offres d’emploi</div><h2>Les opportunités du moment</h2><p>Parcourez les postes et filtrez les annonces selon votre recherche.</p></div>
        <a className="button button-outline" href={paths.contact}>Candidature spontanée <span aria-hidden="true">↗</span></a>
      </div>
      <div className="jobs-demo-note"><span aria-hidden="true">ⓘ</span><p><strong>Maquette de démonstration :</strong> ces annonces, rémunérations et localisations sont fictives. Elles illustrent le fonctionnement de la page et devront être remplacées par les offres réellement ouvertes avant publication.</p></div>
      <div className="jobs-search-panel" role="search" aria-label="Filtrer les offres d’emploi">
        <label className="jobs-search-field"><span aria-hidden="true">⌕</span><span className="visually-hidden">Rechercher une offre</span><input type="search" placeholder="Intitulé, compétence, domaine…" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
        <label className="jobs-filter"><span className="visually-hidden">Type de contrat</span><select value={contract} onChange={(event) => setContract(event.target.value)}><option>Tous les contrats</option><option>CDI</option><option>Mission</option><option>CDD</option><option>Stage</option><option>Alternance</option></select></label>
        <label className="jobs-filter"><span className="visually-hidden">Localisation</span><select value={location} onChange={(event) => setLocation(event.target.value)}><option>Toutes les localisations</option>{[...new Set(jobOffers.map((job) => job.location))].map((place) => <option key={place}>{place}</option>)}</select></label>
        <button className="jobs-reset" type="button" onClick={() => { setSearch(""); setContract("Tous les contrats"); setLocation("Toutes les localisations"); }}>Réinitialiser</button>
      </div>
      <div className="jobs-results-line"><p><strong>{filteredJobs.length}</strong> offre{filteredJobs.length > 1 ? "s" : ""} trouvée{filteredJobs.length > 1 ? "s" : ""}</p><span>Tri : les plus récentes</span></div>
      {filteredJobs.length ? <div className="jobs-offer-grid">{filteredJobs.map((job) => <article className="job-card" key={job.id}>
        <button className="job-card-image-button" type="button" onClick={() => setSelectedJob(job)} aria-label={`Voir le détail : ${job.title}`}><img src={job.image} alt={job.imageAlt} loading="lazy" /><span className="job-category">{job.category}</span><span className="job-image-arrow" aria-hidden="true">↗</span></button>
        <div className="job-card-content"><div className="job-card-meta"><span>{job.contract}</span><span>{job.experience}</span></div><h3><button type="button" onClick={() => setSelectedJob(job)}>{job.title}</button></h3><p className="job-card-summary">{job.summary}</p><div className="job-card-location"><span aria-hidden="true">⌖</span>{job.location}<span className="job-card-salary">{job.salary}</span></div><div className="job-card-actions"><button className="job-details-link" type="button" onClick={() => setSelectedJob(job)}>Voir l’offre <span aria-hidden="true">→</span></button><a href={applyLink(job)} className="job-apply-link" aria-label={`Candidater à ${job.title}`}>Postuler ↗</a></div></div>
      </article>)}</div> : <div className="jobs-empty-state"><h3>Aucune offre ne correspond à ces filtres.</h3><p>Modifiez votre recherche ou envoyez-nous une candidature spontanée.</p><button type="button" className="button button-lime" onClick={() => { setSearch(""); setContract("Tous les contrats"); setLocation("Toutes les localisations"); }}>Voir toutes les offres</button><a className="text-link" href={paths.contact}>Candidature spontanée</a></div>}
    </section>
    <section className="jobs-spontaneous"><div className="page-width jobs-spontaneous-inner"><div><p className="eyebrow"><span /> Vous ne trouvez pas votre poste ?</p><h2>Votre parcours a aussi sa place chez ferroLink.</h2><p>Présentez-nous vos compétences et le type de mission que vous recherchez. Nous pourrons étudier votre candidature spontanée.</p></div><a className="button button-lime" href={paths.contact}>Envoyer une candidature <span aria-hidden="true">↗</span></a></div></section>
    <section className="section page-width jobs-values-section"><div className="section-heading"><div><div className="section-kicker"><span>Pourquoi ferroLink ?</span></div><h2>Des métiers au cœur du ferroviaire</h2></div><a className="text-link" href={paths.competences}>Découvrir nos compétences</a></div><div className="jobs-domain-list">{expertiseAreas.map((area) => <div key={area.title}><FaTrainSubway className="train-icon" aria-hidden="true" /><strong>{area.title}</strong></div>)}</div></section>
    {selectedJob && <div className="job-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedJob(null); }}><section className="job-modal" role="dialog" aria-modal="true" aria-labelledby="job-modal-title"><button className="job-modal-close" type="button" aria-label="Fermer le détail de l’offre" onClick={() => setSelectedJob(null)}>×</button><img className="job-modal-image" src={selectedJob.image} alt={selectedJob.imageAlt} /><div className="job-modal-body"><p className="section-kicker"><span>{selectedJob.category}</span></p><h2 id="job-modal-title">{selectedJob.title}</h2><div className="job-modal-tags"><span>{selectedJob.contract}</span><span>{selectedJob.location}</span><span>{selectedJob.experience}</span><span>{selectedJob.salary}</span></div><p className="job-modal-summary">{selectedJob.summary}</p><h3>Vos missions</h3><ul>{selectedJob.missions.map((mission) => <li key={mission}>{mission}</li>)}</ul><h3>Votre profil</h3><p>{selectedJob.profile}</p><div className="job-modal-actions"><a className="button button-lime" href={applyLink(selectedJob)}>Postuler à cette offre <span aria-hidden="true">↗</span></a><button className="button button-outline" type="button" onClick={() => setSelectedJob(null)}>Retour aux offres</button></div><p className="job-modal-note">Pensez à joindre votre CV et, si possible, quelques lignes de motivation à votre e-mail.</p></div></section></div>}
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
