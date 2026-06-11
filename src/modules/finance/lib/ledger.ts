// Double-entry ledger core — pure & testable (refactor stages 0–2).
//
// CHART OF ACCOUNTS (stage 1): existing Category.type + money Accounts map onto
// ledger account kinds. Normal side is derived deterministically:
//   debit-normal:  bank, cash, asset, expense   (grow by debit)
//   credit-normal: income, liability, equity    (grow by credit)
//
// MONTH CONVENTION reminder: months are 0-based app-wide (see financeCalc.ts).
//
// INVARIANT #1: every journal entry must balance — Σ debit === Σ credit.
// Unbalanced entries must be rejected at the service layer.

export type AccountKind = 'bank' | 'cash' | 'income' | 'expense' | 'asset' | 'liability' | 'equity';

export interface LedgerLine {
  accountRef: string;      // 'acc:<accountId>' for money accounts, 'cat:<categoryId>' for P&L/BS categories
  accountKind: AccountKind;
  debit: number;           // exactly one of debit/credit is non-zero
  credit: number;
}

export const DEBIT_NORMAL: ReadonlySet<AccountKind> = new Set(['bank', 'cash', 'asset', 'expense']);

export function normalSide(kind: AccountKind): 'debit' | 'credit' {
  return DEBIT_NORMAL.has(kind) ? 'debit' : 'credit';
}

/** Map a money Account record to a ledger kind. */
export function accountKindOf(accType?: string | null): AccountKind {
  return accType === 'cash' || accType === 'Наличный' ? 'cash' : 'bank';
}

export interface TxLike {
  id: string;
  type: string;            // 'income' | 'expense' (transfers handled separately)
  amount: number;
  accountId?: string | null;
  categoryId?: string | null;
  categoryType?: string | null;  // Category.type of categoryId
  accountType?: string | null;   // Account.type of accountId
}

/**
 * Posting rules (stage 2):
 *   expense: Дт category(expense) / Кт money account
 *   income:  Дт money account     / Кт category(income)
 * Returns [] when the transaction cannot be posted (missing refs / unsupported type).
 */
export function buildEntries(tx: TxLike): LedgerLine[] {
  const amt = Math.abs(Number(tx.amount) || 0);
  if (!amt || !tx.accountId || !tx.categoryId) return [];
  const accKind = accountKindOf(tx.accountType);
  const accRef = `acc:${tx.accountId}`;
  const catRef = `cat:${tx.categoryId}`;
  if (tx.type === 'expense') {
    return [
      { accountRef: catRef, accountKind: 'expense', debit: amt, credit: 0 },
      { accountRef: accRef, accountKind: accKind, debit: 0, credit: amt },
    ];
  }
  if (tx.type === 'income') {
    return [
      { accountRef: accRef, accountKind: accKind, debit: amt, credit: 0 },
      { accountRef: catRef, accountKind: 'income', debit: 0, credit: amt },
    ];
  }
  return [];
}

/** INVARIANT #1: Σ debit === Σ credit (to a 0.005 rounding tolerance). */
export function isBalanced(lines: LedgerLine[]): boolean {
  if (!lines.length) return false;
  const d = lines.reduce((s, l) => s + l.debit, 0);
  const c = lines.reduce((s, l) => s + l.credit, 0);
  return Math.abs(d - c) < 0.005;
}

export interface TrialBalance { debit: number; credit: number; gap: number; }

/** Trial balance over any set of lines; gap must be ~0 for a healthy ledger. */
export function trialBalance(lines: LedgerLine[]): TrialBalance {
  const debit = lines.reduce((s, l) => s + l.debit, 0);
  const credit = lines.reduce((s, l) => s + l.credit, 0);
  return { debit, credit, gap: debit - credit };
}

/** Balance of one ledger account: signed by its normal side. */
export function accountBalance(lines: LedgerLine[], accountRef: string, kind: AccountKind): number {
  const net = lines.filter(l => l.accountRef === accountRef)
    .reduce((s, l) => s + l.debit - l.credit, 0);
  return normalSide(kind) === 'debit' ? net : -net;
}

/** Real retained earnings (no plug): Σ income credits − Σ expense debits. */
export function retainedEarnings(lines: LedgerLine[]): number {
  const income = lines.filter(l => l.accountKind === 'income').reduce((s, l) => s + l.credit - l.debit, 0);
  const expense = lines.filter(l => l.accountKind === 'expense').reduce((s, l) => s + l.debit - l.credit, 0);
  return income - expense;
}
