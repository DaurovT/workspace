import React, { useState, useMemo } from 'react';
import { useFinanceStore } from '../financeStore';
import { Filter, ChevronDown, ChevronRight, Download, Activity, HelpCircle, Calendar } from 'lucide-react';
import { format, parseISO, eachMonthOfInterval, endOfMonth } from 'date-fns';
import { ru } from 'date-fns/locale';
import { APP_CURRENCY } from '../config/currency';
import { useTranslation } from 'react-i18next';

type GroupBy = 'month' | 'quarter';
const fmtN = (n: number) => n === 0 ? '—' : new Intl.NumberFormat('ru-RU').format(Math.round(n));
const fmtNSigned = (n: number) => {
  if (n === 0) return '—';
  return (n > 0 ? '' : '−') + new Intl.NumberFormat('ru-RU').format(Math.abs(Math.round(n)));
};

interface Col { label: string; month: number; year: number; }

const getQuarterLabel = (m: number) => `Q${Math.ceil(m / 3)}`;

const ReportsCashflowPage: React.FC = () => {
  const { t } = useTranslation();
    const { transactions, categories, accounts, projects } = useFinanceStore();

  const now = new Date();
  const defaultFrom = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const defaultTo   = new Date(now.getFullYear(), now.getMonth(), 1);

  const [dateFrom, setDateFrom] = useState(format(defaultFrom, 'yyyy-MM-dd'));
  const [dateTo,   setDateTo]   = useState(format(defaultTo,   'yyyy-MM-dd'));
  const [groupBy,  setGroupBy]  = useState<GroupBy>('month');
  const [acctFilter, setAcctFilter] = useState<string[]>([]);
  const [projFilter, setProjFilter] = useState<string[]>([]);
  const [showAcctDrop, setShowAcctDrop] = useState(false);
  const [showProjDrop, setShowProjDrop] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ op: true, inv: true, fin: true });
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'f' && !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        setSidebarOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggle = (id: string) => setExpanded(p => ({ ...p, [id]: !p[id] }));

  // ── Build columns ──────────────────────────────────────────────────────────
  const cols = useMemo<Col[]>(() => {
    const from = parseISO(dateFrom);
    const to   = parseISO(dateTo);
    if (from > to) return [];
    return eachMonthOfInterval({ start: from, end: to }).map(d => ({
      label: format(d, 'MMM yy', { locale: ru }),
      month: d.getMonth() + 1,
      year:  d.getFullYear(),
    }));
  }, [dateFrom, dateTo]);

  // Quarter-collapsed columns
  const displayCols = useMemo(() => {
    if (groupBy === 'month') return cols;
    const map = new Map<string, Col>();
    cols.forEach(c => {
      const key = `${getQuarterLabel(c.month)} ${c.year}`;
      if (!map.has(key)) map.set(key, { label: key, month: c.month, year: c.year });
    });
    return Array.from(map.values());
  }, [cols, groupBy]);

  // ── Build category tree with activity ──────────────────────────────────────
  const catMap = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);

  // ── Filter transactions ────────────────────────────────────────────────────
  const baseTx = useMemo(() => {
    const fromMs = parseISO(dateFrom).getTime();
    const toMs   = endOfMonth(parseISO(dateTo)).getTime();
    return transactions.filter(t => {
      if (t.type === 'transfer' || !t.isPaidConfirmed) return false;
      const d = parseISO(t.date).getTime();
      if (d < fromMs || d > toMs) return false;
      if (acctFilter.length && !acctFilter.includes(t.accountId ?? '')) return false;
      if (projFilter.length && !projFilter.includes(t.projectId ?? '')) return false;
      return true;
    });
  }, [transactions, dateFrom, dateTo, acctFilter, projFilter]);

  // ── Aggregate by (activity, catId, col) ───────────────────────────────────
  const agg = useMemo(() => {
    const result: Record<string, number[]> = {};
    const ensure = (k: string) => { if (!result[k]) result[k] = Array(displayCols.length).fill(0); };

    const getColIdx = (date: string) => {
      const d = parseISO(date);
      const m = d.getMonth() + 1, y = d.getFullYear();
      if (groupBy === 'month') return displayCols.findIndex(c => c.month === m && c.year === y);
      const qKey = `${getQuarterLabel(m)} ${y}`;
      return displayCols.findIndex(c => `${getQuarterLabel(c.month)} ${c.year}` === qKey);
    };

    baseTx.forEach(t => {
      const cat = catMap.get(t.categoryId ?? '');
      // Bug #3 fix: skip transactions without an activity category
      if (!cat?.activity) return;
      const activity = cat.activity;
      const idx = getColIdx(t.date);
      if (idx < 0) return;
      const sign = t.type === 'income' ? 1 : -1;
      ensure(activity); result[activity][idx] += sign * (t.baseAmount ?? t.amount);
      const ck = `${activity}__${t.categoryId}`;
      ensure(ck); result[ck][idx] += sign * (t.baseAmount ?? t.amount);
    });
    return result;
  }, [baseTx, catMap, displayCols, groupBy]);

  // Bug #4 fix: initialBalance = current account balance MINUS all confirmed non-transfer
  // transactions that happened AFTER the period start (to reverse-engineer the opening balance)
  const initialBalance = useMemo(() => {
    const accts = acctFilter.length ? accounts.filter(a => acctFilter.includes(a.id)) : accounts;
    const currentTotal = accts.reduce((s, a) => s + (a.currency === APP_CURRENCY ? a.balance : 0), 0);
    const fromMs = parseISO(dateFrom).getTime();
    // All confirmed non-transfer UZS transactions from period start to now
    const allPeriodTx = transactions.filter(t => {
      if (t.type === 'transfer' || !t.isPaidConfirmed) return false;
      const acc = accounts.find(a => a.id === t.accountId);
      if (acc && acc.currency !== APP_CURRENCY) return false;
      if (acctFilter.length && !acctFilter.includes(t.accountId ?? '')) return false;
      return parseISO(t.date).getTime() >= fromMs;
    });
    const periodSum = allPeriodTx.reduce((s, t) => s + (t.type === 'income' ? (t.baseAmount ?? t.amount) : -(t.baseAmount ?? t.amount)), 0);
    return currentTotal - periodSum;
  }, [accounts, transactions, dateFrom, acctFilter]);

  // ── Net cash flow per column ───────────────────────────────────────────────
  const ncf = useMemo(() => displayCols.map((_, i) => {
    const op  = agg['operating']?.[i]  ?? 0;
    const inv = agg['investing']?.[i]  ?? 0;
    const fin = agg['financing']?.[i]  ?? 0;
    return op + inv + fin;
  }), [agg, displayCols]);

  // ── Balances ──────────────────────────────────────────────────────────────
  const balances = useMemo(() => {
    const arr: number[] = [];
    let running = initialBalance;
    displayCols.forEach((_, i) => { running += ncf[i]; arr.push(running); });
    return arr;
  }, [initialBalance, ncf, displayCols]);

  const openBalances = useMemo(() => {
    return displayCols.map((_, i) => i === 0 ? initialBalance : balances[i - 1]);
  }, [initialBalance, balances, displayCols]);

  // ── Cash gap detection ────────────────────────────────────────────────────
  const gapCols = useMemo(() => balances.map(b => b < 0), [balances]);
  const hasGap  = gapCols.some(Boolean);

  // ── Categories per activity ───────────────────────────────────────────────
  const catsByActivity = useMemo(() => {
    const map: Record<string, typeof categories> = { operating: [], investing: [], financing: [] };
    categories.filter(c => c.activity && !c.parentId && (c.type === 'income' || c.type === 'expense')).forEach(c => {
      map[c.activity!]?.push(c);
    });
    return map;
  }, [categories]);

  // ── Style constants aligned with project design system ───────────────────
  const tdS: React.CSSProperties = {
    padding: '8px 14px',
    borderBottom: '1px solid var(--border-subtle)',
    whiteSpace: 'nowrap',
    color: 'var(--text-primary)',
    fontSize: 12,
  };
  const inp: React.CSSProperties = {
    padding: '0 8px',
    height: 28,
    background: 'var(--bg-elevated)',       // correct: elevated, not base
    border: '1px solid var(--border-default)', // correct: default, not subtle
    borderRadius: 6,
    color: 'var(--text-primary)',
    fontSize: 12,
    outline: 'none',
    transition: 'border-color 160ms ease',
  };

  // ── Render ────────────────────────────────────────────────────────────────
  const totalRow = (label: string, values: number[], color?: string, bold = true) => (
    <tr className="row-total">
      <td className="sticky-col" style={{ ...tdS, paddingLeft: 16, fontWeight: bold ? 700 : 500, color: color ?? 'var(--text-primary)', fontSize: 13 }}>{label}</td>
      <td style={tdS} />
      {values.map((v, i) => (
        <td key={i} style={{ ...tdS, textAlign: 'right', fontWeight: bold ? 700 : 600,
          color: color ?? (v < 0 ? '#ef4444' : v > 0 ? '#10b981' : 'var(--text-muted)'),
          background: gapCols[i] ? 'rgba(239,68,68,0.05)' : undefined }}>
          {fmtNSigned(v)}
        </td>
      ))}
      <td style={{ ...tdS, textAlign: 'right', fontWeight: 700, color: color ?? (values.reduce((a,b)=>a+b,0) < 0 ? '#ef4444' : '#10b981'), background: 'var(--bg-surface)' }}>
        {fmtNSigned(values.reduce((a, b) => a + b, 0))}
      </td>
    </tr>
  );

  const sectionRow = (id: string, label: string, values: number[]) => {
    const isOpen = expanded[id];
    const cats = catsByActivity[id] ?? [];
    const actColor = id === 'operating' ? '#6366f1' : id === 'investing' ? '#f59e0b' : '#10b981';
    return (
      <React.Fragment key={id}>
        <tr className="row-section" style={{ cursor: 'pointer' }} onClick={() => toggle(id)}>
          <td className="sticky-col" style={{ ...tdS, fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', paddingLeft: 16 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 3, height: 14, borderRadius: 2, background: actColor, display: 'inline-block' }} />
              {isOpen ? <ChevronDown size={13} color="var(--text-muted)" /> : <ChevronRight size={13} color="var(--text-muted)" />}
              {label}
            </span>
          </td>
          <td style={{ ...tdS, paddingLeft: 8 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', height: 14, gap: 2 }}>
              {values.map((v, i) => {
                const max = Math.max(...values.map(Math.abs), 1);
                return <div key={i} style={{ width: 4, height: Math.max(2, (Math.abs(v)/max)*14), background: v >= 0 ? '#10b981' : '#ef4444', borderRadius: 1 }} />;
              })}
            </div>
          </td>
          {values.map((v, i) => (
            <td key={i} style={{ ...tdS, textAlign: 'right', fontWeight: 700, color: v < 0 ? '#ef4444' : v > 0 ? '#10b981' : 'var(--text-muted)',
              background: gapCols[i] ? 'rgba(239,68,68,0.05)' : undefined }}>
              {fmtNSigned(v)}
            </td>
          ))}
          <td style={{ ...tdS, textAlign: 'right', fontWeight: 700, color: values.reduce((a,b)=>a+b,0) < 0 ? '#ef4444' : '#10b981', background: 'var(--bg-surface)' }}>
            {fmtNSigned(values.reduce((a,b)=>a+b,0))}
          </td>
        </tr>
        {isOpen && cats.map(cat => {
          const key = `${id}__${cat.id}`;
          const vals = agg[key] ?? Array(displayCols.length).fill(0);
          if (vals.every(v => v === 0)) return null;
          return (
            <tr key={cat.id} className="row-base row-hover">
              <td className="sticky-col" style={{ ...tdS, paddingLeft: 40, color: 'var(--text-secondary)', fontSize: 12 }}>{cat.name}</td>
              <td style={tdS} />
              {vals.map((v, i) => (
                <td key={i} style={{ ...tdS, textAlign: 'right', fontSize: 12, color: v < 0 ? '#ef4444' : v > 0 ? 'var(--text-primary)' : 'var(--text-muted)',
                  background: gapCols[i] ? 'rgba(239,68,68,0.04)' : undefined }}>
                  {fmtN(Math.abs(v)) === '—' ? '—' : fmtNSigned(v)}
                </td>
              ))}
              <td style={{ ...tdS, textAlign: 'right', fontSize: 12, background: 'var(--bg-surface)', color: vals.reduce((a,b)=>a+b,0) < 0 ? '#ef4444' : 'var(--text-primary)' }}>
                {fmtNSigned(vals.reduce((a,b)=>a+b,0))}
              </td>
            </tr>
          );
        })}
      </React.Fragment>
    );
  };


  const exportCSV = () => {
    const hdr = ['Статья', ...displayCols.map(c => c.label), 'Итого'].join(';');
    const rows = [
      ['Операционный поток', ...(agg['operating'] ?? []).map(String), String((agg['operating']??[]).reduce((a,b)=>a+b,0))].join(';'),
      ['Инвестиционный поток', ...(agg['investing'] ?? []).map(String), String((agg['investing']??[]).reduce((a,b)=>a+b,0))].join(';'),
      ['Финансовый поток', ...(agg['financing'] ?? []).map(String), String((agg['financing']??[]).reduce((a,b)=>a+b,0))].join(';'),
      ['Чистый ДП', ...ncf.map(String), String(ncf.reduce((a,b)=>a+b,0))].join(';'),
      ['Остаток нач.', ...openBalances.map(String), ''].join(';'),
      ['Остаток кон.', ...balances.map(String), ''].join(';'),
    ];
    const blob = new Blob([[hdr, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'ODDС.csv'; a.click();
  };

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', background: 'var(--bg-base)' }}>
      <style>{`
        .sticky-col { position: sticky; left: 0; z-index: 10; background-color: inherit; }
        .row-base { background-color: var(--bg-base); }
        .row-hover:hover { background-color: var(--bg-hover); }
        .row-section { background-color: var(--bg-surface); }
        .row-section:hover { background-color: var(--bg-elevated); }
        .row-total { background-color: var(--bg-hover); }
      `}</style>

      {/* ── SIDEBAR ── */}
      {isSidebarOpen && (
      <div style={{ width: 240, flexShrink: 0, borderRight: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: 44, padding: '0 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <Filter size={13} color="var(--text-muted)" />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{t("Параметры отчёта", "Параметры отчёта")}</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
        </div>

        <div style={{ flex: 1, padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Period */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 8 }}>{t("Период", "Период")}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Calendar size={12} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                  style={{ ...inp, flex: 1 }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Calendar size={12} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                  style={{ ...inp, flex: 1 }} />
              </div>
            </div>
            {/* GroupBy switcher — matches .view-switcher pattern */}
            <div style={{ display: 'flex', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: 2, gap: 1, marginTop: 8 }}>
              {(['month', 'quarter'] as GroupBy[]).map(g => (
                <button key={g} onClick={() => setGroupBy(g)} style={{
                  flex: 1, height: 22, fontSize: 11, fontWeight: 500, cursor: 'pointer', borderRadius: 4,
                  background: groupBy === g ? 'var(--bg-card)' : 'transparent',
                  color: groupBy === g ? 'var(--text-primary)' : 'var(--text-secondary)',
                  border: 'none',
                  boxShadow: groupBy === g ? 'var(--shadow-sm)' : 'none',
                  transition: 'all 160ms ease',
                }}>
                  {g === 'month' ? 'Месяц' : 'Квартал'}
                </button>
              ))}
            </div>
          </div>

          {/* Accounts */}
          <div style={{ position: 'relative' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>{t("Счета", "Счета")}</div>
            <button onClick={() => { setShowAcctDrop(p => !p); setShowProjDrop(false); }}
              style={{ ...inp, width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
              <span>{acctFilter.length ? `${acctFilter.length} выбрано` : 'Все счета'}</span>
              <ChevronDown size={12} />
            </button>
            {showAcctDrop && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8, zIndex: 50, padding: 8, marginTop: 4, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
                <label style={{ display: 'flex', gap: 6, fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, cursor: 'pointer' }}>
                  <input type="checkbox" checked={acctFilter.length === 0} onChange={() => setAcctFilter([])} />  {t("Все счета", "Все счета")}
                </label>
                {accounts.filter(a => a.currency === APP_CURRENCY).map(a => (
                  <label key={a.id} style={{ display: 'flex', gap: 6, fontSize: 12, color: 'var(--text-primary)', marginBottom: 4, cursor: 'pointer' }}>
                    <input type="checkbox" checked={acctFilter.includes(a.id)}
                      onChange={() => setAcctFilter(p => p.includes(a.id) ? p.filter(x => x !== a.id) : [...p, a.id])} />
                    {a.name}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Projects */}
          <div style={{ position: 'relative' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>{t("Проектов", "Проектов")}</div>
            <button onClick={() => { setShowProjDrop(p => !p); setShowAcctDrop(false); }}
              style={{ ...inp, width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
              <span>{projFilter.length ? `${projFilter.length} выбрано` : 'Все проекты'}</span>
              <ChevronDown size={12} />
            </button>
            {showProjDrop && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8, zIndex: 50, padding: 8, marginTop: 4, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
                <label style={{ display: 'flex', gap: 6, fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, cursor: 'pointer' }}>
                  <input type="checkbox" checked={projFilter.length === 0} onChange={() => setProjFilter([])} />  {t("Все проекты", "Все проекты")}
                </label>
                {projects.map(p => (
                  <label key={p.id} style={{ display: 'flex', gap: 6, fontSize: 12, color: 'var(--text-primary)', marginBottom: 4, cursor: 'pointer' }}>
                    <input type="checkbox" checked={projFilter.includes(p.id)}
                      onChange={() => setProjFilter(prev => prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id])} />
                    {p.name}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Reset */}
          {(acctFilter.length > 0 || projFilter.length > 0) && (
            <button onClick={() => { setAcctFilter([]); setProjFilter([]); }}
              style={{ fontSize: 11, color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
              
              {t("✕ Сбросить фильтры", "✕ Сбросить фильтры")}
            </button>
          )}
        </div>
      </div>
      )}

      {/* ── MAIN ─────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}
        onClick={() => { setShowAcctDrop(false); setShowProjDrop(false); }}>

        {/* Gap Alert */}
        {hasGap && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'rgba(220,38,38,0.08)',
            borderBottom: '1px solid rgba(220,38,38,0.18)',
            padding: '8px 24px', flexShrink: 0,
          }}>
            <Activity size={14} color="var(--color-danger)" />
            <span style={{ fontSize: 11, color: 'var(--color-danger)', fontWeight: 500 }}>
              <b>{t("Внимание:", "Внимание:")}</b>  {t("Кассовый разрыв в", "Кассовый разрыв в")} {displayCols.filter((_, i) => gapCols[i]).map(c => c.label).join(', ')}
            </span>
          </div>
        )}

        {/* Page header — matches .header height & style */}
        <div style={{
          height: 44, padding: '0 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0, background: 'var(--bg-surface)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <button onClick={() => setSidebarOpen(!isSidebarOpen)} style={{ background: isSidebarOpen ? 'var(--bg-card)' : 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <Filter size={13} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <span style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: -0.01 }}>{t("ОДДС: Движение денежных средств", "ОДДС: Движение денежных средств")}</span>
              <span title={t("Отчёт о движении денежных средств: операционный, инвестиционный, финансовый потоки", "Отчёт о движении денежных средств: операционный, инвестиционный, финансовый потоки")} style={{ cursor: 'pointer', display: 'flex', color: 'var(--text-muted)' }}>
                <HelpCircle size={13} />
              </span>
            </div>
          </div>
          <button onClick={exportCSV} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '0 10px', height: 28,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
            borderRadius: 6, fontSize: 12,
            color: 'var(--text-secondary)', cursor: 'pointer',
            transition: 'all 160ms ease',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
            <Download size={12} />  {t("В CSV", "В CSV")}
          </button>
        </div>

        {/* Table */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {displayCols.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              
              {t("Выберите корректный период (начало ≤ конец)", "Выберите корректный период (начало ≤ конец)")}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1000 }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                <tr style={{ background: 'var(--bg-surface)', boxShadow: '0 1px 0 var(--border-subtle)' }}>
                  <th style={{ ...tdS, textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, width: 260, position: 'sticky', left: 0, background: 'var(--bg-surface)', zIndex: 20 }}>{t("По статьям учёта", "По статьям учёта")}</th>
                  <th style={{ ...tdS, width: 60, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-muted)' }}>{t("Тренд", "Тренд")}</th>
                  {displayCols.map((c, i) => (
                    <th key={i} style={{ ...tdS, textAlign: 'right', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5,
                      color: gapCols[i] ? '#ef4444' : 'var(--text-muted)',
                      background: gapCols[i] ? 'rgba(239,68,68,0.06)' : 'var(--bg-surface)' }}>
                      {c.label}
                      {gapCols[i] && <span title={t("Кассовый разрыв", "Кассовый разрыв")}> ⚠</span>}
                    </th>
                  ))}
                  <th style={{ ...tdS, textAlign: 'right', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, background: 'var(--bg-hover)', color: 'var(--color-primary)' }}>{t("Итого", "Итого")}</th>
                </tr>
              </thead>
              <tbody>
                {sectionRow('operating', 'Операционный поток', agg['operating'] ?? Array(displayCols.length).fill(0))}
                {sectionRow('investing', 'Инвестиционный поток', agg['investing'] ?? Array(displayCols.length).fill(0))}
                {sectionRow('financing', 'Финансовый поток',    agg['financing'] ?? Array(displayCols.length).fill(0))}
                {totalRow('Чистый денежный поток', ncf)}
                {totalRow('Остаток на начало', openBalances, 'var(--text-secondary)', false)}
                {totalRow('Остаток на конец',  balances, balances.some(b=>b<0) ? '#ef4444' : '#10b981')}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsCashflowPage;
