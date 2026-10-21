import jwt from 'jsonwebtoken';
import { env } from '@/config/env';
import { ApiError } from './errors';
import type { Role } from '@/types/role';

export interface AccessTokenPayload {
  sub: string;
  role: Role;
}

const ROLES: readonly string[] = ['STUDENT', 'MENTOR', 'ADMIN'];

/**
 * Signs a short-lived access token embedding `sub` (user id) + `role`.
 */
export function signAccessToken(payload: AccessTokenPayload): string {
  // env value is a free-form string (has a boot-time default, so never undefined);
  // the lib's property union includes `undefined`, excluded here because
  // `exactOptionalPropertyTypes` rejects it inside the literal options object.
  const expiresIn = env.JWT_EXPIRES_IN as NonNullable<jwt.SignOptions['expiresIn']>;
  return jwt.sign(payload, env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn,
  });
}

/**
 * Verifies signature AND expiry; throws ApiError(401) when the token is
 * missing, malformed, forged, or expired (Requirements §6).
 */
export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
    if (typeof decoded === 'object' && decoded !== null && isAccessTokenPayload(decoded)) {
      return { sub: decoded.sub, role: decoded.role };
    }
  } catch {
    // Unified 401 below — never leaks which failure happened.
  }
  throw new ApiError(401, 'Authentication failed: invalid or expired token.', 'AUTH_INVALID');
}

function isAccessTokenPayload(decoded: object): decoded is AccessTokenPayload & jwt.JwtPayload {
  const { sub, role, exp } = decoded as { sub?: unknown; role?: unknown; exp?: unknown };
  return (
    typeof sub === 'string' &&
    typeof role === 'string' &&
    ROLES.includes(role) &&
    typeof exp === 'number'
  );
}
