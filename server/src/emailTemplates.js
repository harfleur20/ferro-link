import { fileURLToPath } from "node:url";
import { getContactEmail, siteUrl } from "./mailer.js";

export const spontaneousTitle = "Candidature spontanée";

const logoPath = fileURLToPath(new URL("./assets/email-logo.png", import.meta.url));
const logoId = "ferrolink-logo";
const colors = { navy: "#17243b", lime: "#9acb36", limeText: "#5f8a17", ink: "#1c2637", muted: "#647083", paper: "#f5f7f3", line: "#e2e7df", footer: "#c9d1dc" };
const font = "'Segoe UI',Helvetica,Arial,sans-serif";

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);

const applicationLabel = (application) => application.jobTitle === spontaneousTitle
  ? "votre candidature spontanée"
  : `votre candidature pour le poste « ${application.jobTitle} »`;

// Wording shown to candidates: every text sent to them lives here.
const messages = {
  RECEIVED: (application) => ({
    subject: "Nous avons bien reçu votre candidature",
    eyebrow: "Candidature reçue",
    title: "Merci pour votre candidature",
    paragraphs: [
      `Nous avons bien reçu ${applicationLabel(application)}.`,
      "Notre équipe va l’étudier et reviendra vers vous si votre profil correspond à nos besoins.",
      "Merci de l’intérêt que vous portez à ferroLink.",
    ],
  }),
  INTERVIEW: (application) => ({
    subject: "Votre candidature ferroLink : proposition d’entretien",
    eyebrow: "Entretien",
    title: "Nous aimerions vous rencontrer",
    paragraphs: [
      `Nous avons étudié ${applicationLabel(application)} avec attention et nous souhaitons échanger avec vous lors d’un entretien.`,
      "Un membre de notre équipe vous contactera prochainement pour convenir d’une date.",
      "Si vos coordonnées ou vos disponibilités ont changé, il vous suffit de répondre à cet e-mail.",
    ],
  }),
  ACCEPTED: (application) => ({
    subject: "Bonne nouvelle concernant votre candidature ferroLink",
    eyebrow: "Candidature retenue",
    title: "Votre candidature est retenue",
    paragraphs: [
      `Nous avons le plaisir de vous annoncer que ${applicationLabel(application)} a été retenue.`,
      "Un membre de notre équipe vous contactera prochainement pour vous présenter les prochaines étapes.",
      "Merci pour la confiance que vous nous accordez.",
    ],
  }),
  REJECTED: (application) => ({
    subject: "Réponse à votre candidature ferroLink",
    eyebrow: "Votre candidature",
    title: "Réponse à votre candidature",
    paragraphs: [
      `Nous vous remercions du temps que vous avez consacré à ${applicationLabel(application)}.`,
      "Après étude attentive de votre dossier, nous ne sommes malheureusement pas en mesure d’y donner une suite favorable.",
      "Nos offres évoluent régulièrement : n’hésitez pas à les consulter et à nous écrire de nouveau. Nous vous souhaitons pleine réussite dans vos recherches.",
    ],
    action: { label: "Voir nos offres", url: siteUrl("/offres-emploi") },
  }),
};

function renderHtml({ name, content, jobTitle, contactEmail }) {
  const paragraph = (text) => `<p style="margin:0 0 16px;font:400 16px/1.6 ${font};color:${colors.ink};">${escapeHtml(text)}</p>`;
  const action = content.action
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;"><tr><td bgcolor="${colors.lime}"><a href="${escapeHtml(content.action.url)}" style="display:inline-block;padding:14px 28px;font:700 15px/1 ${font};color:${colors.navy};text-decoration:none;">${escapeHtml(content.action.label)}</a></td></tr></table>`
    : "";
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${escapeHtml(content.subject)}</title></head>
<body style="margin:0;padding:0;background:${colors.paper};">
<div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(content.paragraphs[0])}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${colors.paper}"><tr><td align="center" style="padding:32px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-top:4px solid ${colors.lime};">
<tr><td style="padding:28px 36px 24px;border-bottom:1px solid ${colors.line};"><img src="cid:${logoId}" width="240" alt="ferroLink" style="display:block;width:240px;max-width:100%;height:auto;border:0;"></td></tr>
<tr><td style="padding:32px 36px 12px;">
<p style="margin:0 0 10px;font:700 12px/1.4 ${font};letter-spacing:1.5px;text-transform:uppercase;color:${colors.limeText};">${escapeHtml(content.eyebrow)}</p>
<h1 style="margin:0 0 24px;font:700 26px/1.25 ${font};color:${colors.navy};">${escapeHtml(content.title)}</h1>
${paragraph(`Bonjour ${name},`)}
${content.paragraphs.map(paragraph).join("\n")}
${action}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;"><tr><td bgcolor="${colors.paper}" style="padding:14px 16px;border-left:3px solid ${colors.lime};font:400 14px/1.5 ${font};color:${colors.muted};">Candidature<br><strong style="color:${colors.navy};">${escapeHtml(jobTitle)}</strong></td></tr></table>
<p style="margin:0 0 24px;font:400 16px/1.6 ${font};color:${colors.ink};">L’équipe ferroLink</p>
</td></tr>
<tr><td bgcolor="${colors.navy}" style="padding:22px 36px;font:400 13px/1.6 ${font};color:${colors.footer};">
<strong style="color:#ffffff;">ferroLink</strong> — Le ferroviaire en mouvement<br>
Une question ? <a href="mailto:${escapeHtml(contactEmail)}" style="color:${colors.lime};">${escapeHtml(contactEmail)}</a><br>
<a href="${escapeHtml(siteUrl("/confidentialite"))}" style="color:${colors.footer};">Politique de confidentialité</a>
</td></tr>
</table></td></tr></table>
</body></html>`;
}

function renderText({ name, content, contactEmail }) {
  const action = content.action ? [`${content.action.label} : ${content.action.url}`] : [];
  return [`Bonjour ${name},`, ...content.paragraphs, ...action, "L’équipe ferroLink", `Une question ? ${contactEmail}`].join("\n\n");
}

export async function candidateEmail(kind, application) {
  const contactEmail = await getContactEmail();
  const content = messages[kind](application);
  const view = { name: application.applicantName, content, jobTitle: application.jobTitle, contactEmail };
  return {
    to: application.applicantEmail,
    replyTo: contactEmail,
    subject: content.subject,
    text: renderText(view),
    html: renderHtml(view),
    attachments: [{ filename: "ferrolink.png", path: logoPath, cid: logoId, contentDisposition: "inline" }],
  };
}
