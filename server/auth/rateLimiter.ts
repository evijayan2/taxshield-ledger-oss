import rateLimit from 'express-rate-limit';

/**
 * In-memory rate limiter for login requests in OSS mode.
 * 10 attempts per 15-minute window per IP.
 */
const isDev = process.env.NODE_ENV !== 'production';

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 1000 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many login attempts from this IP. Please try again after 15 minutes.',
  },
});

/**
 * Rate limiter for password reset requests in OSS mode.
 * 5 requests per 60-minute window in production, relaxed in dev.
 */
export const resetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isDev ? 1000 : 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many password reset requests. Please try again later.',
  },
});

/**
 * Rate limiter for employee invite operations.
 * 20 attempts per 60-minute window in production, relaxed in dev.
 */
export const inviteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isDev ? 1000 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many invitation requests. Please try again later.',
  },
});
