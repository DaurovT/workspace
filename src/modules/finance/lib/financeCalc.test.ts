import { describe, it, expect } from 'vitest';
import { monthIndex, accountBalance, netResult, openingBalance, balanceGap } from './financeCalc';

describe('monthIndex — 0-based convention', () => {
  it('January -> 0', () => expect(monthIndex('2026-01-15')).toBe(0));
  it('December -> 11', () => expect(monthIndex('2026-12-31')).toBe(11));
});

describe('accountBalance', () => {
  it('income adds, expense subtracts', () => {
    expect(accountBalance([{ type: 'income', amount: 100 }, { type: 'expense', amount: 30 }])).toBe(70);
  });
  it('ignores deleted and transfers', () => {
    expect(accountBalance([
      { type: 'income', amount: 100, isDeleted: true },
      { type: 'transfer', amount: 50 },
      { type: 'expense', amount: 20 },
    ])).toBe(-20);
  });
  it('matches БОК kassa closing (925 594 000 in − 900 529 655 out = 25 064 345)', () => {
    expect(accountBalance([{ type: 'income', amount: 925594000 }, { type: 'expense', amount: 900529655 }])).toBe(25064345);
  });
});

describe('netResult', () => {
  it('equals income − expense', () => {
    expect(netResult([{ type: 'income', amount: 2317612000 }, { type: 'expense', amount: 2251373686 }])).toBe(66238314);
  });
});

describe('openingBalance (ДДС reverse-engineering)', () => {
  it('opening = closing − period net', () => {
    expect(openingBalance(70, [{ type: 'income', amount: 100 }, { type: 'expense', amount: 30 }])).toBe(0);
  });
  it('positive opening when closing exceeds flow', () => {
    expect(openingBalance(70, [{ type: 'income', amount: 50 }])).toBe(20);
  });
});

describe('balanceGap (balance-sheet identity)', () => {
  it('balanced -> 0', () => expect(balanceGap(1000, 600, 400)).toBe(0));
  it('returns signed gap', () => expect(balanceGap(1000, 600, 300)).toBe(100));
});
