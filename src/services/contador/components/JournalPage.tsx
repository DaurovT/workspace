import React, { useState } from 'react';
import { Plus, Trash2, ArrowRightLeft, Search } from 'lucide-react';
import { useContadorStore } from '../store/contadorStore';

export const JournalPage: React.FC = () => {
  const transactions = useContadorStore(state => state.transactions);
  const accounts = useContadorStore(state => state.accounts);
  const addTransaction = useContadorStore(state => state.addTransaction);
  const deleteTransaction = useContadorStore(state => state.deleteTransaction);

  const [search, setSearch] = useState("");

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    debitId: '',
    creditId: '',
    description: ''
  });

  const filtered = transactions.filter(tx => 
    tx.description.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleDelete = (id: string) => {
    deleteTransaction(id);
  };

  const handleAdd = () => {
    if (!formData.amount || !formData.debitId || !formData.creditId || !formData.description) return;
    
    const amountNum = parseFloat(formData.amount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    addTransaction({
      date: formData.date,
      period: formData.date.substring(5, 7) + '.' + formData.date.substring(0, 4),
      amount: amountNum,
      debitId: formData.debitId,
      creditId: formData.creditId,
      description: formData.description,
      counterpartyId: null // Optional counterparties integration for later
    });

    setFormData({
      ...formData,
      amount: '',
      description: ''
    });
  };

  const getAccountCode = (id: string) => accounts.find(a => a.id === id)?.code || '';

  const isValid = formData.amount && formData.debitId && formData.creditId && formData.description;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '10px 0' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>Журнал операций</h2>
      </header>

      {/* Input Form */}
      <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: 24, boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
             <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Дата</label>
             <input 
               type="date" 
               value={formData.date}
               onChange={(e) => setFormData({...formData, date: e.target.value})}
               style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '8px 12px', borderRadius: 8, fontSize: 13, outline: 'none' }} 
             />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
             <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Сумма</label>
             <input 
               type="number" 
               placeholder="0" 
               value={formData.amount}
               onChange={(e) => setFormData({...formData, amount: e.target.value})}
               style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '8px 12px', borderRadius: 8, fontSize: 13, outline: 'none' }} 
             />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
             <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Дебет</label>
             <select 
               value={formData.debitId}
               onChange={(e) => setFormData({...formData, debitId: e.target.value})}
               style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '8px 12px', borderRadius: 8, fontSize: 13, outline: 'none', appearance: 'auto' }}
             >
               <option value="">Счет...</option>
               {accounts.map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
             </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
             <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Кредит</label>
             <select 
               value={formData.creditId}
               onChange={(e) => setFormData({...formData, creditId: e.target.value})}
               style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '8px 12px', borderRadius: 8, fontSize: 13, outline: 'none', appearance: 'auto' }}
             >
               <option value="">Счет...</option>
               {accounts.map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
             </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
             <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Описание</label>
             <input 
               type="text" 
               placeholder="Назначение..." 
               value={formData.description}
               onChange={(e) => setFormData({...formData, description: e.target.value})}
               style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '8px 12px', borderRadius: 8, fontSize: 13, outline: 'none' }} 
             />
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button 
              onClick={handleAdd}
              disabled={!isValid}
              style={{ 
                width: '100%', padding: '10px 16px', borderRadius: 8, 
                background: isValid ? 'var(--color-primary)' : 'var(--bg-surface)', 
                color: isValid ? '#fff' : 'var(--text-muted)', 
                border: 'none', fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, 
                cursor: isValid ? 'pointer' : 'not-allowed', transition: 'all 0.2s' 
              }}
            >
              <Plus size={16} /> Провести
            </button>
          </div>

        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
         <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 16 }} />
         <input 
           type="text" 
           placeholder="Поиск по описанию..." 
           value={search}
           onChange={(e) => setSearch(e.target.value)}
           style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '12px 16px 12px 42px', borderRadius: 12, fontSize: 13, outline: 'none' }}
         />
      </div>

      <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 12, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: 'rgba(0,0,0,0.2)' }}>
            <tr>
              <th style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-strong)', fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Дата</th>
              <th style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-strong)', fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Дт / Кт</th>
              <th style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-strong)', fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'right' }}>Сумма</th>
              <th style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-strong)', fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Описание</th>
              <th style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-strong)' }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
               <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Ничего не найдено</td></tr>
            ) : filtered.map((tx) => (
              <tr 
                key={tx.id} 
                className="table-row-hover"
                style={{ 
                  borderBottom: '1px solid var(--border-subtle)', 
                  transition: 'background 0.2s',
                  opacity: tx.isDeleted ? 0.3 : 1
                }}
              >
                <td style={{ padding: '16px 20px' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{new Date(tx.date).toLocaleDateString('ru-RU')}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, fontFamily: 'monospace' }}>{tx.period}</div>
                </td>
                <td style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                    <span style={{ color: 'var(--color-primary)' }}>{getAccountCode(tx.debitId)}</span>
                    <ArrowRightLeft size={10} color="var(--text-muted)" />
                    <span style={{ color: 'var(--color-danger)' }}>{getAccountCode(tx.creditId)}</span>
                  </div>
                </td>
                <td style={{ padding: '16px 20px', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', textAlign: 'right' }}>
                  {tx.amount.toLocaleString('ru-RU')}
                </td>
                <td style={{ padding: '16px 20px' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{tx.description}</div>
                </td>
                <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                  {!tx.isDeleted && (
                    <button 
                      onClick={() => confirm('Удалить операцию?') && handleDelete(tx.id)}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default JournalPage;
