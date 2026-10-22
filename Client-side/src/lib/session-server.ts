import 'server-only';

import { cookies } from 'next/headers';
import { parseSession, SESSION_COOKIE, TOKEN_COOKIE } from '@/lib/session';
import type { Session } from '@/types/api';

/**
 * `cookies()`-backed session helpers for Server Components and Route
 * Handlers. `import 'server-only'` guarantees this never reaches a client
 * bundle.
 */

/** Returns the current session, or `null` when signed out. */
export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  return parseSession(cookieStore.get(SESSION_COOKIE)?.value);
}

/** Removes both session cookies. Used by `DELETE /api/session` (logout). */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_COOKIE);
  cookieStore.delete(SESSION_COOKIE);
}
