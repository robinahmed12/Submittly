import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  serializeSession,
  SESSION_COOKIE,
  sessionCookieOptions,
  TOKEN_COOKIE,
} from '@/lib/session';
import type { AuthUser } from '@/types/api';

/**
 * The backend proxy.
 *
 * This is the only place in the app that talks to the Express API. The
 * browser calls `/api/backend/*`; this handler forwards to
 * `<API_URL>/api/*` with the JWT attached as a Bearer header, then returns
 * the upstream body and status **verbatim** so the client never has to
 * re-shape an envelope.
 *
 * Auth responses carry a token. It is written to an httpOnly cookie and
 * stripped from the body, so the token never reaches browser JavaScript.
 */

const API_URL = process.env.API_URL;

export const dynamic = 'force-dynamic';

type BackendRoute = RouteContext<'/api/backend/[...path]'>;

interface ParsedEnvelope {
  success?: boolean;
  data?: { token?: unknown; user?: unknown };
}

function parseEnvelope(payload: string): ParsedEnvelope | null {
  try {
    const parsed: unknown = JSON.parse(payload);
    if (typeof parsed !== 'object' || parsed === null) return null;
    return parsed as ParsedEnvelope;
  } catch {
    return null;
  }
}

function isAuthUser(value: unknown): value is AuthUser {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<AuthUser>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.name === 'string' &&
    typeof candidate.email === 'string' &&
    typeof candidate.role === 'string'
  );
}

/**
 * Writes the session cookies onto the response.
 *
 * The token cookie holds the JWT and is read only here. The session cookie
 * holds the non-sensitive user object so `src/proxy.ts` and the server
 * components can render the signed-in user without re-verifying a signature.
 */
function setSessionCookies(response: NextResponse, token: string, user: AuthUser): void {
  response.cookies.set(TOKEN_COOKIE, token, sessionCookieOptions);
  response.cookies.set(
    SESSION_COOKIE,
    serializeSession({ id: user.id, name: user.name, email: user.email, role: user.role }),
    sessionCookieOptions,
  );
}

async function handler(request: NextRequest, { params }: BackendRoute): Promise<Response> {
  const { path } = await params;

  if (!API_URL) {
    return NextResponse.json(
      {
        success: false,
        message: 'The API is not configured. Set API_URL in .env.local.',
        code: 'INTERNAL',
      },
      { status: 500 },
    );
  }

  const incoming = new URL(request.url);
  const target = new URL(`/api/${path.join('/')}`, API_URL);
  target.search = incoming.search;

  const token = request.cookies.get(TOKEN_COOKIE)?.value;

  const headers = new Headers({ accept: 'application/json' });
  const contentType = request.headers.get('content-type');
  if (contentType) headers.set('content-type', contentType);
  if (token) headers.set('authorization', `Bearer ${token}`);

  const method = request.method;
  // `null`, not `undefined`: with `exactOptionalPropertyTypes` an explicit
  // `undefined` is not assignable to `BodyInit | null`.
  const body = method === 'GET' || method === 'HEAD' ? null : await request.text();

  let upstream: Response;
  try {
    upstream = await fetch(target, { method, headers, body, cache: 'no-store' });
  } catch {
    // The backend is unreachable. Synthesise the same envelope shape so the
    // client has exactly one error path to handle.
    return NextResponse.json(
      { success: false, message: 'The API is unreachable. Please try again.', code: 'INTERNAL' },
      { status: 502 },
    );
  }

  const payload = await upstream.text();
  let responseBody = payload;

  const envelope = upstream.ok ? parseEnvelope(payload) : null;
  const issuedToken = envelope?.data?.token;
  const issuedUser = envelope?.data?.user;
  const hasSession = typeof issuedToken === 'string' && isAuthUser(issuedUser);

  if (hasSession && envelope?.data) {
    // Strip the token from the body — it lives in the cookie, not in JS.
    delete envelope.data.token;
    responseBody = JSON.stringify(envelope);
  }

  const response = new NextResponse(responseBody, {
    status: upstream.status,
    headers: { 'content-type': upstream.headers.get('content-type') ?? 'application/json' },
  });

  if (hasSession) {
    setSessionCookies(response, issuedToken, issuedUser);
  }

  return response;
}

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const PUT = handler;
export const DELETE = handler;
