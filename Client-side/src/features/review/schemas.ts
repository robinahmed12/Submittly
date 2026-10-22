import { z } from 'zod';

/**
 * Review schemas.
 *
 * These constraints are **copies** of the server's
 * `Server-side/src/features/review/review.schema.ts`. When the server changes
 * a rule, change it here in the same PR — see Open Decisions Log #8.
 */

export const submissionStatusSchema = z.enum(['PENDING', 'APPROVED', 'REJECTED']);

/**
 * A review decision.
 *
 * Only `APPROVED` and `REJECTED` are accepted — `PENDING` is the initial
 * state, never a target of a review.
 */
export const updateStatusSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED'], {
    message: 'Status must be either APPROVED or REJECTED',
  }),
  comment: z
    .string()
    .trim()
    .min(1, 'Comment cannot be empty')
    .max(1000, 'Comment must be at most 1000 characters')
    .optional(),
});
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
