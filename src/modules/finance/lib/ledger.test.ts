import { describe, it, expect } from 'vitest';
import { buildEntries, isBalanced, trialBalance, accountBalance, retainedEarnings, normalSide } from './ledger';

const expenseTx = { id: 't1', type: 'expense', amount: 100, accountId: 'A', categoryId: 'C', accountType: 'cash', categoryType: 'expense' };
const incomeTx  = { id: 't2', type: 'income',  amount: 250, accountId: 'A', categoryId: 'R', accountType: null, categoryType: 'income' };

describe('normal sides (chart of accounts)', () => {
  it('bank/cash/asset/expense are debit-normal', () => {
    expect(normalSide('cash')).toBe('debit');
    expect(normalSide('expense')).toBe('debit');
  });
  it('income/liability/equity are credit-normal', () => {
    expect(normalSide('income')).toBe('credit');
    expect(normalSide('liability')).toBe('credit');
  });
});

describe('posting rules', () => {
  it('expense: Дт category / Кт account', () => {
    const e = buildEntries(expenseTx);
    expect(e).toHaveLength(2);
    expect(e[0]).toMatchObject({ accountRef: 'cat:C', debit: 100, credit: 0 });
    expect(e[1]).toMatchObject({ accountRef: 'acc:A', debit: 0, credit: 100 });
  });
  it('income: Дт account / Кт category', () => {
    const e = buildEntries(incomeTx);
    expect(e[0]).toMatchObject({ accountRef: 'acc:A', debit: 250 });
    expect(e[1]).toMatchObject({ accountRef: 'cat:R', credit: 250 });
  });
  it('missing refs -> not postable', () => {
    expect(buildEntries({ ...expenseTx, accountId: null })).toHaveLength(0);
    expect(buildEntries({ ...expenseTx, amount: 0 })).toHaveLength(0);
  });
});

describe('INVARIANT: entries balance', () => {
  it('generated entries always balance', () => {
    expect(isBalanced(buildEntries(expenseTx))).toBe(true);
    expect(isBalanced(buildEntries(incomeTx))).toBe(true);
  });
  it('unbalanced rejected', () => {
    expect(isBalanced([{ accountRef: 'x', accountKind: 'cash', debit: 100, credit: 0 }])).toBe(false);
    expect(isBalanced([])).toBe(false);
  });
});

describe('trial balance & derived balances', () => {
  const lines = [...buildEntries(expenseTx), ...buildEntries(incomeTx)];
  it('Σ debit === Σ credit over the whole ledger', () => {
    const tb = trialBalance(lines);
    expect(tb.debit).toBe(350);
    expect(Math.abs(tb.gap)).toBeLessThan(0.005);
  });
  it('money account balance = income - expense (БОК kassa case)', () => {
    expect(accountBalance(lines, 'acc:A', 'cash')).toBe(150);
  });
  it('retained earnings has no plug: income - expense', () => {
    expect(retainedEarnings(lines)).toBe(150);
  });
  it('accounting identity holds: assets = liabilities + equity', () => {
    const assets = accountBalance(lines, 'acc:A', 'cash');
    expect(assets).toBe(retainedEarnings(lines)); // no liabilities in this set
  });
});
