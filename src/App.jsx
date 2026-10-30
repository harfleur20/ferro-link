import { useState } from "react";
import "./styles/global.css";

const expertiseAreas = [
  { number: "01", icon: "signal", title: "Signalisation & systèmes", description: "Signalisation ferroviaire, CBTC et systèmes de contrôle : nous aidons à concevoir des réseaux sûrs et performants.", tag: "Signalisation · CBTC" },
  { number: "02", icon: "track", title: "Voie & génie civil", description: "De l’étude à la réalisation, nous accompagnons vos projets d’infrastructure et de voie ferrée.", tag: "Infrastructure · Voie" },
  { number: "03", icon: "train", title: "Matériel roulant", description: "Une expertise au service de la conception, de la maintenance et de la disponibilité de vos matériels.", tag: "Trains · Maintenance" },
  { number: "04", icon: "energy", title: "Énergie & télécoms", description: "Courants forts, courants faibles et télécommunications : des systèmes connectés, pensés dans leur ensemble.", tag: "Énergie · Télécoms" },
];
const partners = [
  { src: "/images/partner-1.png", alt: "Egis" }, { src: "/images/partner-2.png", alt: "Colas Rail" },
  { src: "/images/partner-3.jpeg", alt: "INEO, une marque d'Equans" }, { src: "/images/partner-4.jpeg", alt: "Setec" },
  { src: "/images/partner-5.png", alt: "RATP" }, { src: "/images/partner-6.png", alt: "Alstom" },
];

