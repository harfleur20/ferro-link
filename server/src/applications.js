import { randomUUID } from "node:crypto";
import { access, mkdir, open, unlink } from "node:fs/promises";
import path from "node:path";
import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { prisma } from "./db.js";
import { candidateEmail, spontaneousTitle } from "./emailTemplates.js";
import { applicationLimiter } from "./limits.js";
import { adminUrl, getActiveStaff, notificationRecipients, sendMailSafely } from "./mailer.js";
import { requireAuth, requireBusinessManager, requireStaff } from "./middleware.js";
import { slugify } from "./slug.js";

export const applicationsRouter = Router();

// Moving a file to one of these statuses tells the candidate by e-mail.
const candidateEmailStatuses = new Set(["INTERVIEW", "ACCEPTED", "REJECTED"]);

const uploadDir = path.resolve(process.env.PRIVATE_UPLOAD_DIR || "./private-uploads");
await mkdir(uploadDir, { recursive: true });

const allowedExtensions = new Set([".pdf", ".doc", ".docx"]);
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => cb(null, `${randomUUID()}${path.extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: 10 * 1024 * 1024, files: 2 },
  fileFilter: (_req, file, cb) => allowedExtensions.has(path.extname(file.originalname).toLowerCase())
    ? cb(null, true)
    : cb(new Error("Unsupported file type")),
}).fields([{ name: "cv", maxCount: 1 }, { name: "letter", maxCount: 1 }]);

function receiveFiles(req, res, next) {
  upload(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") return res.status(413).json({ error: "Chaque document doit faire 10 Mo maximum." });
    if (err instanceof multer.MulterError || err.message === "Unsupported file type") return res.status(400).json({ error: "Les documents doivent être au format PDF, DOC ou DOCX." });
    next(err);
  });
}

const signatures = {
  ".pdf": [[0x25, 0x50, 0x44, 0x46]],
  ".doc": [[0xd0, 0xcf, 0x11, 0xe0]],
  ".docx": [[0x50, 0x4b, 0x03, 0x04]],
};

async function hasValidSignature(file) {
  const handle = await open(file.path, "r");
  try {
    const { buffer } = await handle.read(Buffer.alloc(4), 0, 4, 0);
    return signatures[path.extname(file.filename)].some((signature) => signature.every((byte, index) => buffer[index] === byte));
  } finally {
    await handle.close();
  }
}

const removeFiles = (files) => Promise.all(files.map((file) => unlink(file.path).catch(() => {})));

const applicationInput = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().toLowerCase().email().max(254),
  telephone: z.string().trim().min(1).max(30),
  ville: z.string().trim().min(1).max(100),
  motivation: z.string().trim().min(20).max(3000),
  experience: z.string().trim().max(100).optional(),
  disponibilite: z.string().trim().max(100).optional(),
  consentement: z.literal("Oui"),
  jobId: z.string().max(40).optional(),
});

export const newApplicationTitle = "Nouvelle candidature";
const applicationNotice = (application) => `${application.applicantName} : ${application.jobTitle}`;

// Removes everything that identifies the candidate: the file, its documents and the team notifications.
export async function removeApplication(application) {
  await prisma.$transaction([
    prisma.application.delete({ where: { id: application.id } }),
    prisma.notification.deleteMany({ where: { title: newApplicationTitle, message: applicationNotice(application) } }),
  ]);
  const documents = [application.resumeUrl, application.letterFile].filter(Boolean);
  await Promise.all(documents.map((filename) => unlink(path.join(uploadDir, path.basename(filename))).catch((err) => {
    if (err.code !== "ENOENT") console.error("Suppression d’un document impossible :", err.message);
  })));
}

async function notifyNewApplication(application) {
  const staff = await getActiveStaff();
  if (staff.length) {
    await prisma.notification.createMany({
      data: staff.map((user) => ({
        userId: user.id,
        title: newApplicationTitle,
        message: applicationNotice(application),
      })),
    });
  }
  await Promise.all([
    sendMailSafely({
      to: notificationRecipients(staff),
      subject: `Nouvelle candidature : ${application.jobTitle}`,
      text: `Candidat : ${application.applicantName}\nE-mail : ${application.applicantEmail}\nTéléphone : ${application.applicantPhone}\nVille : ${application.applicantCity}\n\nConsultez le dossier complet dans l’espace administration :\n${adminUrl()}`,
    }),
    candidateEmail("RECEIVED", application).then(sendMailSafely),
  ]);
}

applicationsRouter.post("/applications/public", applicationLimiter, receiveFiles, async (req, res, next) => {
  const files = Object.values(req.files || {}).flat();
  const reject = async (error) => {
    await removeFiles(files);
    res.status(400).json({ error });
  };
  try {
    const body = req.body || {};
    if (body._honey) return await reject("Formulaire invalide.");
    const parsed = applicationInput.safeParse(body);
    const cv = req.files?.cv?.[0];
    const letter = req.files?.letter?.[0];
    if (!parsed.success && parsed.error.issues.some((issue) => issue.path[0] === "email")) return await reject("Adresse e-mail invalide.");
    if (!parsed.success || !cv) return await reject("Merci de renseigner les champs obligatoires, d'accepter le traitement des données et de joindre votre CV.");
    for (const file of files) {
      if (!(await hasValidSignature(file))) return await reject("Un document joint est illisible ou ne correspond pas à son format.");
    }
    const { jobId, name, email, telephone, ville, experience, disponibilite, motivation } = parsed.data;
    const job = jobId ? await prisma.job.findFirst({ where: { id: jobId, status: "PUBLISHED" }, select: { id: true, title: true } }) : null;
    if (jobId && !job) return await reject("Cette offre n’est plus disponible.");
    const application = await prisma.application.create({
      data: {
        jobId: job?.id,
        jobTitle: job?.title || spontaneousTitle,
        applicantName: name,
        applicantEmail: email,
        applicantPhone: telephone,
        applicantCity: ville,
        experience: experience || null,
        availability: disponibilite || null,
        coverLetter: motivation,
        resumeUrl: cv.filename,
        letterFile: letter?.filename,
        consentAt: new Date(),
      },
    });
    res.status(201).json({ message: "Votre candidature a bien été envoyée.", application: { id: application.id } });
    notifyNewApplication(application).catch((err) => console.error("Notification de candidature impossible :", err.message));
  } catch (err) {
    await removeFiles(files);
    next(err);
  }
});

const sendDocument = (field, label) => async (req, res, next) => {
  try {
    const application = await prisma.application.findUnique({ where: { id: req.params.id }, select: { [field]: true, applicantName: true } });
    const filename = application?.[field];
    if (!filename || path.basename(filename) !== filename) return res.status(404).json({ error: "Document introuvable." });
    const filePath = path.join(uploadDir, filename);
    try { await access(filePath); } catch { return res.status(404).json({ error: "Document introuvable." }); }
    res.download(filePath, `${label}-${slugify(application.applicantName, "candidat")}${path.extname(filename)}`, { dotfiles: "allow" });
  } catch (err) { next(err); }
};

applicationsRouter.get("/applications/:id/cv", requireAuth, requireStaff, sendDocument("resumeUrl", "CV"));
applicationsRouter.get("/applications/:id/letter", requireAuth, requireStaff, sendDocument("letterFile", "Lettre"));

applicationsRouter.get("/applications", requireAuth, requireStaff, async (_req, res, next) => {
  try {
    const applications = await prisma.application.findMany({
      include: { job: { select: { id: true, title: true, location: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json({ applications });
  } catch (err) { next(err); }
});

applicationsRouter.delete("/applications/:id", requireAuth, requireBusinessManager, async (req, res, next) => {
  try {
    const application = await prisma.application.findUnique({ where: { id: req.params.id } });
    if (!application) return res.status(404).json({ error: "Candidature introuvable." });
    await removeApplication(application);
    res.status(204).end();
  } catch (err) { next(err); }
});

applicationsRouter.patch("/applications/:id/status", requireAuth, requireStaff, async (req, res, next) => {
  try {
    const { status, reviewerNote } = req.body || {};
    if (!["RECEIVED", "UNDER_REVIEW", "INTERVIEW", "ACCEPTED", "REJECTED"].includes(status)) return res.status(400).json({ error: "Statut invalide." });
    if (reviewerNote !== undefined && (typeof reviewerNote !== "string" || reviewerNote.length > 5000)) return res.status(400).json({ error: "La note interne est limitée à 5000 caractères." });
    const data = { status, reviewedById: req.session.user.id };
    if (reviewerNote !== undefined) data.reviewerNote = reviewerNote.trim() || null;
    const current = await prisma.application.findUnique({ where: { id: req.params.id }, select: { status: true } });
    if (!current) return res.status(404).json({ error: "Candidature introuvable." });
    // Of two simultaneous changes only one succeeds, so the candidate receives a single e-mail.
    const result = await prisma.application.updateMany({ where: { id: req.params.id, status: current.status }, data });
    if (!result.count) return res.status(409).json({ error: "Cette candidature vient d’être modifiée. Rechargez la page." });
    const application = await prisma.application.findUnique({ where: { id: req.params.id }, include: { job: { select: { id: true, title: true, location: true } } } });
    if (status === current.status || !candidateEmailStatuses.has(status)) return res.json({ application });
    const emailSent = await sendMailSafely(await candidateEmail(status, application));
    res.json({ application, candidateEmail: emailSent ? "sent" : "failed" });
  } catch (err) { next(err); }
});
