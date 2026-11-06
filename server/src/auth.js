import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { accessTokenFilter, accessTokenSessionId, createAccessLink } from "./accessTokens.js";
import { prisma } from "./db.js";
import { loginLimiter, passwordResetLimiter } from "./limits.js";
import { getMailTransport, staffRoles } from "./mailer.js";

// A site served over plain HTTP, such as a temporary Coolify address, could never send a Secure cookie back.
export const secureCookies = process.env.COOKIE_SECURE
  ? process.env.COOKIE_SECURE === "true"
  : process.env.NODE_ENV === "production" && !process.env.FRONTEND_URL?.startsWith("http://");

export const authRouter = Router();
const credentials = z.object({
  email: z.string().email().max(254).transform(v => v.toLowerCase().trim()),
  password: z.string().min(8).max(128),
  rememberMe: z.boolean().optional().default(false),
});
const emailInput = z.object({
  email: z.string().email().max(254).transform(v => v.toLowerCase().trim()),
});
const passwordResetInput = z.object({
  token: z.string().min(32).max(256),
  password: z.string().min(8).max(128),
});
const rememberSessionDuration = 30 * 24 * 60 * 60 * 1000;
const resetTokenDuration = 30 * 60 * 1000;
const resetRequestCooldown = 60 * 1000;
const resetRequestMessage = "Si cette adresse correspond à un compte éligible, un lien de réinitialisation va être envoyé.";

function issueSession(req, res, user, rememberMe) {
  req.session.cookie.maxAge = rememberMe ? rememberSessionDuration : null;
  req.session.user = { id: user.id, role: user.role };
  return res.json({ user: { id: user.id, email: user.email, fullName: user.fullName, avatarUrl: user.avatarUrl, role: user.role } });
}

authRouter.get("/me", async (req, res) => {
  if (!req.session?.user?.id) return res.status(401).json({ error: "Non connecté." });
  const user = await prisma.user.findUnique({ where: { id: req.session.user.id }, select: { id: true, email: true, fullName: true, avatarUrl: true, role: true, isActive: true } });
  if (!user?.isActive) { req.session.destroy(() => {}); return res.status(401).json({ error: "Compte désactivé." }); }
  res.json({ user });
});

authRouter.post("/login", loginLimiter, async (req, res, next) => {
  try {
    const parsed = credentials.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Adresse e-mail ou mot de passe invalide." });
    const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (!user?.passwordHash || !user.isActive || !staffRoles.includes(user.role) || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) return res.status(401).json({ error: "Adresse e-mail ou mot de passe incorrect." });
    req.session.regenerate(err => { if (err) return next(err); issueSession(req, res, user, parsed.data.rememberMe); });
  } catch (err) { next(err); }
});

authRouter.post("/forgot-password", passwordResetLimiter, async (req, res, next) => {
  try {
    const parsed = emailInput.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Adresse e-mail invalide." });

    const mail = getMailTransport();
    if (!mail) return res.status(503).json({ error: "La réinitialisation des mots de passe n’est pas encore configurée." });

    const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (!user?.isActive || !user.passwordHash || !staffRoles.includes(user.role)) {
      return res.json({ message: resetRequestMessage });
    }

    const previousToken = await prisma.session.findFirst({
      where: { ...accessTokenFilter(user.id), expiresAt: { gt: new Date() } },
      select: { expiresAt: true },
    });
    if (previousToken && Date.now() - (previousToken.expiresAt.getTime() - resetTokenDuration) < resetRequestCooldown) {
      return res.json({ message: resetRequestMessage });
    }

    const { url: resetUrl, sessionId } = await createAccessLink(user.id, resetTokenDuration);
    try {
      await mail.transport.sendMail({
        from: mail.from,
        to: user.email,
        subject: "Réinitialisation de votre mot de passe ferroLink",
        text: `Bonjour ${user.fullName},\n\nUtilisez ce lien pour choisir un nouveau mot de passe (valable 30 minutes) :\n${resetUrl}\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.`,
        html: `<p>Bonjour ${user.fullName.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char])},</p><p>Utilisez ce lien pour choisir un nouveau mot de passe. Il est valable 30 minutes.</p><p><a href="${resetUrl}">Réinitialiser mon mot de passe</a></p><p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.</p>`,
      });
    } catch (err) {
      await prisma.session.deleteMany({ where: { sid: sessionId } });
      return next(err);
    }

    res.json({ message: resetRequestMessage });
  } catch (err) { next(err); }
});

authRouter.post("/reset-password", async (req, res, next) => {
  try {
    const parsed = passwordResetInput.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Le lien ou le nouveau mot de passe est invalide." });

    const sessionId = accessTokenSessionId(parsed.data.token);
    const resetToken = await prisma.session.findUnique({ where: { sid: sessionId } });
    if (!resetToken || resetToken.expiresAt <= new Date()) {
      if (resetToken) await prisma.session.delete({ where: { sid: sessionId } });
      return res.status(400).json({ error: "Ce lien de réinitialisation est invalide ou expiré." });
    }

    const resetData = JSON.parse(resetToken.data);
    if (typeof resetData.userId !== "string") {
      await prisma.session.delete({ where: { sid: sessionId } });
      return res.status(400).json({ error: "Ce lien de réinitialisation est invalide ou expiré." });
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    const wasReset = await prisma.$transaction(async tx => {
      const currentToken = await tx.session.findUnique({ where: { sid: sessionId } });
      if (!currentToken || currentToken.expiresAt <= new Date() || currentToken.data !== resetToken.data) return false;
      await tx.user.update({ where: { id: resetData.userId }, data: { passwordHash } });
      await tx.session.deleteMany({
        where: {
          OR: [
            { sid: sessionId },
            { data: { contains: `"id":"${resetData.userId}"` } },
          ],
        },
      });
      return true;
    });
    if (!wasReset) return res.status(400).json({ error: "Ce lien de réinitialisation est invalide ou expiré." });
    res.json({ message: "Mot de passe modifié." });
  } catch (err) { next(err); }
});

authRouter.post("/logout", (req, res) => {
  req.session.destroy(err => {
    res.clearCookie("ferrolink.sid", { httpOnly: true, sameSite: "lax", secure: secureCookies, path: "/" });
    if (err) return res.status(500).json({ error: "Impossible de fermer la session." });
    res.status(204).end();
  });
});
