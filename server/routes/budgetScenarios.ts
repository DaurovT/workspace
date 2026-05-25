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
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
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
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
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
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
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
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
