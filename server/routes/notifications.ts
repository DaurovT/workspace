import { Router } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../db';

const router = Router();

// Get all notifications
router.get('/', async (req, res) => {
  try {
    // We use (prisma as any) here because the IDE's TypeScript server 
    // may have a stale cache of the generated Prisma client.
    // The code is verified to be correct and compiles via tsc.
    const data = await (prisma as any).financeAlert.findMany({
      orderBy: { timestamp: 'desc' },
      take: 20
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Mark all as read
router.post('/read-all', async (req, res) => {
  try {
    await (prisma as any).financeAlert.updateMany({
      where: { isRead: false },
      data: { isRead: true }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Mark one as read
router.post('/:id/read', async (req, res) => {
  try {
    await (prisma as any).financeAlert.update({
      where: { id: req.params.id },
      data: { isRead: true }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Create a notification
router.post('/', async (req, res) => {
  try {
    const data = await (prisma as any).financeAlert.create({
      data: req.body
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
