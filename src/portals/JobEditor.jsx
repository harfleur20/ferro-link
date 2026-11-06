import { useState } from "react";
import { resolveSiteAssetUrl } from "../siteSettings.js";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
const contractTypes = ["CDI", "CDD", "Mission", "Stage", "Alternance"];
const textFields = ["title", "category", "location", "contractType", "experience", "salary", "imageUrl", "imageAlt", "description", "requirements"];

function Field({ label, hint, children }) {
  return <label className="site-editor-field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}

export default function JobEditor({ job, onSave, onCancel }) {
  const [form, setForm] = useState(() => ({
    ...Object.fromEntries(textFields.map((field) => [field, job?.[field] || ""])),
    missions: (job?.missions || []).join("\n"),
  }));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const published = job?.status === "PUBLISHED";
  const input = (field, props = {}) => <input value={form[field]} onChange={(event) => setForm({ ...form, [field]: event.target.value })} {...props} />;

  const uploadImage = async (event) => {
    const fileInput = event.currentTarget;
    const file = fileInput.files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const data = new FormData();
      data.append("assetType", "image");
      data.append("logo", file);
      const response = await fetch(`${API}/api/site-assets`, { method: "POST", credentials: "include", body: data });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Impossible d’importer cette image.");
      setForm((current) => ({ ...current, imageUrl: result.url }));
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setUploading(false);
      fileInput.value = "";
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      await onSave({
        ...form,
        missions: form.missions.split("\n").map((mission) => mission.trim()).filter(Boolean),
        status: event.nativeEvent.submitter?.value || job?.status || "DRAFT",
      });
    } catch (saveError) {
      setError(saveError.message);
      setSaving(false);
    }
  };

  return <section className="portal-panel">
    <div className="portal-panel-heading">
      <div><span className="portal-eyebrow">EMPLOI & RECRUTEMENT</span><h3>{job ? "Modifier l’offre" : "Nouvelle offre"}</h3></div>
      <button className="portal-text-button" type="button" onClick={onCancel}>← Retour aux offres</button>
    </div>
    <form className="job-editor" onSubmit={submit}>
      <Field label="Intitulé du poste *">{input("title", { required: true, maxLength: 180 })}</Field>
      <div className="job-editor-grid">
        <Field label="Domaine">{input("category", { maxLength: 120, placeholder: "Ex. : Signalisation & CBTC" })}</Field>
        <Field label="Lieu (obligatoire pour publier)">{input("location", { maxLength: 120 })}</Field>
        <Field label="Contrat (obligatoire pour publier)">
          <select value={form.contractType} onChange={(event) => setForm({ ...form, contractType: event.target.value })}>
            <option value="">Sélectionner</option>
            {contractTypes.map((type) => <option key={type}>{type}</option>)}
          </select>
        </Field>
        <Field label="Expérience">{input("experience", { maxLength: 60, placeholder: "Ex. : 3 à 5 ans" })}</Field>
        <Field label="Rémunération">{input("salary", { maxLength: 80, placeholder: "Ex. : Selon profil" })}</Field>
      </div>
      <Field label="Présentation du poste *" hint="Affichée sur la carte de l’offre et en tête de sa page.">
        <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows="4" maxLength="1000" required />
      </Field>
      <Field label="Missions" hint="Une mission par ligne, 12 maximum.">
        <textarea value={form.missions} onChange={(event) => setForm({ ...form, missions: event.target.value })} rows="5" />
      </Field>
      <Field label="Profil recherché">
        <textarea value={form.requirements} onChange={(event) => setForm({ ...form, requirements: event.target.value })} rows="4" maxLength="2000" />
      </Field>
      <div className="job-editor-grid">
        <Field label="Image de l’offre" hint="PNG, JPEG ou WebP · 5 Mo maximum. Sans image, le visuel par défaut est utilisé.">
          <input type="file" accept="image/png,image/jpeg,image/webp" disabled={uploading || saving} onChange={uploadImage} />
          {form.imageUrl && <span className="site-editor-image-preview"><img src={resolveSiteAssetUrl(form.imageUrl, API)} alt="" /></span>}
        </Field>
        <Field label="Description de l’image">{input("imageAlt", { maxLength: 300 })}</Field>
      </div>
      {error && <p className="portal-alert error" role="alert">{error}</p>}
      <div className="job-editor-actions">
        <button className="portal-primary-button" type="submit" value="PUBLISHED" disabled={saving || uploading}>{saving ? "Enregistrement…" : published ? "Enregistrer les modifications" : "Publier l’offre"}</button>
        {!published && <button className="portal-secondary-button" type="submit" value="DRAFT" disabled={saving || uploading}>Enregistrer en brouillon</button>}
      </div>
    </form>
  </section>;
}
