import { Router, type Request, type Response } from 'express';
import prisma from '../db';

const router = Router();

// GET /api/contractors
router.get('/', async (_req: Request, res: Response) => {
  try {
    const contractors = await prisma.contractor.findMany();
    res.json(contractors);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// POST /api/contractors
router.post('/', async (req: Request, res: Response) => {
  try {
    const con = await prisma.contractor.create({ data: req.body });
    res.status(201).json(con);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// PUT /api/contractors/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const con = await prisma.contractor.update({ where: { id: req.params.id as string }, data: req.body });
    res.json(con);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// DELETE /api/contractors/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.contractor.delete({ where: { id: req.params.id as string } });
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

export default router;
