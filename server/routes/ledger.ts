import { Router, type Request, type Response } from 'express';
import prisma from '../db';

const router = Router();
const num = (v: any) => Number(v) || 0;

// GET /api/ledger/trial-balance — Σ debit vs Σ credit + plug-free equity (stage 4)
router.get('/trial-balance', async (_req: Request, res: Response) => {
  try {
    const all = await prisma.ledgerEntry.findMany();
    const debit = all.reduce((s, e) => s + num(e.debit), 0);
    const credit = all.reduce((s, e) => s + num(e.credit), 0);
    const income = all.filter(e => e.accountKind === 'income').reduce((s, e) => s + num(e.credit) - num(e.debit), 0);
    const expense = all.filter(e => e.accountKind === 'expense').reduce((s, e) => s + num(e.debit) - num(e.credit), 0);
    res.json({
      entries: all.length, debit, credit, gap: debit - credit,
      balanced: Math.abs(debit - credit) < 1,
      retainedEarnings: income - expense,   // real equity component, no plug
    });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Internal server error' }); }
});

// GET /api/ledger/reconcile — ledger-derived balance vs stored Account.balance
router.get('/reconcile', async (_req: Request, res: Response) => {
  try {
    const [accounts, entries] = await Promise.all([
      prisma.account.findMany(),
      prisma.ledgerEntry.findMany({ where: { accountRef: { startsWith: 'acc:' } } }),
    ]);
    const per = new Map<string, number>();
    for (const e of entries) {
      const id = e.accountRef.slice(4);
      per.set(id, (per.get(id) ?? 0) + num(e.debit) - num(e.credit));
    }
    const rows = accounts.map(a => {
      const ledger = per.get(a.id) ?? 0;
      const stored = num(a.balance);
      return { id: a.id, name: a.name, ledger, stored, diff: ledger - stored, match: Math.abs(ledger - stored) < 1 };
    });
    res.json({ allMatch: rows.every(r => r.match), accounts: rows });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Internal server error' }); }
});

// POST /api/ledger/sync-balances — set Account.balance = ledger-derived (cache refresh)
router.post('/sync-balances', async (_req: Request, res: Response) => {
  try {
    const entries = await prisma.ledgerEntry.findMany({ where: { accountRef: { startsWith: 'acc:' } } });
    const per = new Map<string, number>();
    for (const e of entries) {
      const id = e.accountRef.slice(4);
      per.set(id, (per.get(id) ?? 0) + num(e.debit) - num(e.credit));
    }
    const accounts = await prisma.account.findMany();
    const updated: any[] = [];
    for (const a of accounts) {
      const balance = per.get(a.id) ?? 0;
      await prisma.account.update({ where: { id: a.id }, data: { balance } });
      updated.push({ id: a.id, name: a.name, balance });
    }
    res.json({ updated: updated.length, accounts: updated });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Internal server error' }); }
});

export default router;
