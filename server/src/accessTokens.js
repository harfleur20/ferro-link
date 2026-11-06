import { createHash, randomBytes } from "node:crypto";
import { prisma } from "./db.js";

export const accessTokenFilter = (userId) => ({
  sid: { startsWith: "password-reset:" },
  data: { contains: `"userId":"${userId}"` },
});

export const accessTokenSessionId = (token) => `password-reset:${createHash("sha256").update(token).digest("hex")}`;

// A user only ever has one valid link: creating one replaces the previous one.
export async function createAccessLink(userId, duration, { invitation = false } = {}) {
  const token = randomBytes(32).toString("base64url");
  const sessionId = accessTokenSessionId(token);
  const expiresAt = new Date(Date.now() + duration);
  await prisma.$transaction(async (tx) => {
    await tx.session.deleteMany({ where: accessTokenFilter(userId) });
    await tx.session.create({ data: { sid: sessionId, data: JSON.stringify({ userId }), expiresAt } });
  });
  const url = new URL("/acces-equipe", process.env.FRONTEND_URL || "http://localhost:5173");
  url.searchParams.set("resetToken", token);
  if (invitation) url.searchParams.set("invitation", "1");
  return { url: url.href, sessionId };
}
