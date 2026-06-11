import { Router, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../db';
import { postTransaction, repostTransaction, unpostTransaction, LEDGER_ON } from '../services/ledgerService';

const router = Router();

async function checkLockDate(dateStr?: string) {
  if (!dateStr) return;
  const settings = await prisma.appSettings.findUnique({ where: { id: 'global' } });
  if (settings?.lockDate && dateStr <= settings.lockDate) {
    throw new Error(`Period is locked. Cannot modify transactions on or before ${settings.lockDate}.`);
  }
}

async function applyExchangeRate(data: any, existingTx?: any) {
  if (!data.amount || !data.accountId) return data;
  
  const reqAmount = new Prisma.Decimal(data.amount);
  
  if (existingTx && reqAmount.equals(existingTx.amount) && data.accountId === existingTx.accountId) {
    data.exchangeRate = existingTx.exchangeRate;
    data.baseAmount = existingTx.baseAmount;
    return data;
  }

  const account = await prisma.account.findUnique({ where: { id: data.accountId } });
  if (!account) return data;
  
  const settings = await prisma.appSettings.findUnique({ where: { id: 'global' } });
  const baseCurr = settings?.baseCurrency || 'UZS';
  
  if (account.currency === baseCurr) {
    data.exchangeRate = new Prisma.Decimal(1);
    data.baseAmount = reqAmount;
  } else {
    if (existingTx && existingTx.exchangeRate) {
        const oldAccount = await prisma.account.findUnique({ where: { id: existingTx.accountId } });
        if (oldAccount && oldAccount.currency === account.currency) {
            data.exchangeRate = existingTx.exchangeRate;
            data.baseAmount = reqAmount.mul(existingTx.exchangeRate);
            return data;
        }
    }
    const fx = await prisma.exchangeRate.findUnique({ where: { currency: account.currency } });
    const rate = fx ? fx.rate : new Prisma.Decimal(1);
    data.exchangeRate = rate;
    data.baseAmount = reqAmount.mul(rate);
  }
  return data;
}

function getBalanceFactor(type: string, parentId?: string | null): number {
  if (type === 'income') return 1;
  if (type === 'expense') return -1;
  if (type === 'transfer') return parentId ? 1 : -1;
  return 0;
}

// GET /api/transactions  (with optional filters)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { type, accountId, projectId, dealId, contractorId, dateFrom, dateTo, search, limit, offset } = req.query;

    const where = {
        isDeleted: false,
        ...(type ? { type: String(type) } : {}),
        ...(accountId ? { accountId: String(accountId) } : {}),
        ...(projectId ? { projectId: String(projectId) } : {}),
        ...(dealId ? { dealId: String(dealId) } : {}),
        ...(contractorId ? { contractorId: String(contractorId) } : {}),
        ...(dateFrom || dateTo
          ? {
              date: {
                ...(dateFrom ? { gte: String(dateFrom) } : {}),
                ...(dateTo ? { lte: String(dateTo) } : {}),
              },
            }
          : {}),
        ...(search
          ? {
              OR: [
                { description: { contains: String(search), mode: 'insensitive' as const } },
                { contractor: { name: { contains: String(search), mode: 'insensitive' as const } } },
              ],
            }
          : {}),
    };

    const total = await prisma.transaction.count({ where });

    const transactions = await prisma.transaction.findMany({
      where,
      include: { category: true, account: true, contractor: true, project: true, deal: true },
      orderBy: { date: 'desc' },
      ...(limit ? { take: Number(limit) } : {}),
      ...(offset ? { skip: Number(offset) } : {}),
    });

    if (limit || offset) {
      res.json({ data: transactions, total });
    } else {
      res.json(transactions); // Fallback for legacy calls that expect an array directly
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/transactions/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const tx = await prisma.transaction.findUnique({
      where: { id: String(req.params.id) },
      include: { category: true, account: true, contractor: true, project: true, deal: true },
    });
    if (!tx) return res.status(404).json({ error: 'Not found' });
    res.json(tx);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/transactions
router.post('/', async (req: Request, res: Response) => {
  try {
    const { category, account, contractor, project, deal, ...data } = req.body;
    await checkLockDate(data.date);
    const enrichedData = await applyExchangeRate(data);
    
    const tx = await prisma.$transaction(async (txPrisma) => {
      const createdTx = await txPrisma.transaction.create({ data: enrichedData });
      
      if (createdTx.accountId) {
        const factor = getBalanceFactor(createdTx.type, createdTx.parentId);
        if (factor !== 0) {
          await txPrisma.account.update({
            where: { id: createdTx.accountId },
            data: { balance: { increment: createdTx.amount.mul(factor) } }
          });
        }
      }
      if (LEDGER_ON) {
        const acc = createdTx.accountId ? await txPrisma.account.findUnique({ where: { id: createdTx.accountId }, select: { type: true } }) : null;
        await postTransaction(txPrisma, createdTx, acc?.type);
      }
      return createdTx;
    });
    
    res.status(201).json(tx);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/transactions/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { category, account, contractor, project, deal, ...data } = req.body;
    const existingTx = await prisma.transaction.findUnique({ where: { id: String(req.params.id) } });
    if (existingTx) await checkLockDate(existingTx.date);
    if (data.date) await checkLockDate(data.date);
    
    const enrichedData = await applyExchangeRate(data, existingTx);
    
    const tx = await prisma.$transaction(async (txPrisma) => {
      // Revert old balance
      if (existingTx && existingTx.accountId) {
        const oldFactor = getBalanceFactor(existingTx.type, existingTx.parentId);
        if (oldFactor !== 0) {
          await txPrisma.account.update({
            where: { id: existingTx.accountId },
            data: { balance: { decrement: existingTx.amount.mul(oldFactor) } }
          });
        }
      }
      
      const updatedTx = await txPrisma.transaction.update({ where: { id: String(req.params.id) }, data: enrichedData });
      
      // Apply new balance
      if (updatedTx.accountId) {
        const newFactor = getBalanceFactor(updatedTx.type, updatedTx.parentId);
        if (newFactor !== 0) {
          await txPrisma.account.update({
            where: { id: updatedTx.accountId },
            data: { balance: { increment: updatedTx.amount.mul(newFactor) } }
          });
        }
      }
      if (LEDGER_ON) {
        const acc = updatedTx.accountId ? await txPrisma.account.findUnique({ where: { id: updatedTx.accountId }, select: { type: true } }) : null;
        await repostTransaction(txPrisma, updatedTx, acc?.type);
      }
      return updatedTx;
    });

    res.json(tx);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/transactions/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const existingTx = await prisma.transaction.findUnique({ where: { id: String(req.params.id) } });
    if (existingTx) await checkLockDate(existingTx.date);
    
    await prisma.$transaction(async (txPrisma) => {
      // Revert balance on delete
      if (existingTx && existingTx.accountId) {
        const oldFactor = getBalanceFactor(existingTx.type, existingTx.parentId);
        if (oldFactor !== 0) {
          await txPrisma.account.update({
            where: { id: existingTx.accountId },
            data: { balance: { decrement: existingTx.amount.mul(oldFactor) } }
          });
        }
      }
      
      // Soft delete
      await txPrisma.transaction.update({
        where: { id: String(req.params.id) },
        data: { isDeleted: true, deletedAt: new Date() }
      });
      if (LEDGER_ON) await unpostTransaction(txPrisma, String(req.params.id));
    });
    
    res.status(204).send();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
