import { Router, type Request, type Response } from 'express';
import prisma from '../db';
import { calculatePayrollRun } from '../services/payrollService';
import { authContext } from '../context';

const router = Router();

async function logAudit(action: string, entity: string, details?: string) {
  const ctx = authContext.getStore();
  if (!ctx) return;
  try {
    await prisma.auditLogEntry.create({
      data: { userId: ctx.userId, userName: ctx.userName, action, entity, details }
    });
  } catch (e) { console.error('[AUDIT] Failed:', e); }
}

// GET /api/payroll — list all payroll runs
router.get('/', async (_req: Request, res: Response) => {
  try {
    const runs = await prisma.payrollRun.findMany({
      include: { entries: { include: { details: true } } },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
    res.json(runs);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/payroll/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const run = await prisma.payrollRun.findUnique({
      where: { id: req.params.id as string },
      include: { entries: { include: { details: true } } },
    });
    if (!run) return res.status(404).json({ error: 'Not found' });
    res.json(run);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/payroll — create a payroll run & auto-calculate entries
router.post('/', async (req: Request, res: Response) => {
  try {
    const { month, year, type = 'final' } = req.body;

    // Get all active employees with their absences for the specific month
    const employeesData = await prisma.employee.findMany({ 
      where: { status: 'active' },
      include: {
        absences: {
          where: {
            status: 'approved',
            startDate: { startsWith: `${year}-${String(month).padStart(2, '0')}` }
          }
        }
      }
    });

    const monthStr = `${year}-${String(month).padStart(2, '0')}`;
    const allTimeLogs = await prisma.timeLog.findMany({
      where: { date: { startsWith: monthStr } }
    });

    const employees = employeesData.map(emp => ({
      ...emp,
      timeLogs: allTimeLogs.filter(log => log.userId === emp.userId)
    }));

    let previousAdvances: Record<string, number> = {};
    if (type === 'final') {
      const advanceRun = await prisma.payrollRun.findFirst({
        where: { month, year, type: 'advance', status: { in: ['paid', 'approved'] } },
        include: { entries: true }
      });
      if (advanceRun) {
        for (const entry of advanceRun.entries) {
          previousAdvances[entry.employeeId] = entry.netAmount;
        }
      }
    }

    const { totalGross, totalNet, entries } = calculatePayrollRun(month, year, type, employees as any, previousAdvances);

    const run = await prisma.payrollRun.create({
      data: {
        month,
        year,
        type,
        status: 'calculated',
        totalGross,
        totalNet,
        createdBy: req.body.createdBy || null,
        entries: { create: entries },
      },
      include: { 
        entries: {
          include: { details: true }
        } 
      },
    });

    await logAudit('CREATE', 'PayrollRun', `Рассчитана ведомость за ${month}/${year} (${type}), итого к выплате: ${totalNet}`);
    res.status(201).json(run);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/payroll/:id — update run status or entry details
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { entries, ...runData } = req.body;

    const previousRun = await prisma.payrollRun.findUnique({ where: { id: req.params.id as string } });
    
    const run = await prisma.payrollRun.update({
      where: { id: req.params.id as string },
      data: runData,
      include: { entries: true },
    });

    // Phase 3 Integration: When marked as paid, create an expense transaction
    if (runData.status === 'paid' && previousRun?.status !== 'paid') {
      const legalEntity = await prisma.legalEntity.findFirst();
      const account = await prisma.account.findFirst();
      let hrCategory = await prisma.category.findFirst({ where: { name: 'Зарплаты и ФОТ' } });
      
      if (!hrCategory) {
        const parent = await prisma.category.findFirst({ where: { name: 'Операционные расходы' } });
        hrCategory = await prisma.category.create({
          data: { name: 'Зарплаты и ФОТ', type: 'expense', activity: 'operating', parentId: parent?.id }
        });
      }

      if (account) {
        const tx = await prisma.transaction.create({
          data: {
            date: new Date().toISOString().split('T')[0],
            amount: run.totalNet,
            type: 'expense',
            accountId: account.id,
            categoryId: hrCategory.id,
            isPaidConfirmed: true,
            description: `Выплата зарплаты за ${run.month}/${run.year}`,
          }
        });

        // Update account balance
        await prisma.account.update({
          where: { id: account.id },
          data: { balance: { decrement: run.totalNet } }
        });
      }
    }

    await logAudit('UPDATE', 'PayrollRun', `Статус ведомости ${run.id} изменён на: ${runData.status || 'обновление'}`);
    res.json(run);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/payroll/entry/:id — update a single payroll entry
router.put('/entry/:id', async (req: Request, res: Response) => {
  try {
    const entry = await prisma.payrollEntry.update({
      where: { id: req.params.id as string },
      data: req.body,
    });
    // Recalculate run totals
    const allEntries = await prisma.payrollEntry.findMany({ where: { payrollRunId: entry.payrollRunId } });
    const totalGross = allEntries.reduce((s, e) => s + Number(e.baseSalary) + Number(e.bonus), 0);
    const totalNet = allEntries.reduce((s, e) => s + Number(e.netAmount), 0);
    await prisma.payrollRun.update({
      where: { id: entry.payrollRunId },
      data: { totalGross, totalNet },
    });
    res.json(entry);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/payroll/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await logAudit('DELETE', 'PayrollRun', `Удалена ведомость ${req.params.id}`);
    await prisma.payrollRun.delete({ where: { id: req.params.id as string } });
    res.status(204).send();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
