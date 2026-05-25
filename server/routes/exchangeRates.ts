import { Router } from 'express';

const router = Router();
import prisma from '../db';

// GET all exchange rates
router.get('/', async (req, res) => {
  try {
    const data = await prisma.exchangeRate.findMany({ orderBy: { currency: 'asc' } });
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT upsert single rate by currency
router.put('/:currency', async (req, res) => {
  try {
    const { currency } = req.params;
    const { rate } = req.body;
    const data = await prisma.exchangeRate.upsert({
      where: { currency },
      update: { rate },
      create: { currency, rate },
    });
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
