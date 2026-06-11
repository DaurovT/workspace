import { Router, type Request, type Response } from 'express';
import prisma from '../db';
import { authContext } from '../context';

const router = Router();

const isAdmin = (role?: string) => role === 'admin' || role === 'owner';

// GET /api/shift-schedules
router.get('/', async (_req: Request, res: Response) => {
  try {
    const schedules = await (prisma as any).shiftSchedule.findMany({
      include: { _count: { select: { employees: true } } },
      orderBy: { createdAt: 'asc' },
    });
    res.json(schedules);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/shift-schedules
router.post('/', async (req: Request, res: Response) => {
  try {
    const ctx = authContext.getStore();
    if (!isAdmin(ctx?.role)) return res.status(403).json({ error: 'Access denied' });
    const { name, type, workDays, restDays, hoursPerDay, startTime, endTime, cycleStart, note } = req.body;
    if (!name || !type) return res.status(400).json({ error: 'name и type обязательны' });
    const s = await (prisma as any).shiftSchedule.create({
      data: { name, type, workDays: Number(workDays ?? 5), restDays: Number(restDays ?? 2),
        hoursPerDay: Number(hoursPerDay ?? 8), startTime: startTime ?? '08:00',
        endTime: endTime ?? '17:00', cycleStart: cycleStart || null, note: note || null },
    });
    res.status(201).json(s);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/shift-schedules/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const ctx = authContext.getStore();
    if (!isAdmin(ctx?.role)) return res.status(403).json({ error: 'Access denied' });
    const { name, type, workDays, restDays, hoursPerDay, startTime, endTime, cycleStart, note } = req.body;
    const data: any = {};
    if (name !== undefined) data.name = name;
    if (type !== undefined) data.type = type;
    if (workDays !== undefined) data.workDays = Number(workDays);
    if (restDays !== undefined) data.restDays = Number(restDays);
    if (hoursPerDay !== undefined) data.hoursPerDay = Number(hoursPerDay);
    if (startTime !== undefined) data.startTime = startTime;
    if (endTime !== undefined) data.endTime = endTime;
    if (cycleStart !== undefined) data.cycleStart = cycleStart || null;
    if (note !== undefined) data.note = note;
    const s = await (prisma as any).shiftSchedule.update({ where: { id: req.params.id }, data });
    res.json(s);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/shift-schedules/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const ctx = authContext.getStore();
    if (!isAdmin(ctx?.role)) return res.status(403).json({ error: 'Access denied' });
    // Unlink employees before deleting
    await prisma.employee.updateMany({
      where: { shiftScheduleId: req.params.id } as any,
      data: { shiftScheduleId: null } as any,
    });
    await (prisma as any).shiftSchedule.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
