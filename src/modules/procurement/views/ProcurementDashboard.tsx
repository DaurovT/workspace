import React from 'react';
import { useProcurementStore } from '../procurementStore';
import { Activity, AlertTriangle, TrendingDown, Clock, List, Trophy, FileText } from 'lucide-react';

// ─── KPI Card — exact Manor Finance StatsCard style ────────────────────────

const KpiCard = ({ label, value, sub, icon, color }: { label: string; value: string | number; sub?: string; icon: React.ReactNode; color: string }) => (
  <div style={{ padding: '16px 20px', borderRight: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 6 }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
    <div style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', color, opacity: 0.7, flexShrink: 0 }}>
      {icon}
    </div>
    </div>
    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{value}</div>
    {sub && <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{sub}</div>}
  </div>
);

// ─── Progress bar ──────────────────────────────────────────────────────────

const StatusBar = ({ label, count, total, color }: { label: string; count: number; total: number; color: string }) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontSize: 11, color: 'var(--text-primary)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
          {count} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({pct}%)</span>
        </span>
      </div>
      <div style={{ height: 4, background: 'var(--bg-elevated)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 2, transition: 'width 0.4s ease' }} />
      </div>
    </div>
  );
};

// ─── Section wrapper — same as Finance Section ──────────────────────────────

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 8, overflow: 'hidden', marginBottom: 16 }}>
    <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
      <h2 style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-secondary)', margin: 0 }}>{title}</h2>
    </div>
    {children}
  </div>
);

// ─── Main ──────────────────────────────────────────────────────────────────

const ProcurementDashboard: React.FC = () => {
  const requests = useProcurementStore(state => state.requests);
  const items = useProcurementStore(state => state.items);
  const tenders = useProcurementStore(state => state.tenders);

  const activeRequests = requests.filter(r => r.status !== 'closed' && r.status !== 'cancelled').length;
  const totalItems = items.length;

  const overdueItems = items.filter(i => {
    if (!i.plannedDate || i.actualDate) return false;
    return new Date(i.plannedDate) < new Date();
  });

  const itemsWithDiff = items.filter(i => i.tenderPrice > 0 && i.supplierPrice > 0);
  const negativeDiff = itemsWithDiff.filter(i => {
    const base = i.quantity * i.supplierPrice;
    const broker = i.brokerAmount > 0 ? i.brokerAmount : base * (i.brokerPct / 100);
    const add = i.logisticsCost + i.certification + i.customs + i.otherExpenses;
    return (i.quantity * i.tenderPrice) < (base + broker + add);
  }).length;

  const totalTenderSum = items.reduce((a, i) => a + i.quantity * i.tenderPrice, 0);
  const totalNetSum = items.reduce((a, i) => {
    const base = i.quantity * i.supplierPrice;
    const broker = i.brokerAmount > 0 ? i.brokerAmount : base * (i.brokerPct / 100);
    const add = i.logisticsCost + i.certification + i.customs + i.otherExpenses;
    return a + base + broker + add;
  }, 0);
  const economy = totalTenderSum - totalNetSum;

  const statusCounts: Record<string, number> = {};
  items.forEach(i => { statusCounts[i.status] = (statusCounts[i.status] || 0) + 1; });

  const STATUS_LABELS: Record<string, [string, string]> = {
    new:        ['Новые',       '#6b7280'],
    calculated: ['Рассчитаны', '#3b82f6'],
    in_tender:  ['В тендере',  '#8b5cf6'],
    ordered:    ['Заказаны',   '#f59e0b'],
    delivered:  ['Доставлены', '#10b981'],
    problem:    ['Проблема',   '#ef4444'],
  };

  const activeTenders = tenders.filter(t => t.status === 'active').length;
  const fmt = (n: number) => Math.round(n).toLocaleString('ru');

  return (
    <div style={{ padding: 0 }}>
      {/* Page header — Manor style */}
      <div style={{ height: 44, display: 'flex', alignItems: 'center', paddingLeft: 2, marginBottom: 16 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: -0.01 }}>Дашборд закупок</span>
      </div>

      {/* KPI row */}
      <Section title="Ключевые показатели">
        <div className="mobile-2-col" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)' }}>
          <KpiCard label="Активные заявки" value={activeRequests} sub={`Всего: ${requests.length}`} icon={<FileText />} color="#3b82f6" />
          <KpiCard label="Позиций" value={totalItems} sub={negativeDiff > 0 ? `Убыточных: ${negativeDiff}` : 'Все в плюсе ✓'} icon={<List />} color="#8b5cf6" />
          <KpiCard label="Просроченных" value={overdueItems.length} sub={overdueItems.length > 0 ? 'Требуют внимания' : 'В сроке ✓'} icon={<Clock />} color={overdueItems.length > 0 ? '#ef4444' : '#10b981'} />
          <KpiCard label="Тендеры активны" value={activeTenders} sub={`Всего: ${tenders.length}`} icon={<Trophy />} color="#f59e0b" />
          <KpiCard label="Экономия (план)" value={totalTenderSum > 0 ? (economy >= 0 ? '+' : '−') + fmt(Math.abs(economy)) : '—'} sub={totalTenderSum > 0 ? `Тенд: ${fmt(totalTenderSum)}` : 'Нет данных'} icon={<Activity />} color={economy >= 0 ? '#10b981' : '#ef4444'} />
          <KpiCard label="Отриц. разница" value={negativeDiff} sub={itemsWithDiff.length > 0 ? `из ${itemsWithDiff.length} рассч.` : '—'} icon={<TrendingDown />} color="#ef4444" />
        </div>
      </Section>

      <div className="mobile-1-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Status breakdown */}
        <Section title="Распределение позиций по статусам">
          <div style={{ padding: '12px 20px' }}>
            {totalItems === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center', padding: '16px 0' }}>Нет позиций</div>
            ) : (
              Object.entries(STATUS_LABELS).map(([key, [label, color]]) =>
                statusCounts[key] ? (
                  <StatusBar key={key} label={label} count={statusCounts[key]} total={totalItems} color={color} />
                ) : null
              )
            )}
          </div>
        </Section>

        {/* Problem items */}
        <Section title="Требует внимания">
          <div style={{ padding: '12px 20px' }}>
            {overdueItems.length === 0 && negativeDiff === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center', padding: '16px 0' }}>
                🎉 Критичных проблем нет
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {overdueItems.slice(0, 6).map(item => (
                  <div key={item.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 6,
                    background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)'
                  }}>
                    <AlertTriangle size={12} color="#ef4444" style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.productName}</div>
                      <div style={{ fontSize: 10, color: '#ef4444' }}>Просрочка: {item.plannedDate}</div>
                    </div>
                  </div>
                ))}
                {overdueItems.length > 6 && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', paddingTop: 4 }}>+ ещё {overdueItems.length - 6}</div>
                )}
              </div>
            )}
          </div>
        </Section>
      </div>
    </div>
  );
};

export default ProcurementDashboard;
