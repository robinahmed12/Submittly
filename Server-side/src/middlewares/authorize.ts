import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '@/lib/errors';
import type { Role } from '@/types/role';

/**
 * Role guard to be used strictly after `authenticate`.
 * 403 unless `req.user.role` is in `allowedRoles`
 * (e.g. students can never reach mentor-only routes — Requirements §4.1).
 */
export function authorize(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new ApiError(401, 'Authentication required.', 'AUTH_REQUIRED'));
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      next(
        new ApiError(
          403,
          'Forbidden: this action is not permitted for your role.',
          'ROLE_FORBIDDEN',
        ),
      );
      return;
    }
    next();
  };
}
