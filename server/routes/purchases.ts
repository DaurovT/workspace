import { Router, type Request, type Response } from 'express';
import prisma from '../db';

const router = Router();

// GET /api/purchases
router.get('/', async (req: Request, res: Response) => {
  try {
    const purchases = await prisma.purchase.findMany({
      orderBy: { startDate: 'desc' }
    });
    res.json(purchases);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/purchases
router.post('/', async (req: Request, res: Response) => {
  try {
    const purchase = await prisma.purchase.create({
      data: req.body
    });
    res.status(201).json(purchase);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/purchases/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const purchase = await prisma.purchase.update({
      where: { id: req.params.id as string },
      data: req.body
    });
    res.json(purchase);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/purchases/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.purchase.delete({
      where: { id: req.params.id as string }
    });
    res.status(204).send();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
