import React from 'react';
import { useFinanceStore, type DealStatus, type Deal } from '../financeStore';
import { format } from 'date-fns';

interface Props {
  onRowClick?: (id: string) => void;
  statusFilter?: DealStatus | 'all';
  searchQuery?: string;
}

const Th: React.FC<{ children?: React.ReactNode; width?: string; first?: boolean; last?: boolean }> = ({ children, width, first, last }) => (
  <th style={{
    padding: '8px 14px', textAlign: 'left', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)',
    borderBottom: '1px solid var(--border-subtle)', whiteSpace: 'nowrap', minWidth: width,
    position: 'sticky', top: 0, background: 'var(--bg-surface)', zIndex: 2,
    borderTopLeftRadius: first ? 8 : 0, borderTopRightRadius: last ? 8 : 0,
  }}>
    {children}
  </th>
);

const Td: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <td style={{ padding: '8px 14px', fontSize: 12, borderBottom: '1px solid var(--border-subtle)', verticalAlign: 'middle', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
    {children}
  </td>
);

const STATUS_LABELS: Record<DealStatus, { label: string; color: string; bg: string }> = {
  new:         { label: 'Новая',      color: '#64748b', bg: 'rgba(100,116,139,0.1)' },
  in_progress: { label: 'В работе',   color: '#7c3aed', bg: 'rgba(124,58,237,0.1)' },
  completed:   { label: 'Завершена',  color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  cancelled:   { label: 'Отменена',   color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
};

const StatusBadge: React.FC<{ status: DealStatus }> = ({ status }) => {
  const m = STATUS_LABELS[status] || STATUS_LABELS['new'];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px',
      borderRadius: 12, fontSize: 11, fontWeight: 600, color: m.color, background: m.bg,
      border: `1px solid ${m.color}22` }}>
      {m.label}
    </span>
  );
};

const ProgressBar: React.FC<{ paid: number; total: number; currency: string }> = ({ paid, total, currency }) => {
  const pct = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
  const full = pct === 100;
  return (
    <div style={{ minWidth: 110 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: full ? '#10b981' : 'var(--text-muted)', marginBottom: 4 }}>
        <span>{new Intl.NumberFormat('ru-RU').format(paid)} {currency}</span>
        <span style={{ fontWeight: 700 }}>{pct}%</span>
      </div>
      <div style={{ height: 5, background: 'var(--bg-hover)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: full ? '#10b981' : 'var(--color-primary)', borderRadius: 4, transition: 'width 0.3s' }} />
      </div>
    </div>
  );
};

export const DealsTable: React.FC<Props> = ({ onRowClick, statusFilter = 'all', searchQuery = '' }) => {
  const { deals, contractors, projects } = useFinanceStore();

  const saleDeals = deals
    .filter((d: Deal) => d.type === 'sale')
    .filter((d: Deal) => statusFilter === 'all' || d.status === statusFilter)
    .filter((d: Deal) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      const ctr = contractors.find(c => c.id === d.contractorId)?.name ?? '';
      return d.name.toLowerCase().includes(q) || ctr.toLowerCase().includes(q);
    });

  if (saleDeals.length === 0) {
    return (
      <div style={{ padding: '60px 40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Сделки не найдены</div>
        <div style={{ fontSize: 12 }}>Измените фильтры или создайте новую сделку</div>
      </div>
    );
  }

  return (
    <div className="finance-mobile-table" style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1000 }}>
        <thead>
          <tr>
            <Th width="260px" first>Сделка</Th>
            <Th>Клиент</Th>
            <Th width="120px">Сумма</Th>
            <Th width="160px">Оплачено</Th>
            <Th width="110px">Остаток</Th>
            <Th width="110px">Статус</Th>
            <Th width="140px" last>Сроки</Th>
          </tr>
        </thead>
        <tbody>
          {saleDeals.map((deal: Deal) => {
            const clientName = contractors.find(c => c.id === deal.contractorId)?.name ?? 'Неизвестно';
            const projectName = projects.find(p => p.id === deal.projectId)?.name;
            const remaining = Math.max(0, deal.amount - deal.paidAmount);
            const isOverdue = deal.status !== 'completed' && deal.dateDeadline && new Date(deal.dateDeadline as string) < new Date();

            return (
              <tr key={deal.id}
                style={{ cursor: onRowClick ? 'pointer' : 'default', transition: 'background 0.1s' }}
                onClick={() => onRowClick?.(deal.id)}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                <Td>
                  <div style={{ color: 'var(--text-primary)', fontWeight: 600, lineHeight: 1.3 }}>{deal.name}</div>
                  {projectName && <div style={{ fontSize: 11, color: 'var(--color-primary)', marginTop: 2 }}>📁 {projectName}</div>}
                </Td>
                <Td>
                  <span style={{ color: 'var(--text-secondary)' }}>{clientName}</span>
                </Td>
                <Td>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                    {new Intl.NumberFormat('ru-RU').format(deal.amount)} {deal.currency}
                  </span>
                </Td>
                <Td>
                  <ProgressBar paid={deal.paidAmount} total={deal.amount} currency={deal.currency} />
                </Td>
                <Td>
                  <span style={{ color: remaining > 0 ? '#ef4444' : '#10b981', fontWeight: 700, whiteSpace: 'nowrap' }}>
                    {new Intl.NumberFormat('ru-RU').format(remaining)} {deal.currency}
                  </span>
                </Td>
                <Td>
                  <StatusBadge status={deal.status} />
                </Td>
                <Td>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    <div>с {deal.dateStart ? format(new Date(deal.dateStart as string), 'dd.MM.yy') : '—'}</div>
                    <div style={{ color: isOverdue ? '#ef4444' : 'inherit', fontWeight: isOverdue ? 700 : 400 }}>
                      по {deal.dateDeadline ? format(new Date(deal.dateDeadline as string), 'dd.MM.yy') : '—'}
                      {isOverdue && <span style={{ marginLeft: 4, fontSize: 9, background: '#ef4444', color: 'var(--text-primary)', borderRadius: 4, padding: '1px 4px' }}>!!</span>}
                    </div>
                  </div>
                </Td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
