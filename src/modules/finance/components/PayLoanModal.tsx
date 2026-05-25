import React, { useState, useMemo } from 'react';
import { useFinanceStore } from '../financeStore';
import type { Loan } from '../financeStore';
import { calculateLoan } from '../utils/loansMath';
import { X, Landmark } from 'lucide-react';
import { APP_CURRENCY } from '../config/currency';

interface PayLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: Loan | null;
}

export const PayLoanModal: React.FC<PayLoanModalProps> = ({ isOpen, onClose, loan }) => {
  const { accounts, addTransaction, categories, transactions } = useFinanceStore();
  
  const amortization = useMemo(() => {
    if (!loan) return null;
    return calculateLoan(loan, transactions);
  }, [loan, transactions]);

  const [accountId, setAccountId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState<number>(0);

  // Set default amount when loan or amortization changes
  React.useEffect(() => {
    if (amortization) {
      setAmount(Math.round(amortization.monthlyPayment));
    }
  }, [amortization]);

  if (!isOpen || !loan || !amortization) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId || amount <= 0) return;

    // Find categories
    const loanBodyCat = categories.find(c => c.name.toLowerCase().includes('погашение') || c.name.toLowerCase().includes('займ') || c.type === 'liability');
    const loanIntCat = categories.find(c => c.name.toLowerCase().includes('процент') && c.type === 'expense') || 
                       categories.find(c => c.activity === 'financing' && c.type === 'expense');

    // Split logic: first cover current interest, rest goes to principal
    const interestToCover = Math.min(amount, amortization.currentInterestPayment);
    const principalToCover = amount - interestToCover;

    // We generate an expense transaction for interest
    if (interestToCover > 0) {
      addTransaction({
        accountId,
        amount: interestToCover,
        date,
        type: 'expense',
        categoryId: loanIntCat?.id,
        loanId: loan.id,
        description: `Оплата процентов по займу: ${loan.name}`,
        isPaidConfirmed: true
      });
    }

    // We generate an expense transaction for principal
    if (principalToCover > 0) {
      addTransaction({
        accountId,
        amount: principalToCover,
        date,
        type: 'expense',
        categoryId: loanBodyCat?.id,
        loanId: loan.id,
        description: `Погашение тела по займу: ${loan.name}`,
        isPaidConfirmed: true
      });
    }

    onClose();
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div style={{ background: 'var(--bg-surface)', width: 440, borderRadius: 12, padding: 24, border: '1px solid var(--border-default)', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Внести платеж по займу</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={18} /></button>
        </div>
        
        <div style={{ padding: 16, background: 'var(--bg-elevated)', borderRadius: 8, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ padding: 10, background: 'var(--bg-card)', borderRadius: 8 }}><Landmark size={20} color="#f43f5e" /></div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{loan.name}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Остаток долга: {new Intl.NumberFormat('ru-RU').format(Math.round(amortization.remainingPrincipal))} {APP_CURRENCY}</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
            Счет списания (ДДС)
            <select required value={accountId} onChange={e => setAccountId(e.target.value)} style={{ padding: '10px 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}>
              <option value="" disabled>Выберите счет...</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name} ({acc.currency}) - Баланс: {new Intl.NumberFormat('ru-RU').format(acc.balance)}</option>
              ))}
            </select>
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
              Сумма платежа
              <input required type="number" min="1" max={Math.round(amortization.remainingPrincipal + amortization.currentInterestPayment)} value={amount || ''} onChange={e => setAmount(Number(e.target.value))} style={{ padding: '10px 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontWeight: 600, fontSize: 15 }} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
              Дата платежа
              <input required type="date" value={date} onChange={e => setDate(e.target.value)} style={{ padding: '10px 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)', color: 'var(--text-primary)' }} />
            </label>
          </div>

          <div style={{ background: 'var(--bg-card)', padding: 12, borderRadius: 8, marginTop: 4 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
              <span>Расщепление платежа (автоматически):</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
              <span style={{ color: 'var(--text-secondary)' }}>В погашение процентов (ОПУ):</span>
              <span style={{ fontWeight: 600, color: 'var(--color-danger)' }}>{new Intl.NumberFormat('ru-RU').format(Math.round(Math.min(amount, amortization.currentInterestPayment)))} {APP_CURRENCY}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--text-secondary)' }}>В погашение тела долга (Баланс):</span>
              <span style={{ fontWeight: 600, color: 'var(--color-success)' }}>{new Intl.NumberFormat('ru-RU').format(Math.round(Math.max(0, amount - amortization.currentInterestPayment)))} {APP_CURRENCY}</span>
            </div>
          </div>
          
          <button type="submit" disabled={!accountId || amount <= 0} style={{ marginTop: 8, background: 'var(--color-primary)', color: '#fff', border: 'none', padding: '12px', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: (!accountId || amount <= 0) ? 0.6 : 1 }}>
            Провести платеж
          </button>
        </form>
      </div>
    </div>
  );
};
