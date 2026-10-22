import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { env } from '@/config/env';
import { errorHandler } from '@/middlewares/error-handler';
import { notFoundHandler } from '@/middlewares/not-found';
import { globalLimiter } from '@/middlewares/rate-limiter';
import { authRouter } from '@/features/auth/auth.routes';
import { reviewRouter } from '@/features/review/review.routes';
import { submissionRouter } from '@/features/submissions/submission.routes';

/**
 * Express app factory — middleware chain composed in the documented order
 * (docs/implementation-plan.md §3): json → helmet → cors → global limiter →
 * routes → not-found → error-handler. Kept separate from the listen call so
 * integration tests can mount it without a socket (Phase 7).
 */
export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  // Trust the first proxy hop (nginx / render / vercel) so rate limiting keys
  // on real client IPs rather than the proxy address.
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(',')
        .map(origin => origin.trim())
        .filter(Boolean),
    }),
  );
  app.use(express.json({ limit: '10kb' }));
  app.use(globalLimiter);

  app.get('/api/health', (_req, res) => {
    res.status(200).json({
      success: true,
      data: { status: 'ok', nodeEnv: env.NODE_ENV, uptimeSeconds: Math.round(process.uptime()) },
    });
  });

  // Feature routers mount here across Phases 3–5:
  app.use('/api/auth', authRouter); // Phase 3
  app.use('/api/submissions', submissionRouter); // Phase 4
  app.use('/api/mentor', reviewRouter); // Phase 5

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
