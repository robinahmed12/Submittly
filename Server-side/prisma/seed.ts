// Seeds the ADMIN and (optional) MENTOR accounts
// (Users §3: "an admin account may be seeded directly in the database").
// Credentials come from env; run via `npm run prisma:seed`.
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { env } from '../src/config/env';
import { PrismaClient } from '../src/generated/prisma/client';
import { hashPassword } from '../src/lib/password';

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: env.DATABASE_URL }) });

async function seedAccount(input: {
  name: string;
  email: string | undefined;
  password: string | undefined;
  role: 'ADMIN' | 'MENTOR';
}): Promise<void> {
  const email = input.email?.trim().toLowerCase();
  if (!email || !input.password) {
    console.log(`Skipped ${input.role} seed: no credentials configured.`);
    return;
  }

  const passwordHash = await hashPassword(input.password);

  // Update intentionally empty: never clobber an existing account's password.
  await prisma.user.upsert({
    where: { email },
    update: {},
    create: { name: input.name, email, passwordHash, role: input.role },
  });

  console.log(`Seeded ${input.role} ready: ${email}`);
}

async function main(): Promise<void> {
  await seedAccount({
    name: 'Submittly Admin',
    email: env.ADMIN_EMAIL,
    password: env.ADMIN_PASSWORD,
    role: 'ADMIN',
  });

  await seedAccount({
    name: 'Submittly Mentor',
    email: env.MENTOR_EMAIL,
    password: env.MENTOR_PASSWORD,
    role: 'MENTOR',
  });
}

void main()
  .catch((error: unknown) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
