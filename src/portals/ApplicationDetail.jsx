import { useState } from "react";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
const statuses = [["RECEIVED", "Reçue"], ["UNDER_REVIEW", "En étude"], ["INTERVIEW", "Entretien"], ["ACCEPTED", "Acceptée"], ["REJECTED", "Refusée"]];

function Fact({ label, children }) {
  return <div><dt>{label}</dt><dd>{children || "—"}</dd></div>;
}

export default function ApplicationDetail({ application, onSave, onDelete, onBack }) {
  const [status, setStatus] = useState(application.status);
  const [note, setNote] = useState(application.reviewerNote || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSaved(false);
    setSaving(true);
    try {
      await onSave(application, { status, reviewerNote: note });
      setSaved(true);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setError("");
    setSaving(true);
    try {
      await onDelete(application);
    } catch (deleteError) {
      setError(deleteError.message);
      setSaving(false);
    }
  };

  return <section className="portal-panel application-detail">
    <div className="portal-panel-heading">
      <div><span className="portal-eyebrow">{application.jobTitle}</span><h3>{application.applicantName}</h3></div>
      <button className="portal-text-button" type="button" onClick={onBack}>← Retour aux candidatures</button>
    </div>
    <dl className="application-detail-facts">
      <Fact label="E-mail"><a href={`mailto:${application.applicantEmail}`}>{application.applicantEmail}</a></Fact>
      <Fact label="Téléphone"><a href={`tel:${application.applicantPhone}`}>{application.applicantPhone}</a></Fact>
      <Fact label="Ville">{application.applicantCity}</Fact>
      <Fact label="Expérience">{application.experience}</Fact>
      <Fact label="Disponibilité">{application.availability}</Fact>
      <Fact label="Reçue le">{new Date(application.createdAt).toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" })}</Fact>
    </dl>
    <h4>Message de motivation</h4>
    <p className="application-detail-message">{application.coverLetter || "Aucun message."}</p>
    <h4>Documents</h4>
    <div className="application-detail-documents">
      <a href={`${API}/api/applications/${application.id}/cv`}>Télécharger le CV</a>
      {application.letterFile ? <a href={`${API}/api/applications/${application.id}/letter`}>Télécharger la lettre</a> : <span className="portal-muted">Pas de lettre jointe</span>}
    </div>
    <form className="job-editor" onSubmit={submit}>
      <label className="site-editor-field"><span>Statut</span>
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          {statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      <label className="site-editor-field"><span>Note interne</span>
        <textarea value={note} onChange={(event) => setNote(event.target.value)} rows="4" maxLength="5000" />
        <small>Visible uniquement par l’équipe de recrutement.</small>
      </label>
      {error && <p className="portal-alert error" role="alert">{error}</p>}
      {saved && <p className="portal-alert success" role="status">Modifications enregistrées.</p>}
      <div className="job-editor-actions"><button className="portal-primary-button" type="submit" disabled={saving}>{saving ? "Enregistrement…" : "Enregistrer"}</button></div>
    </form>
    {onDelete && <div className="portal-delete-zone">
      {confirmingDelete ? <>
        <span>Supprimer définitivement ce dossier et ses documents ?</span>
        <button className="portal-danger-button" type="button" disabled={saving} onClick={remove}>Confirmer la suppression</button>
        <button className="portal-text-button" type="button" onClick={() => setConfirmingDelete(false)}>Annuler</button>
      </> : <button className="portal-danger-button" type="button" onClick={() => setConfirmingDelete(true)}>Supprimer ce dossier</button>}
    </div>}
  </section>;
}
