import { createHash } from "node:crypto";
import { Router } from "express";
import Parser from "rss-parser";
import { prisma } from "./db.js";
import { requireAuth, requireBusinessManager } from "./middleware.js";
import { slugify } from "./slug.js";

export const newsRouter = Router();

// Only the title, a short extract, the cover image address and a link are kept: full articles stay on the publisher's site.
const sources = [
  { name: "Rail Passion", url: "https://www.railpassion.fr/feed/", language: "fr" },
  { name: "Railway Gazette", url: "https://www.railwaygazette.com/rss", language: "en" },
];
const excerptLength = 280;
const pageSize = 12;
const refreshInterval = 60 * 60 * 1000;
const minimumRefreshGap = 30 * 60 * 1000;
const imageBatchSize = 5;
const imagesPerRefresh = 30;
const retention = 180 * 24 * 60 * 60 * 1000;
const userAgent = "ferroLink-news/1.0";
const parser = new Parser({ timeout: 10000, headers: { "User-Agent": userAgent } });

const publicFields = { id: true, slug: true, title: true, excerpt: true, imageUrl: true, sourceName: true, sourceUrl: true, language: true, publishedAt: true };

function cleanText(value = "") {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/The post .* appeared first on .*$/is, "")
    .replace(/L[’']article .* est apparu en premier sur .*$/is, "")
    .replace(/\[(…|\.\.\.|&#8230;)\]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function shorten(text) {
  if (text.length <= excerptLength) return text;
  const cut = text.slice(0, excerptLength);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[\s,;:.]+$/, "")}…`;
}

function isWebLink(value) {
  try { return ["http:", "https:"].includes(new URL(value).protocol); }
  catch { return false; }
}

function toArticle(item, source) {
  const title = cleanText(item.title).slice(0, 300);
  const link = item.link?.trim();
  if (!title || !isWebLink(link)) return null;
  const publishedAt = new Date(item.isoDate || item.pubDate || Date.now());
  const hash = createHash("sha1").update(link).digest("hex").slice(0, 6);
  return {
    slug: `${slugify(title, "article")}-${hash}`,
    title,
    excerpt: shorten(cleanText(item.contentSnippet || item.summary || item.content)) || null,
    sourceName: source.name,
    sourceUrl: link,
    language: source.language,
    publishedAt: Number.isNaN(publishedAt.getTime()) ? new Date() : publishedAt,
  };
}

function findCoverImage(html, pageUrl) {
  const tag = html.match(/<meta[^>]+property=["']og:image["'][^>]*>/i)?.[0];
  const content = tag?.match(/content=["']([^"']+)["']/i)?.[1];
  if (!content) return null;
  try {
    const url = new URL(content.replaceAll("&amp;", "&"), pageUrl);
    return url.protocol === "https:" ? url.href : null;
  } catch { return null; }
}

async function fetchCoverImage(pageUrl) {
  try {
    const response = await fetch(pageUrl, { headers: { "User-Agent": userAgent }, signal: AbortSignal.timeout(8000) });
    return response.ok ? findCoverImage(await response.text(), pageUrl) : null;
  } catch { return null; }
}

// Feeds rarely carry an image, so it is read once from each article page.
async function fillMissingImages() {
  const articles = await prisma.newsArticle.findMany({ where: { imageUrl: null }, orderBy: { publishedAt: "desc" }, take: imagesPerRefresh, select: { id: true, sourceUrl: true } });
  for (let index = 0; index < articles.length; index += imageBatchSize) {
    await Promise.all(articles.slice(index, index + imageBatchSize).map(async (article) => {
      const imageUrl = await fetchCoverImage(article.sourceUrl);
      if (imageUrl) await prisma.newsArticle.update({ where: { id: article.id }, data: { imageUrl } });
    }));
  }
}

export async function refreshNews() {
  const failed = [];
  const oldestAllowed = new Date(Date.now() - retention);
  let added = 0;
  for (const source of sources) {
    try {
      const feed = await Promise.race([
        parser.parseURL(source.url),
        new Promise((_, reject) => { setTimeout(() => reject(new Error("Délai dépassé")), 15000).unref(); }),
      ]);
      const data = feed.items.map((item) => toArticle(item, source)).filter((article) => article && article.publishedAt >= oldestAllowed);
      const result = await prisma.newsArticle.createMany({ data, skipDuplicates: true });
      added += result.count;
    } catch (err) {
      failed.push(source.name);
      console.error(`Flux d’actualités indisponible (${source.name}) :`, err.message);
    }
  }
  await prisma.newsArticle.deleteMany({ where: { publishedAt: { lt: oldestAllowed } } });
  await fillMissingImages();
  return { added, failed };
}

export function scheduleNewsRefresh() {
  if (process.env.NEWS_REFRESH === "off") return;
  const run = async () => {
    try {
      const latest = await prisma.newsArticle.findFirst({ orderBy: { fetchedAt: "desc" }, select: { fetchedAt: true } });
      if (latest && Date.now() - latest.fetchedAt.getTime() < minimumRefreshGap) return;
      await refreshNews();
    } catch (err) {
      console.error("Actualisation des actualités impossible :", err.message);
    }
  };
  setTimeout(run, 5000).unref();
  setInterval(run, refreshInterval).unref();
}

newsRouter.get("/news", async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const where = { hidden: false, ...(["fr", "en"].includes(req.query.language) ? { language: req.query.language } : {}) };
    const [articles, total] = await Promise.all([
      prisma.newsArticle.findMany({ where, select: publicFields, orderBy: { publishedAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
      prisma.newsArticle.count({ where }),
    ]);
    res.json({ articles, total, page, pageCount: Math.ceil(total / pageSize) });
  } catch (err) { next(err); }
});

newsRouter.get("/news/:slug", async (req, res, next) => {
  try {
    const article = await prisma.newsArticle.findFirst({ where: { slug: req.params.slug, hidden: false }, select: publicFields });
    if (!article) return res.status(404).json({ error: "Article introuvable." });
    res.json({ article });
  } catch (err) { next(err); }
});

newsRouter.get("/staff/news", requireAuth, requireBusinessManager, async (_req, res, next) => {
  try {
    const articles = await prisma.newsArticle.findMany({ orderBy: { publishedAt: "desc" }, take: 100 });
    res.json({ articles });
  } catch (err) { next(err); }
});

newsRouter.post("/staff/news/refresh", requireAuth, requireBusinessManager, async (_req, res, next) => {
  try {
    res.json(await refreshNews());
  } catch (err) { next(err); }
});

newsRouter.patch("/staff/news/:id", requireAuth, requireBusinessManager, async (req, res, next) => {
  try {
    if (typeof req.body?.hidden !== "boolean") return res.status(400).json({ error: "Valeur invalide." });
    const result = await prisma.newsArticle.updateMany({ where: { id: req.params.id }, data: { hidden: req.body.hidden } });
    if (!result.count) return res.status(404).json({ error: "Article introuvable." });
    res.json({ ok: true });
  } catch (err) { next(err); }
});
