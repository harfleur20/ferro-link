import "dotenv/config";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "../src/db.js";

if (process.env.NODE_ENV === "production") {
  throw new Error("La création d’un compte de test est désactivée en production.");
}

const email = (process.env.ADMIN_EMAIL || "test.admin@ferrolink.local").trim().toLowerCase();
const password = randomBytes(18).toString("base64url");

try {
  const existingUser = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existingUser) {
    throw new Error(`Le compte ${email} existe déjà ; aucun changement n’a été effectué.`);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      fullName: "Administrateur de test",
      role: "SUPER_ADMIN",
    },
    select: { email: true },
  });

  console.log("Compte de test créé. Conservez ces identifiants ; le mot de passe ne sera plus affiché.");
  console.log(`E-mail : ${user.email}`);
  console.log(`Mot de passe : ${password}`);
} finally {
  await prisma.$disconnect();
}
