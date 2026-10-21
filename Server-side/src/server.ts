// dotenv must be imported before anything that reads config/env.
import 'dotenv/config';
import { createApp } from '@/app';
import { env } from '@/config/env';

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`Submittly API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
});

const shutdown = (signal: string): void => {
  console.log(`\n${signal} received: closing server...`);
  server.close(() => process.exit(0));
  // Force-quit if lingering sockets refuse to drain.
  setTimeout(() => process.exit(1), 10_000).unref();
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
