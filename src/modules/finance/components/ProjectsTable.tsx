import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Briefcase, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import type { Project } from '../financeStore';
import { format, parseISO } from 'date-fns';

const fmt = (n: number) => n === 0 ? '—' : new Intl.NumberFormat('ru-RU').format(Math.round(n));
const fmtD = (s?: string) => { try { return s ? format(parseISO(s), 'dd.MM.yy') : '—'; } catch { return '—'; } };


type Status = 'Плановый' | 'В работе' | 'Завершен';
export const STATUS_COLORS: Record<Status, { color: string; bg: string; border: string }> = {
  'Плановый': { color: '#38bdf8', bg: 'rgba(56,189,248,0.1)', border: 'rgba(56,189,248,0.25)' },
  'В работе': { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)' },
  'Завершен': { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.2)' },
};

export interface EnrichedProject extends Project {
  income: number;
  expense: number;
  profit: number;
  margin: number;
  isOverdue: boolean;
}

interface Props {
  data: EnrichedProject[];
  onEdit: (p: Project) => void;
  onDelete: (id: string) => void;
}

const th: React.CSSProperties = {
  padding: '9px 14px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
  borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)',
  whiteSpace: 'nowrap', userSelect: 'none',
};

const GroupRow: React.FC<{ name: string; items: EnrichedProject[]; onEdit: Props['onEdit']; onDelete: Props['onDelete'] }> = ({ name, items, onEdit, onDelete }) => {
  const [open, setOpen] = useState(true);
  const gIncome  = items.reduce((s, p) => s + p.income, 0);
  const gExpense = items.reduce((s, p) => s + p.expense, 0);
  const gProfit  = gIncome - gExpense;
  const gBudget  = items.reduce((s, p) => s + (p.budget ?? 0), 0);
  const gMargin  = gIncome > 0 ? (gProfit / gIncome) * 100 : 0;

  const tdG: React.CSSProperties = { padding: '10px 14px', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-hover)', whiteSpace: 'nowrap' };

  return (
    <>
      <tr style={{ cursor: 'pointer' }} onClick={() => setOpen(o => !o)}>
        <td style={{ ...tdG, width: 32, paddingRight: 0 }}>
          {open ? <ChevronDown size={14} color="var(--text-muted)" /> : <ChevronRight size={14} color="var(--text-muted)" />}
        </td>
        <td style={{ ...tdG, paddingLeft: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <Briefcase size={13} color="var(--color-primary)" />
            {name}
            <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-muted)', background: 'var(--bg-surface)', padding: '1px 6px', borderRadius: 4, border: '1px solid var(--border-subtle)' }}>
              {items.length}
            </span>
          </div>
        </td>
        <td style={tdG} />
        <td style={tdG} />
        <td style={tdG} />
        <td style={{ ...tdG, textAlign: 'right', color: gBudget > 0 ? 'var(--text-secondary)' : 'var(--text-muted)' }}>{fmt(gBudget)}</td>
        <td style={{ ...tdG, textAlign: 'right', color: '#10b981' }}>{fmt(gIncome)}</td>
        <td style={{ ...tdG, textAlign: 'right', color: '#ef4444' }}>{fmt(gExpense)}</td>
        <td style={{ ...tdG, textAlign: 'right', color: gProfit > 0 ? '#10b981' : gProfit < 0 ? '#ef4444' : 'var(--text-muted)' }}>{fmt(gProfit)}</td>
        <td style={{ ...tdG, textAlign: 'right', color: 'var(--color-primary)' }}>{gMargin !== 0 ? `${gMargin.toFixed(1)}%` : '—'}</td>
        <td style={tdG} />
      </tr>

      {open && items.map(p => {
        const st = STATUS_COLORS[(p.status || 'Плановый') as Status] ?? STATUS_COLORS['Плановый'];
        const spent = p.budget ? Math.min(100, (p.expense / p.budget) * 100) : 0;
        const td: React.CSSProperties = { padding: '10px 14px', fontSize: 12, borderBottom: '1px solid var(--border-subtle)', whiteSpace: 'nowrap', color: 'var(--text-primary)' };

        return (
          <tr key={p.id}
            style={{ background: 'var(--bg-base)', transition: 'background 0.12s' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-base)')}>

            <td style={{ ...td, width: 32 }} />
            <td style={{ ...td, paddingLeft: 28, maxWidth: 240 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {p.isOverdue && p.status !== 'Завершен' && (
                  <span title="Просрочен"><AlertTriangle size={12} color="#f59e0b" /></span>
                )}
                <div>
                  <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 190 }}>{p.name}</div>
                  {p.description && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>{p.description}</div>}
                </div>
              </div>
            </td>

            {/* Status */}
            <td style={td}>
              <span style={{ fontSize: 11, fontWeight: 500, padding: '3px 8px', borderRadius: 6, background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
                {p.status || 'Плановый'}
              </span>
            </td>

            {/* Dates */}
            <td style={{ ...td, color: 'var(--text-secondary)' }}>{fmtD(p.dateStart)}</td>
            <td style={{ ...td, color: p.isOverdue && p.status !== 'Завершен' ? '#f59e0b' : 'var(--text-secondary)' }}>{fmtD(p.dateEnd)}</td>

            {/* Budget + progress */}
            <td style={{ ...td, textAlign: 'right' }}>
              {p.budget ? (
                <div>
                  <div style={{ color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>{fmt(p.budget)}</div>
                  <div style={{ height: 3, width: 80, background: 'var(--border-subtle)', borderRadius: 2, marginLeft: 'auto', marginTop: 3 }}>
                    <div style={{ height: '100%', width: `${spent}%`, background: spent > 90 ? '#ef4444' : spent > 70 ? '#f59e0b' : '#10b981', borderRadius: 2, transition: 'width 0.3s' }} />
                  </div>
                </div>
              ) : '—'}
            </td>

            <td style={{ ...td, textAlign: 'right', color: p.income > 0 ? '#10b981' : 'var(--text-muted)', fontWeight: 600 }}>{fmt(p.income)}</td>
            <td style={{ ...td, textAlign: 'right', color: p.expense > 0 ? '#ef4444' : 'var(--text-muted)', fontWeight: 600 }}>{fmt(p.expense)}</td>
            <td style={{ ...td, textAlign: 'right', fontWeight: 700, color: p.profit > 0 ? '#10b981' : p.profit < 0 ? '#ef4444' : 'var(--text-muted)' }}>{fmt(p.profit)}</td>
            <td style={{ ...td, textAlign: 'right', color: p.margin !== 0 ? 'var(--color-primary)' : 'var(--text-muted)', fontWeight: 600 }}>
              {p.margin !== 0 ? `${p.margin.toFixed(1)}%` : '—'}
            </td>

            {/* Actions */}
            <td style={{ ...td, textAlign: 'center' }}>
              <div style={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <button onClick={() => onEdit(p)} title="Редактировать"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '3px 4px', borderRadius: 4 }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-primary)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
                  <Pencil size={12} />
                </button>
                <button onClick={() => onDelete(p.id)} title="Удалить"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '3px 4px', borderRadius: 4 }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
                  <Trash2 size={12} />
                </button>
              </div>
            </td>
          </tr>
        );
      })}
    </>
  );
};

export const ProjectsTable: React.FC<Props> = ({ data, onEdit, onDelete }) => {
  const grouped = useMemo(() => {
    const map = new Map<string, EnrichedProject[]>();
    data.forEach(p => {
      const g = p.group || 'Без группы';
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(p);
    });
    return Array.from(map.entries());
  }, [data]);

  if (data.length === 0) return null;

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th style={{ ...th, width: 32 }} />
          <th style={{ ...th, textAlign: 'left' }}>Проект</th>
          <th style={{ ...th, textAlign: 'left' }}>Статус</th>
          <th style={{ ...th, textAlign: 'left' }}>Начало</th>
          <th style={{ ...th, textAlign: 'left' }}>Конец</th>
          <th style={{ ...th, textAlign: 'right' }}>Бюджет</th>
          <th style={{ ...th, textAlign: 'right' }}>Доходы</th>
          <th style={{ ...th, textAlign: 'right' }}>Расходы</th>
          <th style={{ ...th, textAlign: 'right' }}>Прибыль</th>
          <th style={{ ...th, textAlign: 'right' }}>Рент-ть</th>
          <th style={{ ...th, textAlign: 'center' }}>Действия</th>
        </tr>
      </thead>
      <tbody>
        {grouped.map(([name, items]) => (
          <GroupRow key={name} name={name} items={items} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </tbody>
    </table>
  );
};
