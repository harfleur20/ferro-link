import "dotenv/config";
import express from "express";
import multer from "multer";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { mkdir, access } from "node:fs/promises";
import { createReadStream } from "node:fs";
import cors from "cors";
import helmet from "helmet";
import session from "express-session";
import { PrismaSessionStore } from "@quixo3/prisma-session-store";
import { prisma } from "./db.js";
import { authRouter } from "./auth.js";
import { requireAuth, requireStaff, requireSuperAdmin } from "./middleware.js";

const app = express();
const uploadDir = path.resolve(process.env.PRIVATE_UPLOAD_DIR || "./private-uploads");
await mkdir(uploadDir, { recursive: true });
const allowedExtensions = new Set([".pdf", ".doc", ".docx"]);
const upload = multer({ storage: multer.diskStorage({ destination: (_req, _file, cb) => cb(null, uploadDir), filename: (_req, file, cb) => cb(null, `${randomUUID()}${path.extname(file.originalname).toLowerCase()}`) }), limits: { fileSize: 10 * 1024 * 1024, files: 2 }, fileFilter: (_req, file, cb) => cb(null, allowedExtensions.has(path.extname(file.originalname).toLowerCase())) });
const port = Number(process.env.PORT || 4000);
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
app.set("trust proxy", 1);
app.use(helmet());
app.use(cors({ origin: frontendUrl, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(session({
  name: "ferrolink.sid",
  secret: process.env.SESSION_SECRET || "dev-only-change-this-secret",
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 7 * 24 * 60 * 60 * 1000 },
  store: new PrismaSessionStore(prisma, { checkPeriod: 2 * 60 * 1000, dbRecordIdIsSessionId: true, dbRecordIdFunction: undefined })
}));
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRouter);

app.get("/api/jobs", async (req, res, next) => {
  try {
    const jobs = await prisma.job.findMany({
      where: req.session?.user?.role && ["RECRUITER","RECRUITMENT_ADMIN","SUPER_ADMIN"].includes(req.session.user.role)
        ? {} : { status: "PUBLISHED" },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }]
    });
    res.json({ jobs });
  } catch (err) { next(err); }
});
app.post("/api/jobs", requireAuth, requireStaff, async (req, res, next) => {
  try {
    const { title, department, location, contractType, description, requirements, status } = req.body || {};
    if (!title?.trim() || !description?.trim()) return res.status(400).json({ error: "Le titre et la description sont obligatoires." });
    const published = status === "PUBLISHED";
    const job = await prisma.job.create({ data: {
      title: title.trim(), department, location, contractType, description: description.trim(), requirements,
      status: published ? "PUBLISHED" : "DRAFT", publishedAt: published ? new Date() : null, createdById: req.session.user.id
    }});
    res.status(201).json({ job });
  } catch (err) { next(err); }
});
app.patch("/api/jobs/:id", requireAuth, requireStaff, async (req, res, next) => {
  try {
    const data = { ...req.body };
    delete data.id; delete data.createdById; delete data.createdAt; delete data.updatedAt;
    if (data.status === "PUBLISHED") data.publishedAt ||= new Date();
    if (data.status === "DRAFT") data.publishedAt = null;
    const job = await prisma.job.update({ where: { id: req.params.id }, data });
    res.json({ job });
  } catch (err) { next(err); }
});
app.delete("/api/jobs/:id", requireAuth, requireStaff, async (req, res, next) => {
  try {
    const job = await prisma.job.update({ where: { id: req.params.id }, data: { status: "CLOSED" } });
    res.json({ job });
  } catch (err) { next(err); }
});
app.post("/api/jobs/:id/applications", upload.fields([{ name: "cv", maxCount: 1 }, { name: "letter", maxCount: 1 }]), async (req, res, next) => {
 try {
  const job = await prisma.job.findFirst({ where: { id: req.params.id, status: "PUBLISHED" } });
  if (!job) return res.status(404).json({ error: "Cette offre n'est pas disponible." });
  const body = req.body || {};
  if (body._honey) return res.status(400).json({ error: "Formulaire invalide." });
  if (!body.name?.trim() || !body.email?.trim() || !body.telephone?.trim() || !body.ville?.trim() || !body.motivation?.trim() || body.consentement !== "Oui" || !req.files?.cv?.[0]) return res.status(400).json({ error: "Merci de renseigner les champs obligatoires, d'accepter le traitement des données et de joindre votre CV." });
  const cv = req.files.cv[0], letter = req.files.letter?.[0], email = String(body.email).trim().toLowerCase();
  if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) return res.status(400).json({ error: "Adresse e-mail invalide." });
  const application = await prisma.application.create({ data: { jobId: job.id, applicantName: String(body.name).trim().slice(0,120), applicantEmail: email, applicantPhone: String(body.telephone).trim().slice(0,30), applicantCity: String(body.ville).trim().slice(0,100), experience: String(body.experience || "").slice(0,100) || null, availability: String(body.disponibilite || "").slice(0,100) || null, coverLetter: String(body.motivation).trim().slice(0,3000), resumeUrl: cv.filename + (letter ? "|" + letter.filename : ""), consentAt: new Date() }, include: { job: { select: { id: true, title: true, location: true } } } });
  res.status(201).json({ message: "Votre candidature a bien été envoyée.", application: { id: application.id } });
 } catch (err) { next(err); }
});
app.get("/api/applications/:id/cv", requireAuth, requireStaff, async (req, res, next) => {
 try { const application = await prisma.application.findUnique({ where: { id: req.params.id }, select: { resumeUrl: true } }); const filename = application?.resumeUrl?.split("|")[0]; if (!filename || path.basename(filename) !== filename) return res.status(404).json({ error: "CV introuvable." }); const filePath = path.join(uploadDir, filename); try { await access(filePath); } catch { return res.status(404).json({ error: "CV introuvable." }); } res.setHeader("Content-Disposition", `attachment; filename="CV-${req.params.id}${path.extname(filename)}"`); res.setHeader("X-Content-Type-Options", "nosniff"); createReadStream(filePath).pipe(res); } catch (err) { next(err); }
});
app.get("/api/applications", requireAuth, async (req, res, next) => {
  try {
    const isStaff = ["RECRUITER","RECRUITMENT_ADMIN","SUPER_ADMIN"].includes(req.session.user.role);
    const applications = await prisma.application.findMany({
      where: isStaff ? {} : { candidateId: req.session.user.id },
      include: { job: { select: { id: true, title: true, location: true } }, candidate: { select: { id: true, fullName: true, email: true } } },
      orderBy: { createdAt: "desc" }
    });
    res.json({ applications });
  } catch (err) { next(err); }
});
app.patch("/api/applications/:id/status", requireAuth, requireStaff, async (req, res, next) => {
  try {
    const { status, reviewerNote } = req.body || {};
    if (!["RECEIVED","UNDER_REVIEW","INTERVIEW","ACCEPTED","REJECTED"].includes(status)) return res.status(400).json({ error: "Statut invalide." });
    const application = await prisma.application.update({
      where: { id: req.params.id },
      data: { status, reviewerNote, reviewedById: req.session.user.id },
      include: { job: { select: { title: true } } }
    });
    if (application.candidateId) await prisma.notification.create({ data: { userId: application.candidateId, title: "Mise à jour de candidature", message: "Le statut de votre candidature à « " + application.job.title + " » a été actualisé." } });
    res.json({ application });
  } catch (err) { next(err); }
});
app.get("/api/users", requireAuth, requireSuperAdmin, async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({ select: { id: true, email: true, fullName: true, role: true, isActive: true, createdAt: true }, orderBy: { createdAt: "desc" } });
    res.json({ users });
  } catch (err) { next(err); }
});
app.patch("/api/users/:id/role", requireAuth, requireSuperAdmin, async (req, res, next) => {
  try {
    const { role } = req.body || {};
    if (!["CANDIDATE","RECRUITER","RECRUITMENT_ADMIN","SUPER_ADMIN"].includes(role)) return res.status(400).json({ error: "Rôle invalide." });
    if (req.params.id === req.session.user.id && role !== "SUPER_ADMIN") return res.status(400).json({ error: "Vous ne pouvez pas retirer votre propre rôle super administrateur." });
    const user = await prisma.user.update({ where: { id: req.params.id }, data: { role }, select: { id: true, email: true, fullName: true, role: true } });
    res.json({ user });
  } catch (err) { next(err); }
});
app.get("/api/notifications", requireAuth, async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({ where: { userId: req.session.user.id }, orderBy: { createdAt: "desc" }, take: 50 });
    res.json({ notifications });
  } catch (err) { next(err); }
});
app.patch("/api/notifications/:id/read", requireAuth, async (req, res, next) => {
  try {
    const result = await prisma.notification.updateMany({ where: { id: req.params.id, userId: req.session.user.id }, data: { readAt: new Date() } });
    if (!result.count) return res.status(404).json({ error: "Notification introuvable." });
    res.json({ ok: true });
  } catch (err) { next(err); }
});
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Une erreur interne est survenue." });
});
app.listen(port, () => console.log(`Ferro-Link API listening on port ${port}`));
