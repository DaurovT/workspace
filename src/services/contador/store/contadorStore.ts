import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AccountType = 'ACTIVE' | 'PASSIVE' | 'ACTIVE_PASSIVE';

export interface Account {
  id: string;
  code: string;
  name: string;
  type: AccountType;
}

export interface Counterparty {
  id: string;
  name: string;
  inn: string | null;
}

export interface Transaction {
  id: string;
  date: string; // ISO date
  period: string; // MM.YYYY
  description: string;
  amount: number;
  debitId: string;
  creditId: string;
  counterpartyId: string | null;
  isDeleted: boolean;
}

export interface SystemSettings {
  closedPeriodDate: string;
  openingBalanceDate: string;
  customApiKey: string;
}

interface ContadorState {
  accounts: Account[];
  counterparties: Counterparty[];
  transactions: Transaction[];
  settings: SystemSettings;

  addTransaction: (tx: Omit<Transaction, 'id' | 'isDeleted'>) => void;
  deleteTransaction: (id: string) => void;
  
  addCounterparty: (cp: Omit<Counterparty, 'id'>) => void;
  deleteCounterparty: (id: string) => void;

  updateSettings: (settings: Partial<SystemSettings>) => void;

  // Calculators / Aggregators
  getBalanceForAccount: (accountId: string) => number;
  getCalculatedOsv: () => any[]; // Returns rows for OSV
  getCalculatedBalanceSheet: () => any; // Returns Form 1
  getCalculatedPnl: () => any; // Returns Form 2
}

const INITIAL_ACCOUNTS: Account[] = [
  // Активы (0100 - 5900)
  { id: 'a1', code: '0000', name: 'Вспомогательный счет', type: 'ACTIVE_PASSIVE' },
  { id: 'a2', code: '1010', name: 'Основные средства в эксплуатации', type: 'ACTIVE' },
  { id: 'a3', code: '4010', name: 'Счета к получению от покупателей', type: 'ACTIVE' },
  { id: 'a4', code: '4310', name: 'Авансы выданные', type: 'ACTIVE' },
  { id: 'a5', code: '5010', name: 'Касса в национальной валюте', type: 'ACTIVE' },
  { id: 'a6', code: '5110', name: 'Расчетный счет', type: 'ACTIVE' },
  
  // Пассивы (6000 - 8900)
  { id: 'p1', code: '6010', name: 'Счета к оплате поставщикам', type: 'PASSIVE' },
  { id: 'p2', code: '6410', name: 'Задолженность по налогам', type: 'PASSIVE' },
  { id: 'p3', code: '6710', name: 'Задолженность по оплате труда', type: 'PASSIVE' },
  { id: 'p4', code: '8330', name: 'Уставный капитал', type: 'PASSIVE' },
  { id: 'p5', code: '8710', name: 'Нераспределенная прибыль', type: 'PASSIVE' },
  { id: 'p6', code: '8910', name: 'Резервы предстоящих расходов', type: 'PASSIVE' },
  
  // Доходы и Расходы (9000+) 
  // Technically active/passive rules vary but they close to 8710 or 9910. 
  // Let's treat Revenue as PASSIVE (Credit increases it) and Expenses as ACTIVE (Debit increases them) for standard accumulation before closing
  { id: 'r1', code: '9010', name: 'Доходы от реализации', type: 'PASSIVE' },
  { id: 'r2', code: '9110', name: 'Прочие операционные доходы', type: 'PASSIVE' },
  { id: 'e1', code: '9410', name: 'Расходы по реализации', type: 'ACTIVE' },
  { id: 'e2', code: '9420', name: 'Административные расходы', type: 'ACTIVE' },
  { id: 'e3', code: '9430', name: 'Прочие операционные расходы', type: 'ACTIVE' },
];

