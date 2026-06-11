import React, { useState } from 'react';
import { useFinanceStore } from '../financeStore';
import type { Loan } from '../financeStore';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface LoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  loanToEdit?: Loan;
}

export const LoanModal: React.FC<LoanModalProps> = ({ isOpen, onClose, loanToEdit }) => {
  const { t } = useTranslation();
    const { addLoan, updateLoan, accounts, addTransaction, categories } = useFinanceStore();
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [formData, setFormData] = useState<Partial<Loan>>(loanToEdit || {
    name: '',
    bankName: '',
    principalAmount: 0,
    interestRate: 0,
    termMonths: 12,
    startDate: new Date().toISOString().slice(0, 10),
    type: 'Кредит'
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loanToEdit) {
      updateLoan(loanToEdit.id, formData);
    } else {
      // Since our addLoan doesn't return the ID, we rely on the backend.
      // Wait, let's just use the addTransaction with a description for now,
      // because we don't have the new loanId synchronously from the store yet.
      addLoan(formData);
      
      if (selectedAccountId && formData.principalAmount) {
        // Find a liability/financing category
        const loanCategory = categories.find(c => c.name.toLowerCase().includes('займ') || c.type === 'liability');
        
        addTransaction({
          accountId: selectedAccountId,
          amount: formData.principalAmount,
          date: formData.startDate || new Date().toISOString().slice(0, 10),
          type: 'income',
          categoryId: loanCategory?.id,
          description: `Получение займа: ${formData.name}`,
          isPaidConfirmed: true
        });
      }
    }
    onClose();
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div style={{ background: 'var(--bg-surface)', width: 400, borderRadius: 12, padding: 24, border: '1px solid var(--border-default)', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{loanToEdit ? 'Редактировать займ' : 'Привлечь кредит'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={18} /></button>
        </div>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, color: 'var(--text-secondary)' }}>
            
            {t("Название (Обязательство)", "Название (Обязательство)")}
            <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)', color: 'var(--text-primary)' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, color: 'var(--text-secondary)' }}>
            
            {t("Кредитор (Банк)", "Кредитор (Банк)")}
            <input required type="text" value={formData.bankName} onChange={e => setFormData({...formData, bankName: e.target.value})} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)', color: 'var(--text-primary)' }} />
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, color: 'var(--text-secondary)' }}>
              
              {t("Тип", "Тип")}
              <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}>
                <option value={t("Кредит", "Кредит")}>{t("Кредит", "Кредит")}</option>
                <option value={t("Лизинг", "Лизинг")}>{t("Лизинг", "Лизинг")}</option>
                <option value={t("Займ", "Займ")}>{t("Займ", "Займ")}</option>
                <option value={t("Овердрафт", "Овердрафт")}>{t("Овердрафт", "Овердрафт")}</option>
              </select>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, color: 'var(--text-secondary)' }}>
              
              {t("Сумма тела (Баланс)", "Сумма тела (Баланс)")}
              <input required type="number" min="0" value={formData.principalAmount} onChange={e => setFormData({...formData, principalAmount: Number(e.target.value)})} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)', color: 'var(--text-primary)' }} />
            </label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, color: 'var(--text-secondary)' }}>
              
              {t("Ставка (% годовых)", "Ставка (% годовых)")}
              <input required type="number" step="0.1" min="0" value={formData.interestRate} onChange={e => setFormData({...formData, interestRate: Number(e.target.value)})} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)', color: 'var(--text-primary)' }} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, color: 'var(--text-secondary)' }}>
              
              {t("Срок (мес.)", "Срок (мес.)")}
              <input required type="number" min="1" value={formData.termMonths} onChange={e => setFormData({...formData, termMonths: Number(e.target.value)})} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)', color: 'var(--text-primary)' }} />
            </label>
          </div>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, color: 'var(--text-secondary)' }}>
            
            {t("Дата старта", "Дата старта")}
            <input required type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)', color: 'var(--text-primary)' }} />
          </label>

          {!loanToEdit && (
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, color: 'var(--text-secondary)' }}>
              
              {t("Счет зачисления (ДДС)", "Счет зачисления (ДДС)")}
              <select value={selectedAccountId} onChange={e => setSelectedAccountId(e.target.value)} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}>
                <option value="">{t("Не отражать в ДДС (Только баланс)", "Не отражать в ДДС (Только баланс)")}</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name} ({acc.currency})</option>
                ))}
              </select>
            </label>
          )}
          
          <button type="submit" style={{ marginTop: 12, background: 'var(--color-primary)', color: '#fff', border: 'none', padding: '10px', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            {loanToEdit ? "Сохранить изменения" : 'Создать обязательство'}
          </button>
        </form>
      </div>
    </div>
  );
};
