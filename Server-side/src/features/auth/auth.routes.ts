import { Router } from 'express';
import { authLimiter } from '@/middlewares/rate-limiter';
import { validate } from '@/middlewares/validate';
import { authController } from './auth.controller';
import { loginSchema, signupSchema } from './auth.schema';

/** Mounted at /api/auth — public routes (no `authenticate` guard). */
export const authRouter = Router();

authRouter.post('/signup', authLimiter, validate({ body: signupSchema }), authController.signup);

authRouter.post('/login', authLimiter, validate({ body: loginSchema }), authController.login);
