import React, { useMemo } from 'react';
import { useFinanceStore } from '../financeStore';
import { parseISO, format } from 'date-fns';
import { Landmark, Banknote, Briefcase } from 'lucide-react';
import { calculateLoan } from '../utils/loansMath';

interface LiabilitiesTableProps {
  searchQuery?: string;
  selectedTypes?: string[];
  selectedLoanIds?: string[];
  onToggleSelection?: (id: string) => void;
  onPay?: (loan: any) => void;
}

export const LiabilitiesTable: React.FC<LiabilitiesTableProps> = ({ 
  searchQuery = '', 
  selectedTypes = [],
  selectedLoanIds = [],
  onToggleSelection = () => {},
  onPay = () => {}
}) => {
  const { loans, transactions } = useFinanceStore();

  const enrichedLoans = useMemo(() => {
    return loans
      .filter(l => selectedTypes.length === 0 || selectedTypes.includes(l.type))
      .filter(l => !searchQuery || l.name.toLowerCase().includes(searchQuery.toLowerCase()) || l.bankName.toLowerCase().includes(searchQuery.toLowerCase()))
      .map(loan => {
        const calc = calculateLoan(loan, transactions);
        return {
          ...loan,
          ...calc
        };
      });
  }, [loans, transactions, searchQuery, selectedTypes]);

  const allSelected = enrichedLoans.length > 0 && selectedLoanIds.length === enrichedLoans.length;

  const Th: React.FC<{ children: React.ReactNode, align?: 'left'|'right'|'center', width?: string }> = ({ children, align = 'right', width }) => (
    <th style={{ width, padding: '8px 14px', textAlign: align, fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)', whiteSpace: 'nowrap', backgroundColor: 'transparent' }}>
      {children}
    </th>
  );

  const Td: React.FC<{ children: React.ReactNode, align?: 'left'|'right'|'center' }> = ({ children, align = 'right' }) => (
    <td style={{ padding: '8px 14px', textAlign: align, fontSize: 12, borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
      {children}
    </td>
  );

  const getIcon = (type: string) => {
    switch(type) {
      case 'Кредит': 
      case 'Овердрафт': return <Landmark size={18} color="#f43f5e" />;
      case 'Лизинг': return <Briefcase size={18} color="#f59e0b" />;
      case 'Займ': return <Banknote size={18} color="#10b981" />;
      default: return <Landmark size={18} color="#64748b" />;
    }
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: 1000 }}>
        <thead style={{ background: 'var(--bg-hover)' }}>
          <tr>
            <Th align="center">
              <input 
                id="liabilities-select-all" 
                type="checkbox" 
                checked={allSelected}
                onChange={() => onToggleSelection('all')}
                style={{ accentColor: 'var(--color-primary)' }} 
              />
            </Th>
            <Th align="left">Обязательство</Th>
            <Th align="left">Ставка и Срок</Th>
            <Th align="center">Полный Долг</Th>
            <Th align="center">Остаток</Th>
            <Th align="center">Аннуитет</Th>
            <Th align="left" width="220px">Ближайший платеж</Th>
            <Th align="center">Действия</Th>
          </tr>
        </thead>
        <tbody>
          {enrichedLoans.map(loan => {
            return (
              <tr key={loan.id} style={{ transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <Td align="center">
                  <input 
                    id={`liabilities-checkbox-${loan.id}`} 
                    type="checkbox" 
                    checked={selectedLoanIds.includes(loan.id)}
                    onChange={() => onToggleSelection(loan.id)}
                    style={{ accentColor: 'var(--color-primary)' }} 
                  />
                </Td>
                <Td align="left">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ padding: 8, background: '#fef2f2', borderRadius: 8 }}>
                      {getIcon(loan.type)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{loan.name}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{loan.bankName}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        Старт: {format(parseISO(loan.startDate), 'dd.MM.yyyy')}
                      </div>
                    </div>
                  </div>
                </Td>
                <Td align="left">
                  <div style={{ fontWeight: 600, color: 'var(--color-danger)' }}>{loan.interestRate}% <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-secondary)' }}>годовых</span></div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>На {loan.termMonths} мес.</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>Ост: {loan.monthsRemaining} мес.</div>
                </Td>
                <Td align="center">
                  <span style={{ fontWeight: 600 }}>{new Intl.NumberFormat('ru-RU').format(loan.principalAmount)}</span>
                </Td>
                <Td align="center">
                  <span style={{ fontWeight: 700, color: '#f43f5e' }}>{new Intl.NumberFormat('ru-RU').format(loan.remainingPrincipal)}</span>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    Уже погашено: {new Intl.NumberFormat('ru-RU').format(loan.accumulatedPrincipalPaid)}
                  </div>
                </Td>
                <Td align="center">
                  <span style={{ fontWeight: 600, color: '#9ca3af' }}>{new Intl.NumberFormat('ru-RU').format(Math.round(loan.monthlyPayment))}</span>
                </Td>
                <Td align="left">
                  {loan.monthsRemaining > 0 ? (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                        <span style={{ color: '#10b981' }}>Тело (Баланс): {new Intl.NumberFormat('ru-RU').format(Math.round(loan.currentPrincipalPayment))}</span>
                        <span style={{ color: '#f87171' }}>%: {new Intl.NumberFormat('ru-RU').format(Math.round(loan.currentInterestPayment))}</span>
                      </div>
                      <div style={{ display: 'flex', height: 6, background: 'var(--bg-card)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(loan.currentPrincipalPayment / loan.monthlyPayment) * 100}%`, background: '#10b981' }} />
                        <div style={{ height: '100%', width: `${(loan.currentInterestPayment / loan.monthlyPayment) * 100}%`, background: '#f87171' }} />
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6 }}>
                        % уходят в ОПУ. Тело снижает долг.
                      </div>
                    </div>
                  ) : (
                    <span style={{ color: '#10b981', fontWeight: 600, fontSize: 13 }}>Погашен полностью</span>
                  )}
                </Td>
                <Td align="center">
                  <button onClick={() => onPay(loan)} style={{ background: 'var(--color-primary)', border: 'none', color: '#fff', cursor: 'pointer', padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
                    Платеж
                  </button>
                </Td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  );
};
