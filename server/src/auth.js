import { Router } from "express";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import { z } from "zod";
import { prisma } from "./db.js";

export const authRouter = Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const credentials = z.object({
  email: z.string().email().max(254).transform(v => v.toLowerCase().trim()),
  password: z.string().min(8).max(128),
});
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/"
};

function issueSession(req, res, user) {
  req.session.user = { id: user.id, role: user.role };
  res.cookie("ferrolink.sid", req.sessionID, cookieOptions);
  return res.json({ user: { id: user.id, email: user.email, fullName: user.fullName, avatarUrl: user.avatarUrl, role: user.role } });
}

authRouter.get("/me", async (req, res) => {
  if (!req.session?.user?.id) return res.status(401).json({ error: "Non connecté." });
  const user = await prisma.user.findUnique({ where: { id: req.session.user.id }, select: { id: true, email: true, fullName: true, avatarUrl: true, role: true, isActive: true } });
  if (!user?.isActive) { req.session.destroy(() => {}); return res.status(401).json({ error: "Compte désactivé." }); }
  res.json({ user });
});

authRouter.post("/register", async (req, res, next) => {
  try {
    const parsed = credentials.extend({ fullName: z.string().trim().min(2).max(100) }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Nom, e-mail valide et mot de passe de 8 caractères minimum requis." });
    const { email, password, fullName } = parsed.data;
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(409).json({ error: "Un compte existe déjà avec cette adresse e-mail." });
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({ data: { email, passwordHash, fullName, role: "CANDIDATE" } });
    req.session.regenerate(err => { if (err) return next(err); issueSession(req, res, user); });
  } catch (err) { next(err); }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const parsed = credentials.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Adresse e-mail ou mot de passe invalide." });
    const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (!user?.passwordHash || !user.isActive || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) return res.status(401).json({ error: "Adresse e-mail ou mot de passe incorrect." });
    req.session.regenerate(err => { if (err) return next(err); issueSession(req, res, user); });
  } catch (err) { next(err); }
});

authRouter.post("/google", async (req, res, next) => {
  try {
    if (!process.env.GOOGLE_CLIENT_ID) return res.status(503).json({ error: "La connexion Google n'est pas configurée côté serveur." });
    const token = z.string().min(1).safeParse(req.body?.credential);
    if (!token.success) return res.status(400).json({ error: "Jeton Google manquant." });
    const ticket = await googleClient.verifyIdToken({ idToken: token.data, audience: process.env.GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    if (!payload?.email || !payload.email_verified) return res.status(401).json({ error: "L'adresse Google doit être vérifiée." });
    const email = payload.email.toLowerCase();
    let user = await prisma.user.findUnique({ where: { email } });
    if (user && !user.isActive) return res.status(403).json({ error: "Ce compte est désactivé." });
    if (user && user.googleId && user.googleId !== payload.sub) return res.status(409).json({ error: "Ce compte est associé à une autre identité Google." });
    if (!user) user = await prisma.user.create({ data: { email, googleId: payload.sub, fullName: payload.name || email.split("@")[0], avatarUrl: payload.picture, role: "CANDIDATE" } });
    else if (!user.googleId) user = await prisma.user.update({ where: { id: user.id }, data: { googleId: payload.sub, avatarUrl: user.avatarUrl || payload.picture } });
    req.session.regenerate(err => { if (err) return next(err); issueSession(req, res, user); });
  } catch (err) { if (err?.name === "LoginTicketError") return res.status(401).json({ error: "Connexion Google invalide ou expirée." }); next(err); }
});

authRouter.post("/logout", (req, res) => {
  req.session.destroy(err => {
    res.clearCookie("ferrolink.sid", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" });
    if (err) return res.status(500).json({ error: "Impossible de fermer la session." });
    res.status(204).end();
  });
});
