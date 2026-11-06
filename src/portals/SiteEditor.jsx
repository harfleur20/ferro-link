import { useEffect, useRef, useState } from "react";
import { defaultSiteSettings, mergeSiteSettings, resolveSiteAssetUrl } from "../siteSettings.js";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

const sections = [
  { id: "brand", label: "Identité & navigation" },
  { id: "home", label: "Accueil, expertises et métiers" },
  { id: "partners", label: "Partenaires" },
  { id: "about", label: "À propos et valeurs" },
  { id: "contact", label: "Page contact" },
  { id: "callout", label: "Bandeau avant le pied de page" },
  { id: "footer", label: "Pied de page" },
  { id: "theme", label: "Couleurs & typo" },
];

const fontOptions = ["DM Sans", "League Spartan", "Arial", "Georgia", "system-ui"];

function TextField({ label, value, onChange, multiline = false, hint, displayValue = value, maxLength = multiline ? 1200 : 500 }) {
  const Control = multiline ? "textarea" : "input";
  return <label className="site-editor-field">
    <span>{label}</span>
    <Control value={displayValue} onChange={(event) => onChange(event.target.value)} rows={multiline ? 4 : undefined} maxLength={maxLength} />
    {hint && <small>{hint}</small>}
  </label>;
}

function ColorField({ label, value, onChange }) {
  return <label className="site-editor-color">
    <span>{label}</span>
    <input type="color" value={value} onChange={(event) => onChange(event.target.value)} />
    <code>{value}</code>
  </label>;
}

function ImageField({ label, source, onUpload, uploading, saving }) {
  return <label className="site-editor-field">
    <span>{label}</span>
    <input type="file" accept="image/png,image/jpeg,image/webp" disabled={Boolean(uploading) || saving} onChange={onUpload} />
    <small>PNG, JPEG ou WebP · 5 Mo maximum</small>
    <span className="site-editor-image-preview"><img src={resolveSiteAssetUrl(source, API)} alt="" onError={(event) => { event.currentTarget.hidden = true; }} /></span>
  </label>;
}

