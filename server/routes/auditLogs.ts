import { Router } from 'express';

const router = Router();
import prisma from '../db';

// Get all
router.get('/', async (req, res) => {
  try {
    const data = await prisma.auditLogEntry.findMany({
      orderBy: { timestamp: 'desc' }
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
    const data = await prisma.auditLogEntry.create({
      data: req.body
    });
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
