import React, { useMemo, useState } from 'react';
import { useFinanceStore } from '../financeStore';
import { LineChart, Line } from 'recharts';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { format, startOfMonth, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

interface FlowRow {
  id: string;
  name: string;
  type: 'group' | 'category' | 'total';
  values: number[];
  total: number;
  trend: { value: number }[];
  isExpanded?: boolean;
  children?: FlowRow[];
}

export const ReportsTablePNL: React.FC = () => {
  const { t } = useTranslation();
    const { transactions, categories } = useFinanceStore();
  const [expandedRows, setExpandedRows] = useState<string[]>(['group_revenue', 'group_expenses']);

  const toggleRow = (id: string) => {
    setExpandedRows(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const { months, dataByMonth } = useMemo(() => {
    const validTxs = transactions.filter(t => t.isPaidConfirmed && t.date && ['income', 'expense'].includes(t.type));
    
    const monthSet = new Set<string>();
    validTxs.forEach(t => monthSet.add(startOfMonth(parseISO(t.date!)).toISOString()));
    
    const uniqueMonths = Array.from(monthSet).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    if (uniqueMonths.length === 0) uniqueMonths.push(startOfMonth(new Date()).toISOString());

    return { months: uniqueMonths, dataByMonth: validTxs };
  }, [transactions]);

  const buildRows = () => {
    const sumForCat = (catId: string, monthIndex: number) => {
      const monthStart = months[monthIndex];
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);

      return dataByMonth
        .filter(t => t.categoryId === catId && t.date && new Date(t.date) >= new Date(monthStart) && new Date(t.date) < monthEnd)
        .reduce((sum, t) => sum + (t.baseAmount ?? t.amount), 0);
    };

    const revenueGroup: FlowRow = { id: 'group_revenue', name: 'Выручка', type: 'group', values: months.map(() => 0), total: 0, trend: [], children: [] };
    const expensesGroup: FlowRow = { id: 'group_expenses', name: 'Основные расходы', type: 'group', values: months.map(() => 0), total: 0, trend: [], children: [] };
    const taxesDivsGroup: FlowRow = { id: 'group_taxes', name: 'Налоги и Дивиденды', type: 'group', values: months.map(() => 0), total: 0, trend: [], children: [] };

    categories.forEach(cat => {
      const row: FlowRow = { id: cat.id, name: cat.name, type: 'category', values: [], total: 0, trend: [] };
      months.forEach((_, idx) => {
        const val = sumForCat(cat.id, idx);
        row.values.push(val);
        row.total += val;
      });
      row.trend = row.values.map(v => ({ value: v }));

      if (row.total > 0) {
        if (cat.type === 'income') {
          revenueGroup.children!.push(row);
          row.values.forEach((v, i) => revenueGroup.values[i] += v);
          revenueGroup.total += row.total;
        } else if (cat.type === 'expense') {
          if (cat.name.toLowerCase().includes('налог') || cat.name.toLowerCase().includes('дивиденд')) {
            taxesDivsGroup.children!.push(row);
            row.values.forEach((v, i) => taxesDivsGroup.values[i] += v);
            taxesDivsGroup.total += row.total;
          } else {
            expensesGroup.children!.push(row);
            row.values.forEach((v, i) => expensesGroup.values[i] += v);
            expensesGroup.total += row.total;
          }
        }
      }
    });

    revenueGroup.trend = revenueGroup.values.map(v => ({ value: v }));
    expensesGroup.trend = expensesGroup.values.map(v => ({ value: v }));
    taxesDivsGroup.trend = taxesDivsGroup.values.map(v => ({ value: v }));

    const opProfit: FlowRow = {
      id: 'total_op_profit', name: 'Операционная прибыль', type: 'total',
      values: months.map((_, i) => revenueGroup.values[i] - expensesGroup.values[i]),
      total: revenueGroup.total - expensesGroup.total, trend: []
    };
    opProfit.trend = opProfit.values.map(v => ({ value: v }));

    const netProfit: FlowRow = {
      id: 'total_net_profit', name: 'Чистая прибыль (Net Profit)', type: 'total',
      values: months.map((_, i) => opProfit.values[i] - taxesDivsGroup.values[i]),
      total: opProfit.total - taxesDivsGroup.total, trend: []
    };
    netProfit.trend = netProfit.values.map(v => ({ value: v }));

    return [revenueGroup, expensesGroup, opProfit, taxesDivsGroup, netProfit];
  };

  const rows = buildRows();

  const renderSparkline = (data: { value: number }[], color: string) => (
    <div style={{ width: 60, height: 20 }}>
      {data.length > 1 ? (
        <LineChart width={60} height={20} data={data}>
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      ) : <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>{t("Нет тренда", "Нет тренда")}</div>}
    </div>
  );

  const Th: React.FC<{ children: React.ReactNode, align?: 'left'|'right' }> = ({ children, align = 'right' }) => (
    <th style={{ padding: '12px 16px', textAlign: align, fontWeight: 600, fontSize: 13, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'rgba(30, 41, 59, 1)' }}>
      {children}
    </th>
  );

  const Td: React.FC<{ children: React.ReactNode, align?: 'left'|'right', isBold?: boolean, isTotalRow?: boolean }> = ({ children, align = 'right', isBold, isTotalRow }) => (
    <td style={{ padding: '12px 16px', textAlign: align, fontSize: isTotalRow ? 14 : 13, fontWeight: isBold ? 700 : 400, borderBottom: '1px solid var(--border-subtle)', color: isBold ? '#fff' : 'rgba(255,255,255,0.8)' }}>
      {children}
    </td>
  );

  const renderRow = (row: FlowRow, level = 0) => {
    const isExpanded = expandedRows.includes(row.id);
    const hasChildren = row.children && row.children.length > 0;
    const isTotalRow = row.type === 'total';
    
    let baseColor = 'inherit';
    if (isTotalRow) baseColor = row.total >= 0 ? '#10b981' : '#ef4444';
    if (row.id === 'group_revenue') baseColor = '#10b981';
    if (row.id === 'group_expenses' || row.id === 'group_taxes') baseColor = '#ef4444';

    return (
      <React.Fragment key={row.id}>
        <tr 
          onClick={() => hasChildren && toggleRow(row.id)}
          style={{ 
            cursor: hasChildren ? 'pointer' : 'default', 
            background: isTotalRow ? 'rgba(255,255,255,0.04)' : (level === 0 ? 'rgba(255,255,255,0.02)' : 'transparent'),
            transition: 'background 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = isTotalRow ? 'rgba(255,255,255,0.06)' : 'var(--border-subtle)'}
          onMouseLeave={e => e.currentTarget.style.background = isTotalRow ? 'rgba(255,255,255,0.04)' : (level === 0 ? 'rgba(255,255,255,0.02)' : 'transparent')}
        >
          <Td align="left" isBold={level === 0 || isTotalRow} isTotalRow={isTotalRow}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: level * 20 }}>
              {hasChildren ? (isExpanded ? <ChevronDown size={14} color="var(--text-muted)" /> : <ChevronRight size={14} color="var(--text-muted)" />) : <div style={{ width: 14 }} />}
              <span style={{ color: isTotalRow ? '#fff' : (level === 0 ? 'var(--text-primary)' : 'var(--text-secondary)') }}>{row.name}</span>
            </div>
          </Td>
          <Td align="left">
            {renderSparkline(row.trend, isTotalRow ? baseColor : (row.id.includes('revenue') ? '#10b981' : '#ef4444'))}
          </Td>
          {row.values.map((v, i) => (
            <Td key={i} isBold={level === 0 || isTotalRow} isTotalRow={isTotalRow}>
              <span style={{ color: isTotalRow ? (v >= 0 ? '#10b981' : '#ef4444') : baseColor }}>
                {v === 0 ? '—' : new Intl.NumberFormat('ru-RU').format(v)}
              </span>
            </Td>
          ))}
          <Td isBold={true} isTotalRow={isTotalRow}>
            <span style={{ color: baseColor }}>
              {row.total === 0 ? '—' : new Intl.NumberFormat('ru-RU').format(row.total)}
            </span>
          </Td>
        </tr>
        {isExpanded && row.children?.map(child => renderRow(child, level + 1))}
      </React.Fragment>
    );
  };

  return (
    <div style={{ background: 'var(--bg-surface)', borderRadius: 12, border: '1px solid var(--border-default)', overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
          <thead>
            <tr>
              <Th align="left">{t("По статьям учета", "По статьям учета")}</Th>
              <Th align="left">{t("Тренд", "Тренд")}</Th>
              {months.map(m => (
                <Th key={m}>{format(parseISO(m), "MMM ''yy", { locale: ru })}</Th>
              ))}
              <Th>{t("Итого", "Итого")}</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => renderRow(r))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
