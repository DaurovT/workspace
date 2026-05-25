import { Request, Response, NextFunction } from 'express';
import { authContext } from '../context';
import prisma from '../db';

export const requireProjectMember = async (req: Request, res: Response, next: NextFunction) => {
  const ctx = authContext.getStore();
  if (!ctx || !ctx.userId) return res.status(401).json({ error: 'Unauthorized' });

  let projectId = (req.body?.projectId as string) || (req.query?.projectId as string);

  if (!projectId && req.params.id) {
    if (req.originalUrl.includes('/tasks/')) {
      const task = await prisma.arcanaTask.findUnique({ where: { id: req.params.id as string } });
      if (task) projectId = task.projectId;
    } else if (req.originalUrl.includes('/comments/')) {
       const comment = await prisma.arcanaComment.findUnique({ where: { id: req.params.id as string } });
       if (comment) {
         const task = await prisma.arcanaTask.findUnique({ where: { id: comment.taskId } });
         if (task) projectId = task.projectId;
       }
    } else if (req.originalUrl.includes('/projects/')) {
       projectId = req.params.id as string;
    }
  }

  // If no projectId resolved (e.g. creating something without passing projectId), let standard validation fail it later.
  // Or if it's GET /projects without a specific ID, let it pass (we filter in the route itself).
  if (!projectId && req.originalUrl.endsWith('/projects') && req.method === 'GET') {
      return next();
  }
  
  if (!projectId && req.method === 'POST' && req.originalUrl.endsWith('/projects')) {
      return next(); // Creating a new project doesn't require prior membership
  }

  if (projectId) {
    const member = await prisma.arcanaProjectMember.findFirst({
      where: { projectId, userId: ctx.userId }
    });

    if (!member) {
      return res.status(403).json({ error: 'Access denied. You are not a member of this project.' });
    }
  }

  next();
};
