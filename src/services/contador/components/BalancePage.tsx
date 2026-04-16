import React from 'react';
import { useContadorStore } from '../store/contadorStore';

const assetLabels: Record<string, string> = {
  fixed: "Основные средства (нетто)",
  inventory: "Запасы и материалы",
  receivables: "Дебиторская задолженность",
  advances: "Авансы выданные",
  cash: "Денежные средства",
  finished: "Готовая продукция",
};

const passiveLabels: Record<string, string> = {
  payables: "Кредиторская задолженность",
  taxes: "Задолженность по налогам",
  social: "Социальное страхование",
  salary: "Задолженность по зарплате",
  advances_received: "Авансы полученные",
  equity: "Уставный капитал",
  retained: "Нераспределенная прибыль",
};

export const BalancePage: React.FC = () => {
  const getCalculatedBalanceSheet = useContadorStore(state => state.getCalculatedBalanceSheet);
  const { assets, passives } = getCalculatedBalanceSheet();

  const totalActive = assets.total;
  const totalPassive = passives.total;
  const isBalanced = totalActive === totalPassive;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32, padding: '10px 0', maxWidth: 1000, margin: '0 auto' }}>
      <header>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>Бухгалтерский баланс</h2>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Форма №1. Состояние активов и пассивов компании на текущую дату.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 40 }}>
        
        {/* Assets */}
        <div style={{ background: 'var(--bg-elevated)', borderRadius: 16, padding: 24, border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid var(--border-strong)', paddingBottom: 12, marginBottom: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-primary)' }}>I. Активы</h3>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Сумма (сум)</span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {Object.entries(assetLabels).map(([key, label]) => (
              <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{label}</span>
                <span style={{ flex: 1, borderBottom: '1px dotted var(--border-subtle)', margin: '0 16px', position: 'relative', top: -4 }}></span>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {(assets.items as any)[key].toLocaleString('ru-RU')}
                </span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 24, paddingTop: 16, borderTop: '2px solid var(--border-strong)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-primary)' }}>Итого Активы</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>{assets.total.toLocaleString('ru-RU')}</span>
          </div>
        </div>

        {/* Passives */}
        <div style={{ background: 'var(--bg-elevated)', borderRadius: 16, padding: 24, border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid var(--border-strong)', paddingBottom: 12, marginBottom: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-primary)' }}>II. Пассивы</h3>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Сумма (сум)</span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
             {Object.entries(passiveLabels).map(([key, label]) => (
              <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{label}</span>
                <span style={{ flex: 1, borderBottom: '1px dotted var(--border-subtle)', margin: '0 16px', position: 'relative', top: -4 }}></span>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {(passives.items as any)[key].toLocaleString('ru-RU')}
                </span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 24, paddingTop: 16, borderTop: '2px solid var(--border-strong)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-danger)' }}>Итого Пассивы</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>{passives.total.toLocaleString('ru-RU')}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
        <div style={{
          padding: '12px 32px',
          borderRadius: 100,
          background: isBalanced ? 'var(--color-primary)' : 'var(--color-danger)',
          color: '#fff',
          fontSize: 11,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.2em',
          boxShadow: isBalanced ? '0 0 20px rgba(99, 102, 241, 0.4)' : '0 0 20px rgba(239, 68, 68, 0.4)'
        }}>
          {isBalanced ? 'Баланс сходится' : 'Ошибка: Баланс не сходится'}
        </div>
      </div>
    </div>
  );
};

export default BalancePage;
