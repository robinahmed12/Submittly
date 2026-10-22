import { apiPost } from '@/lib/api-client';
import type { AuthPayload } from '@/types/api';
import type { LoginInput, SignupInput } from './schemas';

/**
 * The auth feature's API calls.
 *
 * The session cookies are written by the backend proxy route, not here — the
 * browser never sees the token.
 */

/** Signs in with an existing account (any role). */
export function login(input: LoginInput): Promise<AuthPayload> {
  return apiPost<AuthPayload>('/auth/login', input);
}

/** Registers a student account. The server assigns the `STUDENT` role. */
export function signup(input: SignupInput): Promise<AuthPayload> {
  return apiPost<AuthPayload>('/auth/signup', input);
}

/**
 * Signs out.
 *
 * The session cookies are httpOnly, so they must be cleared server-side.
 * This calls the local route handler, which does it.
 */
export function logout(): Promise<void> {
  return fetch('/api/session', { method: 'DELETE', credentials: 'same-origin' }).then(
    () => undefined,
  );
}
