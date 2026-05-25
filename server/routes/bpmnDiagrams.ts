import { Router } from 'express';
import prisma from '../db';
import { authContext } from '../context';

const router = Router();

// GET all diagrams
router.get('/', async (req, res) => {
  try {
    const diagrams = await prisma.bpmnDiagram.findMany({
      orderBy: { updatedAt: 'desc' }
    });
    res.json(diagrams);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch diagrams' });
  }
});

// GET single diagram
router.get('/:id', async (req, res) => {
  try {
    const diagram = await prisma.bpmnDiagram.findUnique({
      where: { id: req.params.id }
    });
    if (!diagram) return res.status(404).json({ error: 'Diagram not found' });
    res.json(diagram);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch diagram' });
  }
});

// POST create diagram
router.post('/', async (req, res) => {
  try {
    const { name, xml } = req.body;
    const diagram = await prisma.bpmnDiagram.create({
      data: { name, xml }
    });
    res.status(201).json(diagram);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create diagram' });
  }
});

// PUT update diagram
router.put('/:id', async (req, res) => {
  try {
    const { name, xml } = req.body;
    const diagram = await prisma.bpmnDiagram.update({
      where: { id: req.params.id },
      data: { name, xml }
    });
    res.json(diagram);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update diagram' });
  }
});

// DELETE diagram
router.delete('/:id', async (req, res) => {
  try {
    await prisma.bpmnDiagram.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete diagram' });
  }
});

export default router;
