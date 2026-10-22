import { z } from 'zod';

/**
 * Environment configuration — validated once at boot.
 * This is the ONLY module allowed to read `process.env`
 * (see docs/coding-style.md §11).
 */
const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(4).max(15).default(12),

  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  RATE_LIMIT_AUTH_MAX: z.coerce.number().int().positive().default(10),
  RATE_LIMIT_SUBMIT_MAX: z.coerce.number().int().positive().default(5),

  // Seed-only variables (`npm run prisma:seed`); not required by the API itself.
  ADMIN_EMAIL: z.email().optional(),
  ADMIN_PASSWORD: z.string().optional(),
  MENTOR_EMAIL: z.email().optional(),
  MENTOR_PASSWORD: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    'Invalid environment configuration:\n' +
      parsed.error.issues
        .map(issue => `  - ${issue.path.join('.') || '<root>'}: ${issue.message}`)
        .join('\n'),
  );
  process.exit(1);
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;
