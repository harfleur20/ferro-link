import { Router } from "express";
import { z } from "zod";
import { accessTokenFilter, createAccessLink } from "./accessTokens.js";
import { prisma } from "./db.js";
import { sendMailSafely, staffRoles } from "./mailer.js";
import { requireAuth, requireSuperAdmin } from "./middleware.js";

export const usersRouter = Router();

const invitationDuration = 7 * 24 * 60 * 60 * 1000;
const publicFields = { id: true, email: true, fullName: true, role: true, isActive: true, createdAt: true };
const invitationInput = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  fullName: z.string().trim().min(2).max(120),
  role: z.enum(staffRoles),
});

// Without SMTP the link is handed to the SuperAdmin, who can pass it on directly.
async function sendInvitation(user) {
  const { url } = await createAccessLink(user.id, invitationDuration, { invitation: true });
  const emailSent = await sendMailSafely({
    to: user.email,
    subject: "Votre accès à l’espace ferroLink",
    text: `Bonjour ${user.fullName},\n\nUn compte a été créé pour vous sur l’espace d’administration ferroLink. Choisissez votre mot de passe avec ce lien (valable 7 jours) :\n${url}\n\nSi vous n’attendiez pas cette invitation, ignorez cet e-mail.\n\nL’équipe ferroLink`,
  });
  return { emailSent, inviteUrl: emailSent ? null : url };
}

usersRouter.use("/users", requireAuth, requireSuperAdmin);

usersRouter.get("/users", async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({ select: { ...publicFields, passwordHash: true }, orderBy: { createdAt: "desc" } });
    res.json({ users: users.map(({ passwordHash, ...user }) => ({ ...user, invitationPending: !passwordHash })) });
  } catch (err) { next(err); }
});

usersRouter.post("/users", async (req, res, next) => {
  try {
    const parsed = invitationInput.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Merci de renseigner un nom, une adresse e-mail valide et un rôle." });
    const existing = await prisma.user.findUnique({ where: { email: parsed.data.email }, select: { id: true } });
    if (existing) return res.status(409).json({ error: "Un compte existe déjà avec cette adresse e-mail." });
    const user = await prisma.user.create({ data: parsed.data, select: publicFields });
    res.status(201).json({ user: { ...user, invitationPending: true }, ...(await sendInvitation(user)) });
  } catch (err) { next(err); }
});

usersRouter.post("/users/:id/invitation", async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id }, select: { ...publicFields, passwordHash: true } });
    if (!user) return res.status(404).json({ error: "Utilisateur introuvable." });
    if (user.passwordHash || !user.isActive) return res.status(400).json({ error: "Ce compte n’attend pas d’invitation." });
    res.json(await sendInvitation(user));
  } catch (err) { next(err); }
});

usersRouter.patch("/users/:id/role", async (req, res, next) => {
  try {
    const { role } = req.body || {};
    if (!staffRoles.includes(role)) return res.status(400).json({ error: "Rôle invalide." });
    if (req.params.id === req.session.user.id && role !== "SUPER_ADMIN") return res.status(400).json({ error: "Vous ne pouvez pas retirer votre propre rôle super administrateur." });
    const result = await prisma.user.updateMany({ where: { id: req.params.id }, data: { role } });
    if (!result.count) return res.status(404).json({ error: "Utilisateur introuvable." });
    res.json({ user: { id: req.params.id, role } });
  } catch (err) { next(err); }
});

usersRouter.patch("/users/:id/active", async (req, res, next) => {
  try {
    const { isActive } = req.body || {};
    if (typeof isActive !== "boolean") return res.status(400).json({ error: "Valeur invalide." });
    if (req.params.id === req.session.user.id) return res.status(400).json({ error: "Vous ne pouvez pas désactiver votre propre compte." });
    const result = await prisma.user.updateMany({ where: { id: req.params.id }, data: { isActive } });
    if (!result.count) return res.status(404).json({ error: "Utilisateur introuvable." });
    if (!isActive) {
      await prisma.session.deleteMany({ where: { OR: [accessTokenFilter(req.params.id), { data: { contains: `"id":"${req.params.id}"` } }] } });
    }
    res.json({ user: { id: req.params.id, isActive } });
  } catch (err) { next(err); }
});
