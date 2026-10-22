import type { Role } from '@/types/api';

/**
 * Role → route mapping.
 *
 * Kept in the auth feature because every persona's "home" is an auth
 * decision: where a user lands after signing in, and where they are sent
 * when they are already signed in.
 */

/** The landing route for a role. */
export function roleHome(role: Role): string {
  switch (role) {
    case 'STUDENT':
      return '/student/dashboard';
    case 'MENTOR':
    case 'ADMIN':
      return '/mentor/dashboard';
  }
}

/** A human-readable role name, for the user menu. */
export function roleLabel(role: Role): string {
  switch (role) {
    case 'STUDENT':
      return 'Student';
    case 'MENTOR':
      return 'Mentor';
    case 'ADMIN':
      return 'Admin';
  }
}

/**
 * Validates a `?next=` redirect target.
 *
 * Only same-origin, absolute paths are allowed. `//evil.com` and
 * `https://evil.com` are rejected — an open redirect would let an attacker
 * bounce a freshly-authenticated user off the site.
 */
export function safeNextPath(next: string | undefined): string | null {
  if (!next) return null;
  if (!next.startsWith('/')) return null;
  if (next.startsWith('//')) return null;
  return next;
}
