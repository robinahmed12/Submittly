import type { Request } from 'express';
import { ipKeyGenerator, rateLimit } from 'express-rate-limit';
import { env } from '@/config/env';

const RATE_LIMIT_MESSAGE = {
  success: false as const,
  message: 'Too many requests: please slow down and try again shortly.',
  code: 'RATE_LIMITED',
};

const COMMON_OPTIONS = {
  standardHeaders: 'draft-8' as const,
  legacyHeaders: false,
  message: RATE_LIMIT_MESSAGE,
};

const FIFTEEN_MINUTES = 15 * 60 * 1000;

// Keyed by the authenticated user when present (chain order puts
// `authenticate` before these limiters), falling back to the client IP —
// routed through `ipKeyGenerator` so IPv6 addresses can't bypass limits.
const keyByUserOrIp = (req: Request): string => {
  if (req.user?.id) return req.user.id;
  return req.ip ? ipKeyGenerator(req.ip) : 'unknown';
};

/** Gentle app-wide ceiling, mounted globally in app.ts. */
export const globalLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: 1000,
  ...COMMON_OPTIONS,
});

/** Applied to /api/auth/signup + /api/auth/login (spam-resistant auth — Requirements §6). */
export const authLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: env.RATE_LIMIT_AUTH_MAX,
  keyGenerator: keyByUserOrIp,
  ...COMMON_OPTIONS,
});

/** Applied to POST /api/submissions (basic rate limiting — Requirements §4.2). */
export const submitLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: env.RATE_LIMIT_SUBMIT_MAX,
  keyGenerator: keyByUserOrIp,
  ...COMMON_OPTIONS,
});
