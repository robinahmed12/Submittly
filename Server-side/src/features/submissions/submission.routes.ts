import { Router } from 'express';
import { authenticate } from '@/middlewares/authenticate';
import { authorize } from '@/middlewares/authorize';
import { submitLimiter } from '@/middlewares/rate-limiter';
import { validate } from '@/middlewares/validate';
import { submissionController } from './submission.controller';
import { createSubmissionSchema } from './submission.schema';

/** Mounted at /api/submissions — student-only (mentors/admins get 403). */
export const submissionRouter = Router();

submissionRouter.post(
  '/',
  authenticate,
  authorize('STUDENT'),
  submitLimiter,
  validate({ body: createSubmissionSchema }),
  submissionController.create,
);

submissionRouter.get('/me', authenticate, authorize('STUDENT'), submissionController.listMine);
