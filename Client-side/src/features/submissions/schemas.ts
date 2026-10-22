import { z } from 'zod';

/**
 * Submission schemas.
 *
 * These constraints are **copies** of the server's
 * `Server-side/src/features/submissions/submission.schema.ts`. When the server
 * changes a rule, change it here in the same PR — see Open Decisions Log #8.
 */

const httpUrlSchema = z
  .url('Please provide a valid URL')
  .refine(url => /^https?:\/\//i.test(url), 'URL must start with http:// or https://');

/**
 * An optional URL field.
 *
 * The server's schema is `z.string().trim().pipe(httpUrlSchema).optional()`,
 * which treats an **omitted** key as absent but an empty string as an
 * invalid URL. A blank input must therefore become `undefined` before it is
 * sent — `JSON.stringify` then drops the key entirely.
 *
 * The order matters: `.optional()` has to come **before** the transform, or
 * `z.string()` rejects `undefined` before the transform ever runs and the
 * field reports a bogus "expected string" error.
 */
const optionalHttpUrlSchema = z
  .string()
  .trim()
  .optional()
  .transform((value): string | undefined => (value === '' ? undefined : value))
  .pipe(httpUrlSchema.optional());

export const createSubmissionSchema = z.object({
  projectName: z
    .string()
    .trim()
    .min(3, 'Project name must be at least 3 characters')
    .max(120, 'Project name must be at most 120 characters'),
  repoUrl: z.string().trim().pipe(httpUrlSchema),
  liveUrl: optionalHttpUrlSchema,
  description: z
    .string()
    .trim()
    .min(10, 'Description must be at least 10 characters')
    .max(4000, 'Description must be at most 4000 characters'),
});

/**
 * The form's field values — what the inputs hold.
 *
 * `liveUrl` is a string here (possibly blank) because that is what an
 * `<input>` produces.
 */
export type CreateSubmissionFormValues = z.input<typeof createSubmissionSchema>;

/** The validated payload sent to the API — a blank `liveUrl` is `undefined`. */
export type CreateSubmissionInput = z.output<typeof createSubmissionSchema>;