function ExpertiseIcon({ type }) {
  const common = { viewBox: "0 0 48 48", fill: "none", "aria-hidden": true };
  const paths = {
    signal: <><path d="M24 28v14M19 42h10"/><rect x="14" y="5" width="20" height="25" rx="3"/><circle cx="24" cy="13" r="3"/><circle cx="24" cy="23" r="3"/><path d="M34 10h6M34 25h6"/></>,
    track: <><path d="M17 5 12 43M31 5l5 38M14 13h20M13 21h22M12 29h24M11 37h26"/><path d="M19 5h10"/></>,
    train: <><rect x="10" y="5" width="28" height="32" rx="6"/><path d="M10 24h28M16 42l5-5M32 42l-5-5M18 42h12"/><path d="M17 12h14v7H17z"/><circle cx="18" cy="30" r="2" fill="currentColor"/><circle cx="30" cy="30" r="2" fill="currentColor"/></>,
    energy: <><path d="M10 43 20 5M38 43 28 5M15 24h18M17 16h14M13 32h22M24 5v38"/><path d="M19 5h10M21 11h6"/><path d="m26 17-6 10h5l-3 7 8-11h-5l3-6" fill="currentColor" stroke="none"/></>,
  };
  return <svg {...common}>{paths[type]}</svg>;
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);
  return <>
    <a className="skip-link" href="#contenu">Aller au contenu</a>
    <header className="site-header"><div className="header-inner">
      <a className="brand" href="#accueil" aria-label="ferroLink, accueil"><img src="/images/ferrolink-logo.png" alt="ferroLink" width="995" height="157" /></a>
      <button className="menu-toggle" type="button" aria-expanded={menuOpen} aria-controls="main-navigation" aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"} onClick={() => setMenuOpen(!menuOpen)}><span/><span/></button>
      <nav className={`main-navigation ${menuOpen ? "is-open" : ""}`} id="main-navigation" aria-label="Navigation principale">
        <a href="#expertises" onClick={closeMenu}>Nos expertises</a><a href="#approche" onClick={closeMenu}>Notre approche</a><a href="#references" onClick={closeMenu}>Références</a>
        <a className="button button-small" href="#contact" onClick={closeMenu}>Parlons de votre projet <span aria-hidden="true">↗</span></a>
      </nav>
    </div></header>
    <main id="contenu">
      <section className="hero" id="accueil" aria-labelledby="hero-title">
        <iframe className="hero-video" src="https://www.youtube.com/embed/htTd2MiW4KY?autoplay=1&mute=1&controls=0&loop=1&playlist=htTd2MiW4KY&playsinline=1&start=1&end=30&rel=0" title="Train ferroviaire en mouvement" allow="autoplay; encrypted-media; picture-in-picture" referrerPolicy="strict-origin-when-cross-origin" tabIndex="-1" aria-hidden="true"/>
        <div className="hero-overlay"/><div className="hero-content page-width">
          <p className="eyebrow eyebrow-light"><span/> Conseil & ingénierie ferroviaire</p><h1 id="hero-title">Le ferroviaire<br/>en mouvement.</h1>
          <p className="hero-lead">Nous connectons les talents et les infrastructures pour faire avancer vos projets, du premier tracé à la mise en service.</p>
          <a className="button button-lime" href="#expertises">Découvrir nos expertises <span aria-hidden="true">↘</span></a>
        </div><div className="hero-caption"><span>01</span> Imaginer. Relier. Faire avancer.</div><a className="scroll-cue" href="#intro" aria-label="Défiler vers la suite"><span/></a>
      </section>
      <div className="capability-strip" aria-label="Notre accompagnement"><div className="page-width capability-inner"><span>Une expertise ferroviaire de terrain</span><span className="capability-divider" aria-hidden="true"/><span>Du conseil à la mise en service</span><span className="capability-divider" aria-hidden="true"/><span>Des équipes au cœur de vos projets</span></div></div>
      <section className="intro section page-width" id="intro"><div className="section-kicker"><span>01</span> À propos de ferroLink</div><div className="intro-grid">
        <h2>Le bon lien entre<br/>vos ambitions et le terrain.</h2><div className="intro-copy"><p className="lead">Le ferroviaire est un écosystème exigeant. ferroLink rassemble les compétences qui le font avancer.</p>
        <p>Société de conseil spécialisée dans l'industrie ferroviaire, nous accompagnons les grands comptes et les industriels à chaque étape de leurs projets : études, industrialisation, production, exploitation et maintenance.</p>
        <a className="text-link" href="#approche">Découvrir notre approche <span aria-hidden="true">↗</span></a></div>
      </div></section>
      <section className="expertise section" id="expertises"><div className="page-width"><div className="section-heading"><div><div className="section-kicker"><span>02</span> Nos domaines d'intervention</div><h2>Une vision complète<br/>de vos enjeux ferroviaires.</h2></div><p>Des expertises complémentaires, mobilisées avec agilité selon les besoins et l'ambition de chaque projet.</p></div>
        <div className="expertise-grid">{expertiseAreas.map(area => <article className="expertise-card" key={area.number}><span className="card-number">{area.number}</span><div className="card-mark"><ExpertiseIcon type={area.icon}/></div><h3>{area.title}</h3><p>{area.description}</p><span className="card-tag">{area.tag}</span></article>)}</div>
      </div></section>
      <section className="approach section page-width" id="approche"><div className="approach-heading"><div className="section-kicker"><span>03</span> Notre approche</div><h2>Du premier échange<br/>au dernier essai.</h2><p>Une présence à chaque étape pour sécuriser les décisions, fluidifier les interfaces et transformer les objectifs en résultats concrets.</p><a className="text-link" href="#contact">Construisons la suite ensemble <span aria-hidden="true">↗</span></a></div>
        <div className="approach-steps"><article className="approach-step"><span className="step-index">01 / Comprendre</span><h3>Poser le bon diagnostic</h3><p>Écouter vos équipes, analyser les contraintes et clarifier les priorités.</p></article><article className="approach-step"><span className="step-index">02 / Construire</span><h3>Mobiliser les compétences</h3><p>Réunir les expertises adaptées et les intégrer au plus près du projet.</p></article><article className="approach-step"><span className="step-index">03 / Faire avancer</span><h3>Accompagner dans la durée</h3><p>Suivre les actions, anticiper les enjeux et viser une mise en service maîtrisée.</p></article></div>
      </section>
      <section className="references section" id="references"><div className="page-width"><div className="references-heading"><div><div className="section-kicker"><span>04</span> Ils nous font confiance</div><h2>Le ferroviaire se construit ensemble.</h2></div><p>Des partenaires engagés au service des infrastructures de demain.</p></div>
        <div className="partner-grid">{partners.map(partner => <div className="partner" key={partner.alt}><img src={partner.src} alt={partner.alt} loading="lazy"/></div>)}</div>
      </div></section>
      <section className="contact section page-width" id="contact"><div className="contact-panel"><div className="contact-content"><div className="section-kicker section-kicker-light"><span>05</span> Et si on faisait avancer vos projets ?</div><h2>Chaque grand projet<br/>commence par un échange.</h2><p>Parlons de vos enjeux ferroviaires et des compétences qu'il vous faut.</p><a className="button button-lime" href="mailto:gregory.aline@avenirferro.com">Contactez ferroLink <span aria-hidden="true">↗</span></a></div>
        <div className="contact-orbit" aria-hidden="true"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="orbit-core"><span>FL</span></div><span className="orbit-node"/></div>
      </div></section>
    </main>
    <footer className="site-footer"><div className="page-width footer-main"><a className="footer-brand" href="#accueil" aria-label="ferroLink, retour à l'accueil"><span className="footer-mark" aria-hidden="true">F<span>L</span></span><span className="footer-name">ferro<span>Link</span></span></a>
      <p className="footer-tagline">Connecter les talents<br/>& les infrastructures ferroviaires.</p><nav className="footer-navigation" aria-label="Navigation de pied de page"><a href="#expertises">Expertises</a><a href="#approche">Notre approche</a><a href="#references">Références</a></nav>
      <div className="footer-contact"><span>Un projet en tête ?</span><a href="mailto:gregory.aline@avenirferro.com">Écrivez-nous <span aria-hidden="true">↗</span></a></div>
    </div><div className="page-width footer-bottom"><span>© {new Date().getFullYear()} ferroLink. Tous droits réservés.</span><a href="#accueil">Retour en haut ↑</a></div></footer>
  </>;
}
