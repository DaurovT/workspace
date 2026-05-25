import { Router } from 'express';

const router = Router();
import prisma from '../db';

// Get all
router.get('/', async (req, res) => {
  try {
    const data = await prisma.bdrBudget.findMany();
    console.log('[BDR-BUDGETS] GET / => returned', data.length, 'items:', data.map(d => d.name));
    res.json(data);
  } catch (error) {
    console.error('[BDR-BUDGETS] GET / => ERROR:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

// Create
router.post('/', async (req, res) => {
  try {
    const data = await prisma.bdrBudget.create({
      data: req.body
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Update
router.put('/:id', async (req, res) => {
  try {
    const data = await prisma.bdrBudget.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Delete
router.delete('/:id', async (req, res) => {
  try {
    await prisma.bdrBudget.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
