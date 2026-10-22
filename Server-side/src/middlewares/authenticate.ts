import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '@/lib/errors';
import { verifyAccessToken } from '@/lib/jwt';
import type { AuthenticatedUser } from '@/types/express';

/**
 * Reads the authenticated user set by `authenticate`.
 * Controllers use it instead of `req.user!` so the compiler proves the guard.
 *
 * @throws ApiError 401 AUTH_REQUIRED when the request never passed `authenticate`
 */
export function requireUser(req: Request): AuthenticatedUser {
  if (!req.user) {
    throw new ApiError(401, 'Authentication required.', 'AUTH_REQUIRED');
  }
  return req.user;
}

/**
 * Verifies the `Authorization: Bearer <token>` header (signature + expiry)
 * and attaches `req.user = { id, role }`. 401 when the token is absent or
 * invalid (Requirements §4.1).
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    next(new ApiError(401, 'Authentication required: missing bearer token.', 'AUTH_REQUIRED'));
    return;
  }

  const token = header.slice('Bearer '.length).trim();
  const claims = verifyAccessToken(token);
  req.user = { id: claims.sub, role: claims.role };
  next();
}
