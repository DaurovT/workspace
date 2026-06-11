import { Router, type Request, type Response } from 'express';
import prisma from '../db';

const router = Router();

// GET /api/accounts
router.get('/', async (_req: Request, res: Response) => {
  try {
    const accounts = await prisma.account.findMany();
    res.json(accounts);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/accounts
router.post('/', async (req: Request, res: Response) => {
  try {
    const acc = await prisma.account.create({ data: req.body });
    res.status(201).json(acc);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/accounts/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const acc = await prisma.account.update({ where: { id: req.params.id as string }, data: req.body });
    res.json(acc);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/accounts/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.account.delete({ where: { id: req.params.id as string } });
    res.status(204).send();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/accounts/recompute-balances — recompute each balance from its transactions (fixes drift; audit P1 #11)
router.post('/recompute-balances', async (_req: Request, res: Response) => {
  try {
    const accounts = await prisma.account.findMany();
    const updated: { id: string; name: string; balance: number }[] = [];
    for (const a of accounts) {
      const inc = await prisma.transaction.aggregate({ _sum: { amount: true }, where: { accountId: a.id, type: 'income', isDeleted: false } });
      const exp = await prisma.transaction.aggregate({ _sum: { amount: true }, where: { accountId: a.id, type: 'expense', isDeleted: false } });
      const balance = Number(inc._sum.amount ?? 0) - Number(exp._sum.amount ?? 0);
      await prisma.account.update({ where: { id: a.id }, data: { balance } });
      updated.push({ id: a.id, name: a.name, balance });
    }
    res.json({ updated: updated.length, accounts: updated });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
