// Canonical finance calculations — pure & testable. Audit P1 #11/#13.
//
// MONTH CONVENTION (app-wide): months are 0-based (0 = January … 11 = December),
// matching JS `Date.getMonth()`. `BudgetLine.month`, report columns and these
// helpers all use this convention. Do NOT store 1-based months.

export interface Txn {
  type: string;        // 'income' | 'expense' | 'transfer' | …
  amount: number;
  date?: string;
  isDeleted?: boolean;
}

/** 0-based month index from an ISO date string (documents the convention). */
export function monthIndex(dateStr: string): number {
  return new Date(dateStr).getMonth();
}

/** Account balance = Σ income − Σ expense (transfers & deleted ignored). */
export function accountBalance(txns: Txn[]): number {
  return txns.reduce((s, t) => {
    if (t.isDeleted) return s;
    if (t.type === 'income') return s + t.amount;
    if (t.type === 'expense') return s - t.amount;
    return s;
  }, 0);
}

/** Net P&L for a set of transactions = income − expense. */
export function netResult(txns: Txn[]): number {
  return accountBalance(txns);
}

/** Reverse-engineer opening balance from a known closing balance and the period flows (ДДС). */
export function openingBalance(closingBalance: number, periodTxns: Txn[]): number {
  return closingBalance - netResult(periodTxns);
}

/** Balance-sheet identity: assets − (liabilities + equity). 0 = balanced. */
export function balanceGap(assets: number, liabilities: number, equity: number): number {
  return assets - (liabilities + equity);
}
