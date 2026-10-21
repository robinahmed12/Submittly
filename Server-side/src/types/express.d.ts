import type { Role } from './role';

export interface AuthenticatedUser {
  id: string;
  role: Role;
}

// Assignment to `req.user` happens only inside the authenticate middleware.
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser | undefined;
    }
  }
}
