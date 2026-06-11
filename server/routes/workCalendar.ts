import { Router, type Request, type Response } from 'express';
import prisma from '../db';
import { authContext } from '../context';

const router = Router();
const isAdmin = (role?: string) => role === 'admin' || role === 'owner';

// Государственные праздники Узбекистана (фиксированные)
const UZ_HOLIDAYS = [
  { monthDay: '01-01', name: 'Новый год',              isRecurring: true },
  { monthDay: '01-02', name: 'Новый год (2-й день)',   isRecurring: true },
  { monthDay: '03-08', name: 'День женщин',             isRecurring: true },
  { monthDay: '03-21', name: 'Навруз',                  isRecurring: true },
  { monthDay: '03-22', name: 'Навруз (2-й день)',       isRecurring: true },
  { monthDay: '03-23', name: 'Навруз (3-й день)',       isRecurring: true },
  { monthDay: '05-09', name: 'День памяти и почестей',  isRecurring: true },
  { monthDay: '09-01', name: 'День независимости',      isRecurring: true },
  { monthDay: '10-01', name: 'День учителя',             isRecurring: true },
  { monthDay: '11-18', name: 'День государственного флага', isRecurring: true },
  { monthDay: '12-08', name: 'День Конституции',         isRecurring: true },
];

// GET /api/work-calendar?year=2026
router.get('/', async (req: Request, res: Response) => {
  try {
    const year = String(req.query.year || new Date().getFullYear());
    
    // Получаем конкретные даты этого года
    const specificDays = await (prisma as any).workCalendarDay.findMany({
      where: { date: { startsWith: year }, isRecurring: false },
      orderBy: { date: 'asc' },
    });
    
    // Разворачиваем ежегодные праздники в конкретные даты
    const recurringDays = await (prisma as any).workCalendarDay.findMany({
      where: { isRecurring: true },
    });
    
    // Строим полный список: ежегодные + специфические этого года
    const recurringExpanded = recurringDays.map((d: any) => ({
      ...d,
      date: `${year}-${d.monthDay}`,
    }));
    
    // Добавляем встроенные UZ праздники если ещё не добавлены
    const allDates = new Set([
      ...specificDays.map((d: any) => d.date),
      ...recurringExpanded.map((d: any) => d.date),
    ]);
    
    const uzBuiltin = UZ_HOLIDAYS
      .filter(h => !recurringDays.some((r: any) => r.monthDay === h.monthDay))
      .map(h => ({
        id: `builtin_${h.monthDay}`,
        date: `${year}-${h.monthDay}`,
        monthDay: h.monthDay,
        name: h.name,
        type: 'holiday',
        isRecurring: true,
        isBuiltin: true,
        scope: 'all',
      }));
    
    res.json({
      year,
      specific: specificDays,
      recurring: recurringExpanded,
      builtin: uzBuiltin,
      // Плоский список всех нерабочих дат
      allOffDays: [
        ...uzBuiltin.map((d: any) => d.date),
        ...recurringExpanded.filter((d: any) => d.type !== 'extra_work').map((d: any) => d.date),
        ...specificDays.filter((d: any) => d.type !== 'extra_work').map((d: any) => d.date),
      ].filter((v, i, a) => a.indexOf(v) === i).sort(),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/work-calendar — добавить день
router.post('/', async (req: Request, res: Response) => {
  try {
    const ctx = authContext.getStore();
    if (!isAdmin(ctx?.role)) return res.status(403).json({ error: 'Access denied' });
    
    const { date, type, name, isRecurring, monthDay, scope } = req.body;
    if (!date || !type || !name) return res.status(400).json({ error: 'date, type, name обязательны' });
    
    const day = await (prisma as any).workCalendarDay.upsert({
      where: { date },
      create: {
        date,
        type: type || 'extra_off',
        name,
        isRecurring: isRecurring || false,
        monthDay: isRecurring ? (monthDay || date.slice(5)) : null,
        scope: scope || 'all',
      },
      update: { type, name, isRecurring: isRecurring || false, monthDay: isRecurring ? (monthDay || date.slice(5)) : null, scope: scope || 'all' },
    });
    res.status(201).json(day);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/work-calendar/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const ctx = authContext.getStore();
    if (!isAdmin(ctx?.role)) return res.status(403).json({ error: 'Access denied' });
    await (prisma as any).workCalendarDay.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/work-calendar/off-days?year=2026  — только список нерабочих дат
router.get('/off-days', async (req: Request, res: Response) => {
  try {
    const year = String(req.query.year || new Date().getFullYear());
    
    const specific = await (prisma as any).workCalendarDay.findMany({
      where: { date: { startsWith: year }, type: { not: 'extra_work' } },
      select: { date: true },
    });
    const recurring = await (prisma as any).workCalendarDay.findMany({
      where: { isRecurring: true, type: { not: 'extra_work' } },
      select: { monthDay: true },
    });
    
    const offDays = new Set<string>([
      ...UZ_HOLIDAYS.map(h => `${year}-${h.monthDay}`),
      ...specific.map((d: any) => d.date),
      ...recurring.map((d: any) => `${year}-${d.monthDay}`),
    ]);
    
    res.json(Array.from(offDays).sort());
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
