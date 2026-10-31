import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "./db.js";

export const authRouter = Router();
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

authRouter.post("/login", async (req, res, next) => {
  try {
    const parsed = credentials.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Adresse e-mail ou mot de passe invalide." });
    const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (!user?.passwordHash || !user.isActive || !["RECRUITER","RECRUITMENT_ADMIN","SUPER_ADMIN"].includes(user.role) || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) return res.status(401).json({ error: "Adresse e-mail ou mot de passe incorrect." });
    req.session.regenerate(err => { if (err) return next(err); issueSession(req, res, user); });
  } catch (err) { next(err); }
});

authRouter.post("/logout", (req, res) => {
  req.session.destroy(err => {
    res.clearCookie("ferrolink.sid", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" });
    if (err) return res.status(500).json({ error: "Impossible de fermer la session." });
    res.status(204).end();
  });
});
