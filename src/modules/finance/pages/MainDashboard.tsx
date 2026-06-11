import React, { useState } from 'react';
import { useChartsReady } from '../hooks/useChartsReady';
import {
  Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, ComposedChart, Line, PieChart, Pie, Cell, Brush
} from 'recharts';
import { ChevronDown, Calendar, Filter } from 'lucide-react';
import { useFinanceStore } from '../financeStore';
import { APP_CURRENCY_SYMBOL } from '../config/currency';
import { useTranslation } from 'react-i18next';

const PIE_COLORS_REV = ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];
const PIE_COLORS_EXP = ['#f59e0b', '#fbbf24', '#fcd34d', '#fde68a', '#d97706'];



const MainDashboard: React.FC = () => {
  const { t } = useTranslation();
    const chartsReady = useChartsReady();


  // Global filter states
  const [selectedYear, setSelectedYear] = useState('2026 (План)');
  const [selectedPeriod, setSelectedPeriod] = useState('С начала года');
  const [selectedDates, setSelectedDates] = useState('Янв \'26 — дек \'26');
  const [selectedDisplay, setSelectedDisplay] = useState('По месяцам');
  const [selectedEntities, setSelectedEntities] = useState('Все юрлица');
  const [selectedProjects, setSelectedProjects] = useState('Все проекты');
  const [selectedDeals, setSelectedDeals] = useState("Все сделки");

  // States mapping to segmented controls
  const [method, setMethod] = useState('cash');
  const [profitSort, setProfitSort] = useState('profit');
  const [cfType, setCfType] = useState('total');

  const { transactions, categories, accounts, deals, contractors, projects } = useFinanceStore();

  const selectedYearNum = parseInt((selectedYear.match(/\d{4}/) || [])[0] || '', 10) || new Date().getFullYear();

  // ── Single filtered set driving every chart (audit #1: wire filters to data) ──
  const filteredTx = React.useMemo(() => {
    const proj = selectedProjects !== 'Все проекты' ? projects.find(p => p.name === selectedProjects) : null;
    const now = new Date();
    return transactions.filter(t => {
      const d = new Date(t.date);
      if (d.getFullYear() !== selectedYearNum) return false;
      if (proj && t.projectId !== proj.id) return false;
      if (selectedPeriod === 'За прошлый месяц') {
        const pm = (now.getMonth() + 11) % 12;
        const pmy = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
        if (!(d.getMonth() === pm && d.getFullYear() === pmy)) return false;
      } else if (selectedPeriod === 'За текущий квартал') {
        if (Math.floor(d.getMonth() / 3) !== Math.floor(now.getMonth() / 3) || d.getFullYear() !== now.getFullYear()) return false;
      }
      return true;
    });
  }, [transactions, selectedYearNum, selectedPeriod, selectedProjects, projects]);

  // ── Computed KPIs from real data ─────────────────────────────────────────
  const computedKPIs = React.useMemo(() => {
    const confirmedTx = filteredTx.filter(t => t.isPaidConfirmed);
    const totalIncome = confirmedTx.filter(t => t.type === 'income').reduce((s, t) => s + (t.baseAmount ?? t.amount), 0);
    const totalExpense = confirmedTx.filter(t => t.type === 'expense').reduce((s, t) => s + (t.baseAmount ?? t.amount), 0);
    const netProfit = totalIncome - totalExpense;
    const rentabilityPct = totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) + '%' : '0%';
    const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
    const netCashFlow = totalIncome - totalExpense;
    const liquidity = totalBalance > totalExpense ? 'Высокая' : totalBalance > totalExpense * 0.5 ? 'Средняя' : 'Низкая';
    return { totalIncome, totalExpense, netProfit, rentabilityPct, totalBalance, netCashFlow, liquidity };
  }, [filteredTx, accounts]);

  // Compute monthlyData from real transactions
  const realMonthlyData = React.useMemo(() => {
    const confirmedTx = filteredTx.filter(t => t.isPaidConfirmed);
    const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
    const year = selectedYearNum;
    let runningBal = accounts.reduce((s, a) => s + a.balance, 0);
    // Build per-month aggregations
    const data = months.map((name, i) => {
      const monthTx = confirmedTx.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === i && d.getFullYear() === year;
      });
      const rev = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + (t.baseAmount ?? t.amount), 0);
      const exp = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + (t.baseAmount ?? t.amount), 0);
      return { name, rev, exp, in: rev, out: exp, bal: 0, profit: rev - exp, cf: rev - exp };
    });
    // Compute running balance backwards from current balance
    const totalNetBefore = data.reduce((s, d) => s + d.cf, 0);
    let cumBal = runningBal - totalNetBefore;
    data.forEach(d => { cumBal += d.cf; d.bal = cumBal; });
    return data;
  }, [filteredTx, accounts]);

  // Compute pareto from real deal data
  const realParetoData = React.useMemo(() => {
    if (projects.length === 0) return [];
    const projectRevenue = projects.map(p => {
      const dealSum = deals.filter(d => d.projectId === p.id && d.type === 'sale').reduce((s, d) => s + d.amount, 0);
      const txSum = filteredTx.filter(t => t.projectId === p.id && t.type === 'income' && t.isPaidConfirmed).reduce((s, t) => s + (t.baseAmount ?? t.amount), 0);
      return { name: p.name, value: dealSum || txSum };
    }).filter(d => d.value > 0).sort((a, b) => b.value - a.value).slice(0, 5);
    if (projectRevenue.length === 0) return [];
    const total = projectRevenue.reduce((s, d) => s + d.value, 0);
    let cum = 0;
    return projectRevenue.map(d => { cum += d.value; return { ...d, cumulative: Math.round((cum / total) * 100) }; });
  }, [projects, deals, filteredTx]);

  const realStructureDataRev = React.useMemo(() => {
    const revCats = categories.filter(c => c.type === 'income');
    const data = revCats.map(c => {
      const value = filteredTx.filter(t => t.categoryId === c.id && t.isPaidConfirmed).reduce((sum, t) => sum + (t.baseAmount ?? t.amount), 0);
      return { name: c.name, value };
    }).filter(d => d.value > 0);
    return data.length ? data.sort((a, b) => b.value - a.value).slice(0, 5) : [];
  }, [filteredTx, categories]);

  const realStructureDataExp = React.useMemo(() => {
    const expCats = categories.filter(c => c.type === 'expense');
    const data = expCats.map(c => {
      const value = filteredTx.filter(t => t.categoryId === c.id && t.isPaidConfirmed).reduce((sum, t) => sum + (t.baseAmount ?? t.amount), 0);
      return { name: c.name, value };
    }).filter(d => d.value > 0);
    return data.length ? data.sort((a, b) => b.value - a.value).slice(0, 5) : [];
  }, [filteredTx, categories]);

  const dynamicChartData = React.useMemo(() => realMonthlyData /* fake Math.random scramble removed, audit P0 #2 */, [method, realMonthlyData]);
  const dynamicStructureDataRev = realStructureDataRev;
  const dynamicStructureDataExp = realStructureDataExp;

  const totalRev = computedKPIs.totalIncome;
  const totalExp = computedKPIs.totalExpense;
  const totalProfit = computedKPIs.netProfit;
  const rentability = computedKPIs.rentabilityPct;

  const formatCurrency = (val: number) => new Intl.NumberFormat('ru-RU').format(val);




  const FilterDropdown = ({ label, icon, value, options, onChange }: { label?: string, icon?: React.ReactNode, value: string, options?: string[], onChange?: (v: string) => void }) => {
    const { t } = useTranslation(); void t;
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };
      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
      }
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [isOpen]);

    return (
      <div ref={dropdownRef} style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {label && <span style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, minHeight: 16 }}>{label !== ' ' ? label : ''}</span>}
        <div onClick={() => options && setIsOpen(!isOpen)} style={{ border: '1px solid var(--border-subtle)', borderRadius: 4, padding: '6px 12px 6px 8px', display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-surface)', cursor: options ? 'pointer' : 'default' }}>
          {icon && <div style={{ color: 'var(--text-muted)' }}>{icon}</div>}
          <span style={{ fontSize: 13, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{value}</span>
          {options && <ChevronDown size={14} color="var(--text-muted)" style={{ marginLeft: 4 }} />}
        </div>
        {isOpen && options && (
          <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 6, boxShadow: 'var(--shadow-md)', zIndex: 50, minWidth: '100%', overflow: 'hidden' }}>
            {options.map(opt => (
              <div
                key={opt}
                onClick={() => { onChange?.(opt); setIsOpen(false); }}
                style={{ padding: '8px 12px', fontSize: 13, color: 'var(--text-primary)', cursor: 'pointer', background: value === opt ? 'var(--bg-hover)' : 'transparent', whiteSpace: 'nowrap' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = value === opt ? 'var(--bg-hover)' : 'transparent')}
              >
                {opt}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const StatsCard = ({ label, value, change, isPositive, last }: { label: string, value: string, change?: string, isPositive?: boolean, last?: boolean }) => {
    const { t } = useTranslation(); void t;
    let changeColor = 'var(--text-muted)';
    let Arrow = null;
    if (isPositive === true) { changeColor = '#10b981'; Arrow = () => <span style={{ fontSize: 10 }}>↗</span>; }
    if (isPositive === false) { changeColor = '#ef4444'; Arrow = () => <span style={{ fontSize: 10 }}>↘</span>; }

    return (
      <div style={{ padding: '20px 24px', borderBottom: last ? 'none' : '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{value}</div>
          {change && <div style={{ fontSize: 11, color: changeColor, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2 }}>{Arrow && <Arrow />}{change}</div>}
        </div>
      </div>
    );
  };

  const TabButton = ({ active, children, onClick }: { active?: boolean, children: React.ReactNode, onClick?: () => void }) => (
    <button onClick={onClick} style={{
      padding: '6px 14px', borderRadius: 6, fontSize: 11, fontWeight: 500, transition: 'all 0.15s', cursor: 'pointer', border: 'none',
      background: active ? 'var(--bg-hover)' : 'transparent',
      color: active ? 'var(--text-primary)' : 'var(--text-muted)'
    }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.color = 'var(--text-primary)'; } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.color = 'var(--text-muted)'; } }}
    >
      {children}
    </button>
  );

  const LegendItem = ({ color, label }: { color: string, label: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: 0.8 }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: color }} />
      <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
    </div>
  );

  const DirectionRow = ({ index, name, amount, last }: { index: number, name: string, amount: string, last?: boolean }) => (
    <tr style={{ transition: 'background 0.15s', cursor: 'default' }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      <td style={{ padding: '12px 16px', borderBottom: last ? 'none' : '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 20, height: 20, borderRadius: 4, background: 'rgba(94, 106, 210, 0.1)', color: '#5e6ad2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
            {index}
          </span>
          <span style={{ fontWeight: 500, color: 'var(--text-secondary)', fontSize: 12 }}>{name}</span>
        </div>
      </td>
      <td style={{ padding: '12px 16px', textAlign: 'right', borderBottom: last ? 'none' : '1px solid var(--border-subtle)' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)', fontSize: 13 }}>{amount}</span>
      </td>
    </tr>
  );

  const Section = ({ title, children, kpis, tabs, legend }: { title: string, children: React.ReactNode, kpis: React.ReactNode, tabs?: React.ReactNode, legend?: React.ReactNode }) => (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 8, overflow: 'hidden', position: 'relative', marginBottom: 24 }}>
      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
          {title} <ChevronDown size={14} style={{ opacity: 0.5 }} />
        </h2>
      </div>
      <div className="finance-dashboard-section">
        <div className="finance-dashboard-kpis">
          {kpis}
        </div>
        <div className="finance-dashboard-chart">
          {tabs && <div className="finance-dashboard-tabs">{tabs}</div>}
          <div style={{ flex: 1, minHeight: 280 }}>{children}</div>
          {legend && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, marginTop: 24, flexWrap: 'wrap' }}>{legend}</div>}
        </div>
      </div>
    </div>
  );

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

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', background: 'var(--bg-base)' }}>
      {/* ── SIDEBAR ── */}
      {isSidebarOpen && (
        <div className="finance-filter-sidebar">
          <div style={{ height: 44, padding: '0 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <Filter size={13} color="var(--text-muted)" />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{t("Параметры и фильтры", "Параметры и фильтры")}</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
          </div>

          <div style={{ flex: 1, padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Global Settings */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>{t("Глобальные", "Глобальные")}</div>
              <FilterDropdown value={selectedYear} onChange={setSelectedYear} options={['2025 (Факт)', '2026 (План)', '2027 (План)']} />
              <FilterDropdown value={selectedPeriod} onChange={setSelectedPeriod} options={['С начала года', 'За прошлый месяц', 'За текущий квартал']} />
            </div>

            <div style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 0' }} />

            {/* Detailed Filters Component Block */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>{t("Детализация", "Детализация")}</div>
              <FilterDropdown icon={<Calendar size={14} />} value={selectedDates} onChange={setSelectedDates} options={['Янв \'26 — дек \'26', 'Произвольный период']} />
              <FilterDropdown value={selectedDisplay} onChange={setSelectedDisplay} options={['По месяцам', 'По кварталам', 'По годам']} />
              <FilterDropdown value={selectedEntities} onChange={setSelectedEntities} options={['Все юрлица', ...contractors.map(c => c.name)]} />
              <FilterDropdown value={selectedProjects} onChange={setSelectedProjects} options={['Все проекты', ...projects.map(p => p.name)]} />
              <FilterDropdown value={selectedDeals} onChange={setSelectedDeals} options={["Все сделки", ...deals.map(d => d.name)]} />
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: 'var(--bg-base)' }}>
        {/* Header */}
        <div style={{ height: 44, padding: '0 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <button onClick={() => setSidebarOpen(!isSidebarOpen)} style={{ background: isSidebarOpen ? 'var(--bg-card)' : 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <Filter size={13} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <span style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: -0.01, whiteSpace: 'nowrap' }}>{t("CFO Дашборд", "CFO Дашборд")}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: '32px', overflowY: 'auto', minWidth: 0 }}>

          {/* SECTION 1: Прибыль (Profit & P&L) */}
          <Section title={t("Прибыльность проектов", "Прибыльность проектов")}
            kpis={
              <>
                <StatsCard label={t("Выручка", "Выручка")} value={formatCurrency(totalRev)} change="+15%" isPositive={true} />
                <StatsCard label={t("Расходы", "Расходы")} value={formatCurrency(totalExp)} change="+5%" isPositive={false} />
                <StatsCard label={t("Прибыль", "Прибыль")} value={formatCurrency(totalProfit)} change="+20%" isPositive={true} />
                <StatsCard label={t("Рентабельность", "Рентабельность")} value={rentability} />
                <StatsCard label="EBITDA" value={formatCurrency(computedKPIs.netProfit)} last />
              </>
            }
            tabs={
              <>
                <TabButton active={method === 'accrual'} onClick={() => setMethod('accrual')}>{t("Метод начисления", "Метод начисления")}</TabButton>
                <TabButton active={method === 'cash'} onClick={() => setMethod('cash')}>{t("Кассовый метод", "Кассовый метод")}</TabButton>
                <TabButton active={profitSort === 'profit'} onClick={() => setProfitSort('profit')}>{t("Сортировка по прибыли", "Сортировка по прибыли")}</TabButton>
                <TabButton active={profitSort === 'margin'} onClick={() => setProfitSort('margin')}>{t("По рентабельности", "По рентабельности")}</TabButton>
              </>
            }
            legend={
              <>
                <LegendItem color="var(--color-primary)" label={t("Выручка", "Выручка")} />
                <LegendItem color="#10b981" label={t("Прибыль", "Прибыль")} />
                <LegendItem color="#f59e0b" label={t("Расходы", "Расходы")} />
              </>
            }
          >
            {chartsReady && <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={dynamicChartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} tickFormatter={(val) => `${val / 1000000}M`} />
                <Tooltip cursor={{ fill: 'var(--bg-hover)' }} contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-primary)' }} />
                <Brush dataKey="name" height={20} stroke="var(--border-subtle)" fill="var(--bg-base)" travellerWidth={10} />
                <Bar dataKey="rev" name={t("Выручка", "Выручка")} fill="#5e6ad2" radius={[4, 4, 0, 0]} maxBarSize={20} />
                <Bar dataKey="exp" name={t("Расходы", "Расходы")} fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={20} />
                <Line type="monotone" dataKey="profit" name={t("Прибыль", "Прибыль")} stroke="#10b981" strokeWidth={2} dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} />
              </ComposedChart>
            </ResponsiveContainer>}
          </Section>

          {/* SECTION 2: Движение денег (Cash Flow) */}
          <Section title={t("Денежный поток, сум", "Денежный поток, сум")}
            kpis={
              <>
                <StatsCard label={t("Поступления", "Поступления")} value={formatCurrency(computedKPIs.totalIncome)} />
                <StatsCard label={t("Выплаты", "Выплаты")} value={formatCurrency(computedKPIs.totalExpense)} />
                <StatsCard label={t("Чистый денежный поток", "Чистый денежный поток")} value={formatCurrency(computedKPIs.netCashFlow)} last />
              </>
            }
            tabs={
              <>
                <TabButton active={cfType === 'total'} onClick={() => setCfType('total')}>{t("Общая сумма", "Общая сумма")}</TabButton>
                <TabButton active={cfType === 'operational'} onClick={() => setCfType('operational')}>{t("Операционный", "Операционный")}</TabButton>
                <TabButton active={cfType === 'investment'} onClick={() => setCfType('investment')}>{t("Инвестиционный", "Инвестиционный")}</TabButton>
                <TabButton active={cfType === 'financial'} onClick={() => setCfType('financial')}>{t("Финансовая", "Финансовая")}</TabButton>
              </>
            }
            legend={
              <>
                <LegendItem color="#fbbf24" label={t("Выплаты", "Выплаты")} />
                <LegendItem color="#3b82f6" label={t("Поступления", "Поступления")} />
                <LegendItem color="#ef4444" label={t("Сальдо", "Сальдо")} />
              </>
            }
          >
            {chartsReady && <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={dynamicChartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} tickFormatter={(val) => `${val / 1000000}M`} />
                <Tooltip cursor={{ fill: 'var(--bg-hover)' }} contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-primary)' }} />
                <Brush dataKey="name" height={20} stroke="var(--border-subtle)" fill="var(--bg-base)" travellerWidth={10} />
                <Bar dataKey="in" name={t("Поступления", "Поступления")} fill="#5e6ad2" radius={[4, 4, 0, 0]} maxBarSize={20} />
                <Bar dataKey="out" name={t("Выплаты", "Выплаты")} fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={20} />
                <Line type="monotone" dataKey="cf" name={t("Сальдо", "Сальдо")} stroke="#ef4444" strokeWidth={2} dot={{ r: 4, fill: '#ef4444', strokeWidth: 0 }} />
              </ComposedChart>
            </ResponsiveContainer>}
          </Section>

          {/* SECTION 3: Остатки на счетах (Balance Dynamics) */}
          <Section title={t("Остатки на счетах", "Остатки на счетах")}
            kpis={
              <>
                <StatsCard label={t("Текущий остаток", "Текущий остаток")} value={formatCurrency(computedKPIs.totalBalance)} />
                <StatsCard label={t("Ликвидность", "Ликвидность")} value={computedKPIs.liquidity} last />
              </>
            }
          >
            {chartsReady && <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={realMonthlyData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} tickFormatter={(val) => `${val / 1000000}M`} />
                <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-primary)' }} />
                <Brush dataKey="name" height={20} y={0} stroke="var(--border-subtle)" fill="var(--bg-base)" travellerWidth={10} />
                <Area type="stepAfter" dataKey="bal" name={t("Остаток", "Остаток")} stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorBal)" />
              </AreaChart>
            </ResponsiveContainer>}
          </Section>

          {/* SECTION 4: Структура выручки и расходов (Split Grids) */}
          <div className="finance-dashboard-split">
            {/* Revenue */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 20 }}>
              <h2 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 24, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8 }}>{t("Выручка", "Выручка")}</h2>
              <div className="finance-pie-container">
                <div style={{ width: '50%', height: 200 }}>
                  {chartsReady && <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={dynamicStructureDataRev} innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value" stroke="none">
                        {dynamicStructureDataRev.map((_, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS_REV[index % PIE_COLORS_REV.length]} />)}
                      </Pie>
                      <Tooltip wrapperStyle={{ outline: 'none' }} contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13 }} />
                    </PieChart>
                  </ResponsiveContainer>}
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {dynamicStructureDataRev.map((item, idx) => (
                    <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: PIE_COLORS_REV[idx % PIE_COLORS_REV.length] }} />
                      <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)' }}>{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Expenses */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 20 }}>
              <h2 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 24, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8 }}>{t("Расходы", "Расходы")}</h2>
              <div className="finance-pie-container">
                <div style={{ width: '50%', height: 200 }}>
                  {chartsReady && <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={dynamicStructureDataExp} innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value" stroke="none">
                        {dynamicStructureDataExp.map((_, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS_EXP[index % PIE_COLORS_EXP.length]} />)}
                      </Pie>
                      <Tooltip wrapperStyle={{ outline: 'none' }} contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13 }} />
                    </PieChart>
                  </ResponsiveContainer>}
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {dynamicStructureDataExp.map((item, idx) => (
                    <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: PIE_COLORS_EXP[idx % PIE_COLORS_EXP.length] }} />
                      <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)' }}>{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 5: Парето (Самые прибыльные направления) */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 8, overflow: 'hidden', position: 'relative', marginBottom: 24 }}>
            <div style={{ padding: '12px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                
                {t("Самые прибыльные направления", "Самые прибыльные направления")} <ChevronDown size={14} style={{ opacity: 0.3 }} />
              </h2>
            </div>
            <div style={{ padding: 20 }}>
              <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--border-subtle)' }}>
                    <th style={{ textAlign: 'left', paddingBottom: 16, fontWeight: 500 }}>{t("Направление", "Направление")}</th>
                    <th style={{ textAlign: 'right', paddingBottom: 16, fontWeight: 500 }}>{t("Сумма", "Сумма")}</th>
                  </tr>
                </thead>
                <tbody>
                  {realParetoData.map((d, i) => (
                    <DirectionRow
                      key={i}
                      index={i + 1}
                      name={d.name}
                      amount={`${new Intl.NumberFormat('ru-RU').format(d.value)} ${APP_CURRENCY_SYMBOL}`}
                      last={i === realParetoData.length - 1}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainDashboard;
