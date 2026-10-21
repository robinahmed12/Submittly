// Seeds the ADMIN account (Users §3: "an admin account may be seeded directly
// in the database"). Credentials come from env; run via `npm run prisma:seed`.
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { env } from '../src/config/env';
import { PrismaClient } from '../src/generated/prisma/client';
import { hashPassword } from '../src/lib/password';

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: env.DATABASE_URL }) });

async function main(): Promise<void> {
  const email = env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env before seeding.');
  }

  const passwordHash = await hashPassword(password);

  // Update intentionally empty: never clobber an existing admin password.
  await prisma.user.upsert({
    where: { email },
    update: {},
    create: { name: 'Submittly Admin', email, passwordHash, role: 'ADMIN' },
  });

  console.log(`Seeded admin ready: ${email}`);
}

void main()
  .catch((error: unknown) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
