import type { ApiErrorCode, ApiErrorDetail, ApiFailure, ApiResponse } from '@/types/api';

/**
 * The one door to the Submittly API.
 *
 * Every feature calls through `apiFetch`. It unwraps the server's envelope and
 * throws a typed `ApiError` on failure, so no caller ever inspects
 * `response.ok` or parses an envelope by hand.
 */

/** The base path the backend proxy route is mounted at. */
const API_BASE = '/api/backend';

/** The local route handler that clears the session cookies server-side. */
const SESSION_ROUTE = '/api/session';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly code?: ApiErrorCode,
    readonly details?: ApiErrorDetail[],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Fallback copy for codes that arrive without a message. The API's own
 * `message` is already human-readable and domain-specific, so it is always
 * preferred — these only fill the gap.
 */
const FALLBACK_MESSAGES: Record<ApiErrorCode, string> = {
  AUTH_REQUIRED: 'Your session has expired. Please sign in again.',
  AUTH_INVALID: 'Your session has expired. Please sign in again.',
  ROLE_FORBIDDEN: 'You do not have permission to perform this action.',
  VALIDATION_ERROR: 'Please check the highlighted fields and try again.',
  DUPLICATE_SUBMISSION: 'You have already submitted a project with this repository URL.',
  EMAIL_ALREADY_EXISTS: 'An account with this email already exists.',
  INVALID_STATUS_TRANSITION: 'This submission has already been reviewed.',
  RATE_LIMITED: 'Too many attempts. Please wait a moment and try again.',
  NOT_FOUND: "We couldn't find what you were looking for.",
  INTERNAL: 'Something went wrong on our end. Please try again.',
};

/**
 * The message to show the user for a failed request.
 *
 * Prefers the API's own message; falls back to the code's default copy.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.message) return error.message;
    if (error.code) return FALLBACK_MESSAGES[error.code];
  }
  return FALLBACK_MESSAGES.INTERNAL;
}

/**
 * Clears the session cookies and sends the user back to the login page.
 *
 * The cookies are httpOnly, so browser JavaScript cannot delete them — the
 * local route handler does it server-side.
 */
async function endSession(): Promise<void> {
  try {
    await fetch(SESSION_ROUTE, { method: 'DELETE', credentials: 'same-origin' });
  } catch {
    // The session endpoint is unreachable; the redirect below still happens.
  }

  if (typeof window !== 'undefined') {
    const next = encodeURIComponent(window.location.pathname);
    // A hard navigation, not a router push: the session is gone, and the
    // TanStack Query cache still holds the previous user's data. A client-side
    // transition would keep that cache. The destination is absolute so the
    // intent is explicit (and `@next/next/no-location-assign-relative-destination`
    // does not flag it).
    const destination = new URL(`/login?next=${next}`, window.location.origin).toString();
    window.location.assign(destination);
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      ...init?.headers,
    },
    credentials: 'same-origin',
  });

  // A 401 means the token expired or was rejected. Tear the session down
  // before throwing, so the caller never has to think about it.
  if (response.status === 401) {
    await endSession();
  }

  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !payload.success) {
    const failure = payload as ApiFailure;
    throw new ApiError(response.status, failure.message, failure.code, failure.details);
  }

  return payload.data;
}

/** Convenience wrapper for `GET` requests. */
export function apiGet<T>(path: string): Promise<T> {
  return apiFetch<T>(path, { method: 'GET' });
}

/** Convenience wrapper for JSON `POST` requests. */
export function apiPost<T>(path: string, body: unknown): Promise<T> {
  return apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body) });
}

/** Convenience wrapper for JSON `PATCH` requests. */
export function apiPatch<T>(path: string, body: unknown): Promise<T> {
  return apiFetch<T>(path, { method: 'PATCH', body: JSON.stringify(body) });
}
