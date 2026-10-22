import type { Role, Session } from '@/types/api';

/**
 * Session cookie plumbing shared by the proxy route, the proxy middleware
 * (`src/proxy.ts`) and the server components that read the current user.
 *
 * This module is deliberately free of `next/headers` and `server-only`, so
 * `src/proxy.ts` can import it without dragging server-only APIs into the
 * proxy bundle. The `cookies()`-based helpers live in `session-server.ts`.
 */

/** Holds the JWT. Read only by the backend proxy route. */
export const TOKEN_COOKIE = 'submittly_token';

/** Holds the non-sensitive user object. Read by the proxy and by server components. */
export const SESSION_COOKIE = 'submittly_session';

/** Matches the backend's `JWT_EXPIRES_IN` default of 7 days. */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

/**
 * Shared cookie attributes for both session cookies.
 *
 * `httpOnly` is the point of the whole design: browser JavaScript must never
 * be able to read the token.
 */
export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  path: '/',
  secure: process.env.NODE_ENV === 'production',
  maxAge: SESSION_MAX_AGE_SECONDS,
} as const;

const ROLES: readonly Role[] = ['STUDENT', 'MENTOR', 'ADMIN'];

/**
 * Parses the `submittly_session` cookie into a `Session`.
 *
 * Returns `null` for a missing, malformed, or unrecognised value rather than
 * throwing — a corrupt cookie should log the user out, not crash the request.
 */
export function parseSession(raw: string | undefined): Session | null {
  if (!raw) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (typeof parsed !== 'object' || parsed === null) return null;

  const candidate = parsed as Partial<Session>;
  if (
    typeof candidate.id !== 'string' ||
    typeof candidate.name !== 'string' ||
    typeof candidate.email !== 'string' ||
    !ROLES.includes(candidate.role as Role)
  ) {
    return null;
  }

  return {
    id: candidate.id,
    name: candidate.name,
    email: candidate.email,
    role: candidate.role as Role,
  };
}

/** Serialises a session for storage in the `submittly_session` cookie. */
export function serializeSession(session: Session): string {
  return JSON.stringify(session);
}
