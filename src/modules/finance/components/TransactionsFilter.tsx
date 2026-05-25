import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Calendar, X } from 'lucide-react';
import { useFinanceStore } from '../financeStore';

// ─── Collapsible Section ──────────────────────────────────────────────────────
const Section: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          width: '100%', background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
          color: 'var(--text-muted)', padding: 0, marginBottom: open ? 12 : 0 }}>
        {title}
        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>
      {open && children}
    </div>
  );
};

// ─── Multi-select dropdown ────────────────────────────────────────────────────
const MultiSelect: React.FC<{
  label: string;
  options: { id: string; name: string }[];
  selected: string[];
  onToggle: (id: string) => void;
  onClearAll: () => void;
}> = ({ label, options, selected, onToggle, onClearAll }) => {
  const [open, setOpen] = useState(false);
  const selectedNames = options.filter(o => selected.includes(o.id)).map(o => o.name);
  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '7px 10px', background: 'var(--bg-hover)',
          border: selected.length > 0 ? '1px solid var(--color-primary)' : '1px solid transparent',
          borderRadius: 6, fontSize: 12, fontWeight: 500,
          color: selected.length > 0 ? 'var(--color-primary)' : 'var(--text-secondary)',
          width: '100%', cursor: 'pointer', gap: 6, textAlign: 'left' }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {selectedNames.length > 0 ? selectedNames.join(', ') : label}
        </span>
        {selected.length > 0
          ? <X size={12} onClick={e => { e.stopPropagation(); onClearAll(); }} />
          : <ChevronDown size={12} />}
      </button>
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
          background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
          borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', padding: '8px 0', marginTop: 4 }}>
          {options.map(opt => (
            <label key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', cursor: 'pointer', fontSize: 12,
              color: 'var(--text-primary)', background: selected.includes(opt.id) ? 'rgba(99,102,241,0.08)' : 'transparent' }}>
              <input type="checkbox" checked={selected.includes(opt.id)} onChange={() => onToggle(opt.id)}
                style={{ accentColor: 'var(--color-primary)', width: 14, height: 14 }} />
              {opt.name}
            </label>
          ))}
          {options.length === 0 && (
            <div style={{ padding: '8px 12px', fontSize: 12, color: 'var(--text-muted)' }}>Нет данных</div>
          )}
          <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '4px 0' }} />
          <button onClick={() => setOpen(false)} style={{ width: '100%', padding: '6px 12px', fontSize: 11, fontWeight: 600,
            color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
            Готово
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const TransactionsFilter: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const {
    accounts, contractors, categories, projects,
    typeFilter, setTypeFilter,
    filterStatusPaid, setFilterStatusPaid,
    filterStatusUnpaid, setFilterStatusUnpaid,
    filterAccounts, setFilterAccounts,
    filterContractors, setFilterContractors,
    filterCategories, setFilterCategories,
    filterProjects, setFilterProjects,
    filterDateFrom, setFilterDateFrom,
    filterDateTo, setFilterDateTo,
    filterAmountFrom, setFilterAmountFrom,
    filterAmountTo, setFilterAmountTo,
  } = useFinanceStore();

  const toggleType = (t: string) => {
    if (typeFilter.includes(t)) setTypeFilter(typeFilter.filter(x => x !== t));
    else setTypeFilter([...typeFilter, t]);
  };

  const toggleItem = (list: string[], setter: (v: string[]) => void, id: string) => {
    if (list.includes(id)) setter(list.filter(x => x !== id));
    else setter([...list, id]);
  };

  const hasAnyFilter =
    typeFilter.length < 4
    || !filterStatusPaid || !filterStatusUnpaid
    || filterAccounts.length > 0 || filterContractors.length > 0
    || filterCategories.length > 0 || filterProjects.length > 0
    || !!filterDateFrom || !!filterDateTo
    || !!filterAmountFrom || !!filterAmountTo;

  const resetAll = () => {
    setTypeFilter(['income', 'expense', 'transfer', 'accrual']);
    setFilterStatusPaid(true);
    setFilterStatusUnpaid(true);
    setFilterAccounts([]);
    setFilterContractors([]);
    setFilterCategories([]);
    setFilterProjects([]);
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterAmountFrom('');
    setFilterAmountTo('');
  };

  const chkStyle = { accentColor: 'var(--color-primary)', width: 14, height: 14, cursor: 'pointer' };
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '6px 10px', background: 'var(--bg-hover)',
    border: '1px solid transparent', borderRadius: 6, color: 'var(--text-primary)',
    fontSize: 12, outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{ width: 240, flexShrink: 0, background: 'var(--bg-surface)', borderRight: '1px solid var(--border-subtle)',
      display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>

      {/* Header */}
      <div style={{ height: 44, padding: '0 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Фильтры</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {hasAnyFilter && (
            <button onClick={resetAll} style={{ fontSize: 11, color: 'var(--color-primary)', background: 'none', border: 'none',
              cursor: 'pointer', fontWeight: 600, padding: 0 }}>
              Сброс
            </button>
          )}
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
        </div>
      </div>

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 24, flex: 1 }}>

        {/* Тип операции */}
        <Section title="Тип операции">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { key: 'income',  label: 'Поступление', color: '#10b981' },
              { key: 'expense', label: 'Выплата',      color: '#ef4444' },
              { key: 'transfer',label: 'Перемещение',  color: '#3b82f6' },
              { key: 'accrual', label: 'Начисление',   color: '#f59e0b' },
            ].map(({ key, label, color }) => (
              <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input type="checkbox" checked={typeFilter.includes(key)} onChange={() => toggleType(key)} style={chkStyle} />
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>{label}</span>
                </span>
              </label>
            ))}
          </div>
        </Section>

        {/* Статус оплаты */}
        <Section title="Статус оплаты">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input type="checkbox" checked={filterStatusPaid} onChange={e => setFilterStatusPaid(e.target.checked)} style={chkStyle} />
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>Подтверждена</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input type="checkbox" checked={filterStatusUnpaid} onChange={e => setFilterStatusUnpaid(e.target.checked)} style={chkStyle} />
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>Не подтверждена</span>
            </label>
          </div>
        </Section>

        {/* Период */}
        <Section title="Период оплаты" defaultOpen={false}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calendar size={12} color="var(--text-muted)" style={{ flexShrink: 0 }} />
              <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)}
                style={{ ...inputStyle, flex: 1, fontSize: 11 }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calendar size={12} color="var(--text-muted)" style={{ flexShrink: 0 }} />
              <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)}
                style={{ ...inputStyle, flex: 1, fontSize: 11 }} />
            </div>
            {(filterDateFrom || filterDateTo) && (
              <button onClick={() => { setFilterDateFrom(''); setFilterDateTo(''); }}
                style={{ fontSize: 11, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
                Очистить период
              </button>
            )}
          </div>
        </Section>

        {/* Счета */}
        <Section title={`Счета${filterAccounts.length > 0 ? ` (${filterAccounts.length})` : ''}`} defaultOpen={false}>
          <MultiSelect
            label="Все счета"
            options={accounts.map(a => ({ id: a.id, name: a.name }))}
            selected={filterAccounts}
            onToggle={id => toggleItem(filterAccounts, setFilterAccounts, id)}
            onClearAll={() => setFilterAccounts([])}
          />
        </Section>

        {/* Контрагенты */}
        <Section title={`Контрагенты${filterContractors.length > 0 ? ` (${filterContractors.length})` : ''}`} defaultOpen={false}>
          <MultiSelect
            label="Все контрагенты"
            options={contractors.map(c => ({ id: c.id, name: c.name }))}
            selected={filterContractors}
            onToggle={id => toggleItem(filterContractors, setFilterContractors, id)}
            onClearAll={() => setFilterContractors([])}
          />
        </Section>

        {/* Статьи */}
        <Section title={`Статьи учёта${filterCategories.length > 0 ? ` (${filterCategories.length})` : ''}`} defaultOpen={false}>
          <MultiSelect
            label="Все статьи"
            options={categories.filter(c => !c.parentId).map(c => ({ id: c.id, name: c.name }))}
            selected={filterCategories}
            onToggle={id => toggleItem(filterCategories, setFilterCategories, id)}
            onClearAll={() => setFilterCategories([])}
          />
        </Section>

        {/* Проекты */}
        <Section title={`Проекты${filterProjects.length > 0 ? ` (${filterProjects.length})` : ''}`} defaultOpen={false}>
          <MultiSelect
            label="Все проекты"
            options={projects.map(p => ({ id: p.id, name: p.name }))}
            selected={filterProjects}
            onToggle={id => toggleItem(filterProjects, setFilterProjects, id)}
            onClearAll={() => setFilterProjects([])}
          />
        </Section>

        {/* Сумма */}
        <Section title="Сумма" defaultOpen={false}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="number" value={filterAmountFrom} onChange={e => setFilterAmountFrom(e.target.value)}
              placeholder="От" min="0"
              style={{ ...inputStyle, width: '50%' }} />
            <span style={{ color: 'var(--text-muted)', flexShrink: 0, fontSize: 12 }}>—</span>
            <input
              type="number" value={filterAmountTo} onChange={e => setFilterAmountTo(e.target.value)}
              placeholder="До" min="0"
              style={{ ...inputStyle, width: '50%' }} />
          </div>
        </Section>

        {/* Help */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 'auto', padding: '12px 0 4px' }}>
          <HelpCircle size={12} color="var(--text-muted)" />
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Фильтры применяются мгновенно</span>
        </div>
      </div>
    </div>
  );
};
