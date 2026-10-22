import { z } from 'zod';

const httpUrlSchema = z
  .url('Please provide a valid URL')
  .refine(url => /^https?:\/\//i.test(url), 'URL must start with http:// or https://');

/**
 * Create a submission — the documented duplicate rule lives on the server:
 * one repo URL per student (unique constraint on `(studentId, repoUrl)`).
 */
export const createSubmissionSchema = z.object({
  projectName: z
    .string()
    .trim()
    .min(3, 'Project name must be at least 3 characters')
    .max(120, 'Project name must be at most 120 characters'),
  repoUrl: z.string().trim().pipe(httpUrlSchema),
  liveUrl: z.string().trim().pipe(httpUrlSchema).optional(),
  description: z
    .string()
    .trim()
    .min(10, 'Description must be at least 10 characters')
    .max(4000, 'Description must be at most 4000 characters'),
});
export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>;
