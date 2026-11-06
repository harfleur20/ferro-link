import rateLimit from "express-rate-limit";

const limiter = (windowMs, limit, error, options = {}) => rateLimit({
  windowMs,
  limit,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error },
  ...options,
});

const minutes = (value) => value * 60 * 1000;
const publicFormLimit = () => Number(process.env.PUBLIC_FORM_RATE_LIMIT || 10);

export const loginLimiter = limiter(minutes(15), 10, "Trop de tentatives. Réessayez dans quelques minutes.", { skipSuccessfulRequests: true });
export const passwordResetLimiter = limiter(minutes(60), 5, "Trop de demandes. Réessayez plus tard.");
export const applicationLimiter = limiter(minutes(60), publicFormLimit(), "Trop de candidatures envoyées. Réessayez plus tard.");
export const contactLimiter = limiter(minutes(60), publicFormLimit(), "Trop de messages envoyés. Réessayez plus tard.");
