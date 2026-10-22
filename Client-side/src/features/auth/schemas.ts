import { z } from 'zod';

/**
 * Auth schemas.
 *
 * These constraints are **copies** of the server's
 * `Server-side/src/features/auth/auth.schema.ts`. When the server changes a
 * rule, change it here in the same PR — see Open Decisions Log #8.
 */

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email('Please provide a valid email address')),
  password: z.string().min(1, 'Password is required'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  email: z.string().trim().toLowerCase().pipe(z.email('Please provide a valid email address')),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be at most 72 characters')
    .regex(/[A-Za-z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});
export type SignupInput = z.infer<typeof signupSchema>;
