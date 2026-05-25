import { Router, type Request, type Response } from 'express';
import prisma from '../db';

const router = Router();

// GET /api/accounts
router.get('/', async (_req: Request, res: Response) => {
  try {
    const accounts = await prisma.account.findMany();
    res.json(accounts);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// POST /api/accounts
router.post('/', async (req: Request, res: Response) => {
  try {
    const acc = await prisma.account.create({ data: req.body });
    res.status(201).json(acc);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// PUT /api/accounts/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const acc = await prisma.account.update({ where: { id: req.params.id as string }, data: req.body });
    res.json(acc);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// DELETE /api/accounts/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.account.delete({ where: { id: req.params.id as string } });
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

export default router;
