import React, { useMemo, useState } from 'react';
import { LiabilitiesTable } from '../components/LiabilitiesTable';
import { useFinanceStore } from '../financeStore';
import { calculateLoan } from '../utils/loansMath';
import { APP_CURRENCY } from '../config/currency';
import { LoanModal } from '../components/LoanModal';
import { PayLoanModal } from '../components/PayLoanModal';
import { Filter, Plus, HandCoins } from 'lucide-react';

const LiabilitiesPage: React.FC = () => {
  const { loans, transactions, deleteLoan } = useFinanceStore();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  
  const [searchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['Кредит', 'Лизинг', 'Займ', 'Овердрафт']);

  const [selectedLoanIds, setSelectedLoanIds] = useState<string[]>([]);
  const [isModalOpen, setModalOpen] = useState(false);
  const [loanToPay, setLoanToPay] = useState<any>(null);

  const handleToggleSelection = (id: string) => {
    if (id === 'all') {
      const filteredLoans = loans.filter(l => selectedTypes.length === 0 || selectedTypes.includes(l.type));
      if (selectedLoanIds.length === filteredLoans.length) setSelectedLoanIds([]);
      else setSelectedLoanIds(filteredLoans.map(l => l.id));
      return;
    }
    setSelectedLoanIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleTypeToggle = (t: string) => {
    setSelectedTypes(selectedTypes.includes(t) ? selectedTypes.filter(x => x !== t) : [...selectedTypes, t]);
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'f' && !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        setSidebarOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const { totalDebt, totalInterestPaid } = useMemo(() => {
    let debt = 0;
    let intPaid = 0;
    
    loans.filter(l => selectedTypes.length === 0 || selectedTypes.includes(l.type)).forEach(loan => {
      const calc = calculateLoan(loan, transactions);
      debt += calc.remainingPrincipal;
      intPaid += calc.accumulatedInterest;
    });

    return { totalDebt: Math.round(debt), totalInterestPaid: Math.round(intPaid) };
  }, [loans, selectedTypes]);

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', background: 'var(--bg-base)' }}>
      
      {/* Sidebar Filter */}
      {isSidebarOpen && (
      <div style={{ width: 240, flexShrink: 0, borderRight: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: 44, padding: '0 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <Filter size={12} color="var(--text-muted)" />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>Обязательства</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
        </div>

        <div style={{ flex: 1, padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 8 }}>Тип кредитования</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)', fontSize: 13, cursor: 'pointer' }}>
            <input type="checkbox" checked={selectedTypes.includes('Кредит')} onChange={() => handleTypeToggle('Кредит')} style={{ accentColor: 'var(--color-primary)' }} /> Банковские кредиты
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)', fontSize: 13, cursor: 'pointer' }}>
            <input type="checkbox" checked={selectedTypes.includes('Овердрафт')} onChange={() => handleTypeToggle('Овердрафт')} style={{ accentColor: 'var(--color-primary)' }} /> Овердрафты
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)', fontSize: 13, cursor: 'pointer' }}>
            <input type="checkbox" checked={selectedTypes.includes('Лизинг')} onChange={() => handleTypeToggle('Лизинг')} style={{ accentColor: 'var(--color-primary)' }} /> Лизинг
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)', fontSize: 13, cursor: 'pointer' }}>
            <input type="checkbox" checked={selectedTypes.includes('Займ')} onChange={() => handleTypeToggle('Займ')} style={{ accentColor: 'var(--color-primary)' }} /> Займы партнеров
          </label>
        </div>
        </div>
      </div>
      )}

      {/* ── MAIN ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Header */}
        <div style={{ height: 44, padding: '0 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <button onClick={() => setSidebarOpen(!isSidebarOpen)} style={{ background: isSidebarOpen ? 'var(--bg-card)' : 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <Filter size={12} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <span style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: -0.01 }}>Кредиты и Займы</span>
              <span title="Управление долговой нагрузкой и сплит аннуитетных платежей" style={{ cursor: 'pointer', display: 'flex', color: 'var(--text-muted)' }}>
                <HandCoins size={13} />
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>

            {selectedLoanIds.length > 0 && (
              <button 
                onClick={() => {
                  if (window.confirm('Вы уверены, что хотите удалить выбранные обязательства? Это действие необратимо.')) {
                    selectedLoanIds.forEach(id => deleteLoan(id));
                    setSelectedLoanIds([]);
                  }
                }}
                style={{ background: 'var(--color-danger)', color: '#fff', border: 'none', padding: '0 12px', height: 28, borderRadius: 6, fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', cursor: 'pointer' }}
              >
                Удалить ({selectedLoanIds.length})
              </button>
            )}
            <button onClick={() => setModalOpen(true)} style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', padding: '0 12px', height: 28, borderRadius: 6, fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <Plus size={11} /> Привлечь кредит
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div style={{ flex: 1, overflowY: 'auto', paddingTop: 24 }}>

        {/* KPI Strip */}
        <div style={{ padding: '16px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 10, padding: '12px 16px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#ef4444', marginBottom: 4, opacity: 0.85 }}>Общий долг (Баланс)</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#ef4444' }}>{new Intl.NumberFormat('ru-RU', { notation: 'compact' }).format(totalDebt)} {APP_CURRENCY}</div>
          </div>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '12px 16px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 4 }}>Суммарные переплаты по %</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{new Intl.NumberFormat('ru-RU', { notation: 'compact' }).format(totalInterestPaid)} {APP_CURRENCY}</div>
          </div>
        </div>

        {/* Table Container */}
        <div style={{ padding: '0 24px 40px' }}>
          <LiabilitiesTable 
            searchQuery={searchQuery} 
            selectedTypes={selectedTypes} 
            selectedLoanIds={selectedLoanIds} 
            onToggleSelection={handleToggleSelection} 
            onPay={(loan) => setLoanToPay(loan)}
          />
        </div>
        </div>
      </div>
      
      <LoanModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} />
      <PayLoanModal isOpen={!!loanToPay} onClose={() => setLoanToPay(null)} loan={loanToPay} />
    </div>
  );
};

export default LiabilitiesPage;
