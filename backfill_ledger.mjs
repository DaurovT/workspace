// Stage 3: idempotent backfill of all transactions into LedgerEntry + reconciliation.
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const num = (v) => Number(v) || 0;

// --- posting rules (mirror of src/modules/finance/lib/ledger.ts) ---
function buildEntries(tx, accountType) {
  const amt = Math.abs(num(tx.amount));
  if (!amt || !tx.accountId || !tx.categoryId) return [];
  const accKind = (accountType === 'cash' || accountType === 'Наличный') ? 'cash' : 'bank';
  const accRef = `acc:${tx.accountId}`, catRef = `cat:${tx.categoryId}`;
  if (tx.type === 'expense') return [
    { accountRef: catRef, accountKind: 'expense', debit: amt, credit: 0 },
    { accountRef: accRef, accountKind: accKind, debit: 0, credit: amt }];
  if (tx.type === 'income') return [
    { accountRef: accRef, accountKind: accKind, debit: amt, credit: 0 },
    { accountRef: catRef, accountKind: 'income', debit: 0, credit: amt }];
  return [];
}

const accounts = await prisma.account.findMany();
const accType = new Map(accounts.map(a => [a.id, a.type]));
const txs = await prisma.transaction.findMany({ where: { isDeleted: false } });

let posted = 0, skippedExisting = 0, notPostable = 0;
for (const tx of txs) {
  const existing = await prisma.ledgerEntry.count({ where: { transactionId: tx.id } });
  if (existing > 0) { skippedExisting++; continue; }     // idempotency guard
  const lines = buildEntries(tx, accType.get(tx.accountId));
  if (!lines.length) { notPostable++; continue; }
  const d = lines.reduce((s, l) => s + l.debit, 0), c = lines.reduce((s, l) => s + l.credit, 0);
  if (Math.abs(d - c) >= 0.005) throw new Error(`unbalanced tx ${tx.id}`);
  await prisma.ledgerEntry.createMany({
    data: lines.map(l => ({ transactionId: tx.id, ...l })),
  });
  posted++;
}

// --- reconciliation ---
const all = await prisma.ledgerEntry.findMany();
const D = all.reduce((s, e) => s + num(e.debit), 0);
const C = all.reduce((s, e) => s + num(e.credit), 0);

const perAcc = new Map();
for (const e of all) {
  if (!e.accountRef.startsWith('acc:')) continue;
  const id = e.accountRef.slice(4);
  perAcc.set(id, (perAcc.get(id) ?? 0) + num(e.debit) - num(e.credit));
}
const recon = [];
for (const a of accounts) {
  const ledgerBal = perAcc.get(a.id) ?? 0;
  const stored = num(a.balance);
  recon.push({ name: a.name, ledger: Math.round(ledgerBal), stored: Math.round(stored), match: Math.abs(ledgerBal - stored) < 1 });
}
const inc = all.filter(e => e.accountKind === 'income').reduce((s, e) => s + num(e.credit) - num(e.debit), 0);
const exp = all.filter(e => e.accountKind === 'expense').reduce((s, e) => s + num(e.debit) - num(e.credit), 0);

console.log(JSON.stringify({
  backfill: { txTotal: txs.length, posted, skippedExisting, notPostable, entries: all.length },
  trialBalance: { debit: Math.round(D), credit: Math.round(C), gap: Math.round(D - C) },
  retainedEarnings: Math.round(inc - exp),
  accounts: recon,
}, null, 1));
await prisma.$disconnect();