export const useContadorStore = create<ContadorState>()(
  persist(
    (set, get) => ({
      accounts: INITIAL_ACCOUNTS,
      counterparties: [
        { id: 'c1', name: 'ООО Ромашка', inn: '123456789' },
        { id: 'c2', name: 'БЦ Авангард', inn: '987654321' }
      ],
      transactions: [],
      settings: {
        closedPeriodDate: '2024-02-29',
        openingBalanceDate: '2024-01-01',
        customApiKey: ''
      },

      addTransaction: (txData) => set((state) => ({
        transactions: [...state.transactions, { id: Date.now().toString(), isDeleted: false, ...txData }]
      })),

      deleteTransaction: (id) => set((state) => ({
        transactions: state.transactions.map(t => t.id === id ? { ...t, isDeleted: true } : t)
      })),

      addCounterparty: (cp) => set((state) => ({
        counterparties: [...state.counterparties, { id: Date.now().toString(), ...cp }]
      })),

      deleteCounterparty: (id) => set((state) => ({
        counterparties: state.counterparties.filter(c => c.id !== id)
      })),

      updateSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings }
      })),

      getBalanceForAccount: (accountId: string) => {
        const { accounts, transactions } = get();
        const acc = accounts.find(a => a.id === accountId);
        if (!acc) return 0;

        let total = 0;
        transactions.filter(t => !t.isDeleted).forEach(t => {
          if (t.debitId === accountId) {
             total += acc.type === 'ACTIVE' ? t.amount : -t.amount;
             if (acc.type === 'ACTIVE_PASSIVE') total += t.amount * 2; // Active_passive needs specific treatment but let's stick to standard flow
          }
          if (t.creditId === accountId) {
             total += acc.type === 'PASSIVE' ? t.amount : -t.amount;
          }
        });
        return total;
      },

      getCalculatedOsv: () => {
        const { accounts, transactions } = get();
        
        let report: any[] = [];
        accounts.forEach(acc => {
          let obDebit = 0;
          let obCredit = 0;
          let turnDebit = 0;
          let turnCredit = 0;

          transactions.filter(t => !t.isDeleted).forEach(t => {
            // For OSV we just sum up debits and credits
            if (t.debitId === acc.id) turnDebit += t.amount;
            if (t.creditId === acc.id) turnCredit += t.amount;
          });

          if (turnDebit === 0 && turnCredit === 0) return; // Skip empty
          
          let cbDebit = 0;
          let cbCredit = 0;

          if (acc.type === 'ACTIVE') {
            const balance = turnDebit - turnCredit;
            cbDebit = balance > 0 ? balance : 0;
          } else if (acc.type === 'PASSIVE') {
            const balance = turnCredit - turnDebit;
            cbCredit = balance > 0 ? balance : 0;
          } else {
             // Treat ACTIVE_PASSIVE
             const balance = turnCredit - turnDebit;
             if (balance > 0) cbCredit = balance; else cbDebit = Math.abs(balance);
          }

          report.push({
            id: acc.id,
            code: acc.code,
            name: acc.name,
            obDebit, obCredit,
            turnDebit, turnCredit,
            cbDebit, cbCredit
          });
        });

        report.sort((a, b) => a.code.localeCompare(b.code));
        return report;
      },

      getCalculatedBalanceSheet: () => {
        const { accounts, getBalanceForAccount } = get();

        // Helper to sum over prefixes
        const sumPrefix = (prefixes: string[]) => {
           let total = 0;
           accounts.forEach(a => {
             if (prefixes.some(p => a.code.startsWith(p))) {
               total += getBalanceForAccount(a.id);
             }
           });
           return total;
        };

        const assets = {
          fixed: sumPrefix(['01', '02', '10']),
          inventory: sumPrefix(['29']),
          receivables: sumPrefix(['40']),
          advances: sumPrefix(['43']),
          cash: sumPrefix(['50', '51']),
          finished: sumPrefix(['28']),
        };

        const passives = {
          equity: sumPrefix(['83']),
          retained: sumPrefix(['87']),
          payables: sumPrefix(['60']),
          advances_received: sumPrefix(['63']),
          taxes: sumPrefix(['64']),
          social: sumPrefix(['65']),
          salary: sumPrefix(['67']),
        };

        const totalAssets = Object.values(assets).reduce((a, b) => a + b, 0);
        const totalPassives = Object.values(passives).reduce((a, b) => a + b, 0);

        return {
          assets: { items: assets, total: totalAssets },
          passives: { items: passives, total: totalPassives }
        };
      },

      getCalculatedPnl: () => {
         const { accounts, transactions } = get();
         
         const sumTxForPrefixes = (prefixes: string[], side: 'debit' | 'credit') => {
           let total = 0;
           const targetAccs = accounts.filter(a => prefixes.some(p => a.code.startsWith(p))).map(a => a.id);
           
           transactions.filter(t => !t.isDeleted).forEach(t => {
              if (side === 'debit' && targetAccs.includes(t.debitId)) total += t.amount;
              if (side === 'credit' && targetAccs.includes(t.creditId)) total += t.amount;
           });
           return total;
         };

         // Form 2 maps:
         // Revenue is Credit on 9000
         const revenues = sumTxForPrefixes(['90'], 'credit');
         const cogs = sumTxForPrefixes(['9120'], 'debit'); // Actually cost of goods sold, mock as 0 if absent
         const grossProfit = revenues - cogs;

         const adminExp = sumTxForPrefixes(['9420'], 'debit');
         const salesExp = sumTxForPrefixes(['9410'], 'debit');
         const otherExp = sumTxForPrefixes(['9430'], 'debit');

         const operatingProfit = grossProfit - adminExp - salesExp - otherExp;

         const otherInc = sumTxForPrefixes(['9110', '93'], 'credit');
         const netProfit = operatingProfit + otherInc;

         return {
           revenues,
           cogs,
           grossProfit,
           adminExp,
           salesExp,
           otherExp,
           operatingProfit,
           otherInc,
           netProfit
         };
      }
    }),
    {
      name: 'contador-storage'
    }
  )
);
