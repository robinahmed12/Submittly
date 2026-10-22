import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { parseSession, SESSION_COOKIE } from '@/lib/session';
import type { Role } from '@/types/api';

/**
 * Role-based route gate.
 *
 * Next.js 16 renamed the `middleware.ts` convention to `proxy.ts`; the
 * exported function must be named `proxy`. It runs on the Node.js runtime.
 *
 * This is **UX, not security** — it stops a user from reaching a page that
 * would fail. The real enforcement is the API's `authorize` middleware, which
 * returns 403 regardless of what the client does.
 */

/** Which roles may reach which path prefix. */
const ROLE_GUARDS: ReadonlyArray<{ prefix: string; roles: readonly Role[] }> = [
  { prefix: '/student', roles: ['STUDENT'] },
  { prefix: '/mentor', roles: ['MENTOR', 'ADMIN'] },
];

const PUBLIC_ONLY_PATHS = new Set(['/login', '/signup']);

function allowedRoles(pathname: string): readonly Role[] | null {
  const guard = ROLE_GUARDS.find(
    candidate => pathname === candidate.prefix || pathname.startsWith(`${candidate.prefix}/`),
  );
  return guard ? guard.roles : null;
}

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const session = parseSession(request.cookies.get(SESSION_COOKIE)?.value);

  const allowed = allowedRoles(pathname);

  if (allowed) {
    if (!session) {
      const next = encodeURIComponent(pathname);
      return NextResponse.redirect(new URL(`/login?next=${next}`, request.url));
    }
    if (!allowed.includes(session.role)) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  if (PUBLIC_ONLY_PATHS.has(pathname) && session) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Everything except API routes and static assets.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
};
