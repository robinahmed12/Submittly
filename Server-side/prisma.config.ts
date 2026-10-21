// Prisma CLI configuration (Prisma ORM v7).
// The connection URL moved here from the schema in v7 — see
// docs/implementation-plan.md §4.
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  // `prisma generate` runs without a database (e.g. on `npm install`), so the
  // missing variable is a warning here — migrate/db commands will fail loudly.
  console.warn('[prisma.config] DATABASE_URL is not set — database commands will fail.');
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: databaseUrl ?? '',
  },
});