export default function SiteEditor({ settings, updatedAt, loadError, onSaved }) {
  const [section, setSection] = useState("brand");
  const [draft, setDraft] = useState(() => mergeSiteSettings(settings || defaultSiteSettings));
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState("");
  const [feedback, setFeedback] = useState("");
  const [saveError, setSaveError] = useState("");
  const previewRef = useRef(null);
  const sectionTabRefs = useRef([]);
  const dirty = JSON.stringify(draft) !== JSON.stringify(settings || defaultSiteSettings);
  const previewPath = section === "about" ? "/a-propos" : section === "contact" ? "/contact" : "/";

  const handleSectionTabKeyDown = (event, index) => {
    let nextIndex;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (index + 1) % sections.length;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = (index - 1 + sections.length) % sections.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = sections.length - 1;
    else return;

    event.preventDefault();
    setSection(sections[nextIndex].id);
    sectionTabRefs.current[nextIndex]?.focus();
  };

  useEffect(() => {
    previewRef.current?.contentWindow?.postMessage(
      { type: "ferrolink:site-preview", settings: draft },
      window.location.origin,
    );
  }, [draft, section]);

  const update = (group, field, value) => {
    setDraft((current) => ({ ...current, [group]: { ...current[group], [field]: value } }));
    setFeedback("");
    setSaveError("");
  };

  const updatePartner = (index, field, value) => {
    setDraft((current) => ({
      ...current,
      home: {
        ...current.home,
        partners: current.home.partners.map((partner, partnerIndex) => partnerIndex === index
          ? { ...partner, [field]: value }
          : partner),
      },
    }));
    setFeedback("");
    setSaveError("");
  };

  const updateListItem = (group, field, index, key, value) => {
    setDraft((current) => ({
      ...current,
      [group]: {
        ...current[group],
        [field]: current[group][field].map((item, itemIndex) => itemIndex === index
          ? typeof item === "string" ? value : { ...item, [key]: value }
          : item),
      },
    }));
    setFeedback("");
    setSaveError("");
  };

  const removeListItem = (group, field, index) => {
    setDraft((current) => ({ ...current, [group]: { ...current[group], [field]: current[group][field].filter((_, itemIndex) => itemIndex !== index) } }));
  };

  const addListItem = (group, field, template) => {
    setDraft((current) => ({ ...current, [group]: { ...current[group], [field]: [...current[group][field], typeof template === "function" ? template() : template] } }));
  };

  const importLogo = async (field, event, onImported = (url) => update("brand", field, url), assetType = "logo") => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    const maxSize = assetType === "logo" ? 256 * 1024 : 5 * 1024 * 1024;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > maxSize) {
      setSaveError(`Choisissez une image PNG, JPEG ou WebP de ${assetType === "logo" ? "256 Ko" : "5 Mo"} maximum.`);
      input.value = "";
      return;
    }
    setUploadingLogo(field);
    setSaveError("");
    setFeedback("");
    try {
      const formData = new FormData();
      formData.append("assetType", assetType);
      formData.append("logo", file);
      const response = await fetch(`${API}/api/site-assets`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Impossible d’importer ce logo.");
      onImported(result.url);
      setFeedback("Logo importé. Enregistrez et publiez pour l’afficher sur le site.");
    } catch (error) {
      setSaveError(error.message || "Impossible d’importer ce logo.");
    } finally {
      setUploadingLogo("");
      input.value = "";
    }
  };

  const imageField = (group, field, label) => <ImageField
    key={`${group}-${field}`}
    label={label}
    source={draft[group][field]}
    uploading={uploadingLogo}
    saving={saving}
    onUpload={(event) => importLogo(`${group}-${field}`, event, (url) => update(group, field, url), "image")}
  />;

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFeedback("");
    setSaveError("");
    try {
      const response = await fetch(`${API}/api/site-settings`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: draft }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Impossible d’enregistrer le site.");
      onSaved(result.settings, result.updatedAt);
      setFeedback("Modifications publiées sur le site.");
    } catch (error) {
      setSaveError(error.message || "Impossible d’enregistrer le site.");
    } finally {
      setSaving(false);
    }
  };

  return <section className="portal-panel site-editor">
    <div className="portal-panel-heading">
      <div><span className="portal-eyebrow">PERSONNALISATION DU SITE PUBLIC</span><h3>Modifier le contenu du site</h3></div>
      {updatedAt && <span className="portal-muted">Publié le {new Date(updatedAt).toLocaleString("fr-FR")}</span>}
    </div>
    <p className="site-editor-intro">Modifiez le site section par section. Les changements enregistrés sont visibles par tous les visiteurs.</p>
    {loadError && <p className="portal-alert error" role="alert">Impossible de charger les réglages enregistrés : {loadError}</p>}

    <div className="site-editor-layout">
      <div className="site-editor-sections" role="tablist" aria-label="Rubriques du contenu du site">
        {sections.map((item, index) => <button
          key={item.id}
          ref={(element) => { sectionTabRefs.current[index] = element; }}
          id={`site-editor-tab-${item.id}`}
          type="button"
          role="tab"
          aria-selected={section === item.id}
          aria-controls={`site-editor-panel-${item.id}`}
          tabIndex={section === item.id ? 0 : -1}
          className={section === item.id ? "selected" : ""}
          onClick={() => setSection(item.id)}
          onKeyDown={(event) => handleSectionTabKeyDown(event, index)}
        >{item.label}</button>)}
      </div>
      <form
        className="site-editor-form"
        id={`site-editor-panel-${section}`}
        role="tabpanel"
        aria-labelledby={`site-editor-tab-${section}`}
        tabIndex={0}
        onSubmit={save}
      >
        {section === "brand" && <>
          <h4>Identité visuelle et navigation</h4>
          {imageField("brand", "headerLogo", "Logo de l’en-tête")}
          {imageField("brand", "footerLogo", "Logo du pied de page")}
          <div className="site-editor-logo-preview">
            {[["En-tête", draft.brand.headerLogo], ["Pied de page", draft.brand.footerLogo]].map(([label, src]) => <div key={`${label}-${src}`}>
              <span>{label}{uploadingLogo === (label === "En-tête" ? "headerLogo" : "footerLogo") ? " · import en cours" : ""}</span><img src={resolveSiteAssetUrl(src, API)} alt={`Aperçu du logo ${label.toLowerCase()}`} onError={(event) => { event.currentTarget.hidden = true; }} />
            </div>)}
          </div>
          <h4>Liens du menu principal</h4>
          <TextField label="Accueil" value={draft.navigation.home} maxLength={80} onChange={(value) => update("navigation", "home", value)} />
          <TextField label="À propos" value={draft.navigation.about} maxLength={80} onChange={(value) => update("navigation", "about", value)} />
          <TextField label="Offres d’emploi" value={draft.navigation.jobs} maxLength={80} onChange={(value) => update("navigation", "jobs", value)} />
          <TextField label="Actualités" value={draft.navigation.news} maxLength={80} onChange={(value) => update("navigation", "news", value)} />
          <TextField label="Contact" value={draft.navigation.contact} maxLength={80} onChange={(value) => update("navigation", "contact", value)} />
          <TextField label="Sous-menu des offres" value={draft.navigation.jobsOffers} maxLength={80} onChange={(value) => update("navigation", "jobsOffers", value)} />
          <TextField label="Lien candidature spontanée" value={draft.navigation.spontaneous} maxLength={80} onChange={(value) => update("navigation", "spontaneous", value)} />
          <TextField label="Bouton du menu" value={draft.navigation.cta} maxLength={80} onChange={(value) => update("navigation", "cta", value)} />
        </>}

        {section === "home" && <>
          <h4>Page d’accueil</h4>
          <label className="site-editor-field"><span>Fond du hero</span><select value={draft.home.heroMediaType} onChange={(event) => update("home", "heroMediaType", event.target.value)}><option value="video">Vidéo ferroviaire</option><option value="image">Image importée</option></select></label>
          {imageField("home", "heroImage", "Image / poster du hero")}
          <TextField label="Accroche du hero" value={draft.home.heroKicker} onChange={(value) => update("home", "heroKicker", value)} />
          <TextField label="Titre principal" value={draft.home.heroTitle} onChange={(value) => update("home", "heroTitle", value)} multiline />
          <TextField label="Texte du bouton principal" value={draft.home.heroCta} onChange={(value) => update("home", "heroCta", value)} />
          <TextField label="Légende du hero" value={draft.home.heroCaption} onChange={(value) => update("home", "heroCaption", value)} />
          {imageField("home", "introImage", "Image de présentation")}
          <TextField label="Description de l’image de présentation" value={draft.home.introImageAlt} onChange={(value) => update("home", "introImageAlt", value)} />
          <TextField label="Légende de l’image de présentation" value={draft.home.introImageCaption} onChange={(value) => update("home", "introImageCaption", value)} />
          <TextField label="Accroche de présentation" value={draft.home.introKicker} onChange={(value) => update("home", "introKicker", value)} />
          <TextField label="Titre de présentation" value={draft.home.introTitle} onChange={(value) => update("home", "introTitle", value)} />
          <TextField label="Présentation courte" value={draft.home.introLead} onChange={(value) => update("home", "introLead", value)} multiline />
          <TextField label="Texte de présentation" value={draft.home.introText} onChange={(value) => update("home", "introText", value)} multiline />
          <TextField label="Lien vers À propos" value={draft.home.introLink} onChange={(value) => update("home", "introLink", value)} />
          <TextField label="Libellé du téléphone" value={draft.home.introPhoneLabel} onChange={(value) => update("home", "introPhoneLabel", value)} />
          <TextField label="Téléphone de présentation" value={draft.home.introPhone} onChange={(value) => update("home", "introPhone", value)} />
          {imageField("home", "homeBandImage", "Image du bandeau de contact de l’accueil")}
          <TextField label="Accroche du bandeau d’accueil" value={draft.home.contactKicker} onChange={(value) => update("home", "contactKicker", value)} />
          <TextField label="Titre de la section expertises" value={draft.home.expertiseTitle} onChange={(value) => update("home", "expertiseTitle", value)} />
          <TextField label="Description de la section expertises" value={draft.home.expertiseText} onChange={(value) => update("home", "expertiseText", value)} multiline />
          {imageField("home", "expertiseImage", "Image des expertises")}
          <TextField label="Description de l’image des expertises" value={draft.home.expertiseImageAlt} onChange={(value) => update("home", "expertiseImageAlt", value)} />
          <TextField label="Repère visuel des expertises" value={draft.home.expertiseKicker} onChange={(value) => update("home", "expertiseKicker", value)} />
          <TextField label="Lien de la section expertises" value={draft.home.expertiseLink} onChange={(value) => update("home", "expertiseLink", value)} />
          <div className="site-editor-list-heading"><h5>Domaines d’expertise</h5><button type="button" onClick={() => addListItem("home", "expertiseAreas", { title: "", detail: "" })} disabled={draft.home.expertiseAreas.length >= 10}>Ajouter une expertise</button></div>
          {draft.home.expertiseAreas.map((area, index) => <article className="site-editor-list-card" key={`expertise-${index}`}>
            <TextField label={`Expertise ${index + 1}`} value={area.title} onChange={(value) => updateListItem("home", "expertiseAreas", index, "title", value)} />
            <TextField label="Description" value={area.detail} onChange={(value) => updateListItem("home", "expertiseAreas", index, "detail", value)} multiline />
            <button type="button" className="site-editor-remove" onClick={() => removeListItem("home", "expertiseAreas", index)} disabled={draft.home.expertiseAreas.length <= 1}>Supprimer cette expertise</button>
          </article>)}
          <TextField label="Titre de la section métiers" value={draft.home.metiersTitle} onChange={(value) => update("home", "metiersTitle", value)} />
          <TextField label="Description de la section métiers" value={draft.home.metiersText} onChange={(value) => update("home", "metiersText", value)} multiline />
          {imageField("home", "metiersImage", "Image des métiers")}
          <TextField label="Description de l’image des métiers" value={draft.home.metiersImageAlt} onChange={(value) => update("home", "metiersImageAlt", value)} />
          <TextField label="Repère visuel des métiers" value={draft.home.metiersKicker} onChange={(value) => update("home", "metiersKicker", value)} />
          <TextField label="Lien de la section métiers" value={draft.home.metiersLink} onChange={(value) => update("home", "metiersLink", value)} />
          <div className="site-editor-list-heading"><h5>Métiers et interventions</h5><button type="button" onClick={() => addListItem("home", "metiers", "")} disabled={draft.home.metiers.length >= 20}>Ajouter un métier</button></div>
          {draft.home.metiers.map((metier, index) => <div className="site-editor-list-row" key={`metier-${index}`}>
            <TextField label={`Métier ${index + 1}`} value={metier} onChange={(value) => updateListItem("home", "metiers", index, "", value)} />
            <button type="button" className="site-editor-remove" onClick={() => removeListItem("home", "metiers", index)} disabled={draft.home.metiers.length <= 1}>Supprimer</button>
          </div>)}
          <TextField label="Titre du bandeau de contact" value={draft.home.contactTitle} onChange={(value) => update("home", "contactTitle", value)} />
          <TextField label="Texte du bouton de contact" value={draft.home.contactCta} onChange={(value) => update("home", "contactCta", value)} />
        </>}

        {section === "partners" && <>
          <h4>Section partenaires</h4>
          <TextField label="Accroche de la section" value={draft.home.partnersKicker} onChange={(value) => update("home", "partnersKicker", value)} />
          <TextField label="Titre de la section" value={draft.home.partnersTitle} onChange={(value) => update("home", "partnersTitle", value)} />
          <p className="site-editor-help">Cette section s’affiche sur la page d’accueil, juste avant le bandeau de contact.</p>
          <div className="site-editor-list-heading"><span /><button type="button" onClick={() => addListItem("home", "partners", { src: "/images/partner-1.png", alt: "Nouveau partenaire" })} disabled={draft.home.partners.length >= 12}>Ajouter un partenaire</button></div>
          <div className="site-editor-partners">
            {draft.home.partners.map((partner, index) => <article className="site-editor-partner" key={`partner-${index}`}>
              <h5>Partenaire {index + 1}</h5>
              <TextField label="Nom du partenaire" value={partner.alt} maxLength={120} onChange={(value) => updatePartner(index, "alt", value)} />
              <label className="site-editor-field">Importer le logo de {partner.alt || `partenaire ${index + 1}`}
                <input type="file" accept="image/png,image/jpeg,image/webp" disabled={Boolean(uploadingLogo) || saving} onChange={(event) => importLogo(`partner-${index}`, event, (url) => updatePartner(index, "src", url))} />
                <small>PNG, JPEG ou WebP · 256 Ko maximum</small>
              </label>
              <div className="site-editor-partner-preview"><img src={resolveSiteAssetUrl(partner.src, API)} alt={`Logo ${partner.alt}`} onError={(event) => { event.currentTarget.hidden = true; }} /></div>
              <button type="button" className="site-editor-remove" onClick={() => removeListItem("home", "partners", index)} disabled={draft.home.partners.length <= 1}>Supprimer ce partenaire</button>
            </article>)}
          </div>
        </>}

        {section === "about" && <>
          <h4>Page « À propos »</h4>
          <TextField label="Accroche de la page" value={draft.about.kicker} onChange={(value) => update("about", "kicker", value)} />
          <TextField label="Titre de la page" value={draft.about.title} onChange={(value) => update("about", "title", value)} />
          <TextField label="Description de la page" value={draft.about.description} onChange={(value) => update("about", "description", value)} multiline />
          <TextField label="Accroche de la vision" value={draft.about.visionKicker} onChange={(value) => update("about", "visionKicker", value)} />
          <TextField label="Sur-titre de la vision" value={draft.about.visionOverline} onChange={(value) => update("about", "visionOverline", value)} />
          <TextField label="Titre de la section vision" value={draft.about.visionTitle} onChange={(value) => update("about", "visionTitle", value)} />
          <TextField label="Présentation courte" value={draft.about.visionLead} onChange={(value) => update("about", "visionLead", value)} multiline />
          <TextField label="Texte de la section vision" value={draft.about.visionText} onChange={(value) => update("about", "visionText", value)} multiline />
          {imageField("about", "visionImage", "Image de la vision")}
          <TextField label="Description de l’image de la vision" value={draft.about.visionImageAlt} onChange={(value) => update("about", "visionImageAlt", value)} />
          <TextField label="Légende de l’image de la vision" value={draft.about.visionCaption} onChange={(value) => update("about", "visionCaption", value)} />
          <TextField label="Lien vers les expertises" value={draft.about.visionLink} onChange={(value) => update("about", "visionLink", value)} />
          <h4>Galerie « Le ferroviaire en mouvement »</h4>
          <TextField label="Accroche de la galerie" value={draft.about.galleryKicker} onChange={(value) => update("about", "galleryKicker", value)} />
          <TextField label="Titre de la galerie" value={draft.about.galleryTitle} onChange={(value) => update("about", "galleryTitle", value)} />
          <TextField label="Description de la galerie" value={draft.about.galleryDescription} onChange={(value) => update("about", "galleryDescription", value)} multiline />
          <div className="site-editor-list-heading"><span /><button type="button" onClick={() => addListItem("about", "gallery", { image: "/images/hero-video-poster.jpg", alt: "", label: "", title: "" })} disabled={draft.about.gallery.length >= 8}>Ajouter une photo</button></div>
          {draft.about.gallery.map((item, index) => <article className="site-editor-list-card" key={`gallery-${index}`}>
            <ImageField
              label={`Importer la photo ${index + 1}`}
              source={item.image}
              uploading={uploadingLogo}
              saving={saving}
              onUpload={(event) => importLogo(`gallery-${index}`, event, (url) => updateListItem("about", "gallery", index, "image", url), "image")}
            />
            <TextField label="Description de la photo" value={item.alt} maxLength={300} onChange={(value) => updateListItem("about", "gallery", index, "alt", value)} />
            <TextField label="Libellé" value={item.label} maxLength={120} onChange={(value) => updateListItem("about", "gallery", index, "label", value)} />
            <TextField label="Titre affiché" value={item.title} maxLength={180} onChange={(value) => updateListItem("about", "gallery", index, "title", value)} />
            <button type="button" className="site-editor-remove" onClick={() => removeListItem("about", "gallery", index)} disabled={draft.about.gallery.length <= 1}>Supprimer cette photo</button>
          </article>)}
          <h4>Section « Nos valeurs »</h4>
          <TextField label="Accroche de la section" value={draft.about.valuesKicker} onChange={(value) => update("about", "valuesKicker", value)} />
          <TextField label="Titre de la section" value={draft.about.valuesTitle} onChange={(value) => update("about", "valuesTitle", value)} />
          <TextField label="Texte de présentation" value={draft.about.valuesDescription} onChange={(value) => update("about", "valuesDescription", value)} multiline />
          <div className="site-editor-list-heading"><span /><button type="button" onClick={() => addListItem("about", "values", { title: "", detail: "", label: "" })} disabled={draft.about.values.length >= 8}>Ajouter une valeur</button></div>
          {draft.about.values.map((item, index) => <article className="site-editor-list-card" key={`value-${index}`}>
            <TextField label={`Valeur ${index + 1}`} value={item.title} onChange={(value) => updateListItem("about", "values", index, "title", value)} />
            <TextField label="Description" value={item.detail} onChange={(value) => updateListItem("about", "values", index, "detail", value)} multiline />
            <TextField label="Libellé court" value={item.label} onChange={(value) => updateListItem("about", "values", index, "label", value)} />
            <button type="button" className="site-editor-remove" onClick={() => removeListItem("about", "values", index)} disabled={draft.about.values.length <= 1}>Supprimer cette valeur</button>
          </article>)}
        </>}

        {section === "footer" && <>
          <h4>Pied de page</h4>
          <TextField label="Signature" value={draft.footer.tagline} onChange={(value) => update("footer", "tagline", value)} />
          <TextField label="Texte de présentation" value={draft.footer.description} onChange={(value) => update("footer", "description", value)} multiline />
          <TextField label="Titre de la colonne navigation" value={draft.footer.exploreTitle} onChange={(value) => update("footer", "exploreTitle", value)} />
          <TextField label="Titre de la colonne expertises" value={draft.footer.expertiseTitle} onChange={(value) => update("footer", "expertiseTitle", value)} />
          <TextField label="Titre de la colonne contact" value={draft.footer.contactTitle} onChange={(value) => update("footer", "contactTitle", value)} />
          <TextField label="Texte de la colonne contact" value={draft.footer.contactDescription} onChange={(value) => update("footer", "contactDescription", value)} multiline />
          <div className="site-editor-list-heading"><h5>Téléphones</h5><button type="button" onClick={() => addListItem("footer", "phones", "")} disabled={draft.footer.phones.length >= 5}>Ajouter un téléphone</button></div>
          {draft.footer.phones.map((phone, index) => <div className="site-editor-list-row" key={`footer-phone-${index}`}>
            <TextField label={`Téléphone ${index + 1}`} value={phone} maxLength={40} onChange={(value) => updateListItem("footer", "phones", index, "", value)} />
            <button type="button" className="site-editor-remove" onClick={() => removeListItem("footer", "phones", index)} disabled={draft.footer.phones.length <= 1}>Supprimer</button>
          </div>)}
          <TextField label="Bouton de contact" value={draft.footer.contactCta} onChange={(value) => update("footer", "contactCta", value)} />
          <div className="site-editor-list-heading"><h5>Réseaux sociaux</h5><button type="button" onClick={() => addListItem("footer", "socials", { name: "", url: "https://" })} disabled={draft.footer.socials.length >= 8}>Ajouter un réseau</button></div>
          {draft.footer.socials.map((social, index) => <article className="site-editor-list-card site-editor-social-fields" key={`social-${index}`}>
            <TextField label="Nom du réseau" value={social.name} onChange={(value) => updateListItem("footer", "socials", index, "name", value)} />
            <TextField label="Lien HTTPS" value={social.url} onChange={(value) => updateListItem("footer", "socials", index, "url", value)} />
            <button type="button" className="site-editor-remove" onClick={() => removeListItem("footer", "socials", index)} disabled={draft.footer.socials.length <= 1}>Supprimer ce réseau</button>
          </article>)}
          <TextField label="Mention de copyright" value={draft.footer.copyright} onChange={(value) => update("footer", "copyright", value)} />
          <TextField label="Signature de bas de page" value={draft.footer.signature} onChange={(value) => update("footer", "signature", value)} />
          <TextField label="Lien de retour en haut" value={draft.footer.backToTop} onChange={(value) => update("footer", "backToTop", value)} />
        </>}

        {section === "callout" && <>
          <h4>Bandeau avant le pied de page</h4>
          <TextField label="Accroche" value={draft.callout.kicker} onChange={(value) => update("callout", "kicker", value)} />
          <TextField label="Titre" value={draft.callout.title} onChange={(value) => update("callout", "title", value)} />
          <TextField label="Texte" value={draft.callout.description} onChange={(value) => update("callout", "description", value)} multiline maxLength={500} />
          <TextField label="Texte du bouton" value={draft.callout.button} onChange={(value) => update("callout", "button", value)} />
          {imageField("callout", "backgroundImage", "Image d’arrière-plan du bandeau")}
          <p className="site-editor-help">Ce bandeau de contact s’affiche avant le pied de page sur les différentes pages du site.</p>
        </>}

        {section === "contact" && <>
          <h4>Page contact</h4>
          <TextField label="Accroche de la page" value={draft.contact.kicker} onChange={(value) => update("contact", "kicker", value)} />
          <TextField label="Titre de la page" value={draft.contact.title} onChange={(value) => update("contact", "title", value)} />
          <TextField label="Description de la page" value={draft.contact.description} onChange={(value) => update("contact", "description", value)} multiline />
          <TextField label="Titre des coordonnées" value={draft.contact.infoTitle} onChange={(value) => update("contact", "infoTitle", value)} />
          <TextField label="Titre du bloc coordonnées" value={draft.contact.infoHeading} onChange={(value) => update("contact", "infoHeading", value)} />
          <TextField label="Libellé téléphones" value={draft.contact.phoneLabel} onChange={(value) => update("contact", "phoneLabel", value)} />
          {draft.contact.phones.map((phone, index) => <div className="site-editor-list-row" key={`contact-phone-${index}`}>
            <TextField label={`Téléphone affiché ${index + 1}`} value={phone} maxLength={40} onChange={(value) => updateListItem("contact", "phones", index, "", value)} />
            <TextField label="Lien tel:" value={draft.contact.phoneLinks[index]} maxLength={40} onChange={(value) => updateListItem("contact", "phoneLinks", index, "", value)} />
            <button type="button" className="site-editor-remove" onClick={() => setDraft((current) => ({ ...current, contact: { ...current.contact, phones: current.contact.phones.filter((_, itemIndex) => itemIndex !== index), phoneLinks: current.contact.phoneLinks.filter((_, itemIndex) => itemIndex !== index) } }))} disabled={draft.contact.phones.length <= 1}>Supprimer</button>
          </div>)}
          <button type="button" className="site-editor-add-button" onClick={() => setDraft((current) => ({ ...current, contact: { ...current.contact, phones: [...current.contact.phones, ""], phoneLinks: [...current.contact.phoneLinks, ""] } }))} disabled={draft.contact.phones.length >= 5}>Ajouter un téléphone</button>
          <TextField label="Libellé e-mail" value={draft.contact.emailLabel} onChange={(value) => update("contact", "emailLabel", value)} />
          <div className="site-editor-list-heading"><h5>Adresses e-mail affichées</h5><button type="button" onClick={() => addListItem("contact", "emails", "")} disabled={draft.contact.emails.length >= 5}>Ajouter un e-mail</button></div>
          {draft.contact.emails.map((email, index) => <div className="site-editor-list-row" key={`contact-email-${index}`}>
            <TextField label={`E-mail ${index + 1}`} value={email} maxLength={160} onChange={(value) => updateListItem("contact", "emails", index, "", value)} />
            <button type="button" className="site-editor-remove" onClick={() => removeListItem("contact", "emails", index)} disabled={draft.contact.emails.length <= 1}>Supprimer</button>
          </div>)}
          <TextField label="Libellé adresse" value={draft.contact.addressLabel} onChange={(value) => update("contact", "addressLabel", value)} />
          <div className="site-editor-list-heading"><h5>Adresse postale</h5><button type="button" onClick={() => addListItem("contact", "addressLines", "")} disabled={draft.contact.addressLines.length >= 5}>Ajouter une ligne</button></div>
          {draft.contact.addressLines.map((line, index) => <div className="site-editor-list-row" key={`address-${index}`}>
            <TextField label={`Ligne ${index + 1}`} value={line} maxLength={180} onChange={(value) => updateListItem("contact", "addressLines", index, "", value)} />
            <button type="button" className="site-editor-remove" onClick={() => removeListItem("contact", "addressLines", index)} disabled={draft.contact.addressLines.length <= 1}>Supprimer</button>
          </div>)}
          <TextField label="Libellé réseaux sociaux" value={draft.contact.socialsLabel} onChange={(value) => update("contact", "socialsLabel", value)} />
          <TextField label="Nom du réseau social" value={draft.contact.socialName} onChange={(value) => update("contact", "socialName", value)} />
          <TextField label="Lien HTTPS" value={draft.contact.socialUrl} onChange={(value) => update("contact", "socialUrl", value)} />
          <h4>Formulaire de contact</h4>
          <TextField label="Accroche du formulaire" value={draft.contact.formKicker} onChange={(value) => update("contact", "formKicker", value)} />
          <TextField label="Titre du formulaire" value={draft.contact.formTitle} onChange={(value) => update("contact", "formTitle", value)} />
          <TextField label="Libellé du champ nom" value={draft.contact.nameLabel} onChange={(value) => update("contact", "nameLabel", value)} />
          <TextField label="Libellé du champ e-mail" value={draft.contact.emailFieldLabel} onChange={(value) => update("contact", "emailFieldLabel", value)} />
          <TextField label="Libellé du champ sujet" value={draft.contact.subjectLabel} onChange={(value) => update("contact", "subjectLabel", value)} />
          <TextField label="Libellé du champ message" value={draft.contact.messageLabel} onChange={(value) => update("contact", "messageLabel", value)} />
          <TextField label="Libellé du bouton d’envoi" value={draft.contact.submitLabel} onChange={(value) => update("contact", "submitLabel", value)} />
          <TextField label="Message après envoi" value={draft.contact.successText} onChange={(value) => update("contact", "successText", value)} multiline />
          <TextField label="Note de confidentialité" value={draft.contact.privacyText} onChange={(value) => update("contact", "privacyText", value)} multiline />
        </>}

        {section === "theme" && <>
          <h4>Style général</h4>
          <div className="site-editor-colors">
            <ColorField label="Couleur principale" value={draft.theme.primaryColor} onChange={(value) => update("theme", "primaryColor", value)} />
            <ColorField label="Couleur d’accentuation" value={draft.theme.accentColor} onChange={(value) => update("theme", "accentColor", value)} />
          </div>
          <div className="site-editor-fonts">
            {["bodyFont", "headingFont"].map((field) => <label className="site-editor-field" key={field}>
              <span>{field === "bodyFont" ? "Police des textes" : "Police des titres"}</span>
              <select value={draft.theme[field]} onChange={(event) => update("theme", field, event.target.value)}>
                {fontOptions.map((font) => <option key={font} value={font}>{font}</option>)}
              </select>
            </label>)}
          </div>
          <div className="site-editor-fonts">
            <label className="site-editor-field">
              <span>Taille du texte : {draft.theme.bodySize}px</span>
              <input type="range" min="14" max="20" value={draft.theme.bodySize} onChange={(event) => update("theme", "bodySize", Number(event.target.value))} />
            </label>
            <label className="site-editor-field">
              <span>Taille des grands titres : {draft.theme.headingSize}px</span>
              <input type="range" min="32" max="64" value={draft.theme.headingSize} onChange={(event) => update("theme", "headingSize", Number(event.target.value))} />
            </label>
          </div>
        </>}

        <div className="site-editor-actions">
          {feedback && <span className="portal-alert success" role="status">{feedback}</span>}
          {saveError && <span className="portal-alert error" role="alert">{saveError}</span>}
          <button className="portal-primary-button site-editor-save" type="submit" disabled={!dirty || saving || Boolean(uploadingLogo)}>
            {uploadingLogo ? "Import du logo…" : saving ? "Publication…" : "Enregistrer et publier"}
          </button>
        </div>
      </form>

      <aside className="site-editor-preview" aria-label="Aperçu en direct du site">
        <div className="site-editor-preview-heading">
          <div><span className="portal-eyebrow">APERÇU EN DIRECT</span><p>Le site réel · modifié sans publication</p></div>
          <a href={previewPath} target="_blank" rel="noreferrer">Ouvrir dans un nouvel onglet ↗</a>
        </div>
        <iframe
          key={previewPath}
          ref={previewRef}
          className="site-editor-preview-frame"
          src={`${previewPath}?sitePreview=1`}
          title={`Aperçu en direct du site ferroLink — ${section === "about" ? "À propos" : "Accueil"}`}
          onLoad={() => previewRef.current?.contentWindow?.postMessage(
            { type: "ferrolink:site-preview", settings: draft },
            window.location.origin,
          )}
        />
      </aside>
    </div>
  </section>;
}
