import { Router, type Request, type Response } from 'express';
import prisma from '../db';
import { authContext } from '../context';

const router = Router();

// ── Validation helpers ──────────────────────────────────────────────
const VALID_SALARY_TYPES = ['monthly', 'hourly'];
const VALID_STATUSES = ['active', 'on_leave', 'terminated'];
const VALID_TAX_PROFILES = ['standard', 'non_resident', 'b2b'];

function validateEmployeeData(body: any, isCreate = false) {
  const errors: string[] = [];

  if (isCreate) {
    if (!body.userId) errors.push('userId обязателен');
    if (!body.hireDate) errors.push('hireDate обязателен');
    if (body.salary == null || typeof body.salary !== 'number' || body.salary < 0) {
      errors.push('salary должен быть положительным числом');
    }
  }

  if (body.salaryType && !VALID_SALARY_TYPES.includes(body.salaryType)) {
    errors.push(`salaryType должен быть одним из: ${VALID_SALARY_TYPES.join(', ')}`);
  }
  if (body.status && !VALID_STATUSES.includes(body.status)) {
    errors.push(`status должен быть одним из: ${VALID_STATUSES.join(', ')}`);
  }
  if (body.taxProfile && !VALID_TAX_PROFILES.includes(body.taxProfile)) {
    errors.push(`taxProfile должен быть одним из: ${VALID_TAX_PROFILES.join(', ')}`);
  }
  if (body.advancePct != null && (typeof body.advancePct !== 'number' || body.advancePct < 0 || body.advancePct > 100)) {
    errors.push('advancePct должен быть числом от 0 до 100');
  }
  if (body.salary != null && (typeof body.salary !== 'number' || body.salary < 0)) {
    errors.push('salary должен быть положительным числом');
  }

  return errors;
}

// ── Audit helper ────────────────────────────────────────────────────
async function logAudit(action: string, entity: string, details?: string, oldValue?: any, newValue?: any) {
  const ctx = authContext.getStore();
  if (!ctx) return;
  try {
    await prisma.auditLogEntry.create({
      data: {
        userId: ctx.userId,
        userName: ctx.userName,
        action,
        entity,
        details,
        oldValue: oldValue ? JSON.stringify(oldValue) : null,
        newValue: newValue ? JSON.stringify(newValue) : null,
      }
    });
  } catch (e) {
    console.error('[AUDIT] Failed to log:', e);
  }
}

// Whitelist of allowed fields for create/update
const ALLOWED_FIELDS = [
  'userId', 'department', 'position', 'hireDate', 'salary', 'salaryType',
  'currency', 'contractorId', 'status', 'terminationDate', 'bankAccount',
  'notes', 'taxProfile', 'advancePct'
];

function sanitizeBody(body: any) {
  const clean: any = {};
  for (const key of ALLOWED_FIELDS) {
    if (body[key] !== undefined) clean[key] = body[key];
  }
  return clean;
}

// GET /api/employees/kpi — aggregate time data for HR dashboard
router.get('/kpi', async (_req: Request, res: Response) => {
  try {
    const employees = await prisma.employee.findMany({
      where: { status: 'active' },
      include: { user: { select: { id: true, name: true } } },
    });

    // Get current month time logs
    const now = new Date();
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const timeLogs = await prisma.timeLog.findMany({
      where: { date: { startsWith: monthStr } },
    });

    // Get completed tasks count per user
    const completedTasks = await prisma.arcanaTask.groupBy({
      by: ['assigneeId'],
      where: { status: 'done' },
      _count: { id: true },
    });

    const kpi = employees.map(emp => {
      const userLogs = timeLogs.filter(l => l.userId === emp.userId);
      const totalHours = userLogs.reduce((s, l) => s + Number(l.hours), 0);
      const tasksDone = completedTasks.find(t => t.assigneeId === emp.userId)?._count?.id || 0;

      return {
        employeeId: emp.id,
        userId: emp.userId,
        name: emp.user.name,
        department: emp.department,
        salary: emp.salary,
        hoursThisMonth: totalHours,
        tasksDone,
      };
    });

    res.json(kpi);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// GET /api/employees
router.get('/', async (_req: Request, res: Response) => {
  try {
    const employees = await prisma.employee.findMany({
      include: { absences: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(employees);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// GET /api/employees/me
router.get('/me', async (req: Request, res: Response) => {
  try {
    const ctx = authContext.getStore();
    if (!ctx || !ctx.userId) return res.status(401).json({ error: 'Unauthorized' });
    const userId = ctx.userId;
    const employee = await prisma.employee.findFirst({
      where: { userId },
      include: {
        user: { select: { id: true, name: true, email: true, role: true, avatar: true } },
        absences: true,
        payrollEntries: { include: { payrollRun: true, details: true } },
      },
    });
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    
    const timeLogs = await prisma.timeLog.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 50
    });
    
    res.json({ ...employee, timeLogs });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// GET /api/employees/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: req.params.id as string },
      include: { absences: true, payrollEntries: true },
    });
    if (!employee) return res.status(404).json({ error: 'Not found' });
    res.json(employee);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// POST /api/employees
router.post('/', async (req: Request, res: Response) => {
  try {
    const errors = validateEmployeeData(req.body, true);
    if (errors.length) return res.status(400).json({ error: errors.join('; ') });

    const data = sanitizeBody(req.body);
    const employee = await prisma.employee.create({ data });
    await logAudit('CREATE', 'Employee', `Создан сотрудник: ${data.userId}`, null, employee);
    res.status(201).json(employee);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// PUT /api/employees/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const errors = validateEmployeeData(req.body, false);
    if (errors.length) return res.status(400).json({ error: errors.join('; ') });

    const old = await prisma.employee.findUnique({ where: { id: req.params.id as string } });
    const data = sanitizeBody(req.body);
    const employee = await prisma.employee.update({
      where: { id: req.params.id as string },
      data,
    });
    await logAudit('UPDATE', 'Employee', `Обновлён сотрудник: ${employee.userId}`, old, employee);
    res.json(employee);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// DELETE /api/employees/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const old = await prisma.employee.findUnique({ where: { id: req.params.id as string } });
    await prisma.employee.delete({ where: { id: req.params.id as string } });
    await logAudit('DELETE', 'Employee', `Удалён сотрудник: ${old?.userId || req.params.id}`, old, null);
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

export default router;
