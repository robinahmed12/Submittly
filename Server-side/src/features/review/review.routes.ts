import { Router } from 'express';
import { authenticate } from '@/middlewares/authenticate';
import { authorize } from '@/middlewares/authorize';
import { validate } from '@/middlewares/validate';
import { reviewController } from './review.controller';
import {
  listSubmissionsQuerySchema,
  submissionIdParamSchema,
  updateStatusSchema,
} from './review.schema';

/** Mounted at /api/mentor — mentors and admins only (students get 403). */
export const reviewRouter = Router();

reviewRouter.get(
  '/submissions',
  authenticate,
  authorize('MENTOR', 'ADMIN'),
  validate({ query: listSubmissionsQuerySchema }),
  reviewController.listSubmissions,
);

reviewRouter.patch(
  '/submissions/:id/status',
  authenticate,
  authorize('MENTOR', 'ADMIN'),
  validate({ params: submissionIdParamSchema, body: updateStatusSchema }),
  reviewController.updateStatus,
);

reviewRouter.get('/stats', authenticate, authorize('MENTOR', 'ADMIN'), reviewController.getStats);
