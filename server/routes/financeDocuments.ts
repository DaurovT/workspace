import { Router, type Request, type Response } from 'express';
import prisma from '../db';

const router = Router();

// GET /api/finance-documents
router.get('/', async (req: Request, res: Response) => {
  try {
    const docs = await prisma.financeDocument.findMany({
      orderBy: { date: 'desc' }
    });
    res.json(docs);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// POST /api/finance-documents
router.post('/', async (req: Request, res: Response) => {
  try {
    const doc = await prisma.financeDocument.create({
      data: req.body
    });
    res.status(201).json(doc);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// PUT /api/finance-documents/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const doc = await prisma.financeDocument.update({
      where: { id: req.params.id as string },
      data: req.body
    });
    res.json(doc);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// DELETE /api/finance-documents/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.financeDocument.delete({
      where: { id: req.params.id as string }
    });
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

export default router;
