import { Request, Response, NextFunction } from 'express';
import { authContext } from '../context';

export const requireRoles = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const ctx = authContext.getStore();

    if (!ctx || !ctx.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // owner and admin have access to everything
    if (ctx.role === 'admin' || ctx.role === 'owner') {
      return next();
    }

    if (!roles.includes(ctx.role)) {
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }

    next();
  };
};

// Roles allowed to perform write operations on finance/hr/procurement routes
export const requireWriteAccess = requireRoles(['owner', 'admin', 'cfo', 'accountant']);
