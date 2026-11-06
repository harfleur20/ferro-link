import { Router } from "express";
import { prisma } from "./db.js";

export const seoRouter = Router();

const publicPages = ["/", "/a-propos", "/offres-emploi", "/candidature-spontanee", "/actualites", "/contact", "/mentions-legales", "/confidentialite"];
const siteUrl = () => (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/+$/, "");

seoRouter.get("/robots.txt", (_req, res) => {
  res.type("text/plain").send(`User-agent: *\nDisallow: /administration\nDisallow: /acces-equipe\nSitemap: ${siteUrl()}/sitemap.xml\n`);
});

// News pages only hold an extract of third-party articles, so they are left out.
seoRouter.get("/sitemap.xml", async (_req, res, next) => {
  try {
    const jobs = await prisma.job.findMany({ where: { status: "PUBLISHED" }, select: { slug: true } });
    const urls = [...publicPages, ...jobs.map((job) => `/offres-emploi/${job.slug}`)];
    const entries = urls.map((url) => `  <url><loc>${siteUrl()}${url}</loc></url>`).join("\n");
    res.type("application/xml").send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`);
  } catch (err) { next(err); }
});
