import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { ApiError } from '@/lib/errors';
import { Prisma } from '@/generated/prisma/client';
import type { ApiErrorEnvelope } from '@/types/http';

const isBodyParserError = (error: unknown): boolean =>
  error instanceof Error &&
  'type' in error &&
  (error as { type?: unknown }).type === 'entity.parse.failed';

/** Maps every failure reaching the app boundary to an ApiError. */
function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (error instanceof ZodError) {
    return new ApiError(
      400,
      'Validation failed.',
      'VALIDATION_ERROR',
      error.issues.map(issue => ({
        path: issue.path.map(String).join('.'),
        message: issue.message,
      })),
    );
  }

  // Safety net when a service relies on the DB-level unique constraint.
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    return new ApiError(409, 'This value already exists.', 'DUPLICATE_SUBMISSION');
  }

  if (isBodyParserError(error)) {
    return new ApiError(400, 'Invalid request: malformed JSON body.', 'VALIDATION_ERROR');
  }

  if (error instanceof Error && 'status' in error) {
    const status: unknown = (error as { status?: unknown }).status;
    if (typeof status === 'number' && status >= 400 && status < 500) {
      return new ApiError(status, 'Invalid request payload.', 'VALIDATION_ERROR');
    }
  }

  // Expected failures are ApiError; everything here is a genuine fault.
  return new ApiError(500, 'Internal server error.', 'INTERNAL');
}

/**
 * Central error renderer — the only place that produces error envelopes.
 * ApiErrors render as-is; unexpected errors log server-side (stack) and
 * return a generic 500 so internals never leak (Requirements §6).
 */
export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const apiError = toApiError(error);

  if (apiError.status >= 500) {
    console.error('[error-handler] Unhandled failure:', error);
  }

  const payload: ApiErrorEnvelope = {
    success: false,
    message: apiError.message,
    code: apiError.code,
  };
  if (apiError.details) payload.details = apiError.details;

  res.status(apiError.status).json(payload);
}
