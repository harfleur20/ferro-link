import { prisma } from "./db.js";
import { staffRoles } from "./mailer.js";

// Rights come from the database on every request, so a role change or a deactivation applies at once.
export async function requireAuth(req, res, next) {
  const id = req.session?.user?.id;
  if (!id) return res.status(401).json({ error: "Authentification requise." });
  try {
    const user = await prisma.user.findUnique({ where: { id }, select: { role: true, isActive: true } });
    if (!user?.isActive || !staffRoles.includes(user.role)) {
      req.session.destroy(() => {});
      return res.status(401).json({ error: "Authentification requise." });
    }
    req.session.user.role = user.role;
    next();
  } catch (err) { next(err); }
}
export function requireStaff(req, res, next) {
  if (!staffRoles.includes(req.session?.user?.role)) return res.status(403).json({ error: "Accès réservé à l'équipe de recrutement." });
  next();
}
export function requireBusinessManager(req, res, next) {
  if (!["RECRUITMENT_ADMIN", "SUPER_ADMIN"].includes(req.session?.user?.role)) return res.status(403).json({ error: "La gestion des offres est réservée au Business Manager et au SuperAdmin." });
  next();
}
export function requireSuperAdmin(req, res, next) {
  if (req.session?.user?.role !== "SUPER_ADMIN") return res.status(403).json({ error: "Accès réservé au super administrateur." });
  next();
}
