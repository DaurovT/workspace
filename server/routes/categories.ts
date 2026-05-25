import { Router, type Request, type Response } from 'express';
import prisma from '../db';

const router = Router();

// GET /api/categories
router.get('/', async (_req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany();
    res.json(categories);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// POST /api/categories
router.post('/', async (req: Request, res: Response) => {
  try {
    const cat = await prisma.category.create({ data: req.body });
    res.status(201).json(cat);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// PUT /api/categories/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const cat = await prisma.category.update({ where: { id: req.params.id as string }, data: req.body });
    res.json(cat);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// DELETE /api/categories/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.category.delete({ where: { id: req.params.id as string } });
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

export default router;
