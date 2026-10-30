import { useState } from "react";
import "./styles/global.css";

const expertiseAreas = [
  { number: "01", title: "Signalisation & CBTC (Communication Based Train Control)" },
  { number: "02", title: "Matériel Roulant" },
  { number: "03", title: "Courants forts & Energie" },
  { number: "04", title: "Génie Civil & voie ferrée" },
  { number: "05", title: "Courants faibles & Télécoms" },
];

const métiers = [
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

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return <>
    <a className="skip-link" href="#contenu">Aller au contenu</a>
    <header className="site-header">
      <div className="header-inner">
        <a className="brand" href="#accueil" aria-label="ferroLink, accueil">
          <img src="/images/ferrolink-logo.png" alt="ferroLink" width="995" height="157" />
        </a>
        <button className="menu-toggle" type="button" aria-expanded={menuOpen} aria-controls="main-navigation" aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"} onClick={() => setMenuOpen(!menuOpen)}>
          <span /><span />
        </button>
        <nav className={`main-navigation ${menuOpen ? "is-open" : ""}`} id="main-navigation" aria-label="Navigation principale">
          <a href="#accueil" onClick={closeMenu}>Accueil</a>
          <a href="#presentation" onClick={closeMenu}>À propos de nous</a>
          <a href="#competences" onClick={closeMenu}>Nos compétences</a>
          <a href="#offres-emploi" onClick={closeMenu}>Offres d'emploi</a>
          <a href="#contact" onClick={closeMenu}>Contactez-nous</a>
          <a className="button button-small" href="#rejoignez-nous" onClick={closeMenu}>Rejoignez-Nous <span aria-hidden="true">↗</span></a>
        </nav>
      </div>
    </header>

    <main id="contenu">
      <section className="hero" id="accueil" aria-labelledby="hero-title">
        <iframe className="hero-video" src="https://www.youtube.com/embed/htTd2MiW4KY?autoplay=1&mute=1&controls=0&loop=1&playlist=htTd2MiW4KY&playsinline=1&start=1&end=30&rel=0" title="Train ferroviaire en mouvement" allow="autoplay; encrypted-media; picture-in-picture" referrerPolicy="strict-origin-when-cross-origin" tabIndex="-1" aria-hidden="true" />
        <div className="hero-overlay" />
        <div className="hero-content page-width">
          <p className="eyebrow eyebrow-light"><span /> Conseil & ingénierie ferroviaire</p>
          <h1 id="hero-title">Une affaire de<br />chemin de fer</h1>
          <a className="button button-lime" href="#rejoignez-nous">Rejoignez-Nous <span aria-hidden="true">↗</span></a>
        </div>
        <div className="hero-caption"><span>01</span> ferroLink — Le ferroviaire en mouvement</div>
      </section>

      <section className="intro section page-width" id="presentation">
        <div className="section-kicker"><span>01</span> Présentation de notre entreprise Avenir Ferro</div>
        <div className="intro-grid">
          <h2>PRÉSENTATION DE NOTRE ENTREPRISE AVENIR FERRO</h2>
          <div className="intro-copy">
            <p className="lead"><strong>Avenir Ferro</strong> est une société de conseil spécialisée dans l’industrie ferroviaire.</p>
            <p>Elle a pour rôle d’accompagner les clients grands comptes et industriels du ferroviaire dans la réalisation de leurs projets d’envergure et innovants allant des études jusqu’à l’industrialisation, la production, l’exploitation et la maintenance. Elle est donc présente sur l’ensemble du cycle du projet, de la définition jusqu’à la livraison.</p>
            <a className="text-link" href="#competences">Lire la suite <span aria-hidden="true">↗</span></a>
          </div>
        </div>
      </section>

      <section className="expertise section" id="competences">
        <div className="page-width">
          <div className="section-heading">
            <div>
              <div className="section-kicker"><span>02</span> Nos principaux domaines de compétences</div>
              <h2>Nos principaux domaines de compétences</h2>
            </div>
          </div>
          <div className="expertise-grid">
            {expertiseAreas.map((area) => <article className="expertise-card" key={area.number}>
              <span className="card-number">{area.number}</span>
              <div className="card-mark" aria-hidden="true"><span className="rail-symbol">✳</span></div>
              <h3>{area.title}</h3>
            </article>)}
          </div>
        </div>
      </section>

      <section className="approach section page-width" id="metiers">
        <div className="approach-heading">
          <div className="section-kicker"><span>03</span> Nos métiers</div>
          <h2>Les métiers sur lesquels nous pouvons accompagner nos clients</h2>
        </div>
        <div className="approach-steps">
          {métiers.map((métier, index) => <article className="approach-step" key={métier}>
            <span className="step-index">{String(index + 1).padStart(2, "0")}</span>
            <h3>{métier}</h3>
          </article>)}
        </div>
      </section>

      <section className="references section" id="references">
        <div className="page-width">
          <div className="references-heading">
            <div>
              <div className="section-kicker"><span>04</span> Ils nous font confiance</div>
              <h2>ILS NOUS FONT CONFIANCE</h2>
            </div>
          </div>
          <div className="partner-grid">
            {partners.map((partner) => <div className="partner" key={partner.alt}><img src={partner.src} alt={partner.alt} loading="lazy" /></div>)}
          </div>
        </div>
      </section>

      <section className="contact section page-width" id="contact">
        <div className="contact-panel">
          <div className="contact-content">
            <div className="section-kicker section-kicker-light"><span>05</span> Confiez nous vos besoins</div>
            <h2>Confiez nous vos besoins</h2>
            <p>Contactez-Nous</p>
            <a className="button button-lime" href="mailto:gregory.aline@avenirferro.com">Contactez-Nous <span aria-hidden="true">↗</span></a>
          </div>
          <div className="contact-orbit" aria-hidden="true"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="orbit-core"><span>FL</span></div><span className="orbit-node" /></div>
        </div>
      </section>

      <section className="section page-width" id="offres-emploi">
        <div className="section-heading">
          <div>
            <div className="section-kicker"><span>06</span> Rejoignez-Nous</div>
            <h2>Rejoignez-Nous</h2>
          </div>
          <p>Consultez les opportunités et prenez contact avec notre équipe.</p>
        </div>
        <div id="rejoignez-nous">
          <a className="button button-lime" href="https://avenirferro.com/offres-demploi/">Offres d'emploi <span aria-hidden="true">↗</span></a>
        </div>
      </section>
    </main>

    <footer className="site-footer">
      <div className="page-width footer-main">
        <a className="footer-brand" href="#accueil" aria-label="ferroLink, retour à l'accueil"><span className="footer-mark" aria-hidden="true">F<span>L</span></span><span className="footer-name">ferro<span>Link</span></span></a>
        <p className="footer-tagline">Une affaire de chemin de fer.</p>
        <nav className="footer-navigation" aria-label="Navigation de pied de page">
          <a href="#presentation">À propos de nous</a><a href="#competences">Nos compétences</a><a href="#offres-emploi">Offres d'emploi</a><a href="#contact">Contactez-nous</a>
        </nav>
        <div className="footer-contact"><span>Appelez-nous aujourd'hui</span><a href="tel:+33633821507">+336-33-82-15-07</a><a href="mailto:gregory.aline@avenirferro.com">Contactez-Nous <span aria-hidden="true">↗</span></a></div>
      </div>
      <div className="page-width footer-bottom"><span>© {new Date().getFullYear()} ferroLink. Tous droits réservés.</span><a href="#accueil">Retour en haut ↑</a></div>
    </footer>
  </>;
}
