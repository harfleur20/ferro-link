import { Router } from "express";
import { z } from "zod";
import { prisma } from "./db.js";
import { contactLimiter } from "./limits.js";
import { adminUrl, getActiveStaff, notificationRecipients, sendMailSafely } from "./mailer.js";
import { requireAuth, requireBusinessManager, requireStaff } from "./middleware.js";

export const contactRouter = Router();
export const newContactMessageTitle = "Nouveau message de contact";

const contactInput = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().toLowerCase().email().max(254),
  subject: z.string().trim().min(1).max(180),
  message: z.string().trim().min(1).max(5000),
  website: z.string().max(200).optional(),
});

const contactNotice = (message) => `${message.name} : ${message.subject}`;

async function notifyContactMessage(message) {
  const staff = await getActiveStaff();
  if (staff.length) {
    await prisma.notification.createMany({
      data: staff.map((user) => ({ userId: user.id, title: newContactMessageTitle, message: contactNotice(message) })),
    });
  }
  await sendMailSafely({
    to: notificationRecipients(staff),
    replyTo: message.email,
    subject: `Message du site : ${message.subject}`,
    text: `De : ${message.name} <${message.email}>\n\n${message.message}\n\nMessage également disponible dans l’espace administration :\n${adminUrl()}`,
  });
}

contactRouter.post("/contact", contactLimiter, async (req, res, next) => {
  try {
    const parsed = contactInput.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Merci de vérifier les champs du formulaire." });
    const { website, ...data } = parsed.data;
    // Bots filling the hidden field get a normal answer and nothing is stored.
    if (website) return res.status(201).json({ ok: true });
    const message = await prisma.contactMessage.create({ data });
    res.status(201).json({ ok: true });
    notifyContactMessage(message).catch((err) => console.error("Notification de message impossible :", err.message));
  } catch (err) { next(err); }
});

contactRouter.get("/staff/contact-messages", requireAuth, requireStaff, async (_req, res, next) => {
  try {
    const messages = await prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
    res.json({ messages });
  } catch (err) { next(err); }
});

contactRouter.delete("/staff/contact-messages/:id", requireAuth, requireBusinessManager, async (req, res, next) => {
  try {
    const message = await prisma.contactMessage.findUnique({ where: { id: req.params.id } });
    if (!message) return res.status(404).json({ error: "Message introuvable." });
    await Promise.all([
      prisma.contactMessage.deleteMany({ where: { id: message.id } }),
      prisma.notification.deleteMany({ where: { title: newContactMessageTitle, message: contactNotice(message) } }),
    ]);
    res.status(204).end();
  } catch (err) { next(err); }
});

contactRouter.patch("/staff/contact-messages/:id/read", requireAuth, requireStaff, async (req, res, next) => {
  try {
    const result = await prisma.contactMessage.updateMany({ where: { id: req.params.id }, data: { readAt: new Date() } });
    if (!result.count) return res.status(404).json({ error: "Message introuvable." });
    res.json({ ok: true });
  } catch (err) { next(err); }
});
