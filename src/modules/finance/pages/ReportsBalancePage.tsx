import React, { useState, useMemo } from 'react';
import { useFinanceStore } from '../financeStore';
import { Filter, ChevronDown, ChevronRight, Download, HelpCircle, Calendar, ShieldCheck, ShieldAlert } from 'lucide-react';
import { format, parseISO, eachMonthOfInterval, endOfMonth, lastDayOfMonth } from 'date-fns';
import { ru } from 'date-fns/locale';
import { APP_CURRENCY, APP_CURRENCY_SYMBOL } from '../config/currency';
import { useTranslation } from 'react-i18next';

type GroupBy = 'month' | 'quarter';
const fmtN = (n: number) => new Intl.NumberFormat('ru-RU').format(Math.round(Math.abs(n)));
const fmtV = (n: number, allowZero = false) => (n === 0 && !allowZero) ? '—' : (n < 0 ? `−${fmtN(n)}` : fmtN(n));
const getQ  = (m: number) => `Q${Math.ceil(m / 3)}`;
interface Col { label: string; month: number; year: number; }

const tdS: React.CSSProperties = { padding: '8px 14px', borderBottom: '1px solid var(--border-subtle)', whiteSpace: 'nowrap', fontSize: 12, color: 'var(--text-primary)' };
const inp: React.CSSProperties = { padding: '0 8px', height: 28, background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 12, outline: 'none' };

const Sparkline = ({ vals, color = '#6366f1' }: { vals: number[]; color?: string }) => {
  const { t } = useTranslation(); void t;
    const max = Math.max(...vals.map(Math.abs), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', height: 14, gap: 2 }}>
      {vals.map((v, i) => (
        <div key={i} style={{ width: 4, height: Math.max(2, (Math.abs(v) / max) * 14), borderRadius: 1, background: color }} />
      ))}
    </div>
  );
};

