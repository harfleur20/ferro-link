export function requireAuth(req, res, next) {
  if (!req.session?.user?.id) return res.status(401).json({ error: "Authentification requise." });
  next();
}
export function requireStaff(req, res, next) {
  if (!["RECRUITER", "RECRUITMENT_ADMIN", "SUPER_ADMIN"].includes(req.session?.user?.role)) return res.status(403).json({ error: "Accès réservé à l'équipe de recrutement." });
  next();
}
export function requireSuperAdmin(req, res, next) {
  if (req.session?.user?.role !== "SUPER_ADMIN") return res.status(403).json({ error: "Accès réservé au super administrateur." });
  next();
}
