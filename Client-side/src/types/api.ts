/**
 * Domain types mirroring the Submittly Express API.
 *
 * These are copies of the backend's Prisma-derived views — the server's
 * `lib/errors.ts` and its feature services. Keep them in sync: a new server
 * error code means a new client error code.
 *
 * Dates are `string` here. The API serialises Prisma `Date` values to ISO
 * 8601 strings over JSON; parse to a `Date` at the point of formatting and
 * nowhere else.
 */

export type Role = 'STUDENT' | 'MENTOR' | 'ADMIN';

export type SubmissionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

/** Identical to the server's `ApiErrorCode` union. */
export type ApiErrorCode =
  | 'AUTH_REQUIRED'
  | 'AUTH_INVALID'
  | 'ROLE_FORBIDDEN'
  | 'VALIDATION_ERROR'
  | 'DUPLICATE_SUBMISSION'
  | 'EMAIL_ALREADY_EXISTS'
  | 'INVALID_STATUS_TRANSITION'
  | 'RATE_LIMITED'
  | 'NOT_FOUND'
  | 'INTERNAL';

export interface ApiErrorDetail {
  path: string;
  message: string;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiFailure {
  success: false;
  message: string;
  code?: ApiErrorCode;
  details?: ApiErrorDetail[];
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

/** The signed-in user, as returned by the API. */
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

/**
 * The auth response the browser receives.
 *
 * The API returns `{ user, token }`, but the backend proxy strips the token
 * and delivers it as the `submittly_token` httpOnly cookie — so the browser
 * only ever sees the user.
 */
export interface AuthPayload {
  user: AuthUser;
}

/**
 * The non-sensitive user object stored in the `submittly_session` cookie.
 * Holds no secret — the JWT lives in the separate `submittly_token` cookie.
 */
export interface Session {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Submission {
  id: string;
  studentId: string;
  projectName: string;
  repoUrl: string;
  liveUrl: string | null;
  description: string;
  status: SubmissionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SubmissionList {
  items: Submission[];
  total: number;
}

export interface ReviewStudent {
  id: string;
  name: string;
  email: string;
}

export interface ReviewSubmission {
  id: string;
  projectName: string;
  repoUrl: string;
  liveUrl: string | null;
  description: string;
  status: SubmissionStatus;
  createdAt: string;
  updatedAt: string;
  student: ReviewStudent;
}

export interface PaginatedSubmissions {
  items: ReviewSubmission[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ReviewStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export interface HealthStatus {
  status: string;
  nodeEnv: string;
  uptimeSeconds: number;
}
