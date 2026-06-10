import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useFinanceStore } from '../financeStore';
import type { Transaction } from '../financeStore';
import { useTranslation } from 'react-i18next';

const fmt = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });
const MONTH_LABELS = ['янв','Фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];
const COL_W = 88;      // width for every period column
const SUM_W = 96;      // slightly wider for summary (Итого) columns
const LABEL_W = 240;

// ─── Flat column definition (no colSpan!) ─────────────────────────────────────
interface DataCol {
  key: string;
  headerLabel: string;   // top row label
  subLabel: string;      // 'факт' | 'план'
  year: number;
  month: number;         // 0-based; for summary = selected month (По дням) or 0 (otherwise)
  summaryMonths?: number[]; // months to aggregate for summary col
  day?: number;
  isPlan: boolean;
  isSummary: boolean;
  isToday: boolean;
  isGroupFirst: boolean; // show top-label; false = show empty (grouped visually)
}

function buildCols(viewMode: string, year: number, month: number): DataCol[] {
  const today = new Date();
  const cols: DataCol[] = [];

  // Summary col: fact + plan (2 cells)
  // In По дням mode: summary = the selected month
  // In other modes: summary = the whole year (summaryMonths = 0..11)
  const sumLabel = viewMode === 'По дням'
    ? `${MONTH_LABELS[month]} '${String(year).slice(2)}`
    : `Итого '${String(year).slice(2)}`;

  const summaryMonths = viewMode === 'По дням' ? [month] : [0,1,2,3,4,5,6,7,8,9,10,11];

  cols.push({ key: 'sum-f', headerLabel: sumLabel, subLabel: 'факт', year, month: summaryMonths[0], summaryMonths, isPlan: false, isSummary: true, isToday: false, isGroupFirst: true });
  cols.push({ key: 'sum-p', headerLabel: '',        subLabel: 'план', year, month: summaryMonths[0], summaryMonths, isPlan: true,  isSummary: true, isToday: false, isGroupFirst: false });

  if (viewMode === 'По дням') {
    const days = new Date(year, month + 1, 0).getDate();
    for (let d = 1; d <= days; d++) {
      const isToday = today.getFullYear()===year && today.getMonth()===month && today.getDate()===d;
      cols.push({ key: `d-${d}`, headerLabel: String(d), subLabel: 'факт', year, month, day: d, isPlan: false, isSummary: false, isToday, isGroupFirst: true });
    }
  } else if (viewMode === 'По кварталам') {
    for (let q = 0; q < 4; q++) {
      const sm = q * 3;
      const isToday = today.getFullYear()===year && Math.floor(today.getMonth()/3)===q;
      cols.push({ key: `q-${q}`, headerLabel: `Q${q+1} '${String(year).slice(2)}`, subLabel: 'факт', year, month: sm, isPlan: false, isSummary: false, isToday, isGroupFirst: true });
    }
  } else {
    for (let m = 0; m < 12; m++) {
      const isToday = today.getFullYear()===year && today.getMonth()===m;
      cols.push({ key: `m-${m}`, headerLabel: `${MONTH_LABELS[m]} '${String(year).slice(2)}`, subLabel: 'факт', year, month: m, isPlan: false, isSummary: false, isToday, isGroupFirst: true });
    }
  }
  return cols;
}

// ─── Data aggregation ─────────────────────────────────────────────────────────
function sumTx(txs: Transaction[], catId: string, type: string, col: DataCol, viewMode: string): number {
  return txs.filter(t => {
    if (t.categoryId !== catId || t.type !== type) return false;
    const d = new Date(t.date);
    if (col.isSummary) {
      // Sum only the months defined in summaryMonths
      const months = col.summaryMonths ?? [0,1,2,3,4,5,6,7,8,9,10,11];
      return d.getFullYear() === col.year && months.includes(d.getMonth());
    }
    if (d.getFullYear() !== col.year || d.getMonth() !== col.month) return false;
    if (col.day !== undefined) return d.getDate() === col.day;
    if (viewMode === 'По кварталам') return d.getMonth() >= col.month && d.getMonth() < col.month + 3;
    return true;
  }).reduce((s, t) => s + (t.baseAmount ?? t.amount), 0);
}



// ─── Cell components ──────────────────────────────────────────────────────────
const Cell: React.FC<{ value: number; isPlan?: boolean; isToday?: boolean; bold?: boolean; isGroup?: boolean; w?: number }> =
({ value, isPlan, isToday, bold, isGroup, w = COL_W }) => {
  const { t } = useTranslation(); void t;
    const bg = isToday ? 'rgba(99,102,241,0.07)' : isGroup ? 'rgba(99,102,241,0.04)' : 'transparent';
  const color = isPlan
    ? 'var(--color-primary)'
    : value === 0 ? 'var(--text-muted)'
    : 'var(--text-primary)';
  return (
    <td style={{ width: w, minWidth: w, maxWidth: w, padding: '6px 8px', textAlign: 'right',
      fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: bold ? 500 : 400, color,
      borderBottom: '1px solid var(--border-subtle)', borderRight: '1px solid var(--border-subtle)',
      background: bg, whiteSpace: 'nowrap', overflow: 'hidden' }}>
      {value === 0 ? '—' : fmt.format(value)}
    </td>
  );
};

// ─── Row interface ────────────────────────────────────────────────────────────
interface RowDef {
  id: string; label: string; type: 'income' | 'expense'; indent: number;
  children?: RowDef[];
}

// ─── Main component ───────────────────────────────────────────────────────────
export const PaymentCalendarTable: React.FC<{
  viewMode: string; periodYear: number; periodMonth: number;
  todayTrigger: number; scenarioId: string; hideZeroRows?: boolean;
  filterAccountId?: string; filterProjectId?: string; filterDealId?: string;
  accountingMethod?: string; source?: string;
}> = ({ viewMode, periodYear, periodMonth, todayTrigger, scenarioId, hideZeroRows = false,
        filterAccountId, filterProjectId, filterDealId,
        accountingMethod = 'Кассовый метод', source = 'Доходы и расходы' }) => {
  const { t } = useTranslation();
    const { categories, transactions, budgetLines, updateBudgetLine } = useFinanceStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const todayThRef = useRef<HTMLTableCellElement>(null);

  const cols = useMemo(() => buildCols(viewMode, periodYear, periodMonth), [viewMode, periodYear, periodMonth]);

  // Reset scroll to start when viewMode changes
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
  }, [viewMode, periodYear, periodMonth]);

  // Scroll to today column when triggered
  useEffect(() => {
    if (todayTrigger > 0 && scrollRef.current && todayThRef.current) {
      const c = scrollRef.current, t = todayThRef.current;
      c.scrollTo({ left: t.offsetLeft - LABEL_W - c.clientWidth/2 + t.offsetWidth/2, behavior: 'smooth' });
    }
  }, [todayTrigger]);

  const incomeRows: RowDef[] = useMemo(() => {
    const cats = categories.filter(c => c.type === 'income');
    return cats.filter(c => !c.parentId).map(c => ({
      id: c.id, label: c.name, type: 'income' as const, indent: 0,
      children: cats.filter(ch => ch.parentId === c.id).map(ch => ({ id: ch.id, label: ch.name, type: 'income' as const, indent: 1 }))
    }));
  }, [categories]);

  const expenseRows: RowDef[] = useMemo(() => {
    const cats = categories.filter(c => c.type === 'expense');
    const build = (parentId?: string, indent = 0): RowDef[] =>
      cats.filter(c => (parentId ? c.parentId === parentId : !c.parentId)).map(c => ({
        id: c.id, label: c.name, type: 'expense' as const, indent,
        children: build(c.id, indent + 1)
      }));
    return build(undefined);
  }, [categories]);

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const toggle = (id: string) => setCollapsed(p => ({ ...p, [id]: !p[id] }));

  // Apply active filters to transactions
  const filteredTx = useMemo(() => {
    return transactions.filter(t => {
      if (filterAccountId && t.accountId !== filterAccountId) return false;
      if (filterProjectId && t.projectId !== filterProjectId) return false;
      if (filterDealId && t.dealId !== filterDealId) return false;
      // Кассовый метод = only confirmed/paid operations
      if (accountingMethod === 'Кассовый метод' && !t.isPaidConfirmed) return false;
      return true;
    });
  }, [transactions, filterAccountId, filterProjectId, filterDealId, accountingMethod]);

  const getValue = (catId: string, type: 'income' | 'expense', col: DataCol): number => {
    if (col.isPlan) {
      // Use budget lines from active scenario
      const months = col.isSummary ? (col.summaryMonths ?? [0,1,2,3,4,5,6,7,8,9,10,11]) : [col.month];
      return budgetLines
        .filter(l => l.scenarioId === scenarioId && l.categoryId === catId && months.includes(l.month))
        .reduce((s, l) => s + l.amount, 0);
    }
    return sumTx(filteredTx, catId, type, col, viewMode);
  };

  // Inline editing state for plan cells
  const [editingCell, setEditingCell] = useState<string | null>(null); // key = `${catId}:${month}`
  const [editValue, setEditValue] = useState('');

  const startEdit = (catId: string, month: number, currentVal: number) => {
    setEditingCell(`${catId}:${month}`);
    setEditValue(currentVal === 0 ? '' : String(currentVal));
  };

  const commitEdit = (catId: string, _type: 'income' | 'expense', month: number) => {
    const amount = parseFloat(editValue.replace(/[\s,]/g, '')) || 0;
    updateBudgetLine(scenarioId, catId, month, periodYear, amount);
    setEditingCell(null);
  };

  const aggTree = (rows: RowDef[], col: DataCol): number =>
    rows.reduce((s, r) => s + getValue(r.id, r.type, col) + aggTree(r.children ?? [], col), 0);

  const renderRows = (rows: RowDef[]): React.ReactNode[] => {
    const result: React.ReactNode[] = [];
    for (const row of rows) {
      const isCollapsed = collapsed[row.id];
      const hasKids = (row.children?.length ?? 0) > 0;

      // If hideZeroRows: skip leaf rows where all fact cols are 0
      if (hideZeroRows && !hasKids) {
        const anyVal = cols.some(c => !c.isPlan && !c.isSummary && getValue(row.id, row.type, c) !== 0);
        if (!anyVal) continue;
      }

      result.push(
        <tr key={row.id}>
          <td style={{ position: 'sticky', left: 0, zIndex: 3, width: LABEL_W, minWidth: LABEL_W,
            padding: `6px 12px 6px ${12 + row.indent * 20}px`,
            background: 'var(--bg-surface)',
            boxShadow: '2px 0 4px rgba(0,0,0,0.05)',
            borderBottom: '1px solid var(--border-subtle)',
            borderRight: '1px solid var(--border-subtle)', fontSize: 12,
            fontWeight: hasKids ? 500 : 400,
            color: hasKids ? 'var(--text-primary)' : 'var(--text-secondary)',
            whiteSpace: 'nowrap', cursor: hasKids ? 'pointer' : 'default' }}
            onClick={() => hasKids && toggle(row.id)}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {hasKids && (isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />)}
              {row.label}
            </span>
          </td>
          {cols.map(col => {
            const val = hasKids ? aggTree([row], col) : getValue(row.id, row.type, col);
            const w = colW(col);
            // Plan cells on leaf rows are editable
            if (col.isPlan && !hasKids && !col.isSummary) {
              const cellKey = `${row.id}:${col.month}`;
              const isEditing = editingCell === cellKey;
              return (
                <td key={col.key} style={{ width: w, minWidth: w, maxWidth: w, padding: isEditing ? '2px 4px' : '6px 8px',
                  textAlign: 'right', fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 400,
                  color: 'var(--color-primary)',
                  borderBottom: '1px solid var(--border-subtle)', borderRight: '1px solid var(--border-subtle)',
                  background: col.isToday ? 'rgba(99,102,241,0.07)' : 'transparent',
                  cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
                  onClick={() => !isEditing && startEdit(row.id, col.month, val)}>
                  {isEditing ? (
                    <input
                      autoFocus
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      onBlur={() => commitEdit(row.id, row.type, col.month)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') commitEdit(row.id, row.type, col.month);
                        if (e.key === 'Escape') setEditingCell(null);
                      }}
                      style={{ width: '100%', textAlign: 'right', fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--color-primary)',
                        background: 'var(--bg-base)', border: '1px solid var(--color-primary)',
                        borderRadius: 4, padding: '2px 6px', outline: 'none' }}
                    />
                  ) : (
                    <span title={t("Кликните чтобы редактировать план", "Кликните чтобы редактировать план")}>
                      {val === 0 ? <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{t("план", "план")}</span> : fmt.format(val)}
                    </span>
                  )}
                </td>
              );
            }
            return <Cell key={col.key} value={val} isPlan={col.isPlan} isToday={col.isToday} isGroup={col.isSummary} bold={hasKids} w={w} />;
          })}
        </tr>
      );
      if (hasKids && !isCollapsed) result.push(...renderRows(row.children!));
    }
    return result;
  };

  const netForCol = (col: DataCol) => aggTree(incomeRows, col) - aggTree(expenseRows, col);

  const stickyLabel = (label: string, bold = true, bg = 'var(--bg-surface)') => (
    <td style={{ position: 'sticky', left: 0, zIndex: 3, width: LABEL_W, minWidth: LABEL_W,
      padding: '8px 12px', background: bg, borderBottom: '1px solid var(--border-subtle)',
      borderRight: '2px solid var(--border-subtle)', fontSize: 12,
      fontWeight: bold ? 600 : 400, color: 'var(--text-primary)',
      whiteSpace: 'nowrap', overflow: 'hidden' }}>
      {label}
    </td>
  );


  const colW = (col: DataCol) => col.isSummary ? SUM_W : COL_W;
  const tableWidth = LABEL_W + cols.reduce((s, c) => s + colW(c), 0);

  const dividendCats = useMemo(() => categories.filter(c => c.name.toLowerCase().includes('дивиденд')), [categories]);
  const getDividendValue = (col: DataCol) => dividendCats.reduce((s, c) => s + getValue(c.id, 'expense', col), 0);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div ref={scrollRef} style={{ flex: 1, overflowX: 'auto', overflowY: 'auto',
        border: '1px solid var(--border-subtle)', borderRadius: 10, background: 'var(--bg-surface)' }}>
        <table style={{ borderCollapse: 'collapse', tableLayout: 'fixed', width: tableWidth, minWidth: tableWidth }}>
          {/* colgroup: most reliable way to lock column widths with tableLayout:fixed */}
          <colgroup>
            <col width={LABEL_W} />
            {cols.map(col => (
              <col key={col.key} width={colW(col)} />
            ))}
          </colgroup>
          <thead>
            {/* Row 1 – period labels. Each th is individually sticky. */}
            <tr style={{ height: 34 }}>
              {/* Corner cell: sticky both left AND top */}
              <th style={{
                position: 'sticky', left: 0, top: 0, zIndex: 12,
                width: LABEL_W, minWidth: LABEL_W,
                padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 700,
                color: 'var(--text-primary)',
                borderBottom: '1px solid var(--border-subtle)',
                borderRight: '1px solid var(--border-subtle)',
                background: 'var(--bg-surface)',
                boxShadow: '2px 2px 6px rgba(0,0,0,0.08)',
                whiteSpace: 'nowrap', overflow: 'hidden',
              }}>
                {source === 'Баланс денег (ДДС)' ? 'Движение денежных средств, сум' : 'Доходы и расходы, сум'}
              </th>
              {cols.map((col, i) => {
                const w = colW(col);
                // Opaque backgrounds — never transparent in header!
                const bg = col.isSummary
                  ? 'var(--bg-base)'
                  : col.isToday
                    ? 'var(--color-primary-muted, #e8eaff)'
                    : 'var(--bg-surface)';
                return (
                  <th key={col.key}
                    ref={col.isToday && col.isGroupFirst ? (el) => { if (el) todayThRef.current = el; } : undefined}
                    style={{
                      position: 'sticky', top: 0,
                      width: w, minWidth: w, maxWidth: w,
                      padding: '8px 8px 4px',
                      textAlign: 'center', fontSize: 11, fontWeight: 600,
                      color: col.isToday
                        ? 'var(--color-primary)'
                        : col.isSummary ? 'var(--color-primary)' : 'var(--text-secondary)',
                      borderBottom: '1px solid var(--border-subtle)',
                      borderRight: i < cols.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                      background: bg,
                      whiteSpace: 'nowrap', overflow: 'hidden',
                    }}>
                    {col.isGroupFirst ? (
                      <>
                        {col.headerLabel}
                        {col.isToday && <span style={{
                          marginLeft: 4, fontSize: 9,
                          background: 'var(--color-primary)', color: 'var(--text-primary)',
                          borderRadius: 4, padding: '1px 4px',
                        }}>{t("сег", "сег")}</span>}
                      </>
                    ) : null}
                  </th>
                );
              })}
            </tr>
            {/* Row 2 – fact/plan sub-labels. Sticks below row 1 (top: 34px). */}
            <tr style={{ height: 24 }}>
              <th style={{
                position: 'sticky', left: 0, top: 34, zIndex: 12,
                width: LABEL_W, minWidth: LABEL_W,
                background: 'var(--bg-surface)',
                borderBottom: '2px solid var(--border-subtle)',
                borderRight: '1px solid var(--border-subtle)',
                boxShadow: '2px 0 6px rgba(0,0,0,0.06)',
              }} />
              {cols.map((col, i) => {
                const w = colW(col);
                const bg = col.isSummary
                  ? 'var(--bg-base)'
                  : col.isToday
                    ? 'var(--color-primary-muted, #e8eaff)'
                    : 'var(--bg-surface)';
                return (
                  <th key={col.key} style={{
                    position: 'sticky', top: 34,
                    width: w, minWidth: w, maxWidth: w,
                    padding: '3px 8px 5px', textAlign: 'right', fontSize: 10, fontWeight: 600,
                    color: col.isPlan ? 'var(--color-primary)'
                      : col.isSummary ? 'var(--color-primary)' : 'var(--text-muted)',
                    borderBottom: '2px solid var(--border-subtle)',
                    borderRight: i < cols.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                    background: bg, overflow: 'hidden',
                  }}>
                    {col.subLabel}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {source === 'Баланс денег (ДДС)' ? (() => {
              // ── ДДС mode: group categories by activity flow ───────────────
              const ACTIVITY_LABELS: Record<string, string> = {
                operating: '\u041e\u043f\u0435\u0440\u0430\u0446\u0438\u043e\u043d\u043d\u0430\u044f', investing: '\u0418\u043d\u0432\u0435\u0441\u0442\u0438\u0446\u0438\u043e\u043d\u043d\u0430\u044f', financing: '\u0424\u0438\u043d\u0430\u043d\u0441\u043e\u0432\u0430\u044f'
              };

              const getFlowVal = (flow: string, txType: 'income' | 'expense', col: DataCol) => {
                const flowCats = categories.filter(c => c.activity === flow && c.type === txType);
                return flowCats.reduce((s, c) => {
                  const rows: RowDef[] = [{ id: c.id, label: c.name, type: txType, indent: 0 }];
                  return s + aggTree(rows, col);
                }, 0);
              };

              const rows: React.ReactNode[] = [];

              // For each activity: show Поступления then Выбытия
              const flows = ['operating', 'investing', 'financing'];
              flows.forEach(flow => {
                const inc = (col: DataCol) => getFlowVal(flow, 'income', col);
                const exp = (col: DataCol) => getFlowVal(flow, 'expense', col);
                const net = (col: DataCol) => inc(col) - exp(col);

                // Section header (no colSpan — incompatible with tableLayout:fixed)
                rows.push(
                  <tr key={`${flow}-hdr`}>
                    <td style={{ position: 'sticky', left: 0, zIndex: 3,
                      width: LABEL_W, minWidth: LABEL_W,
                      padding: '7px 12px', fontSize: 11, fontWeight: 700,
                      color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em',
                      background: 'var(--bg-base)', overflow: 'hidden', whiteSpace: 'nowrap',
                      borderBottom: '1px solid var(--border-subtle)',
                      borderRight: '1px solid var(--border-subtle)',
                      borderTop: '2px solid var(--border-subtle)' }}>
                      {ACTIVITY_LABELS[flow]}  {t("деятельность", "деятельность")}
                    </td>
                    {cols.map(col => {
                      const w = colW(col);
                      return <td key={col.key} style={{ width: w, minWidth: w, maxWidth: w,
                        background: 'var(--bg-base)',
                        borderBottom: '1px solid var(--border-subtle)',
                        borderRight: '1px solid var(--border-subtle)',
                        borderTop: '2px solid var(--border-subtle)' }} />;
                    })}
                  </tr>
                );

                // Поступления leaf rows
                const incCats = categories.filter(c => c.activity === flow && c.type === 'income' && !c.parentId);
                incCats.forEach(cat => {
                  rows.push(
                    <tr key={`${flow}-inc-${cat.id}`}>
                      <td style={{ position: 'sticky', left: 0, zIndex: 3, width: LABEL_W, minWidth: LABEL_W,
                        padding: '6px 12px 6px 28px', background: 'var(--bg-surface)',
                        boxShadow: '2px 0 4px rgba(0,0,0,0.05)',
                        borderBottom: '1px solid var(--border-subtle)', borderRight: '1px solid var(--border-subtle)',
                        fontSize: 12, fontWeight: 500, color: '#22c55e', whiteSpace: 'nowrap' }}>
                        ↑ {cat.name}
                      </td>
                      {cols.map(col => <Cell key={col.key} value={getValue(cat.id, 'income', col)} isPlan={col.isPlan} isToday={col.isToday} />)}
                    </tr>
                  );
                });

                // Выбытия leaf rows
                const expCats = categories.filter(c => c.activity === flow && c.type === 'expense' && !c.parentId);
                expCats.forEach(cat => {
                  rows.push(
                    <tr key={`${flow}-exp-${cat.id}`}>
                      <td style={{ position: 'sticky', left: 0, zIndex: 3, width: LABEL_W, minWidth: LABEL_W,
                        padding: '6px 12px 6px 28px', background: 'var(--bg-surface)',
                        boxShadow: '2px 0 4px rgba(0,0,0,0.05)',
                        borderBottom: '1px solid var(--border-subtle)', borderRight: '1px solid var(--border-subtle)',
                        fontSize: 12, fontWeight: 500, color: '#ef4444', whiteSpace: 'nowrap' }}>
                        ↓ {cat.name}
                      </td>
                      {cols.map(col => <Cell key={col.key} value={getValue(cat.id, 'expense', col)} isPlan={col.isPlan} isToday={col.isToday} />)}
                    </tr>
                  );
                });

                // Net cash flow for this activity
                rows.push(
                  <tr key={`${flow}-net`} style={{ background: 'var(--bg-base)' }}>
                    <td style={{ position: 'sticky', left: 0, zIndex: 3, width: LABEL_W, minWidth: LABEL_W,
                      padding: '7px 12px', background: 'var(--bg-base)',
                      boxShadow: '2px 0 4px rgba(0,0,0,0.05)',
                      borderBottom: '2px solid var(--border-subtle)', borderRight: '1px solid var(--border-subtle)',
                      fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                      \u0427\u0438\u0441\u0442\u044b\u0439 \u043f\u043e\u0442\u043e\u043a \u2014 {ACTIVITY_LABELS[flow].toLowerCase()}
                    </td>
                    {cols.map(col => {
                      const v = net(col);
                      const c = v < 0 ? '#ef4444' : v > 0 ? '#22c55e' : 'var(--text-muted)';
                      return <td key={col.key} style={{ width: COL_W, minWidth: COL_W, maxWidth: COL_W,
                        padding: '7px 10px', textAlign: 'right', fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 600, color: c,
                        borderBottom: '2px solid var(--border-subtle)', borderRight: '1px solid var(--border-subtle)',
                        background: col.isToday ? 'rgba(99,102,241,0.07)' : 'var(--bg-base)',
                        whiteSpace: 'nowrap' }}>{v === 0 ? '—' : fmt.format(v)}</td>;
                    })}
                  </tr>
                );
              });

              // Total net cash flow
              rows.push(
                <tr key="total-net">
                  <td style={{ position: 'sticky', left: 0, zIndex: 3, width: LABEL_W, minWidth: LABEL_W,
                    padding: '10px 12px', background: 'rgba(99,102,241,0.08)',
                    boxShadow: '2px 0 4px rgba(0,0,0,0.05)',
                    borderBottom: '1px solid var(--border-subtle)', borderRight: '1px solid var(--border-subtle)',
                    fontSize: 12, fontWeight: 600, color: 'var(--color-primary)', whiteSpace: 'nowrap' }}>
                    \u0427\u0438\u0441\u0442\u044b\u0439 \u0434\u0435\u043d\u0435\u0436\u043d\u044b\u0439 \u043f\u043e\u0442\u043e\u043a
                  </td>
                  {cols.map(col => {
                    const v = flows.reduce((s, flow) => {
                      const inc = getFlowVal(flow, 'income', col);
                      const exp = getFlowVal(flow, 'expense', col);
                      return s + inc - exp;
                    }, 0);
                    const c = v < 0 ? '#ef4444' : v > 0 ? '#22c55e' : 'var(--text-muted)';
                    return <td key={col.key} style={{ width: COL_W, minWidth: COL_W, maxWidth: COL_W,
                      padding: '10px 10px', textAlign: 'right', fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 600, color: c,
                      borderBottom: '1px solid var(--border-subtle)', borderRight: '1px solid var(--border-subtle)',
                      background: 'rgba(99,102,241,0.08)', whiteSpace: 'nowrap' }}>{v === 0 ? '—' : fmt.format(v)}</td>;
                  })}
                </tr>
              );

              return rows;
            })() : (
              <>
                {renderRows(incomeRows)}
                {renderRows(expenseRows)}
              </>
            )}

            {/* separator */}
            <tr>
              <td style={{ height: 2, padding: 0, background: 'var(--border-subtle)' }} />
              {cols.map(col => <td key={col.key} style={{ height: 2, padding: 0, background: 'var(--border-subtle)' }} />)}
            </tr>

            {/* Чистая прибыль */}
            <tr style={{ background: 'var(--bg-base)' }}>
              {stickyLabel('Чистая прибыль (Net Profit)', true, 'var(--bg-base)')}
              {cols.map(col => {
                const v = netForCol(col);
                const w = colW(col);
                const c = v < 0 ? '#ef4444' : v > 0 ? '#22c55e' : 'var(--text-muted)';
                return <td key={col.key} style={{ width: w, minWidth: w, maxWidth: w, padding: '8px 8px', textAlign: 'right',
                  fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 600, color: col.isPlan ? 'var(--color-primary)' : c,
                  borderBottom: '1px solid var(--border-subtle)', borderRight: '1px solid var(--border-subtle)',
                  background: col.isSummary ? 'rgba(99,102,241,0.04)' : col.isToday ? 'rgba(99,102,241,0.07)' : 'var(--bg-base)',
                  whiteSpace: 'nowrap', overflow: 'hidden' }}>{v === 0 ? '—' : fmt.format(v)}</td>;
              })}
            </tr>

            {/* Рентабельность */}
            <tr>
              {stickyLabel('Рентабельность, %', false)}
              {cols.map(col => {
                const inc = aggTree(incomeRows, col);
                const pct = inc === 0 ? 0 : Math.round(netForCol(col) / inc * 100);
                const w = colW(col);
                return <td key={col.key} style={{ width: w, minWidth: w, maxWidth: w, padding: '7px 8px', textAlign: 'right',
                  fontSize: 13, fontFamily: 'var(--font-mono)', color: pct < 0 ? '#ef4444' : 'var(--text-secondary)',
                  borderBottom: '1px solid var(--border-subtle)', borderRight: '1px solid var(--border-subtle)',
                  background: col.isToday ? 'rgba(99,102,241,0.07)' : 'transparent',
                  whiteSpace: 'nowrap', overflow: 'hidden' }}>{pct === 0 ? '—' : `${pct}%`}</td>;
              })}
            </tr>

            {/* Дивиденды */}
            <tr style={{ background: 'var(--bg-base)' }}>
              {stickyLabel('Дивиденды', false, 'var(--bg-base)')}
              {cols.map(col => <Cell key={col.key} value={getDividendValue(col)} isPlan={col.isPlan} isToday={col.isToday} w={colW(col)} />)}
            </tr>

            {/* Нераспределённая прибыль */}
            <tr>
              {stickyLabel('Нераспределённая прибыль', false)}
              {cols.map(col => {
                const v = netForCol(col) - getDividendValue(col);
                return <Cell key={col.key} value={v} isPlan={col.isPlan} isToday={col.isToday} w={colW(col)} />;
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
