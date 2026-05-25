import { Router, type Request, type Response } from 'express';
import prisma from '../db';
import { authContext } from '../context';

const router = Router();

const VALID_ABSENCE_TYPES = ['vacation', 'sick', 'personal', 'maternity'];
const VALID_ABSENCE_STATUSES = ['pending', 'approved', 'rejected'];

function validateAbsenceData(body: any, isCreate = false) {
  const errors: string[] = [];
  if (isCreate) {
    if (!body.employeeId) errors.push('employeeId обязателен');
    if (!body.type || !VALID_ABSENCE_TYPES.includes(body.type)) {
      errors.push(`type должен быть одним из: ${VALID_ABSENCE_TYPES.join(', ')}`);
    }
    if (!body.startDate) errors.push('startDate обязателен');
    if (!body.endDate) errors.push('endDate обязателен');
  }
  if (body.type && !VALID_ABSENCE_TYPES.includes(body.type)) {
    errors.push(`type должен быть одним из: ${VALID_ABSENCE_TYPES.join(', ')}`);
  }
  if (body.status && !VALID_ABSENCE_STATUSES.includes(body.status)) {
    errors.push(`status должен быть одним из: ${VALID_ABSENCE_STATUSES.join(', ')}`);
  }
  if (body.startDate && body.endDate && body.startDate > body.endDate) {
    errors.push('startDate не может быть позже endDate');
  }
  return errors;
}

async function logAudit(action: string, entity: string, details?: string, oldValue?: any, newValue?: any) {
  const ctx = authContext.getStore();
  if (!ctx) return;
  try {
    await prisma.auditLogEntry.create({
      data: { userId: ctx.userId, userName: ctx.userName, action, entity, details,
        oldValue: oldValue ? JSON.stringify(oldValue) : null,
        newValue: newValue ? JSON.stringify(newValue) : null }
    });
  } catch (e) { console.error('[AUDIT] Failed:', e); }
}

const ALLOWED_FIELDS = ['employeeId', 'type', 'startDate', 'endDate', 'status', 'approvedBy', 'note'];

function sanitize(body: any) {
  const clean: any = {};
  for (const key of ALLOWED_FIELDS) {
    if (body[key] !== undefined) clean[key] = body[key];
  }
  return clean;
}

// GET /api/absences
router.get('/', async (req: Request, res: Response) => {
  try {
    const where: any = {};
    if (req.query.employeeId) where.employeeId = req.query.employeeId as string;
    const absences = await prisma.absence.findMany({ where, orderBy: { startDate: 'desc' } });
    res.json(absences);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// POST /api/absences
router.post('/', async (req: Request, res: Response) => {
  try {
    const errors = validateAbsenceData(req.body, true);
    if (errors.length) return res.status(400).json({ error: errors.join('; ') });

    const data = sanitize(req.body);
    const absence = await prisma.absence.create({ data });
    await logAudit('CREATE', 'Absence', `Создано отсутствие: ${data.type} для ${data.employeeId}`, null, absence);
    res.status(201).json(absence);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// PUT /api/absences/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const errors = validateAbsenceData(req.body, false);
    if (errors.length) return res.status(400).json({ error: errors.join('; ') });

    const old = await prisma.absence.findUnique({ where: { id: req.params.id as string } });
    const data = sanitize(req.body);
    const absence = await prisma.absence.update({
      where: { id: req.params.id as string },
      data,
    });
    await logAudit('UPDATE', 'Absence', `Обновлено отсутствие: ${absence.id}`, old, absence);
    res.json(absence);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// DELETE /api/absences/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const old = await prisma.absence.findUnique({ where: { id: req.params.id as string } });
    await prisma.absence.delete({ where: { id: req.params.id as string } });
    await logAudit('DELETE', 'Absence', `Удалено отсутствие: ${req.params.id}`, old, null);
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

export default router;
