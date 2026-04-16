import React from 'react';
import { useContadorStore } from '../store/contadorStore';

export const PnlPage: React.FC = () => {
  const getCalculatedPnl = useContadorStore(state => state.getCalculatedPnl);
  const pnl = getCalculatedPnl();

  const expenseItems = [
    { label: "Административные расходы", value: pnl.adminExp },
    { label: "Коммерческие расходы", value: pnl.salesExp },
    { label: "Прочие операционные расходы", value: pnl.otherExp },
  ];

  const totalOpExpenses = pnl.adminExp + pnl.salesExp + pnl.otherExp;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 40, padding: '10px 0', maxWidth: 800, margin: '0 auto' }}>
      <header style={{ borderBottom: '1px solid var(--border-strong)', paddingBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>Отчет о финансовых результатах</h2>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Форма №2. Анализ доходов и расходов за весь период деятельности.</p>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        
        {/* Revenue */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
            <h3 style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--text-muted)' }}>Доходы</h3>
            <span style={{ flex: 1, height: 1, background: 'var(--border-subtle)', margin: '0 16px' }}></span>
          </div>
          <div style={{ 
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
            padding: '20px 24px', background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border-subtle)' 
          }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>Выручка от реализации товаров и услуг</span>
            <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-primary)', letterSpacing: '-0.02em' }}>
              {pnl.revenues.toLocaleString('ru-RU')}
            </span>
          </div>
        </section>

        {/* Expenses */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
            <h3 style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--text-muted)' }}>Расходы</h3>
            <span style={{ flex: 1, height: 1, background: 'var(--border-subtle)', margin: '0 16px' }}></span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {expenseItems.map((item, i) => (
              <div key={item.label} style={{ 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                padding: '16px 24px', 
                background: 'rgba(255, 255, 255, 0.02)',
                borderBottom: i === expenseItems.length - 1 ? 'none' : '1px solid var(--border-subtle)'
              }}>
                <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{item.label}</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{item.value.toLocaleString('ru-RU')}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-strong)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 24px' }}>
            <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-danger)' }}>Итого операционные расходы</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>{totalOpExpenses.toLocaleString('ru-RU')}</span>
          </div>
        </section>

        {/* Net Profit */}
        <section style={{ marginTop: 20 }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(139,92,246,0.1) 100%)',
            border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: 16, padding: '32px 40px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            boxShadow: '0 8px 32px rgba(99,102,241,0.15)'
          }}>
            <div>
              <h3 style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--text-primary)' }}>Чистая прибыль</h3>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 8 }}>После вычета всех операционных расходов</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <span style={{ fontSize: 40, fontWeight: 800, color: 'var(--color-primary)', letterSpacing: '-0.03em', lineHeight: 1 }}>
                {pnl.netProfit.toLocaleString('ru-RU')}
              </span>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', marginTop: 12, padding: '4px 8px', background: 'rgba(255,255,255,0.1)', borderRadius: 4, color: 'var(--text-secondary)' }}>
                Валюта: СУМ
              </span>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default PnlPage;
