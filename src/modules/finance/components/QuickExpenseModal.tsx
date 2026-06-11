import React, { useState } from 'react';
import { useFinanceStore } from '../financeStore';
import { X, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface QuickExpenseModalProps {
  onClose: () => void;
}

const QuickExpenseModal: React.FC<QuickExpenseModalProps> = ({ onClose }) => {
  const { t } = useTranslation();
    const { accounts, categories, addTransaction } = useFinanceStore();
  
  const expenseCategories = categories.filter(c => c.type === 'expense');
  
  const [amount, setAmount] = useState<number | ''>('');
  const [accountId, setAccountId] = useState(accounts.length > 0 ? accounts[0].id : '');
  const [categoryId, setCategoryId] = useState(expenseCategories.length > 0 ? expenseCategories[0].id : '');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !accountId || !categoryId) return;

    setIsSubmitting(true);
    try {
      await addTransaction({
        date: new Date().toISOString().split('T')[0],
        amount: Number(amount),
        type: 'expense',
        categoryId,
        accountId,
        description,
        isPaidConfirmed: true
      });
      onClose();
    } catch (err) {
      console.error('Failed to create quick expense:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        background: 'var(--bg-surface)',
        borderRadius: 12,
        width: 400,
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        display: 'flex', flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={18} />
            </div>
            <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>{t("Быстрый расход", "Быстрый расход")}</span>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>{t("Сумма", "Сумма")}</label>
            <input 
              type="number" 
              value={amount} 
              onChange={e => setAmount(Number(e.target.value) || '')} 
              placeholder="0.00"
              required
              autoFocus
              style={{ width: '100%', height: 40, padding: '0 12px', background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 15, outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>{t("Счет списания", "Счет списания")}</label>
            <select 
              value={accountId} 
              onChange={e => setAccountId(e.target.value)} 
              required
              style={{ width: '100%', height: 40, padding: '0 12px', background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 14, outline: 'none' }}
            >
              <option value="" disabled>{t("Выберите счет", "Выберите счет")}</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.name} ({new Intl.NumberFormat('ru-RU').format(a.balance)} {a.currency})</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>{t("Статья расходов", "Статья расходов")}</label>
            <select 
              value={categoryId} 
              onChange={e => setCategoryId(e.target.value)} 
              required
              style={{ width: '100%', height: 40, padding: '0 12px', background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 14, outline: 'none' }}
            >
              <option value="" disabled>{t("Выберите статью", "Выберите статью")}</option>
              {expenseCategories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>{t("Описание (на что)", "Описание (на что)")}</label>
            <input 
              type="text" 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              placeholder={t("Например, такси, канцтовары...", "Например, такси, канцтовары...")}
              required
              style={{ width: '100%', height: 40, padding: '0 12px', background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 14, outline: 'none' }}
            />
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            style={{ 
              marginTop: 8, height: 44, width: '100%', borderRadius: 8, border: 'none', 
              background: '#ef4444', color: '#fff', fontSize: 14, fontWeight: 600, 
              cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1 
            }}
          >
            {isSubmitting ? 'Сохранение...' : 'Записать расход'}
          </button>

        </form>
      </div>
    </div>
  );
};

export default QuickExpenseModal;
