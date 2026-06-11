import React, { useState, useMemo } from 'react';
import { useFinanceStore } from '../financeStore';
import { Filter, ChevronDown, ChevronRight, Download, HelpCircle, Calendar } from 'lucide-react';
import { format, parseISO, eachMonthOfInterval, endOfMonth } from 'date-fns';
import { ru } from 'date-fns/locale';
import { exportToCSV } from '../utils/exportData';
import { useTranslation } from 'react-i18next';


type GroupBy = 'month' | 'quarter';
const fmtN = (n: number) => new Intl.NumberFormat('ru-RU').format(Math.round(Math.abs(n)));
const fmtV = (n: number) => n === 0 ? '—' : (n < 0 ? `−${fmtN(n)}` : fmtN(n));
const getQ = (m: number) => `Q${Math.ceil(m / 3)}`;
interface Col { label: string; month: number; year: number; }

const ReportsPnlPage: React.FC = () => {
  const { t } = useTranslation();
    const { transactions, categories, settings } = useFinanceStore();
  const currencySymbol = settings.baseCurrency === 'UZS' ? 'сум' : '$';
  const now = new Date();
  const [dateFrom, setDateFrom] = useState(format(new Date(now.getFullYear(), now.getMonth() - 5, 1), 'yyyy-MM-dd'));
  const [dateTo,   setDateTo]   = useState(format(new Date(now.getFullYear(), now.getMonth(), 1),     'yyyy-MM-dd'));
  const [groupBy,  setGroupBy]  = useState<GroupBy>('month');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ inc: true, opex: true, tax: true });
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

  // Columns
  const cols = useMemo<Col[]>(() => {
    const from = parseISO(dateFrom), to = parseISO(dateTo);
    if (from > to) return [];
    return eachMonthOfInterval({ start: from, end: to }).map(d => ({
      label: format(d, 'MMM yy', { locale: ru }),
      month: d.getMonth() + 1, year: d.getFullYear(),
    }));
  }, [dateFrom, dateTo]);

  const displayCols = useMemo<Col[]>(() => {
    if (groupBy === 'month') return cols;
    const map = new Map<string, Col>();
    cols.forEach(c => { const k = `${getQ(c.month)} ${c.year}`; if (!map.has(k)) map.set(k, { ...c, label: k }); });
    return Array.from(map.values());
  }, [cols, groupBy]);

  const catMap = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);

  const baseTx = useMemo(() => {
    const from = parseISO(dateFrom).getTime();
    const to   = endOfMonth(parseISO(dateTo)).getTime();
    return transactions.filter(t => {
      if (!t.isPaidConfirmed || t.type === 'transfer') return false;
      const d = parseISO(t.date).getTime();
      return d >= from && d <= to;
    });
  }, [transactions, dateFrom, dateTo]);

  // ── Category classification based on real store structure ───────────────
  // Income: operating income (Revenue)
  const incCats  = useMemo(() => categories.filter(c => c.type === 'income' && !c.parentId && c.activity === 'operating'), [categories]);
  const incAllCats  = useMemo(() => categories.filter(c => c.type === 'income' && c.activity === 'operating'), [categories]);
  // OPEX: ALL operating expenses (exclude taxes which are handled below)
  const opexRootCats = useMemo(() => categories.filter(c => c.type === 'expense' && !c.parentId && c.activity === 'operating' && !c.name.toLowerCase().includes('налог')), [categories]);
  const opexAllCats  = useMemo(() => categories.filter(c => c.type === 'expense' && c.activity === 'operating' && !c.name.toLowerCase().includes('налог')), [categories]);
  
  // Tax/Finance = financing activity expenses OR explicitly named taxes (exclude dividends)
  const taxCats = useMemo(() => categories.filter(c =>
    (c.type === 'expense' && c.activity === 'financing' && !c.name.toLowerCase().includes('дивиденд')) ||
    (c.type === 'expense' && c.name.toLowerCase().includes('налог'))
  ), [categories]);

  const agg = useMemo(() => {
    const r: Record<string, number[]> = {};
    const ensure = (k: string) => { if (!r[k]) r[k] = Array(displayCols.length).fill(0); };

    const getColIdx = (date: string) => {
      const d = parseISO(date); const m = d.getMonth() + 1, y = d.getFullYear();
      if (groupBy === 'month') return displayCols.findIndex(c => c.month === m && c.year === y);
      const qk = `${getQ(m)} ${y}`;
      return displayCols.findIndex(c => `${getQ(c.month)} ${c.year}` === qk);
    };

    baseTx.forEach(t => {
      const cat = catMap.get(t.categoryId ?? '');
      if (!cat || (cat.type !== 'income' && cat.type !== 'expense')) return;
      // Exclude financing income (loans) from P&L revenue
      if (cat.type === 'income' && cat.activity !== 'operating') return;
      // Exclude dividend/financing expense cats from OPEX
      if (cat.type === 'expense' && cat.activity !== 'operating' && cat.activity !== 'financing') return;
      const idx = getColIdx(t.date); if (idx < 0) return;
      ensure(cat.id);
      r[cat.id][idx] += t.type === 'income' ? (t.baseAmount ?? t.amount) : -(t.baseAmount ?? t.amount);
    });
    return r;
  }, [baseTx, catMap, displayCols, groupBy]);

  const sumCats = (cats: typeof categories) => displayCols.map((_, i) =>
    cats.reduce((s, c) => s + (agg[c.id]?.[i] ?? 0), 0)
  );

  const incVals  = sumCats(incAllCats);
  const opexVals = sumCats(opexAllCats);   // all operating expenses (negative values)
  const taxVals  = sumCats(taxCats);
  // EBITDA = Revenue + OPEX (OPEX values are already negative)
  const ebitdaVals = displayCols.map((_, i) => incVals[i] + opexVals[i]);
  const netVals    = displayCols.map((_, i) => ebitdaVals[i] + taxVals[i]);




  // Styles matching project design system
  const tdS: React.CSSProperties = { padding: '8px 14px', borderBottom: '1px solid var(--border-subtle)', whiteSpace: 'nowrap', fontSize: 12, color: 'var(--text-primary)' };
  const inp: React.CSSProperties = { padding: '0 8px', height: 28, background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 12, outline: 'none' };

  const Sparkline = ({ vals, positive }: { vals: number[]; positive?: boolean }) => {
    const { t } = useTranslation(); void t;
    const max = Math.max(...vals.map(Math.abs), 1);
    return (
      <div style={{ display: 'flex', alignItems: 'flex-end', height: 14, gap: 2 }}>
        {vals.map((v, i) => (
          <div key={i} style={{ width: 4, height: Math.max(2, (Math.abs(v) / max) * 14), borderRadius: 1,
            background: positive === false ? '#dc2626' : v >= 0 ? '#10b981' : '#dc2626' }} />
        ))}
      </div>
    );
  };

  const sectionLabel = (id: string, label: string, vals: number[], isExpense = false) => (
    <tr style={{ cursor: 'pointer', background: 'var(--bg-hover)' }} onClick={() => toggle(id)}>
      <td style={{ ...tdS, fontWeight: 700, fontSize: 12, paddingLeft: 14 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 3, height: 12, borderRadius: 2, background: isExpense ? '#dc2626' : '#10b981', display: 'inline-block', flexShrink: 0 }} />
          {expanded[id] ? <ChevronDown size={12} color="var(--text-muted)" /> : <ChevronRight size={12} color="var(--text-muted)" />}
          {label}
        </span>
      </td>
      <td style={{ ...tdS, paddingLeft: 8 }}><Sparkline vals={vals} positive={!isExpense} /></td>
      {vals.map((v, i) => (
        <td key={i} style={{ ...tdS, textAlign: 'right', fontWeight: 700, color: v < 0 ? '#dc2626' : '#10b981' }}>
          {v === 0 ? '—' : (v < 0 ? `−${fmtN(v)}` : fmtN(v))}
        </td>
      ))}
      <td style={{ ...tdS, textAlign: 'right', fontWeight: 700, background: 'var(--bg-surface)', color: vals.reduce((a,b)=>a+b,0) < 0 ? '#dc2626' : '#10b981' }}>
        {fmtV(vals.reduce((a,b)=>a+b,0))}
      </td>
    </tr>
  );

  // Bug #6 fix: key on Fragment, add margin % to totalRow
  const catRow = (cat: { id: string; name: string }, isExpense = false) => {
    const vals = agg[cat.id] ?? Array(displayCols.length).fill(0);
    if (vals.every(v => v === 0)) return null;
    const total = vals.reduce((a, b) => a + b, 0);
    return (
      <React.Fragment key={cat.id}>
        <tr
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
          <td style={{ ...tdS, paddingLeft: 36, color: 'var(--text-secondary)', fontSize: 11 }}>{cat.name}</td>
          <td style={{ ...tdS, paddingLeft: 8 }}><Sparkline vals={vals} positive={!isExpense} /></td>
          {vals.map((v, i) => (
            <td key={i} style={{ ...tdS, textAlign: 'right', fontSize: 11, color: v < 0 ? '#dc2626' : v > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
              {fmtV(v)}
            </td>
          ))}
          <td style={{ ...tdS, textAlign: 'right', fontSize: 11, background: 'var(--bg-surface)', color: 'var(--text-secondary)' }}>
            {fmtV(total)}
          </td>
        </tr>
      </React.Fragment>
    );
  };

  const totalRow = (label: string, vals: number[], highlight = false, baseVals?: number[]) => {
    const total = vals.reduce((a, b) => a + b, 0);
    const margin = baseVals ? (() => { const b = baseVals.reduce((a,x)=>a+x,0); return b !== 0 ? (total / b * 100).toFixed(1) + '%' : null; })() : null;
    return (
      <tr style={{ background: highlight ? 'rgba(16,185,129,0.06)' : 'var(--bg-hover)' }}>
        <td style={{ ...tdS, paddingLeft: 14, fontWeight: 700, fontSize: 12 }}>
          {label}
          {margin && <span style={{ marginLeft: 8, fontSize: 10, color: 'var(--text-muted)', fontWeight: 400 }}>{margin}</span>}
        </td>
        <td style={{ ...tdS }}><Sparkline vals={vals} /></td>
        {vals.map((v, i) => (
          <td key={i} style={{ ...tdS, textAlign: 'right', fontWeight: 700, color: v < 0 ? '#dc2626' : v > 0 ? '#10b981' : 'var(--text-muted)', fontSize: 12 }}>
            {fmtV(v)}
          </td>
        ))}
        <td style={{ ...tdS, textAlign: 'right', fontWeight: 700, background: 'var(--bg-elevated)', color: total < 0 ? '#dc2626' : total > 0 ? 'var(--color-primary)' : 'var(--text-muted)', fontSize: 12 }}>
          {fmtV(total)}
        </td>
      </tr>
    );
  };


  const exportCSV = () => {
    const headers = ['Статья', ...displayCols.map(c => c.label), 'Итого'];
    const rows = [
      ['Выручка', ...incVals.map(String), String(incVals.reduce((a,b)=>a+b,0))],
      ['Операционные расходы (OPEX)', ...opexVals.map(String), String(opexVals.reduce((a,b)=>a+b,0))],
      ['EBITDA', ...ebitdaVals.map(String), String(ebitdaVals.reduce((a,b)=>a+b,0))],
      ['Налоги / Финансовые', ...taxVals.map(String), String(taxVals.reduce((a,b)=>a+b,0))],
      ['Чистая прибыль (Net Profit)', ...netVals.map(String), String(netVals.reduce((a,b)=>a+b,0))],
    ];
    exportToCSV('ОПУ', headers, rows);
  };

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', background: 'var(--bg-base)' }}>

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
                  <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ ...inp, flex: 1 }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Calendar size={12} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                  <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ ...inp, flex: 1 }} />
                </div>
              </div>
              {/* View switcher — matches .view-switcher pattern */}
              <div style={{ display: 'flex', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: 2, gap: 1, marginTop: 8 }}>
                {(['month', 'quarter'] as GroupBy[]).map(g => (
                  <button key={g} onClick={() => setGroupBy(g)} style={{
                    flex: 1, height: 22, fontSize: 11, fontWeight: 500, cursor: 'pointer', borderRadius: 4,
                    background: groupBy === g ? 'var(--bg-card)' : 'transparent',
                    color: groupBy === g ? 'var(--text-primary)' : 'var(--text-secondary)',
                    border: 'none', boxShadow: groupBy === g ? 'var(--shadow-sm)' : 'none',
                    transition: 'all 160ms ease',
                  }}>
                    {g === 'month' ? 'Месяц' : 'Квартал'}
                  </button>
                ))}
              </div>
            </div>

            {/* Summary KPIs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 2 }}>{t("Итого за период", "Итого за период")}</div>
              {[
                { label: 'Выручка',         val: incVals.reduce((a,b)=>a+b,0),    color: '#10b981' },
                { label: 'EBITDA',          val: ebitdaVals.reduce((a,b)=>a+b,0), color: '#6366f1' },
                { label: 'Чистая прибыль (Net Profit)',  val: netVals.reduce((a,b)=>a+b,0),    color: netVals.reduce((a,b)=>a+b,0) >= 0 ? '#10b981' : '#dc2626' },
                { label: 'EBITDA margin',   val: ebitdaVals.reduce((a,b)=>a+b,0), color: '#6366f1', isPercent: true, base: incVals.reduce((a,b)=>a+b,0) },

              ].map(({ label, val, color, isPercent, base }: { label: string; val: number; color: string; isPercent?: boolean; base?: number }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'var(--bg-elevated)', borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color }}>
                    {isPercent && base
                      ? (base !== 0 ? (val / base * 100).toFixed(1) + '%' : '—')
                      : (val === 0 ? '—' : fmtV(val) + " " + currencySymbol)}
                  </span>
                </div>
              ))}

            </div>
          </div>
        </div>
      )}

      {/* ── MAIN ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Header — 44px like .header */}
        <div style={{ height: 44, padding: '0 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <button onClick={() => setSidebarOpen(!isSidebarOpen)} style={{ background: isSidebarOpen ? 'var(--bg-card)' : 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <Filter size={13} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <span style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: -0.01 }}>{t("ОПУ: Отчёт о прибылях и убытках", "ОПУ: Отчёт о прибылях и убытках")}</span>
              <span title={t("Отчёт о прибылях и убытках: доходы, расходы, прибыль", "Отчёт о прибылях и убытках: доходы, расходы, прибыль")} style={{ cursor: 'pointer', display: 'flex', color: 'var(--text-muted)' }}>
                <HelpCircle size={13} />
              </span>
            </div>
          </div>
          <button onClick={exportCSV} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0 10px', height: 28, background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 6, fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 160ms ease' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
            <Download size={12} />  {t("В CSV", "В CSV")}
          </button>
        </div>

        {/* Table */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {displayCols.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
              
              {t("Выберите корректный период", "Выберите корректный период")}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1000 }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                <tr style={{ background: 'var(--bg-surface)', boxShadow: '0 1px 0 var(--border-subtle)' }}>
                  <th style={{ ...tdS, textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', width: 260, position: 'sticky', left: 0, background: 'var(--bg-surface)', zIndex: 20 }}>{t("По статьям учёта", "По статьям учёта")}</th>
                  <th style={{ ...tdS, width: 56, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>{t("Тренд", "Тренд")}</th>
                  {displayCols.map((c, i) => (
                    <th key={i} style={{ ...tdS, textAlign: 'right', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>{c.label}</th>
                  ))}
                  <th style={{ ...tdS, textAlign: 'right', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--color-primary)', background: 'var(--bg-hover)' }}>{t("Итого", "Итого")}</th>
                </tr>
              </thead>
              <tbody>
                {/* Revenue */}
                {sectionLabel('inc', 'Выручка (Revenue)', incVals)}
                {expanded['inc'] && incCats.map(c => catRow(c, false))}

                {/* OPEX = all operating expenses */}
                {sectionLabel('opex', settings.pnlMode === 'fixed_variable' ? "Операционные расходы (Пост. и Перем.)" : 'Операционные расходы (Прямые и Косвенные)', opexVals, true)}
                {expanded['opex'] && opexRootCats.map(c => catRow(c, true))}

                {/* EBITDA */}
                {totalRow('Операционная прибыль (EBITDA)', ebitdaVals, true, incVals)}

                {/* Tax / Finance */}
                {taxCats.length > 0 && <>
                  {sectionLabel('tax', 'Налоги и финансовые расходы', taxVals, true)}
                  {expanded['tax'] && taxCats.map(c => catRow(c, true))}
                </>}

                {/* Net Profit */}
                {totalRow('Чистая прибыль (Net Profit)', netVals, false, incVals)}

              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsPnlPage;
