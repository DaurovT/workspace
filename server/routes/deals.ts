import { Router, type Request, type Response } from 'express';
import prisma from '../db';

const router = Router();

// GET /api/deals  (with optional ?status=&contractorId= filters)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, contractorId, projectId } = req.query;
    const deals = await prisma.deal.findMany({
      where: {
        ...(status ? { status: String(status) } : {}),
        ...(contractorId ? { contractorId: String(contractorId) } : {}),
        ...(projectId ? { projectId: String(projectId) } : {}),
      },
      include: { contractor: true, project: true },
      orderBy: { dateStart: 'desc' },
    });
    res.json(deals);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// GET /api/deals/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const deal = await prisma.deal.findUnique({
      where: { id: req.params.id as string },
      include: { contractor: true, project: true, transactions: true },
    });
    if (!deal) return res.status(404).json({ error: 'Not found' });
    res.json(deal);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// POST /api/deals
router.post('/', async (req: Request, res: Response) => {
  try {
    const { contractor, project, transactions, ...data } = req.body;
    const deal = await prisma.deal.create({ data });
    res.status(201).json(deal);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// PUT /api/deals/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { contractor, project, transactions, ...data } = req.body;
    const deal = await prisma.deal.update({ where: { id: req.params.id as string }, data });
    res.json(deal);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// DELETE /api/deals/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.deal.delete({ where: { id: req.params.id as string } });
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

export default router;
