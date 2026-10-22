import type { Request, Response } from 'express';
import { authService } from './auth.service';
import { loginSchema, signupSchema } from './auth.schema';

// Arrow properties (not object methods) so the handlers can be passed straight
// to the router without an unbound `this` — see docs/coding-style.md §5.
export const authController = {
  signup: async (req: Request, res: Response): Promise<void> => {
    const input = signupSchema.parse(req.body);
    const result = await authService.signup(input);
    res.status(201).json({ success: true, data: result });
  },

  login: async (req: Request, res: Response): Promise<void> => {
    const input = loginSchema.parse(req.body);
    const result = await authService.login(input);
    res.status(200).json({ success: true, data: result });
  },
};
