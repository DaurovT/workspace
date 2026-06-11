import { describe, it, expect } from 'vitest';
import { openingBalance, netResult, monthIndex, type Txn } from './financeCalc';
import { buildEntries, trialBalance, retainedEarnings } from './ledger';

// Real БОК jan–apr 2026 figures (income = turnover+other, expense = fact)
const MONTHS: { m: string; income: number; expense: number }[] = [
  { m: '2026-01-31', income: 2317612000, expense: 2251373686 },
  { m: '2026-02-28', income: 2364930000, expense: 2392502512 },
  { m: '2026-03-31', income: 2398375000, expense: 2875797950 },
  { m: '2026-04-30', income: 2913295000, expense: 2614421853 },
];
const txns: Txn[] = MONTHS.flatMap(({ m, income, expense }) => [
  { type: 'income', amount: income, date: m },
  { type: 'expense', amount: expense, date: m },
]);

describe('ДДС: цепочка остатков по месяцам (БОК факт)', () => {
  it('closing(n) = opening(n) + net(n), сцеплено через все месяцы', () => {
    let opening = 0; // открытие года = 0 (решение владельца)
    const closings: number[] = [];
    for (const { m } of MONTHS) {
      const monthTx = txns.filter(t => t.date === m);
      const closing = opening + netResult(monthTx);
      closings.push(closing);
      opening = closing;
    }
    expect(closings.map(Math.round)).toEqual([66238314, 38665802, -438757148, -139884001]);
  });
  it('конец апреля == накопленный поток (anchor ДДС/Баланса)', () => {
    expect(Math.round(netResult(txns))).toBe(-139884001);
  });
  it('openingBalance восстанавливает открытие из закрытия (reverse ДДС)', () => {
    const closing = netResult(txns);
    expect(openingBalance(closing, txns)).toBe(0);
  });
});

describe('ОПУ ↔ ledger: один источник правды', () => {
  it('retainedEarnings из проводок == netResult из транзакций', () => {
    const lines = txns.flatMap((t, i) => buildEntries({
      id: 't' + i, type: t.type, amount: t.amount, accountId: 'A', categoryId: 'C',
    }));
    expect(Math.round(retainedEarnings(lines))).toBe(Math.round(netResult(txns)));
    expect(Math.abs(trialBalance(lines).gap)).toBeLessThan(0.005);
  });
});

describe('месячная корзина: 0-based индекс', () => {
  it('каждая дата БОК попадает в свой 0-based месяц', () => {
    expect(MONTHS.map(x => monthIndex(x.m))).toEqual([0, 1, 2, 3]);
  });
});
