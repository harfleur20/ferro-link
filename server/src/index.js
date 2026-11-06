import "dotenv/config";
import express from "express";
import multer from "multer";
import path from "node:path";
import { randomBytes, randomUUID } from "node:crypto";
import { mkdir, access, writeFile } from "node:fs/promises";
import cors from "cors";
import helmet from "helmet";
import session from "express-session";
import { PrismaSessionStore } from "@quixo3/prisma-session-store";
import { prisma } from "./db.js";
import { authRouter } from "./auth.js";
import { jobsRouter } from "./jobs.js";
import { applicationsRouter } from "./applications.js";
import { contactRouter } from "./contact.js";
import { newsRouter, scheduleNewsRefresh } from "./news.js";
import { scheduleDataPurge } from "./retention.js";
import { seoRouter } from "./seo.js";
import { usersRouter } from "./users.js";
import { requireAuth, requireBusinessManager, requireStaff } from "./middleware.js";

// A missing production secret must neither stop the site nor fall back to a value published in the repository.
function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (process.env.NODE_ENV !== "production") return secret || "dev-only-change-this-secret";
  if (secret?.length >= 32 && secret !== "replace-with-a-long-random-secret") return secret;
  console.warn("SESSION_SECRET absent ou trop faible : clé temporaire utilisée, l’équipe sera déconnectée à chaque redémarrage.");
  return randomBytes(32).toString("hex");
}

const app = express();
const siteAssetDir = path.resolve(process.env.PUBLIC_SITE_ASSET_DIR || "./public/site-assets");
await mkdir(siteAssetDir, { recursive: true });
const logoMimeTypes = new Map([["image/png", { extension: "png", signature: bytes => bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) }], ["image/jpeg", { extension: "jpg", signature: bytes => bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 }], ["image/webp", { extension: "webp", signature: bytes => bytes.length >= 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP" }]]);
const logoUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1 }, fileFilter: (_req, file, cb) => logoMimeTypes.has(file.mimetype) ? cb(null, true) : cb(new Error("Unsupported file type")) });
const avatarUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024, files: 1 }, fileFilter: (_req, file, cb) => logoMimeTypes.has(file.mimetype) ? cb(null, true) : cb(new Error("Unsupported file type")) });
const port = Number(process.env.PORT || 4000);
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
app.set("trust proxy", 1);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      "img-src": ["'self'", "data:", "https:"],
      "media-src": ["'self'", "https://videos.pexels.com"],
      "upgrade-insecure-requests": null,
    },
  },
}));
app.use(cors({ origin: frontendUrl, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(session({
  name: "ferrolink.sid",
  secret: getSessionSecret(),
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: { httpOnly: true, secure: process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE === "true" : process.env.NODE_ENV === "production", sameSite: "lax" },
  store: new PrismaSessionStore(prisma, { checkPeriod: 2 * 60 * 1000, dbRecordIdIsSessionId: true, dbRecordIdFunction: undefined })
}));
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRouter);
app.use("/api", jobsRouter);
app.use("/api", applicationsRouter);
app.use("/api", contactRouter);
app.use("/api", newsRouter);
app.use("/api", usersRouter);
app.use(seoRouter);

app.post("/api/site-assets", requireAuth, requireBusinessManager, (req, res, next) => {
  logoUpload.single("logo")(req, res, err => {
    if (!err) return next();
    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ error: "L’image ne doit pas dépasser 5 Mo." });
    }
    if (err instanceof multer.MulterError || err.message === "Unsupported file type") {
      return res.status(400).json({ error: "Format de logo invalide. Choisissez un fichier PNG, JPEG ou WebP." });
    }
    next(err);
  });
}, async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: "Sélectionnez un logo à importer." });
    const assetType = req.body.assetType || "logo";
    if (!["logo", "image"].includes(assetType)) return res.status(400).json({ error: "Le type d’image est invalide." });
    if (assetType === "logo" && file.size > 256 * 1024) return res.status(413).json({ error: "Le logo ne doit pas dépasser 256 Ko." });
    const image = logoMimeTypes.get(file.mimetype);
    if (!image?.signature(file.buffer)) return res.status(400).json({ error: "Le contenu du fichier ne correspond pas à une image PNG, JPEG ou WebP valide." });
    const filename = `${randomUUID()}.${image.extension}`;
    await writeFile(path.join(siteAssetDir, filename), file.buffer, { flag: "wx" });
    res.status(201).json({ url: `/api/site-assets/${filename}` });
  } catch (err) { next(err); }
});
app.get("/api/site-assets/:filename", async (req, res, next) => {
  const { filename } = req.params;
  if (!/^[\da-f-]{36}\.(png|jpg|webp)$/.test(filename)) return res.status(404).json({ error: "Image introuvable." });
  const imagePath = path.join(siteAssetDir, filename);
  try {
    await access(imagePath);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.type(path.extname(filename)).sendFile(imagePath);
  } catch (err) {
    if (err.code === "ENOENT") return res.status(404).json({ error: "Image introuvable." });
    next(err);
  }
});

