import { Router, type Request, type Response } from 'express';
import prisma from '../db';

const router = Router();

// GET /api/invoices
router.get('/', async (req: Request, res: Response) => {
  try {
    const invoices = await prisma.invoice.findMany({
      orderBy: { issuedDate: 'desc' }
    });
    res.json(invoices);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/invoices
router.post('/', async (req: Request, res: Response) => {
  try {
    const invoice = await prisma.invoice.create({
      data: req.body
    });
    res.status(201).json(invoice);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/invoices/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const invoice = await prisma.invoice.update({
      where: { id: req.params.id as string },
      data: req.body
    });
    res.json(invoice);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/invoices/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.invoice.delete({
      where: { id: req.params.id as string }
    });
    res.status(204).send();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
