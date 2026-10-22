import { prisma } from '@/db/prisma';
import { Prisma, type User } from '@/generated/prisma/client';
import { ApiError } from '@/lib/errors';
import { signAccessToken } from '@/lib/jwt';
import { hashPassword, verifyPassword } from '@/lib/password';
import type { Role } from '@/types/role';
import type { LoginInput, SignupInput } from './auth.schema';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: Date;
}

export interface AuthResult {
  user: AuthUser;
  token: string;
}

// A real bcrypt hash of a throwaway value. Compared against when the email is
// unknown so login takes the same time whether or not the account exists.
const DUMMY_PASSWORD_HASH = '$2b$12$yEtezQWNwlt8s8qqQk2YAuf1fKYtwx9oqQ/OZV.F0iMYdTG9D19IS';

function buildAuthResult(user: User): AuthResult {
  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    },
    token: signAccessToken({ sub: user.id, role: user.role }),
  };
}

/**
 * Registers a student account and returns the created user + access token.
 *
 * @throws ApiError 409 EMAIL_ALREADY_EXISTS  when the email is already registered
 */
export async function signup(input: SignupInput): Promise<AuthResult> {
  const passwordHash = await hashPassword(input.password);

  try {
    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        role: 'STUDENT', // students are the only self-registering role
      },
    });
    return buildAuthResult(user);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ApiError(409, 'An account with this email already exists.', 'EMAIL_ALREADY_EXISTS');
    }
    throw error;
  }
}

/**
 * Authenticates an existing account (any role) and returns the user + token.
 *
 * @throws ApiError 401 AUTH_INVALID  for unknown email OR wrong password
 */
export async function login(input: LoginInput): Promise<AuthResult> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  if (!user) {
    await verifyPassword(input.password, DUMMY_PASSWORD_HASH);
    throw new ApiError(401, 'Invalid email or password.', 'AUTH_INVALID');
  }

  const isPasswordValid = await verifyPassword(input.password, user.passwordHash);
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid email or password.', 'AUTH_INVALID');
  }

  return buildAuthResult(user);
}

export const authService = { signup, login };
