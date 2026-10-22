import type { Request, Response } from 'express';
import { requireUser } from '@/middlewares/authenticate';
import { createSubmissionSchema } from './submission.schema';
import { submissionService } from './submission.service';

export const submissionController = {
  create: async (req: Request, res: Response): Promise<void> => {
    const user = requireUser(req);
    const input = createSubmissionSchema.parse(req.body);
    const submission = await submissionService.createSubmission(user.id, input);
    res.status(201).json({ success: true, data: { submission } });
  },

  listMine: async (req: Request, res: Response): Promise<void> => {
    const user = requireUser(req);
    const result = await submissionService.listMySubmissions(user.id);
    res.status(200).json({ success: true, data: result });
  },
};
