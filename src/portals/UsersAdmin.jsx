import { useRef, useState } from "react";
import { FaCopy } from "react-icons/fa6";
import { toast } from "./toast.jsx";

const staffRoles = [["RECRUITER", "Chargé de recrutement"], ["RECRUITMENT_ADMIN", "Business Manager"], ["SUPER_ADMIN", "SuperAdmin"]];
const emptyInvitation = { fullName: "", email: "", role: "RECRUITER" };

function accountStatus(account) {
  if (!account.isActive) return ["status-rejected", "Désactivé"];
  return account.invitationPending ? ["status-reviewing", "Invitation en attente"] : ["status-accepted", "Actif"];
}

function InvitationLink({ email, url }) {
  const field = useRef(null);

  // Browsers disable the Clipboard API on plain HTTP addresses, such as a temporary Coolify domain.
  const copy = async () => {
    try {
      if (navigator.clipboard) await navigator.clipboard.writeText(url);
      else {
        field.current.select();
        if (!document.execCommand("copy")) throw new Error("copy refused");
      }
      toast.success("Lien d’invitation copié.");
    } catch {
      field.current.select();
      toast.error("Copie impossible : le lien est sélectionné, copiez-le avec Ctrl+C.");
    }
  };

  return <div className="users-invite-link" role="status">
    <p>Aucun e-mail n’a pu être envoyé à {email}. Transmettez-lui ce lien, valable 7 jours :</p>
    <div className="users-invite-copy">
      <input ref={field} readOnly value={url} aria-label="Lien d’invitation" onFocus={(event) => event.target.select()} />
      <button type="button" onClick={copy} aria-label="Copier le lien d’invitation" title="Copier le lien"><FaCopy aria-hidden="true" /></button>
    </div>
  </div>;
}

export default function UsersAdmin({ api, currentUser, users, setUsers }) {
  const [search, setSearch] = useState("");
  const [invitation, setInvitation] = useState(emptyInvitation);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const filteredUsers = users.filter((account) => `${account.fullName} ${account.email}`.toLowerCase().includes(search.toLowerCase()));
  const updateField = (event) => setInvitation((current) => ({ ...current, [event.target.name]: event.target.value }));
  const updateAccount = (id, changes) => setUsers((previous) => previous.map((item) => item.id === id ? { ...item, ...changes } : item));

  const showInvitation = ({ email, emailSent, inviteUrl }) => {
    if (emailSent) {
      toast.success(`Invitation envoyée à ${email}.`);
      return;
    }
    setResult({ email, inviteUrl });
    toast.success("Invitation créée. Copiez le lien pour la transmettre.");
  };

  const invite = async (event) => {
    event.preventDefault();
    setResult(null);
    setSending(true);
    try {
      const { user, emailSent, inviteUrl } = await api("/api/users", { method: "POST", body: JSON.stringify(invitation) });
      setUsers((previous) => [user, ...previous]);
      showInvitation({ email: user.email, emailSent, inviteUrl });
      setInvitation(emptyInvitation);
    } catch (inviteError) {
      toast.error(inviteError.message);
    } finally {
      setSending(false);
    }
  };

  const run = async (action) => {
    setResult(null);
    try {
      await action();
    } catch (actionError) {
      toast.error(actionError.message);
    }
  };

  const resend = (account) => run(async () => {
    const { emailSent, inviteUrl } = await api(`/api/users/${account.id}/invitation`, { method: "POST" });
    showInvitation({ email: account.email, emailSent, inviteUrl });
  });

  const changeRole = (account, role) => run(async () => {
    await api(`/api/users/${account.id}/role`, { method: "PATCH", body: JSON.stringify({ role }) });
    updateAccount(account.id, { role });
    toast.success(`Rôle de ${account.fullName} mis à jour.`);
  });

  const setActive = (account, isActive) => run(async () => {
    await api(`/api/users/${account.id}/active`, { method: "PATCH", body: JSON.stringify({ isActive }) });
    updateAccount(account.id, { isActive });
    toast.success(`Compte de ${account.fullName} ${isActive ? "réactivé" : "désactivé"}.`);
  });

  return <section className="portal-panel">
    <div className="portal-panel-heading">
      <div><span className="portal-eyebrow">ACCÈS À LA PLATEFORME</span><h3>Utilisateurs & rôles</h3></div>
      <span className="portal-muted">{users.length} compte{users.length > 1 ? "s" : ""}</span>
    </div>

    <form className="job-editor users-invite" onSubmit={invite}>
      <h4>Inviter un membre de l’équipe</h4>
      <div className="job-editor-grid">
        <label className="site-editor-field"><span>Nom complet</span><input name="fullName" value={invitation.fullName} onChange={updateField} required minLength="2" maxLength="120" /></label>
        <label className="site-editor-field"><span>Adresse e-mail</span><input name="email" type="email" value={invitation.email} onChange={updateField} required maxLength="254" /></label>
        <label className="site-editor-field"><span>Rôle</span>
          <select name="role" value={invitation.role} onChange={updateField}>
            {staffRoles.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
      </div>
      <div className="job-editor-actions"><button className="portal-primary-button" type="submit" disabled={sending}>{sending ? "Envoi…" : "Envoyer l’invitation"}</button></div>
    </form>

    {result && <InvitationLink email={result.email} url={result.inviteUrl} />}

    <label className="portal-search-label">Rechercher un utilisateur
      <input className="portal-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nom ou adresse e-mail" />
    </label>
    {filteredUsers.length === 0 ? <p className="portal-empty">Aucun utilisateur ne correspond à cette recherche.</p> : <div className="portal-table-wrap">
      <table className="portal-table">
        <thead><tr><th>Nom</th><th>E-mail</th><th>Rôle</th><th>Compte</th><th>Créé le</th><th>Actions</th></tr></thead>
        <tbody>{filteredUsers.map((account) => {
          const [statusClass, statusLabel] = accountStatus(account);
          const isSelf = account.id === currentUser.id;
          return <tr key={account.id}>
            <td>{account.fullName}</td><td>{account.email}</td>
            <td><select aria-label={`Rôle de ${account.fullName}`} value={account.role} disabled={isSelf} onChange={(event) => changeRole(account, event.target.value)}>
              {staffRoles.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select></td>
            <td><span className={`portal-status ${statusClass}`}>{statusLabel}</span></td>
            <td>{new Date(account.createdAt).toLocaleDateString("fr-FR", { dateStyle: "medium" })}</td>
            <td><div className="users-actions">
              {account.invitationPending && account.isActive && <button className="portal-text-button" type="button" onClick={() => resend(account)}>Renvoyer l’invitation</button>}
              {!isSelf && <button className="portal-text-button" type="button" onClick={() => setActive(account, !account.isActive)}>{account.isActive ? "Désactiver" : "Réactiver"}</button>}
            </div></td>
          </tr>;
        })}</tbody>
      </table>
    </div>}
  </section>;
}
