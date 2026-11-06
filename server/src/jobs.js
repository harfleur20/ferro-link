import { randomBytes } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "./db.js";
import { requireAuth, requireBusinessManager, requireStaff } from "./middleware.js";
import { slugify } from "./slug.js";

export const jobsRouter = Router();

const publicFields = {
  id: true, slug: true, title: true, category: true, location: true, contractType: true, experience: true,
  salary: true, imageUrl: true, imageAlt: true, description: true, missions: true, requirements: true, publishedAt: true,
};
const imagePattern = /^(\/images\/[\w-]+\.(png|jpe?g|webp)|\/api\/site-assets\/[\da-f-]{36}\.(png|jpg|webp))$/i;
const optionalText = (label, max) => z.string()
  .trim()
  .max(max, `${label} : ${max} caractères maximum.`)
  .transform((value) => value || null)
  .nullable()
  .optional();

const jobInput = z.object({
  title: z.string().trim().min(1, "Le titre est obligatoire.").max(180, "Titre : 180 caractères maximum."),
  category: optionalText("Domaine", 120),
  location: optionalText("Lieu", 120),
  contractType: optionalText("Contrat", 60),
  experience: optionalText("Expérience", 60),
  salary: optionalText("Rémunération", 80),
  imageUrl: optionalText("Image", 500).refine((value) => !value || imagePattern.test(value), "L’image doit être importée depuis votre appareil."),
  imageAlt: optionalText("Description de l’image", 300),
  description: z.string().trim().min(1, "La description est obligatoire.").max(1000, "Description : 1000 caractères maximum."),
  missions: z.array(z.string().trim().min(1).max(300, "Chaque mission : 300 caractères maximum.")).max(12, "12 missions maximum.").optional(),
  requirements: optionalText("Profil", 2000),
  status: z.enum(["DRAFT", "PUBLISHED", "CLOSED"]).optional(),
});

const firstIssue = (result) => result.error.issues[0]?.message || "Les informations de l’offre sont invalides.";
const publicationError = (job) => job.status === "PUBLISHED" && (!job.location || !job.contractType)
  ? "Renseignez le lieu et le type de contrat avant de publier l’offre."
  : null;

async function uniqueSlug(title) {
  const slug = slugify(title);
  const existing = await prisma.job.findUnique({ where: { slug }, select: { id: true } });
  return existing ? `${slug}-${randomBytes(3).toString("hex")}` : slug;
}

jobsRouter.get("/jobs", async (_req, res, next) => {
  try {
    const jobs = await prisma.job.findMany({
      where: { status: "PUBLISHED" },
      select: publicFields,
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    });
    res.json({ jobs });
  } catch (err) { next(err); }
});

jobsRouter.get("/jobs/:slug", async (req, res, next) => {
  try {
    const job = await prisma.job.findFirst({ where: { slug: req.params.slug, status: "PUBLISHED" }, select: publicFields });
    if (!job) return res.status(404).json({ error: "Offre introuvable." });
    res.json({ job });
  } catch (err) { next(err); }
});

jobsRouter.get("/staff/jobs", requireAuth, requireStaff, async (_req, res, next) => {
  try {
    const jobs = await prisma.job.findMany({ orderBy: [{ updatedAt: "desc" }] });
    res.json({ jobs });
  } catch (err) { next(err); }
});

jobsRouter.post("/jobs", requireAuth, requireBusinessManager, async (req, res, next) => {
  try {
    const parsed = jobInput.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: firstIssue(parsed) });
    const status = parsed.data.status || "DRAFT";
    const problem = publicationError({ ...parsed.data, status });
    if (problem) return res.status(400).json({ error: problem });
    const job = await prisma.job.create({
      data: {
        ...parsed.data,
        status,
        slug: await uniqueSlug(parsed.data.title),
        publishedAt: status === "PUBLISHED" ? new Date() : null,
        createdById: req.session.user.id,
      },
    });
    res.status(201).json({ job });
  } catch (err) { next(err); }
});

jobsRouter.patch("/jobs/:id", requireAuth, requireBusinessManager, async (req, res, next) => {
  try {
    const parsed = jobInput.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: firstIssue(parsed) });
    const current = await prisma.job.findUnique({ where: { id: req.params.id } });
    if (!current) return res.status(404).json({ error: "Offre introuvable." });
    const problem = publicationError({ ...current, ...parsed.data });
    if (problem) return res.status(400).json({ error: problem });
    const data = { ...parsed.data };
    if (data.status === "PUBLISHED") data.publishedAt = current.publishedAt || new Date();
    if (data.status === "DRAFT") data.publishedAt = null;
    const job = await prisma.job.update({ where: { id: current.id }, data });
    res.json({ job });
  } catch (err) { next(err); }
});

jobsRouter.delete("/jobs/:id", requireAuth, requireBusinessManager, async (req, res, next) => {
  try {
    const result = await prisma.job.updateMany({ where: { id: req.params.id }, data: { status: "CLOSED" } });
    if (!result.count) return res.status(404).json({ error: "Offre introuvable." });
    res.json({ ok: true });
  } catch (err) { next(err); }
});
