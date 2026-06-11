import { describe, it, expect } from 'vitest';
import { buildCols, sumTx, type TxLite } from './paymentCalendarCols';

const NOW = new Date('2026-06-15');

describe('buildCols', () => {
  it('По месяцам: 2 summary + 12 месячных, месяцы 0-based', () => {
    const cols = buildCols('По месяцам', 2026, 0, NOW);
    expect(cols).toHaveLength(14);
    expect(cols[2].month).toBe(0);
    expect(cols[13].month).toBe(11);
    expect(cols.find(c => c.isToday)?.month).toBe(5); // июнь
  });
  it('По кварталам: 4 квартала со стартовыми месяцами 0,3,6,9', () => {
    const q = buildCols('По кварталам', 2026, 0, NOW).filter(c => !c.isSummary);
    expect(q.map(c => c.month)).toEqual([0, 3, 6, 9]);
  });
  it('По дням: дни февраля 2026 = 28', () => {
    const d = buildCols('По дням', 2026, 1, NOW).filter(c => !c.isSummary);
    expect(d).toHaveLength(28);
  });
});

describe('sumTx', () => {
  const txs: TxLite[] = [
    { categoryId: 'C', type: 'expense', date: '2026-01-15', amount: 10 },
    { categoryId: 'C', type: 'expense', date: '2026-02-15', amount: 20 },
    { categoryId: 'C', type: 'expense', date: '2026-03-15', amount: 30 },
    { categoryId: 'C', type: 'expense', date: '2026-04-15', amount: 40 },
    { categoryId: 'X', type: 'expense', date: '2026-01-15', amount: 999 },
  ];
  it('месячная колонка: только свой месяц', () => {
    const cols = buildCols('По месяцам', 2026, 0, NOW);
    const feb = cols.find(c => !c.isSummary && c.month === 1)!;
    expect(sumTx(txs, 'C', 'expense', feb, 'По месяцам')).toBe(20);
  });
  it('REGRESSION: квартал суммирует все 3 месяца (был баг: только первый)', () => {
    const cols = buildCols('По кварталам', 2026, 0, NOW);
    const q1 = cols.find(c => !c.isSummary && c.month === 0)!;
    expect(sumTx(txs, 'C', 'expense', q1, 'По кварталам')).toBe(60); // 10+20+30
    const q2 = cols.find(c => !c.isSummary && c.month === 3)!;
    expect(sumTx(txs, 'C', 'expense', q2, 'По кварталам')).toBe(40);
  });
  it('summary-колонка: весь год', () => {
    const sum = buildCols('По месяцам', 2026, 0, NOW)[0];
    expect(sumTx(txs, 'C', 'expense', sum, 'По месяцам')).toBe(100);
  });
});
