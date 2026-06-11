import React, { useMemo } from 'react';
import { useFinanceStore } from '../financeStore';
import { format, parseISO, endOfMonth, startOfMonth } from 'date-fns';
import { ru } from 'date-fns/locale';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { APP_CURRENCY, } from '../config/currency';
import { useTranslation } from 'react-i18next';

export const ReportsTableBalance: React.FC = () => {
  const { t } = useTranslation();
    const { transactions, categories, accounts, funds } = useFinanceStore();

  // Build a set of months from confirmed transactions
  const months = useMemo(() => {
    const validTxs = transactions.filter(t => t.isPaidConfirmed && t.date);
    const monthSet = new Set<string>();
    validTxs.forEach(t => monthSet.add(startOfMonth(parseISO(t.date)).toISOString()));
    const sorted = Array.from(monthSet).sort((a, b) => new Date(a).getTime() - new Date(b).getTime()).slice(-6);
    if (sorted.length === 0) sorted.push(startOfMonth(new Date()).toISOString());
    return sorted;
  }, [transactions]);

  // Build balance snapshot at end of each month
  const snapshots = useMemo(() => {
    return months.map(m => {
      const cutoff = endOfMonth(parseISO(m));

      const txsBefore = transactions.filter(t =>
        t.isPaidConfirmed && t.date && parseISO(t.date) <= cutoff
      );

      // Assets
      const cash = accounts.reduce((s, a) => s + (a.currency === APP_CURRENCY ? a.balance : 0), 0);
      const reserved = funds.reduce((s, f) => s + f.currentBalance, 0);
      
      // Receivables: income accruals not yet paid (type === 'accrual' or shipment)
      const receivables = txsBefore
        .filter(t => t.type === 'accrual' && !t.isPaidConfirmed)
        .reduce((s, t) => s + (t.baseAmount ?? t.amount), 0);

      // Fixed assets: all income from investing category
      const fixedAssets = txsBefore
        .filter(t => {
          const cat = categories.find(c => c.id === t.categoryId);
          return cat?.activity === 'investing' && t.type === 'expense';
        })
        .reduce((s, t) => s + (t.baseAmount ?? t.amount), 0);

      const totalAssets = cash + receivables + fixedAssets;

      // Liabilities
      const payables = txsBefore
        .filter(t => {
          const cat = categories.find(c => c.id === t.categoryId);
          return cat?.activity === 'financing' && t.type === 'expense';
        })
        .reduce((s, t) => s + (t.baseAmount ?? t.amount), 0);

      // Capital: cumulative net profit
      const income = txsBefore.filter(t => t.type === 'income').reduce((s, t) => s + (t.baseAmount ?? t.amount), 0);
      const expense = txsBefore.filter(t => t.type === 'expense').reduce((s, t) => s + (t.baseAmount ?? t.amount), 0);
      const retainedEarnings = income - expense;
      
      const totalLiabEquity = payables + retainedEarnings;

      return { cash, reserved, receivables, fixedAssets, totalAssets, payables, retainedEarnings, totalLiabEquity };
    });
  }, [months, transactions, categories, accounts, funds]);

  const fmt = (v: number) => new Intl.NumberFormat('ru-RU').format(Math.round(v));

  const SectionHeader: React.FC<{ label: string; colorAccent?: string }> = ({ label, colorAccent = 'rgba(59,130,246,0.5)' }) => (
    <tr>
      <td colSpan={months.length + 1} style={{ padding: '10px 16px 6px', background: 'rgba(0,0,0,0.25)', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1.2, borderLeft: `3px solid ${colorAccent}` }}>
        {label}
      </td>
    </tr>
  );

  const Row: React.FC<{ label: string; values: number[]; isBold?: boolean; indent?: boolean; color?: string }> = ({ label, values, isBold, indent, color }) => (
    <tr style={{ background: isBold ? 'rgba(255,255,255,0.03)' : 'transparent' }}
      onMouseEnter={e => { if (!isBold) e.currentTarget.style.background = 'var(--bg-hover)'; }}
      onMouseLeave={e => { if (!isBold) e.currentTarget.style.background = 'transparent'; }}>
      <td style={{ padding: '11px 16px', fontSize: isBold ? 13.5 : 13, fontWeight: isBold ? 700 : 400, color: color || (isBold ? '#fff' : 'rgba(255,255,255,0.75)'), borderBottom: '1px solid var(--border-subtle)', paddingLeft: indent ? 32 : 16 }}>
        {label}
      </td>
      {values.map((v, i) => {
        const prev = i > 0 ? values[i - 1] : null;
        const delta = prev !== null ? v - prev : null;
        return (
          <td key={i} style={{ padding: '11px 16px', textAlign: 'right', fontSize: isBold ? 13.5 : 13, fontWeight: isBold ? 700 : 400, color: color || (isBold ? '#fff' : 'rgba(255,255,255,0.8)'), borderBottom: '1px solid var(--border-subtle)', borderLeft: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
              {delta !== null && Math.abs(delta) > 100 && (
                <span style={{ fontSize: 10, color: delta > 0 ? '#10b981' : '#ef4444' }}>
                  {delta > 0 ? '▲' : '▼'}
                </span>
              )}
              <span style={{ color: v < 0 ? '#ef4444' : (color || 'inherit') }}>
                {fmt(v)}
              </span>
            </div>
          </td>
        );
      })}
    </tr>
  );

  const lastSnap = snapshots[snapshots.length - 1];
  const isBalanced = lastSnap && Math.abs(lastSnap.totalAssets - lastSnap.totalLiabEquity) < 1;

  return (
    <div>
      {/* Balance Health Banner */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <TrendingUp size={20} color="#10b981" />
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{t("АКТИВЫ", "АКТИВЫ")}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#10b981' }}>{lastSnap ? fmt(lastSnap.totalAssets) : '—'}  {t("сум", "сум")}</div>
          </div>
        </div>
        <div style={{ flex: 1, background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <TrendingDown size={20} color="#8b5cf6" />
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{t("ПАССИВЫ + КАПИТАЛ", "ПАССИВЫ + КАПИТАЛ")}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#8b5cf6' }}>{lastSnap ? fmt(lastSnap.totalLiabEquity) : '—'}  {t("сум", "сум")}</div>
          </div>
        </div>
        <div style={{ background: isBalanced ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)', border: `1px solid ${isBalanced ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`, borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: isBalanced ? '#10b981' : '#ef4444', boxShadow: `0 0 8px ${isBalanced ? '#10b981' : '#ef4444'}` }} />
          <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>{isBalanced ? "Баланс сходится ✓" : 'Расхождение'}</div>
        </div>
      </div>

      {/* Main Table */}
      <div style={{ background: '#111827', borderRadius: 12, border: '1px solid var(--border-default)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
            <thead>
              <tr style={{ background: 'var(--bg-card)' }}>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', borderBottom: '2px solid rgba(255,255,255,0.08)', width: '35%' }}>
                  
                  {t("Статья", "Статья")}
                </th>
                {months.map(m => (
                  <th key={m} style={{ padding: '14px 16px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', borderBottom: '2px solid rgba(255,255,255,0.08)', borderLeft: '1px solid var(--border-subtle)', minWidth: 120 }}>
                    {format(endOfMonth(parseISO(m)), "MMM ''yy", { locale: ru })}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* ASSETS */}
              <SectionHeader label={t("I. Активы", "I. Активы")} colorAccent="#3b82f6" />
              <Row label={t("Денежные средства (Счета)", "Денежные средства (Счета)")} values={snapshots.map(s => s.cash)} indent />
              <Row label={t("Зарезервировано (Сейфы)", "Зарезервировано (Сейфы)")} values={snapshots.map(s => -s.reserved)} indent color="#f59e0b" />
              <Row label={t("Свободные денежные средства", "Свободные денежные средства")} values={snapshots.map(s => s.cash - s.reserved)} indent color="#10b981" />
              <Row label={t("Дебиторская задолженность", "Дебиторская задолженность")} values={snapshots.map(s => s.receivables)} indent />
              <Row label={t("Основные средства (капвложения)", "Основные средства (капвложения)")} values={snapshots.map(s => s.fixedAssets)} indent />
              <Row label={t("ИТОГО АКТИВЫ", "ИТОГО АКТИВЫ")} values={snapshots.map(s => s.totalAssets)} isBold color="#3b82f6" />

              {/* Spacer */}
              <tr><td colSpan={months.length + 1} style={{ height: 12 }} /></tr>

              {/* LIABILITIES */}
              <SectionHeader label={t("II. Обязательства", "II. Обязательства")} colorAccent="#ef4444" />
              <Row label={t("Кредиторская задолженность", "Кредиторская задолженность")} values={snapshots.map(s => s.payables)} indent />
              <Row label={t("ИТОГО ОБЯЗАТЕЛЬСТВА", "ИТОГО ОБЯЗАТЕЛЬСТВА")} values={snapshots.map(s => s.payables)} isBold color="#ef4444" />

              {/* Spacer */}
              <tr><td colSpan={months.length + 1} style={{ height: 12 }} /></tr>

              {/* EQUITY */}
              <SectionHeader label={t("III. Капитал", "III. Капитал")} colorAccent="#10b981" />
              <Row label={t("Нераспределённая прибыль", "Нераспределённая прибыль")} values={snapshots.map(s => s.retainedEarnings)} indent color={lastSnap?.retainedEarnings >= 0 ? '#10b981' : '#ef4444'} />
              <Row label={t("ИТОГО КАПИТАЛ", "ИТОГО КАПИТАЛ")} values={snapshots.map(s => s.retainedEarnings)} isBold color="#10b981" />

              {/* Spacer */}
              <tr><td colSpan={months.length + 1} style={{ height: 12 }} /></tr>

              {/* TOTAL */}
              <tr style={{ background: 'var(--bg-surface)' }}>
                <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', borderTop: '2px solid var(--border-default)' }}>
                  
                  {t("ИТОГО ПАССИВЫ + КАПИТАЛ", "ИТОГО ПАССИВЫ + КАПИТАЛ")}
                </td>
                {snapshots.map((s, i) => {
                  const balanced = Math.abs(s.totalAssets - s.totalLiabEquity) < 1;
                  return (
                    <td key={i} style={{ padding: '14px 16px', textAlign: 'right', fontSize: 14, fontWeight: 800, borderTop: '2px solid var(--border-default)', borderLeft: '1px solid var(--border-subtle)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                        {!balanced && <span style={{ fontSize: 10, background: '#ef4444', color: 'var(--text-primary)', padding: '2px 6px', borderRadius: 4 }}>!</span>}
                        <span style={{ color: balanced ? '#10b981' : '#ef4444' }}>{fmt(s.totalLiabEquity)}</span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 16px', background: 'var(--bg-base)', borderTop: '1px solid var(--border-subtle)', fontSize: 11, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
          <span>{t("Форма №1 · Управленческий баланс · Данные автоматически агрегируются из операций", "Форма №1 · Управленческий баланс · Данные автоматически агрегируются из операций")}</span>
          <span>{t("▲ — рост vs предыдущий период &nbsp; ▼ — снижение", "▲ — рост vs предыдущий период &nbsp; ▼ — снижение")}</span>
        </div>
      </div>
    </div>
  );
};
