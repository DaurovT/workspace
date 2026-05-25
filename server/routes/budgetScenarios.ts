import { Router } from 'express';

const router = Router();
import prisma from '../db';

// Get all
router.get('/', async (req, res) => {
  try {
    const data = await prisma.budgetScenario.findMany({
      include: { budgetLines: true }
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Create
router.post('/', async (req, res) => {
  try {
    const data = await prisma.budgetScenario.create({
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
    const data = await prisma.budgetScenario.update({
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
    await prisma.budgetLine.deleteMany({
      where: { scenarioId: req.params.id }
    });
    await prisma.budgetScenario.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
