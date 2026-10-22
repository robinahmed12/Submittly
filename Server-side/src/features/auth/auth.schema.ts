import { z } from 'zod';

/**
 * Signup — students only. Roles are never client-suppliable
 * (mentor/admin accounts are created by seed — Requirements §3).
 */
export const signupSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  // Normalize before validating so "  Amina@Example.COM " is accepted and stored lowercase.
  email: z.string().trim().toLowerCase().pipe(z.email('Please provide a valid email address')),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be at most 72 characters')
    .regex(/[A-Za-z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});
export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email('Please provide a valid email address')),
  password: z.string().min(1, 'Password is required'),
});
export type LoginInput = z.infer<typeof loginSchema>;
