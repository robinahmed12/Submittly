import type { NextFunction, Request, Response } from 'express';

/** Terminal handler for unmatched routes — 404 envelope (API contract). */
export function notFoundHandler(_req: Request, res: Response, _next: NextFunction): void {
  res.status(404).json({
    success: false,
    message: 'Route not found.',
    code: 'NOT_FOUND',
  });
}
