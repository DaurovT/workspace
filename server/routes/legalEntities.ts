import { Router, type Request, type Response } from 'express';
import prisma from '../db';

const router = Router();

// GET /api/legal-entities
router.get('/', async (_req: Request, res: Response) => {
  try {
    const entities = await prisma.legalEntity.findMany({ orderBy: { createdAt: 'asc' } });
    res.json(entities);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// POST /api/legal-entities
router.post('/', async (req: Request, res: Response) => {
  try {
    const entity = await prisma.legalEntity.create({ data: req.body });
    res.status(201).json(entity);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// PUT /api/legal-entities/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const entity = await prisma.legalEntity.update({
      where: { id: req.params.id as string },
      data: req.body,
    });
    res.json(entity);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// DELETE /api/legal-entities/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.legalEntity.delete({ where: { id: req.params.id as string } });
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

export default router;
