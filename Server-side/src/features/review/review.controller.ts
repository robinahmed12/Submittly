import type { Request, Response } from 'express';
import { requireUser } from '@/middlewares/authenticate';
import { listSubmissionsQuerySchema, updateStatusSchema } from './review.schema';
import { reviewService } from './review.service';

export const reviewController = {
  listSubmissions: async (req: Request, res: Response): Promise<void> => {
    const query = listSubmissionsQuerySchema.parse(req.query);
    const result = await reviewService.listSubmissions(query);
    res.status(200).json({ success: true, data: result });
  },

  updateStatus: async (req: Request, res: Response): Promise<void> => {
    const user = requireUser(req);
    const { id } = req.params as { id: string };
    const input = updateStatusSchema.parse(req.body);
    const submission = await reviewService.updateStatus(id, user.id, input);
    res.status(200).json({ success: true, data: { submission } });
  },

  getStats: async (_req: Request, res: Response): Promise<void> => {
    const stats = await reviewService.getStats();
    res.status(200).json({ success: true, data: { stats } });
  },
};
