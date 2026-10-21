import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '@/lib/errors';
import { verifyAccessToken } from '@/lib/jwt';

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