const ReportsBalancePage: React.FC = () => {
  const { t } = useTranslation();
    const { transactions, accounts, assets, loans } = useFinanceStore();
  const now = new Date();

  const [dateFrom, setDateFrom] = useState(format(new Date(now.getFullYear(), now.getMonth() - 5, 1), 'yyyy-MM-dd'));
  const [dateTo,   setDateTo]   = useState(format(new Date(now.getFullYear(), now.getMonth(), 1),     'yyyy-MM-dd'));
  const [groupBy,  setGroupBy]  = useState<GroupBy>('month');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ assets: true, liab: true, equity: true });
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

  // ── Columns ──────────────────────────────────────────────────────────────
  const cols = useMemo<Col[]>(() => {
    const from = parseISO(dateFrom), to = parseISO(dateTo);
    if (from > to) return [];
    return eachMonthOfInterval({ start: from, end: to }).map(d => ({
      label: format(lastDayOfMonth(d), 'dd MMM yy', { locale: ru }),
      month: d.getMonth() + 1, year: d.getFullYear(),
    }));
  }, [dateFrom, dateTo]);

  const displayCols = useMemo<Col[]>(() => {
    if (groupBy === 'month') return cols;
    const map = new Map<string, Col>();
    cols.forEach(c => { const k = `${getQ(c.month)} ${c.year}`; if (!map.has(k)) map.set(k, { ...c, label: k }); });
    return Array.from(map.values());
  }, [cols, groupBy]);

  // ── 1. CASH ───────────────────────────────────────────────────────────────
  const uzsAccounts = useMemo(() => accounts.filter(a => a.currency === APP_CURRENCY), [accounts]);
  const currentCash = useMemo(() => uzsAccounts.reduce((s, a) => s + a.balance, 0), [uzsAccounts]);
  const confirmedTx = useMemo(() => transactions.filter(t => t.isPaidConfirmed && t.type !== 'transfer'), [transactions]);

  const cashPerCol = useMemo(() => {
    const fromMs = parseISO(dateFrom).getTime();
    const allFromStart = confirmedTx
      .filter(t => parseISO(t.date).getTime() >= fromMs)
      .reduce((s, t) => s + (t.type === 'income' ? (t.baseAmount ?? t.amount) : -(t.baseAmount ?? t.amount)), 0);
    const startCash = currentCash - allFromStart;

    return displayCols.map(c => {
      const colEnd = endOfMonth(new Date(c.year, c.month - 1, 1)).getTime();
      const sum = confirmedTx
        .filter(t => parseISO(t.date).getTime() >= fromMs && parseISO(t.date).getTime() <= colEnd)
        .reduce((s, t) => s + (t.type === 'income' ? (t.baseAmount ?? t.amount) : -(t.baseAmount ?? t.amount)), 0);
      return startCash + sum;
    });
  }, [confirmedTx, displayCols, currentCash, dateFrom]);

  // ── 2. RECEIVABLES ────────────────────────────────────────────────────────
  const receivablesPerCol = useMemo(() => displayCols.map(c => {
    const colEnd = endOfMonth(new Date(c.year, c.month - 1, 1)).getTime();
    return transactions
      .filter(t => !t.isPaidConfirmed && t.type === 'income' && parseISO(t.date).getTime() <= colEnd)
      .reduce((s, t) => s + (t.baseAmount ?? t.amount), 0);
  }), [transactions, displayCols]);

  // ── 3. FIXED ASSETS ───────────────────────────────────────────────────────
  const fixedAssetsPerCol = useMemo(() => displayCols.map(c => {
    const colDate = lastDayOfMonth(new Date(c.year, c.month - 1, 1));
    return assets
      .filter(a => a.status !== 'Списан' && a.status !== 'Продан')
      .reduce((s, a) => {
        const acqDate = parseISO(a.acquisitionDate);
        if (acqDate > colDate) return s;
        const months = Math.max(0, (colDate.getFullYear() - acqDate.getFullYear()) * 12 + colDate.getMonth() - acqDate.getMonth());
        const depreciable = a.initialCost - a.salvageValue;
        const dep = Math.min(depreciable, (depreciable / a.usefulLifeMonths) * months);
        return s + a.initialCost - dep;
      }, 0);
  }), [assets, displayCols]);

  // ── 4. LOANS ──────────────────────────────────────────────────────────────
  const loansPerCol = useMemo(() => displayCols.map(c => {
    const colDate = lastDayOfMonth(new Date(c.year, c.month - 1, 1));
    return loans.reduce((s, l) => {
      const start = parseISO(l.startDate);
      if (start > colDate) return s;
      const monthsElapsed = Math.max(0, (colDate.getFullYear() - start.getFullYear()) * 12 + colDate.getMonth() - start.getMonth());
      const monthlyPayment = l.principalAmount / l.termMonths;
      const repaid = Math.min(l.principalAmount, monthlyPayment * monthsElapsed);
      return s + (l.principalAmount - repaid);
    }, 0);
  }), [loans, displayCols]);

  // ── 5. AGGREGATES ─────────────────────────────────────────────────────────
  const totalAssetsPerCol = displayCols.map((_, i) => cashPerCol[i] + receivablesPerCol[i] + fixedAssetsPerCol[i]);
  const equityPerCol = displayCols.map((_, i) => totalAssetsPerCol[i] - loansPerCol[i]);
  const totalPassivesPerCol = displayCols.map((_, i) => loansPerCol[i] + equityPerCol[i]);
  const balanceCheckPerCol = displayCols.map((_, i) => totalAssetsPerCol[i] - totalPassivesPerCol[i]);
  const isBalanced = balanceCheckPerCol.every(v => Math.abs(v) < 1);

  // ── Sub-components for table ──────────────────────────────────────────────
  const SectionRow = ({ id, label, vals, color }: { id: string; label: string; vals: number[]; color: string }) => (
    <tr style={{ cursor: 'pointer', background: 'var(--bg-hover)' }} onClick={() => toggle(id)}>
      <td style={{ ...tdS, fontWeight: 700, fontSize: 12, paddingLeft: 14 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 3, height: 12, borderRadius: 2, background: color, display: 'inline-block', flexShrink: 0 }} />
          {expanded[id] ? <ChevronDown size={12} color="var(--text-muted)" /> : <ChevronRight size={12} color="var(--text-muted)" />}
          {label}
        </span>
      </td>
      <td style={{ ...tdS, paddingLeft: 8 }}><Sparkline vals={vals} color={color} /></td>
      {vals.map((v, i) => <td key={i} style={{ ...tdS, textAlign: 'right', fontWeight: 700, color }}>{fmtV(v)}</td>)}
      <td style={{ ...tdS, textAlign: 'right', fontWeight: 700, color, background: 'var(--bg-surface)' }}>{fmtV(vals[vals.length - 1] ?? 0)}</td>
    </tr>
  );

  const SubRow = ({ label, vals, level = 1, color }: { label: string; vals: number[]; level?: number; color?: string }) => (
    <tr onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
      <td style={{ ...tdS, paddingLeft: 14 + level * 22, color: 'var(--text-secondary)', fontSize: 11 }}>{label}</td>
      <td style={{ ...tdS, paddingLeft: 8 }}><Sparkline vals={vals} color={color} /></td>
      {vals.map((v, i) => <td key={i} style={{ ...tdS, textAlign: 'right', fontSize: 11, color: v === 0 ? 'var(--text-muted)' : 'var(--text-primary)' }}>{fmtV(v)}</td>)}
      <td style={{ ...tdS, textAlign: 'right', fontSize: 11, color: 'var(--text-secondary)', background: 'var(--bg-surface)' }}>{fmtV(vals[vals.length - 1] ?? 0)}</td>
    </tr>
  );

  const TotalRow = ({ label, vals, color = 'var(--text-primary)', bgHighlight = false }: { label: string; vals: number[]; color?: string; bgHighlight?: boolean }) => (
    <tr style={{ background: bgHighlight ? 'rgba(99,102,241,0.06)' : 'var(--bg-hover)' }}>
      <td style={{ ...tdS, paddingLeft: 14, fontWeight: 700, fontSize: 12 }}>{label}</td>
      <td style={{ ...tdS }}><Sparkline vals={vals} color={color} /></td>
      {vals.map((v, i) => <td key={i} style={{ ...tdS, textAlign: 'right', fontWeight: 700, fontSize: 12, color }}>{fmtV(v)}</td>)}
      <td style={{ ...tdS, textAlign: 'right', fontWeight: 700, fontSize: 12, color, background: 'var(--bg-elevated)' }}>{fmtV(vals[vals.length - 1] ?? 0)}</td>
    </tr>
  );

  // ── Export ────────────────────────────────────────────────────────────────
  const exportCSV = () => {
    const lines = [
      ['Статья', ...displayCols.map(c => c.label)].join(';'),
      ['Денежные средства', ...cashPerCol.map(String)].join(';'),
      ['Дебиторская задолженность', ...receivablesPerCol.map(String)].join(';'),
      ['Основные средства', ...fixedAssetsPerCol.map(String)].join(';'),
      ['ИТОГО Активы', ...totalAssetsPerCol.map(String)].join(';'),
      ['Кредиты и займы', ...loansPerCol.map(String)].join(';'),
      ["Собственный капитал", ...equityPerCol.map(String)].join(';'),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'Баланс.csv'; a.click();
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
            <div style={{ display: 'flex', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: 2, gap: 1, marginTop: 8 }}>
              {(['month', 'quarter'] as GroupBy[]).map(g => (
                <button key={g} onClick={() => setGroupBy(g)} style={{
                  flex: 1, height: 22, fontSize: 11, fontWeight: 500, cursor: 'pointer', borderRadius: 4,
                  background: groupBy === g ? 'var(--bg-card)' : 'transparent',
                  color: groupBy === g ? 'var(--text-primary)' : 'var(--text-secondary)',
                  border: 'none', boxShadow: groupBy === g ? 'var(--shadow-sm)' : 'none', transition: 'all 160ms ease',
                }}>
                  {g === 'month' ? 'Месяц' : 'Квартал'}
                </button>
              ))}
            </div>
          </div>

          {/* Balance check indicator */}
          <div style={{ padding: '10px 12px', borderRadius: 8, background: isBalanced ? 'rgba(16,185,129,0.08)' : 'rgba(220,38,38,0.08)', border: `1px solid ${isBalanced ? 'rgba(16,185,129,0.2)' : 'rgba(220,38,38,0.2)'}`, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            {isBalanced ? <ShieldCheck size={14} color="#10b981" style={{ flexShrink: 0, marginTop: 1 }} /> : <ShieldAlert size={14} color="#dc2626" style={{ flexShrink: 0, marginTop: 1 }} />}
            <span style={{ fontSize: 11, color: isBalanced ? '#10b981' : '#dc2626', fontWeight: 500, lineHeight: 1.4 }}>
              {isBalanced ? 'Баланс сходится: Активы = Пассивы' : 'Баланс не сходится'}
            </span>
          </div>

          {/* KPI summary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 2 }}>{t("На конец периода", "На конец периода")}</div>
            {[
              { label: 'Активы',         val: totalAssetsPerCol[totalAssetsPerCol.length - 1] ?? 0, color: '#6366f1' },
              { label: 'ОБЯЗАТЕЛЬСТВА',  val: loansPerCol[loansPerCol.length - 1] ?? 0,            color: '#dc2626' },
              { label: 'Собств. капитал',val: equityPerCol[equityPerCol.length - 1] ?? 0,           color: '#10b981' },
            ].map(({ label, val, color }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'var(--bg-elevated)', borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color }}>{val === 0 ? '—' : fmtV(val) + " " + APP_CURRENCY_SYMBOL}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      )}

      {/* ── MAIN ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Header */}
        <div style={{ height: 44, padding: '0 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <button onClick={() => setSidebarOpen(!isSidebarOpen)} style={{ background: isSidebarOpen ? 'var(--bg-card)' : 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <Filter size={13} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <span style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: -0.01 }}>{t("Управленческий Баланс", "Управленческий Баланс")}</span>
              <span title={t("Активы = Обязательства + Собственный капитал", "Активы = Обязательства + Собственный капитал")} style={{ cursor: 'pointer', display: 'flex', color: 'var(--text-muted)' }}>
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
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>{t("Выберите корректный период", "Выберите корректный период")}</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1000 }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                <tr style={{ background: 'var(--bg-surface)', boxShadow: '0 1px 0 var(--border-subtle)' }}>
                  <th style={{ ...tdS, textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', width: 280, position: 'sticky', left: 0, background: 'var(--bg-surface)', zIndex: 20 }}>{t("Статьи баланса", "Статьи баланса")}</th>
                  <th style={{ ...tdS, width: 56, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>{t("Тренд", "Тренд")}</th>
                  {displayCols.map((c, i) => (
                    <th key={i} style={{ ...tdS, textAlign: 'right', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>{c.label}</th>
                  ))}
                  <th style={{ ...tdS, textAlign: 'right', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--color-primary)', background: 'var(--bg-hover)' }}>{t("Последний", "Последний")}</th>
                </tr>
              </thead>
              <tbody>
                {/* ── ASSETS ── */}
                <SectionRow id="assets" label={t("АКТИВЫ", "АКТИВЫ")} vals={totalAssetsPerCol} color="#6366f1" />
                {expanded['assets'] && <>
                  <SubRow label={t("Денежные средства", "Денежные средства")} vals={cashPerCol} color="#6366f1" />
                  <SubRow label={t("Дебиторская задолженность", "Дебиторская задолженность")} vals={receivablesPerCol} color="#6366f1" />
                  <SubRow label={t("Основные средства (остаточная стоимость)", "Основные средства (остаточная стоимость)")} vals={fixedAssetsPerCol} color="#6366f1" />
                </>}
                <TotalRow label={t("ИТОГО Активы", "ИТОГО Активы")} vals={totalAssetsPerCol} color="#6366f1" bgHighlight />

                {/* ── LIABILITIES ── */}
                <SectionRow id="liab" label={t("ОБЯЗАТЕЛЬСТВА", "ОБЯЗАТЕЛЬСТВА")} vals={loansPerCol} color="#dc2626" />
                {expanded['liab'] && <>
                  <SubRow label={t("Займы и кредиты (остаток)", "Займы и кредиты (остаток)")} vals={loansPerCol} color="#dc2626" />
                </>}

                {/* ── EQUITY ── */}
                <SectionRow id="equity" label={t("СОБСТВЕННЫЙ КАПИТАЛ", "СОБСТВЕННЫЙ КАПИТАЛ")} vals={equityPerCol} color="#10b981" />
                {expanded['equity'] && <>
                  <SubRow label={t("Нераспределённая прибыль", "Нераспределённая прибыль")} vals={equityPerCol} color="#10b981" />
                </>}
                <TotalRow label={t("ИТОГО Пассивы", "ИТОГО Пассивы")} vals={totalPassivesPerCol} color="#6366f1" bgHighlight />

                {/* Balance check */}
                <tr style={{ background: isBalanced ? 'rgba(16,185,129,0.05)' : 'rgba(220,38,38,0.06)' }}>
                  <td style={{ ...tdS, paddingLeft: 14, fontWeight: 600, fontSize: 11, color: isBalanced ? '#10b981' : '#dc2626' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      {isBalanced ? <ShieldCheck size={11} /> : <ShieldAlert size={11} />}
                      
                      {t("Балансовый контроль (Активы − Пассивы)", "Балансовый контроль (Активы − Пассивы)")}
                    </span>
                  </td>
                  <td style={tdS} />
                  {balanceCheckPerCol.map((v, i) => (
                    <td key={i} style={{ ...tdS, textAlign: 'right', fontSize: 11, fontWeight: 600, color: Math.abs(v) < 1 ? '#10b981' : '#dc2626' }}>
                      {Math.abs(v) < 1 ? '✓' : fmtV(v, true)}
                    </td>
                  ))}
                  <td style={{ ...tdS, background: 'var(--bg-surface)' }} />
                </tr>
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsBalancePage;
