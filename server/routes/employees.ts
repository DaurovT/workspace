import { Router, type Request, type Response } from 'express';
import prisma from '../db';
import { authContext } from '../context';

const router = Router();

const isAdminOrOwner = () => { const c = authContext.getStore(); return c?.role === 'admin' || c?.role === 'owner'; };

const ALLOWED = [
  'lastName','firstName','middleName','birthDate','gender','nationality',
  'passportSeries','passportNumber','passportIssuedBy','passportIssuedDate','passportExpiry',
  'inn','pinfl','phone','address','emergencyContact','emergencyPhone',
  'userId','hasSystemAccess','hireDate','salary','salaryType','currency',
  'bankAccount','taxProfile','advancePct','contractorId','status','terminationDate',
  'department','position','notes','orgPositionId',
  'medicalBookDate','medicalBookExpiry','uniformSize','education',
  'scheduleType','scheduleWorkDays','scheduleRestDays','scheduleHours',
  'scheduleStart','scheduleEnd','scheduleCycleDate',
];

function sanitize(body: any) {
  const data: any = {};
  for (const key of ALLOWED) {
    if (key in body) {
      const v = body[key];
      data[key] = (v === '' || v === undefined) ? null : v;
    }
  }
  // Numeric coercions
  if (data.salary != null)           data.salary = Number(data.salary);
  if (data.advancePct != null)       data.advancePct = Number(data.advancePct);
  if (data.scheduleWorkDays != null) data.scheduleWorkDays = Number(data.scheduleWorkDays);
  if (data.scheduleRestDays != null) data.scheduleRestDays = Number(data.scheduleRestDays);
  if (data.scheduleHours != null)    data.scheduleHours = Number(data.scheduleHours);
  if (data.hasSystemAccess != null)  data.hasSystemAccess = Boolean(data.hasSystemAccess);
  // userId: null means no system access
  if ('userId' in data && data.userId === null) data.hasSystemAccess = false;
  return data;
}

function validate(data: any, isCreate: boolean) {
  const errors: string[] = [];
  if (isCreate) {
    if (!data.hireDate) errors.push('hireDate обязателен');
    if (!data.firstName) errors.push('firstName обязателен');
    if (!data.lastName) errors.push('lastName обязателен');
    if (data.salary == null || isNaN(Number(data.salary))) errors.push('salary обязателен');
  }
  if (data.salary != null && Number(data.salary) < 0) errors.push('salary должен быть >= 0');
  if (data.advancePct != null) {
    const p = Number(data.advancePct);
    if (p < 0 || p > 100) errors.push('advancePct должен быть 0–100');
  }
  return errors;
}

async function audit(action: string, entity: string, details: string, old?: any, nw?: any) {
  const ctx = authContext.getStore();
  try {
    await prisma.auditLogEntry.create({
      data: { userId: ctx?.userId || 'system', userName: ctx?.userName || 'System', action, entity, details,
        oldValue: old ? JSON.stringify(old) : null, newValue: nw ? JSON.stringify(nw) : null }
    });
  } catch (e) { /* non-critical */ }
}

// GET /api/employees/kpi
router.get('/kpi', async (_req: Request, res: Response) => {
  try {
    const employees = await prisma.employee.findMany({
      where: { status: 'active' },
      include: { user: { select: { id: true, name: true } } },
    });
    const now = new Date();
    const monthStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
    const timeLogs = await prisma.timeLog.findMany({ where: { date: { startsWith: monthStr } } });
    const completedTasks = await prisma.arcanaTask.groupBy({
      by: ['assigneeId'], where: { status: 'done' }, _count: { id: true },
    });
    const kpi = employees.map(emp => {
      const logs = timeLogs.filter(l => l.userId === emp.userId);
      const hours = logs.reduce((s, l) => s + Number(l.hours), 0);
      const tasks = completedTasks.find(t => t.assigneeId === emp.userId)?._count?.id || 0;
      const name = emp.firstName && emp.lastName ? `${emp.lastName} ${emp.firstName}` : (emp.user?.name || emp.userId || '—');
      return { employeeId: emp.id, userId: emp.userId, name, department: emp.department, salary: emp.salary, hoursThisMonth: hours, tasksDone: tasks };
    });
    res.json(kpi);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Internal server error' }); }
});

// GET /api/employees
router.get('/', async (_req: Request, res: Response) => {
  try {
    const employees = await prisma.employee.findMany({
      include: { absences: true, orgPosition: true },
      orderBy: { createdAt: 'desc' },
    } as any);
    res.json(employees);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Internal server error' }); }
});

// GET /api/employees/me
router.get('/me', async (_req: Request, res: Response) => {
  try {
    const ctx = authContext.getStore();
    if (!ctx?.userId) return res.status(401).json({ error: 'Unauthorized' });
    const emp = await prisma.employee.findFirst({
      where: { userId: ctx.userId },
      include: {
        user: { select: { id: true, name: true, email: true, role: true, avatar: true } },
        absences: true,
        payrollEntries: { include: { payrollRun: true, details: true } },
        orgPosition: true,
      },
    } as any);
    if (!emp) return res.status(404).json({ error: 'Employee not found' });
    const timeLogs = await prisma.timeLog.findMany({ where: { userId: ctx.userId }, orderBy: { date: 'desc' }, take: 50 });
    res.json({ ...emp, timeLogs });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Internal server error' }); }
});

// GET /api/employees/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const emp = await prisma.employee.findUnique({
      where: { id: req.params.id as string },
      include: { absences: true, payrollEntries: true, orgPosition: true },
    } as any);
    if (!emp) return res.status(404).json({ error: 'Not found' });
    res.json(emp);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Internal server error' }); }
});

// POST /api/employees
router.post('/', async (req: Request, res: Response) => {
  try {
    const errors = validate(sanitize(req.body), true);
    if (errors.length) return res.status(400).json({ error: errors.join('; ') });
    const data = sanitize(req.body);
    const emp = await prisma.employee.create({ data, include: { orgPosition: true } } as any);
    await audit('CREATE', 'Employee', `Создан: ${data.lastName} ${data.firstName}`, null, emp);
    res.status(201).json(emp);
  } catch (e: any) {
    if (e.code === 'P2002') return res.status(409).json({ error: 'Дублирование уникального поля' });
    console.error(e); res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/employees/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const ctx = authContext.getStore();
    const targetId = req.params.id as string;
    if (!isAdminOrOwner() && ctx?.userId) {
      const self = await prisma.employee.findFirst({ where: { userId: ctx.userId } });
      if (!self || self.id !== targetId) return res.status(403).json({ error: 'Access denied' });
    }
    const errors = validate(sanitize(req.body), false);
    if (errors.length) return res.status(400).json({ error: errors.join('; ') });
    const old = await prisma.employee.findUnique({ where: { id: targetId } });
    const data = sanitize(req.body);
    const emp = await prisma.employee.update({ where: { id: targetId }, data, include: { orgPosition: true } } as any);
    await audit('UPDATE', 'Employee', `Обновлён: ${targetId}`, old, emp);
    res.json(emp);
  } catch (e: any) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Not found' });
    console.error(e); res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/employees/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    if (!isAdminOrOwner()) return res.status(403).json({ error: 'Access denied' });
    const userId = req.params.id as string;
    const old = await prisma.employee.findUnique({ where: { id: userId } });
    await prisma.arcanaProjectMember.deleteMany({ where: { userId } });
    await prisma.employee.delete({ where: { id: userId } });
    await audit('DELETE', 'Employee', `Удалён: ${userId}`, old, null);
    res.json({ success: true });
  } catch (e: any) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Not found' });
    console.error(e); res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
