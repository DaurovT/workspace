import { Router, type Request, type Response } from 'express';
import prisma from '../db';

const router = Router();

// GET /api/settings
router.get('/', async (req: Request, res: Response) => {
  try {
    let settings = await prisma.appSettings.findUnique({
      where: { id: 'global' }
    });
    
    // If not exists, create default
    if (!settings) {
      settings = await prisma.appSettings.create({
        data: { id: 'global' }
      });
    }
    
    res.json(settings);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// PUT /api/settings
router.put('/', async (req: Request, res: Response) => {
  try {
    const settings = await prisma.appSettings.upsert({
      where: { id: 'global' },
      update: req.body,
      create: { id: 'global', ...req.body }
    });
    res.json(settings);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

export default router;
