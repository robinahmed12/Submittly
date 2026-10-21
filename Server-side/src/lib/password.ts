import { compare, hash } from 'bcryptjs';
import { env } from '@/config/env';

/** Hashes a plaintext password for storage (never stored in plaintext — Requirements §6). */
export function hashPassword(plain: string): Promise<string> {
  return hash(plain, env.BCRYPT_SALT_ROUNDS);
}

/** Constant-time comparison of a plaintext candidate against a stored hash. */
export function verifyPassword(plain: string, passwordHash: string): Promise<boolean> {
  return compare(plain, passwordHash);
}
