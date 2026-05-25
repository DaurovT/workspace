import { Request, Response, NextFunction } from 'express';
import { authContext } from '../context';

export const requireRoles = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const ctx = authContext.getStore();
    
    // If no context or no userId, they shouldn't even be here (handled by global auth middleware), but double check.
    if (!ctx || !ctx.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Admin has access to everything
    if (ctx.role === 'admin') {
      return next();
    }

    if (!roles.includes(ctx.role)) {
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }

    next();
  };
};

export const requireWriteAccess = requireRoles(['admin', 'manager', 'accountant', 'hr']);
