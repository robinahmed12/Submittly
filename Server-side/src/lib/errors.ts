/**
 * Stable error codes rendered in every error envelope.
 * Documented in docs/implementation-plan.md §5.3.
 */
export type ApiErrorCode =
  | 'AUTH_REQUIRED'
  | 'AUTH_INVALID'
  | 'ROLE_FORBIDDEN'
  | 'VALIDATION_ERROR'
  | 'DUPLICATE_SUBMISSION'
  | 'INVALID_STATUS_TRANSITION'
  | 'RATE_LIMITED'
  | 'NOT_FOUND'
  | 'INTERNAL';

export interface ApiErrorDetail {
  path: string;
  message: string;
}

/**
 * Intended client-facing failure. Throw from services; controllers never
 * catch it — the central error handler renders the envelope.
 */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly code: ApiErrorCode,
    readonly details?: ApiErrorDetail[],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
