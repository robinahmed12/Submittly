import type { RequestHandler } from 'express';
import type { z } from 'zod';
import { ApiError } from '@/lib/errors';

export interface ValidationSchemas {
  body?: z.ZodType;
  query?: z.ZodType;
  params?: z.ZodType;
}

const TARGET_KEYS = ['params', 'query', 'body'] as const;

/**
 * Parses body/query/params with Zod, strips unknown keys and replaces the
 * request values with the parsed result. Renders 400 VALIDATION_ERROR with
 * per-field details on any failure (Requirements §6: server-side validation).
 */
export function validate(schemas: ValidationSchemas): RequestHandler {
  return (req, _res, next): void => {
    const details: Array<{ path: string; message: string }> = [];

    for (const key of TARGET_KEYS) {
      const schema = schemas[key];
      if (!schema) continue;

      const result = schema.safeParse(req[key]);
      if (!result.success) {
        for (const issue of result.error.issues) {
          details.push({
            path: issue.path.map(part => String(part)).join('.'),
            message: issue.message,
          });
        }
        continue;
      }

      // Express 5 exposes `req.query` as a getter-only property, so the parsed
      // value is installed as an own property instead of a plain assignment.
      // The cast is structural (style: no `any`); the schema owns the shape.
      Object.defineProperty(req, key, {
        value: result.data,
        writable: true,
        configurable: true,
        enumerable: true,
      });
    }

    if (details.length > 0) {
      next(new ApiError(400, 'Validation failed.', 'VALIDATION_ERROR', details));
      return;
    }
    next();
  };
}
