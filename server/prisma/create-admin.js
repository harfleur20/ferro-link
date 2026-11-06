import "dotenv/config";
import { createAccessLink } from "../src/accessTokens.js";
import { prisma } from "../src/db.js";

const linkDuration = 24 * 60 * 60 * 1000;
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const fullName = process.env.ADMIN_NAME?.trim();

try {
  if (!email || !fullName) throw new Error("Renseignez ADMIN_EMAIL et ADMIN_NAME.");
  const superAdmins = await prisma.user.count({ where: { role: "SUPER_ADMIN", isActive: true } });
  if (superAdmins) throw new Error("Un SuperAdmin existe déjà : invitez les autres comptes depuis l’administration.");
  if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) throw new Error(`Le compte ${email} existe déjà ; aucun changement n’a été effectué.`);

  const user = await prisma.user.create({ data: { email, fullName, role: "SUPER_ADMIN" }, select: { id: true } });
  const { url } = await createAccessLink(user.id, linkDuration, { invitation: true });
  console.log(`SuperAdmin créé : ${email}`);
  console.log(`Choisissez le mot de passe avec ce lien (valable 24 heures) :\n${url}`);
} catch (err) {
  console.error(err.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
