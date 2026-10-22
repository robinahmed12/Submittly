import { z } from 'zod';

export const submissionStatusSchema = z.enum(['PENDING', 'APPROVED', 'REJECTED']);

/** Query params for the mentor list — server-side filtering + pagination. */
export const listSubmissionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1, 'Page must be 1 or greater').default(1),
  limit: z.coerce.number().int().min(1).max(50, 'Limit must be between 1 and 50').default(10),
  status: submissionStatusSchema.optional(),
});
export type ListSubmissionsQuery = z.infer<typeof listSubmissionsQuerySchema>;

/** Route param: Prisma `cuid()` id. */
export const submissionIdParamSchema = z.object({
  id: z.string().regex(/^[a-z0-9]{20,32}$/i, 'Invalid submission id'),
});
export type SubmissionIdParam = z.infer<typeof submissionIdParamSchema>;

/**
 * Review decision. Only APPROVED / REJECTED are accepted here — PENDING is
 * the initial state, never a target of a review.
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
