import React, { useState } from 'react';
import { ArrowRight, X } from 'lucide-react';
import { useContadorStore } from '../store/contadorStore';

interface OSVEntry {
  id: string;
  code: string;
  name: string;
  debitTurnover: number;
  creditTurnover: number;
  balanceDebit: number;
  balanceCredit: number;
}

export const OsvPage: React.FC = () => {
  const [period, setPeriod] = useState(new Date().toLocaleDateString("ru-RU", { month: "2-digit", year: "numeric" }));
  const [selectedAccount, setSelectedAccount] = useState<any>(null);

  const getCalculatedOsv = useContadorStore(state => state.getCalculatedOsv);
  const osvData = getCalculatedOsv();

  const totals = osvData.reduce((acc, curr) => ({
    debitTurnover: acc.debitTurnover + curr.turnDebit,
    creditTurnover: acc.creditTurnover + curr.turnCredit,
    balanceDebit: acc.balanceDebit + curr.cbDebit,
    balanceCredit: acc.balanceCredit + curr.cbCredit,
  }), { debitTurnover: 0, creditTurnover: 0, balanceDebit: 0, balanceCredit: 0 });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '10px 0' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>Оборотно-сальдовая ведомость</h2>
        </div>
        <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '4px 12px' }}>
          <input 
            type="text" 
            value={period} 
            onChange={(e) => setPeriod(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', width: 60, textAlign: 'center', fontSize: 13, fontWeight: 700 }}
          />
        </div>
      </header>

      <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 12, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: 'rgba(0,0,0,0.2)' }}>
            <tr>
              <th style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-strong)', fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Счет</th>
              <th style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-strong)', fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Наименование</th>
              <th style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-strong)', fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'right' }}>Оборот Дт</th>
              <th style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-strong)', fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'right' }}>Оборот Кт</th>
              <th style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-strong)', fontSize: 10, fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'right' }}>Сальдо Дт</th>
              <th style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-strong)', fontSize: 10, fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'right' }}>Сальдо Кт</th>
            </tr>
          </thead>
          <tbody>
            {osvData.map((row) => (
              <tr 
                key={row.code} 
                className="table-row-hover"
                onClick={() => setSelectedAccount(row)} 
                style={{ borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer', transition: 'background 0.2s' }}
              >
                <td style={{ padding: '16px 20px', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{row.code}</td>
                <td style={{ padding: '16px 20px', fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {row.name}
                  <ArrowRight size={12} opacity={0.3} />
                </td>
                <td style={{ padding: '16px 20px', fontSize: 13, color: 'var(--text-primary)', textAlign: 'right' }}>{row.turnDebit > 0 ? row.turnDebit.toLocaleString('ru-RU') : '—'}</td>
                <td style={{ padding: '16px 20px', fontSize: 13, color: 'var(--text-primary)', textAlign: 'right' }}>{row.turnCredit > 0 ? row.turnCredit.toLocaleString('ru-RU') : '—'}</td>
                <td style={{ padding: '16px 20px', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', textAlign: 'right' }}>{row.cbDebit > 0 ? row.cbDebit.toLocaleString('ru-RU') : '—'}</td>
                <td style={{ padding: '16px 20px', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', textAlign: 'right' }}>{row.cbCredit > 0 ? row.cbCredit.toLocaleString('ru-RU') : '—'}</td>
              </tr>
            ))}
          </tbody>
          <tfoot style={{ background: 'rgba(0,0,0,0.4)', borderTop: '2px solid var(--border-strong)' }}>
            <tr>
              <td colSpan={2} style={{ padding: '16px 20px', fontSize: 11, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Итого</td>
              <td style={{ padding: '16px 20px', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', textAlign: 'right' }}>{totals.debitTurnover.toLocaleString('ru-RU')}</td>
              <td style={{ padding: '16px 20px', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', textAlign: 'right' }}>{totals.creditTurnover.toLocaleString('ru-RU')}</td>
              <td style={{ padding: '16px 20px', fontSize: 15, fontWeight: 800, color: 'var(--color-primary)', textAlign: 'right' }}>{totals.balanceDebit.toLocaleString('ru-RU')}</td>
              <td style={{ padding: '16px 20px', fontSize: 15, fontWeight: 800, color: 'var(--color-primary)', textAlign: 'right' }}>{totals.balanceCredit.toLocaleString('ru-RU')}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {selectedAccount && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={() => setSelectedAccount(null)} />
          
          <div style={{ 
            position: 'relative', width: 500, background: 'var(--bg-surface)', 
            borderLeft: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column',
            boxShadow: '-10px 0 30px rgba(0,0,0,0.5)'
          }}>
            <header style={{ padding: 24, borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{selectedAccount.code} — {selectedAccount.name}</h3>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Детализация: {period}</p>
              </div>
              <button 
                onClick={() => setSelectedAccount(null)} 
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </header>
            
            <div style={{ flex: 1, padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Детализация по транзакциям недоступна в демо-режиме.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OsvPage;
