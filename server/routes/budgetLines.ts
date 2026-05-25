import { Router } from 'express';

const router = Router();
import prisma from '../db';

// Get all
router.get('/', async (req, res) => {
  try {
    const data = await prisma.budgetLine.findMany();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Update or Create (Upsert)
router.post('/upsert', async (req, res) => {
  const { scenarioId, categoryId, month, year, amount } = req.body;
  try {
    const existing = await prisma.budgetLine.findFirst({
      where: { scenarioId, categoryId, month, year }
    });

    if (existing) {
      const updated = await prisma.budgetLine.update({
        where: { id: existing.id },
        data: { amount }
      });
      res.json(updated);
    } else {
      const created = await prisma.budgetLine.create({
        data: { scenarioId, categoryId, month, year, amount }
      });
      res.json(created);
    }
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
