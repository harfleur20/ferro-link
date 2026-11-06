import nodemailer from "nodemailer";
import { prisma } from "./db.js";

export const staffRoles = ["RECRUITER", "RECRUITMENT_ADMIN", "SUPER_ADMIN"];

export function getMailTransport() {
  const { SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
  const port = Number(process.env.SMTP_PORT || 587);
  if (!SMTP_HOST || !SMTP_FROM || (!!SMTP_USER !== !!SMTP_PASS) || !Number.isInteger(port) || port < 1 || port > 65535) return null;

  return {
    from: SMTP_FROM,
    transport: nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      secure: process.env.SMTP_SECURE === "true",
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 20000,
      ...(SMTP_USER && SMTP_PASS ? { auth: { user: SMTP_USER, pass: SMTP_PASS } } : {}),
    }),
  };
}

// A mail failure must never make a candidate or a visitor lose their submission.
export async function sendMailSafely(message) {
  const mail = getMailTransport();
  if (!mail) return false;
  try {
    await mail.transport.sendMail({ from: mail.from, ...message });
    return true;
  } catch (err) {
    console.error("Envoi d’e-mail impossible :", err.message);
    return false;
  }
}

export async function getActiveStaff() {
  return prisma.user.findMany({ where: { isActive: true, role: { in: staffRoles } }, select: { id: true, email: true } });
}

export function notificationRecipients(staff) {
  return process.env.NOTIFICATION_EMAIL || staff.map((user) => user.email);
}

export const siteUrl = (path) => new URL(path, process.env.FRONTEND_URL || "http://localhost:5173").href;
export const adminUrl = () => siteUrl("/administration");

export async function getContactEmail() {
  const settings = await prisma.siteSettings.findUnique({ where: { id: "main" }, select: { value: true } });
  return settings?.value?.contact?.emails?.[0] || "contact@ferrolink.fr";
}
