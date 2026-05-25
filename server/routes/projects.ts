import { Router, type Request, type Response } from 'express';
import prisma from '../db';

const router = Router();

// GET /api/projects
router.get('/', async (_req: Request, res: Response) => {
  try {
    const projects = await prisma.project.findMany();
    res.json(projects);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// POST /api/projects
router.post('/', async (req: Request, res: Response) => {
  try {
    const proj = await prisma.$transaction(async (tx) => {
      // 1. Create Finance Project
      const financeProject = await tx.project.create({ data: req.body });
      
      // 2. Create Arcana Project linked to Finance Project
      const arcanaProject = await tx.arcanaProject.create({
        data: {
          id: financeProject.id, // Keep IDs identical for 1-to-1 sync
          name: financeProject.name,
          description: financeProject.description || '',
        }
      });
      
      // 3. Auto-assign the creator as admin of the Arcana project
      const { authContext } = require('../context');
      const userId = authContext.getStore()?.userId;
      if (userId) {
         await tx.arcanaProjectMember.create({
           data: {
             projectId: arcanaProject.id,
             userId: userId,
             role: 'admin'
           }
         });
      }

      return financeProject;
    });

    res.status(201).json(proj);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// PUT /api/projects/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const proj = await prisma.$transaction(async (tx) => {
      const updated = await tx.project.update({ where: { id: req.params.id as string }, data: req.body });
      
      // Sync update to Arcana
      try {
        await tx.arcanaProject.update({
          where: { id: req.params.id as string },
          data: {
            ...(req.body.name !== undefined && { name: req.body.name }),
            ...(req.body.description !== undefined && { description: req.body.description }),
          }
        });
      } catch (e) {
        // Ignore if arcana project doesn't exist
      }
      return updated;
    });
    res.json(proj);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// DELETE /api/projects/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.project.delete({ where: { id: req.params.id as string } });
      
      // Sync delete to Arcana
      try {
        await tx.arcanaProject.delete({ where: { id: req.params.id as string } });
      } catch (e) {
        // Ignore if arcana project doesn't exist
      }
    });
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

export default router;
