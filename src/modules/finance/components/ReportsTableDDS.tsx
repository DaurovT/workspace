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
  type: 'group' | 'subgroup' | 'category';
  values: number[]; // Index maps to array of months
  total: number;
  trend: { value: number }[];
  isExpanded?: boolean;
  children?: FlowRow[];
}

export const ReportsTableDDS: React.FC = () => {
  const { t } = useTranslation();
    const { transactions, categories } = useFinanceStore();
  const [expandedRows, setExpandedRows] = useState<string[]>(['group_op', 'group_inv', 'group_fin', 'sub_op_in', 'sub_op_out']);

  const toggleRow = (id: string) => {
    setExpandedRows(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // 1. Group transactions by month
  const { months, dataByMonth } = useMemo(() => {
    const validTxs = transactions.filter(t => t.isPaidConfirmed && t.date && ['income', 'expense'].includes(t.type));
    
    // Find unique months
    const monthSet = new Set<string>();
    validTxs.forEach(t => {
      const d = parseISO(t.date!);
      monthSet.add(startOfMonth(d).toISOString());
    });
    
    const uniqueMonths = Array.from(monthSet).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    
    // If no months, mock current month
    if (uniqueMonths.length === 0) {
      uniqueMonths.push(startOfMonth(new Date()).toISOString());
    }

    return { months: uniqueMonths, dataByMonth: validTxs };
  }, [transactions]);

  // 2. Build rows logic
  const buildRows = () => {
    const sumForCat = (catId: string, monthIndex: number) => {
      const monthStart = months[monthIndex];
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);

      return dataByMonth
        .filter(t => t.categoryId === catId && t.date && new Date(t.date) >= new Date(monthStart) && new Date(t.date) < monthEnd)
        .reduce((sum, t) => sum + (t.baseAmount ?? t.amount), 0);
    };

    const createGroup = (id: string, name: string, activity: string): FlowRow => {
      const flowIn: FlowRow = { id: `sub_${id}_in`, name: 'Поступления', type: 'subgroup', values: months.map(() => 0), total: 0, trend: [], children: [] };
      const flowOut: FlowRow = { id: `sub_${id}_out`, name: "Выплаты", type: 'subgroup', values: months.map(() => 0), total: 0, trend: [], children: [] };

      categories.filter(c => c.activity === activity).forEach(cat => {
        const row: FlowRow = { id: cat.id, name: cat.name, type: 'category', values: [], total: 0, trend: [] };
        months.forEach((_, idx) => {
          const val = sumForCat(cat.id, idx);
          row.values.push(val);
          row.total += val;
          row.trend.push({ value: val });
        });

        if (cat.type === 'income') {
          flowIn.children!.push(row);
          row.values.forEach((v, i) => flowIn.values[i] += v);
          flowIn.total += row.total;
        } else if (cat.type === 'expense') {
          flowOut.children!.push(row);
          row.values.forEach((v, i) => flowOut.values[i] += v);
          flowOut.total += row.total;
        }
      });

      flowIn.trend = flowIn.values.map(v => ({ value: v }));
      flowOut.trend = flowOut.values.map(v => ({ value: v }));

      const totalGroup: FlowRow = {
        id: `group_${id}`, name, type: 'group',
        values: months.map((_, i) => flowIn.values[i] - flowOut.values[i]),
        total: flowIn.total - flowOut.total,
        trend: [], children: [flowIn, flowOut]
      };
      totalGroup.trend = totalGroup.values.map(v => ({ value: v }));

      return totalGroup;
    };

    const opFlow = createGroup('op', 'Операционный денежный поток', 'operating');
    const invFlow = createGroup('inv', 'Инвестиционный денежный поток', 'investing');
    const finFlow = createGroup('fin', 'Финансовый денежный поток', 'financing');

    const totalFlow: FlowRow = {
      id: 'total_flow', name: 'Общий денежный поток', type: 'group',
      values: months.map((_, i) => opFlow.values[i] + invFlow.values[i] + finFlow.values[i]),
      total: opFlow.total + invFlow.total + finFlow.total,
      trend: []
    };
    totalFlow.trend = totalFlow.values.map(v => ({ value: v }));

    return [opFlow, invFlow, finFlow, totalFlow];
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

  const Td: React.FC<{ children: React.ReactNode, align?: 'left'|'right', isBold?: boolean }> = ({ children, align = 'right', isBold }) => (
    <td style={{ padding: '12px 16px', textAlign: align, fontSize: 13, fontWeight: isBold ? 600 : 400, borderBottom: '1px solid var(--border-subtle)', color: isBold ? '#fff' : 'rgba(255,255,255,0.8)' }}>
      {children}
    </td>
  );

  const renderRow = (row: FlowRow, level = 0) => {
    const isExpanded = expandedRows.includes(row.id);
    const hasChildren = row.children && row.children.length > 0;
    
    // Determine color
    let rowColor = 'inherit';
    if (row.id.includes('total_flow')) rowColor = row.total >= 0 ? '#10b981' : '#ef4444';

    return (
      <React.Fragment key={row.id}>
        <tr 
          onClick={() => hasChildren && toggleRow(row.id)}
          style={{ 
            cursor: hasChildren ? 'pointer' : 'default', 
            background: level === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
            transition: 'background 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = level === 0 ? 'rgba(255,255,255,0.02)' : 'transparent'}
        >
          <Td align="left" isBold={level < 2}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: level * 20 }}>
              {hasChildren ? (isExpanded ? <ChevronDown size={14} color="var(--text-muted)" /> : <ChevronRight size={14} color="var(--text-muted)" />) : <div style={{ width: 14 }} />}
              <span style={{ color: level === 0 ? '#fff' : (level === 1 ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)') }}>{row.name}</span>
            </div>
          </Td>
          <Td align="left">
            {renderSparkline(row.trend, row.id.includes('_out') || row.total < 0 ? '#ef4444' : '#10b981')}
          </Td>
          {row.values.map((v, i) => (
            <Td key={i} isBold={level === 0}>
              <span style={{ color: rowColor }}>{new Intl.NumberFormat('ru-RU').format(v)}</span>
            </Td>
          ))}
          <Td isBold={true}>
            <span style={{ color: rowColor }}>{new Intl.NumberFormat('ru-RU').format(row.total)}</span>
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
