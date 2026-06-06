import rateLimit from "express-rate-limit";

/**
 * Rate limiter for auth endpoints (login, signup).
 * Prevents brute force attacks: max 10 requests per 15 minutes per IP.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    data: null,
    error: {
      code: "RATE_LIMITED",
      message: "Too many requests. Please try again after 15 minutes.",
      details: null,
    },
    meta: {},
  },
});

/**
 * General API rate limiter.
 * Max 100 requests per minute per IP.
 */
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    data: null,
    error: {
      code: "RATE_LIMITED",
      message: "Too many requests. Please try again shortly.",
      details: null,
    },
    meta: {},
  },
});
