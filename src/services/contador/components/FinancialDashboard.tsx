import React from 'react';
import { ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, Wallet, Minus, Users, Activity } from 'lucide-react';

// === Mock Data (Usually this comes from store.ts) ===
const data = {
  metrics: {
    revenue: 12500000,
    expenses: 8300000,
    profit: 4200000,
    margin: 33.6,
    bank: 5800000,
    ar: 1200000,
  },
  expensesByAccount: [
    { code: '9410', name: 'Аренда офиса', amount: 1500000 },
    { code: '9420', name: 'Зарплата АУП', amount: 3200000 },
    { code: '9430', name: 'Маркетинг', amount: 800000 },
    { code: '9440', name: 'Коммуналка', amount: 120000 },
    { code: '9450', name: 'Прочее', amount: 500000 },
  ],
  chartData: [
    { period: 'Янв', revenue: 9500, expenses: 6800 },
    { period: 'Фев', revenue: 10200, expenses: 7100 },
    { period: 'Мар', revenue: 12500, expenses: 8300 },
    { period: 'Апр', revenue: 11000, expenses: 7400 },
    { period: 'Май', revenue: 13200, expenses: 8500 },
    { period: 'Июн', revenue: 14800, expenses: 9000 },
  ]
};

const FinancialDashboard: React.FC = () => {
  const metrics = data.metrics;

  const cards = [
    { name: 'Выручка', value: metrics.revenue, sub: 'Всего по счету 9010', icon: ArrowUpRight, color: '#10b981' },
    { name: 'Расходы', value: metrics.expenses, sub: 'Операционные (94*)', icon: ArrowDownRight, color: '#ef4444' },
    { name: 'Чистая прибыль', value: metrics.profit, sub: 'Выручка - Расходы', icon: metrics.profit >= 0 ? TrendingUp : TrendingDown, color: '#a855f7' },
    { name: 'Маржинальность', value: metrics.margin, unit: '%', sub: 'Рентабельность', icon: Activity, color: '#3b82f6' },
    { name: 'Деньги в банке', value: metrics.bank, sub: 'Сальдо счета 5110', icon: Wallet, color: '#f59e0b' },
    { name: 'Дебиторка', value: metrics.ar, sub: 'Задолженность клиентов', icon: Users, color: '#6366f1' },
  ];

  // Helper for max value in charts
  const maxVal = Math.max(...data.chartData.map(d => Math.max(d.revenue, d.expenses)));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '10px 0' }}>
      
      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        {cards.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.name} style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 16,
              padding: '20px',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-sm)'
            }}>
              {/* Glow effect */}
              <div style={{
                position: 'absolute', top: -40, right: -40, width: 100, height: 100,
                background: card.color, borderRadius: '50%', filter: 'blur(50px)', opacity: 0.15
              }} />
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {card.name}
                </span>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: `${card.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={14} color={card.color} />
                </div>
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', marginTop: 12, letterSpacing: '-0.02em' }}>
                {card.value.toLocaleString('ru-RU')}
                {card.unit && <span style={{ fontSize: 16, opacity: 0.7, marginLeft: 4 }}>{card.unit}</span>}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 8 }}>
                {card.sub}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
        
        {/* Structure Table */}
        <div style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 16,
          padding: '20px',
        }}>
          <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 20 }}>
            Структура расходов
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {data.expensesByAccount.map((exp, i) => (
                <tr key={exp.code} style={{ borderBottom: i === data.expensesByAccount.length - 1 ? 'none' : '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '12px 0', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', width: 60 }}>{exp.code}</td>
                  <td style={{ padding: '12px 0', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{exp.name}</td>
                  <td style={{ padding: '12px 0', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', textAlign: 'right' }}>
                    {exp.amount.toLocaleString('ru-RU')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Custom CSS Chart */}
        <div style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 16,
          padding: '20px',
          display: 'flex', flexDirection: 'column'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Динамика выручки и расходов
            </h3>
            <div style={{ display: 'flex', gap: 16, fontSize: 11, fontWeight: 600 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--color-primary)' }} /> Выручка
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--color-danger)' }} /> Расходы
              </div>
            </div>
          </div>
          
          <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: 20, paddingTop: 20 }}>
            {data.chartData.map((d, i) => {
              const revHeight = (d.revenue / maxVal) * 100;
              const expHeight = (d.expenses / maxVal) * 100;
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, height: '100%' }}>
                  <div style={{ width: '100%', flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 8, position: 'relative' }}>
                    {/* Revenue Bar */}
                    <div style={{
                      width: '40%', height: `${revHeight}%`,
                      background: 'var(--color-primary)',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.3s ease',
                      boxShadow: '0 0 10px rgba(99, 102, 241, 0.2)'
                    }} />
                    {/* Expenses Bar */}
                    <div style={{
                      width: '40%', height: `${expHeight}%`,
                      background: 'var(--color-danger)',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.3s ease',
                      boxShadow: '0 0 10px rgba(239, 68, 68, 0.2)'
                    }} />
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>{d.period}</div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

export default FinancialDashboard;