app.post("/api/profile/avatar", requireAuth, requireStaff, (req, res, next) => {
  avatarUpload.single("avatar")(req, res, err => {
    if (!err) return next();
    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ error: "La photo de profil ne doit pas dépasser 2 Mo." });
    }
    if (err instanceof multer.MulterError || err.message === "Unsupported file type") {
      return res.status(400).json({ error: "Format d’image invalide. Choisissez un fichier PNG, JPEG ou WebP." });
    }
    next(err);
  });
}, async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: "Sélectionnez une photo de profil." });
    const image = logoMimeTypes.get(file.mimetype);
    if (!image?.signature(file.buffer)) return res.status(400).json({ error: "Le contenu du fichier ne correspond pas à une image PNG, JPEG ou WebP valide." });
    const filename = `${randomUUID()}.${image.extension}`;
    await writeFile(path.join(siteAssetDir, filename), file.buffer, { flag: "wx" });
    const user = await prisma.user.update({
      where: { id: req.session.user.id },
      data: { avatarUrl: `/api/site-assets/${filename}` },
      select: { id: true, email: true, fullName: true, avatarUrl: true, role: true },
    });
    res.status(200).json({ user });
  } catch (err) { next(err); }
});

app.get("/api/site-settings", async (_req, res, next) => {
  try {
    const [settings] = await prisma.$queryRaw`SELECT "value", "updatedAt" FROM "SiteSettings" WHERE "id" = 'main'`;
    res.json({ settings: settings?.value || null, updatedAt: settings?.updatedAt || null });
  } catch (err) { next(err); }
});
app.put("/api/site-settings", requireAuth, requireBusinessManager, async (req, res, next) => {
  try {
    const { settings } = req.body || {};
    if (!settings || typeof settings !== "object" || Array.isArray(settings) || Buffer.byteLength(JSON.stringify(settings), "utf8") > 900 * 1024) {
      return res.status(400).json({ error: "Les réglages du site sont invalides ou trop volumineux." });
    }

    const fields = {
      brand: { headerLogo: 500, footerLogo: 500 },
      navigation: { home: 80, about: 80, jobs: 80, news: 80, contact: 80, jobsOffers: 80, spontaneous: 80, cta: 80 },
      home: {
        heroTitle: 180, heroKicker: 120, heroCta: 80, heroCaption: 180, heroImage: 500,
        introKicker: 120, introTitle: 180, introLead: 500, introText: 1200, introImage: 500,
        introImageAlt: 300, introImageCaption: 120, introLink: 80, introPhoneLabel: 80, introPhone: 40,
        homeBandImage: 500, contactKicker: 120, contactTitle: 180, contactCta: 80, partnersKicker: 120,
        expertiseKicker: 80, expertiseTitle: 180, expertiseText: 500, expertiseImage: 500,
        expertiseImageAlt: 300, expertiseLink: 80, metiersKicker: 80, metiersTitle: 180,
        metiersText: 500, metiersImage: 500, metiersImageAlt: 300, metiersLink: 80, partnersTitle: 180,
      },
      about: {
        kicker: 120, title: 180, description: 1200, visionKicker: 120, visionOverline: 120,
        visionTitle: 180, visionLead: 500, visionText: 1200, visionLink: 100,
        visionImage: 500, visionImageAlt: 300, visionCaption: 180, galleryKicker: 120,
        galleryTitle: 180, galleryDescription: 500, valuesKicker: 120, valuesTitle: 180, valuesDescription: 500,
      },
      footer: {
        tagline: 120, description: 1200, exploreTitle: 120, expertiseTitle: 120, contactTitle: 120,
        contactDescription: 500, contactCta: 80, copyright: 120, signature: 180, backToTop: 80,
      },
      legal: { companyName: 180, legalForm: 180, siret: 40, publicationDirector: 180, hostName: 180, hostAddress: 300, privacyEmail: 160 },
      callout: { kicker: 80, title: 180, description: 500, button: 80, backgroundImage: 500 },
      contact: {
        kicker: 120, title: 180, description: 800, infoTitle: 120, infoHeading: 180,
        phoneLabel: 80, emailLabel: 80, addressLabel: 80, socialsLabel: 80, socialName: 80,
        socialUrl: 500, formKicker: 120, formTitle: 180, nameLabel: 80, emailFieldLabel: 80,
        subjectLabel: 80, messageLabel: 80, submitLabel: 80, successText: 500, privacyText: 500,
      },
    };
    const normalized = {};
    for (const [section, allowedFields] of Object.entries(fields)) {
      const values = settings[section];
      if (!values || typeof values !== "object" || Array.isArray(values)) {
        return res.status(400).json({ error: `La section « ${section} » est obligatoire.` });
      }
      normalized[section] = {};
      for (const [field, maxLength] of Object.entries(allowedFields)) {
        const value = values[field];
        if (typeof value !== "string" || !value.trim() || value.length > maxLength) {
          return res.status(400).json({ error: `Le champ « ${field} » est invalide (maximum ${maxLength} caractères).` });
        }
        normalized[section][field] = value.trim();
      }
    }
    if (!["video", "image"].includes(settings.home.heroMediaType)) {
      return res.status(400).json({ error: "Le type de média du hero est invalide." });
    }
    normalized.home.heroMediaType = settings.home.heroMediaType;

    const normalizeTextList = (section, field, { min = 1, max, length = 300 } = {}) => {
      const list = settings[section][field];
      if (!Array.isArray(list) || list.length < min || list.length > max || list.some((item) => typeof item !== "string" || !item.trim() || item.length > length)) {
        throw new Error(`La liste « ${field} » est invalide.`);
      }
      normalized[section][field] = list.map((item) => item.trim());
    };
    const normalizeObjectList = (section, field, keys, { min = 1, max, imageKey } = {}) => {
      const list = settings[section][field];
      if (!Array.isArray(list) || list.length < min || list.length > max) throw new Error(`La liste « ${field} » est invalide.`);
      normalized[section][field] = list.map((item, index) => {
        if (!item || typeof item !== "object" || Array.isArray(item)) throw new Error(`L’élément ${index + 1} de « ${field} » est invalide.`);
        const result = {};
        for (const [key, maxLength] of Object.entries(keys)) {
          if (typeof item[key] !== "string" || !item[key].trim() || item[key].length > maxLength) {
            throw new Error(`Le champ « ${key} » de l’élément ${index + 1} est invalide.`);
          }
          result[key] = item[key].trim();
        }
        if (imageKey && !/^\/images\/[\w-]+\.(png|jpe?g|webp|svg)$/i.test(result[imageKey])
          && !/^\/api\/site-assets\/[\da-f-]{36}\.(png|jpg|webp)$/.test(result[imageKey])) {
          throw new Error(`L’image de l’élément ${index + 1} de « ${field} » est invalide.`);
        }
        return result;
      });
    };

    try {
      normalizeObjectList("home", "partners", { src: 500, alt: 120 }, { max: 12, imageKey: "src" });
      normalizeObjectList("home", "expertiseAreas", { title: 180, detail: 500 }, { max: 10 });
      normalizeTextList("home", "metiers", { max: 20, length: 160 });
      normalizeObjectList("about", "gallery", { image: 500, alt: 300, label: 120, title: 180 }, { max: 8, imageKey: "image" });
      normalizeObjectList("about", "values", { title: 120, detail: 500, label: 120 }, { max: 8 });
      normalizeTextList("footer", "phones", { max: 5, length: 40 });
      normalizeObjectList("footer", "socials", { name: 80, url: 500 }, { max: 8 });
      normalizeTextList("contact", "phones", { max: 5, length: 40 });
      normalizeTextList("contact", "phoneLinks", { max: 5, length: 40 });
      normalizeTextList("contact", "emails", { max: 5, length: 160 });
      normalizeTextList("contact", "addressLines", { max: 5, length: 180 });
    } catch (validationError) {
      return res.status(400).json({ error: validationError.message });
    }
    if (normalized.contact.phones.length !== normalized.contact.phoneLinks.length
      || [...normalized.contact.emails, normalized.legal.privacyEmail].some((email) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
      return res.status(400).json({ error: "Les coordonnées e-mail ou téléphone sont invalides." });
    }

    const imageSources = [
      ...["headerLogo", "footerLogo"].map((field) => normalized.brand[field]),
      ...["heroImage", "introImage", "homeBandImage", "expertiseImage", "metiersImage"].map((field) => normalized.home[field]),
      ...normalized.home.partners.map((item) => item.src),
      normalized.about.visionImage,
      ...normalized.about.gallery.map((item) => item.image),
      normalized.callout.backgroundImage,
    ];
    for (const source of imageSources) {
      const uploaded = /^\/api\/site-assets\/([\da-f-]{36}\.(png|jpg|webp))$/.exec(source);
      if (!uploaded && !/^\/images\/[\w-]+\.(png|jpe?g|webp|svg)$/i.test(source)) {
        return res.status(400).json({ error: "Les images doivent être choisies dans les images ferroLink ou importées depuis votre appareil." });
      }
      if (uploaded) {
        try {
          await access(path.join(siteAssetDir, uploaded[1]));
        } catch (err) {
          if (err.code === "ENOENT") return res.status(400).json({ error: "Une image importée est introuvable ; veuillez la sélectionner à nouveau." });
          throw err;
        }
      }
    }
    const httpsUrl = (value) => {
      try { return new URL(value).protocol === "https:"; }
      catch { return false; }
    };
    if (!httpsUrl(normalized.contact.socialUrl)
      || normalized.footer.socials.some((social) => !httpsUrl(social.url))
      || [...normalized.footer.phones, normalized.home.introPhone].some((phone) => !/^\+?[\d\s().-]+$/.test(phone))
      || normalized.contact.phoneLinks.some((phone) => !/^\+?[\d\s().-]+$/.test(phone))) {
      return res.status(400).json({ error: "Les liens sociaux ou numéros de téléphone sont invalides." });
    }

    const theme = settings.theme;
    const fontChoices = ["DM Sans", "League Spartan", "Arial", "Georgia", "system-ui"];
    if (!theme || typeof theme !== "object" || Array.isArray(theme)
      || typeof theme.primaryColor !== "string" || !/^#[\da-f]{6}$/i.test(theme.primaryColor)
      || typeof theme.accentColor !== "string" || !/^#[\da-f]{6}$/i.test(theme.accentColor)
      || !fontChoices.includes(theme.bodyFont)
      || !fontChoices.includes(theme.headingFont)
      || !Number.isInteger(theme.bodySize) || theme.bodySize < 14 || theme.bodySize > 20
      || !Number.isInteger(theme.headingSize) || theme.headingSize < 32 || theme.headingSize > 64) {
      return res.status(400).json({ error: "Les couleurs, polices ou tailles du thème sont invalides." });
    }
    normalized.theme = {
      primaryColor: theme.primaryColor,
      accentColor: theme.accentColor,
      bodyFont: theme.bodyFont,
      headingFont: theme.headingFont,
      bodySize: theme.bodySize,
      headingSize: theme.headingSize,
    };

    const [saved] = await prisma.$queryRaw`
      INSERT INTO "SiteSettings" ("id", "value", "updatedById", "updatedAt")
      VALUES ('main', ${JSON.stringify(normalized)}::jsonb, ${req.session.user.id}, CURRENT_TIMESTAMP)
      ON CONFLICT ("id") DO UPDATE
      SET "value" = EXCLUDED."value", "updatedById" = EXCLUDED."updatedById", "updatedAt" = CURRENT_TIMESTAMP
      RETURNING "value", "updatedAt"
    `;
    res.json({ settings: saved.value, updatedAt: saved.updatedAt });
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
app.use("/api", (_req, res) => res.status(404).json({ error: "Ressource introuvable." }));

// In production the same server delivers the built site; any page address falls back to the app.
const clientDir = process.env.CLIENT_DIST_DIR && path.resolve(process.env.CLIENT_DIST_DIR);
if (clientDir) {
  app.use("/assets", express.static(path.join(clientDir, "assets"), { immutable: true, maxAge: "1y" }));
  app.use(express.static(clientDir, { index: false, maxAge: "1h" }));
  app.get(/.*/, (req, res, next) => {
    if (path.extname(req.path)) return next();
    res.setHeader("Cache-Control", "no-cache");
    res.sendFile(path.join(clientDir, "index.html"));
  });
}

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Une erreur interne est survenue." });
});
const server = app.listen(port, () => {
  console.log(`Ferro-Link API listening on port ${port}`);
  scheduleNewsRefresh();
  scheduleDataPurge();
});
process.on("SIGTERM", () => server.close(() => process.exit(0)));
