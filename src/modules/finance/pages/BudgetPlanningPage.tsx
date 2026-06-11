import React, { useState } from 'react';
import { useFinanceStore } from '../financeStore';
import { ChevronLeft, ChevronRight, Calendar, ChevronDown, HelpCircle, MoreHorizontal, Copy,
  Download, FileText, Printer, EyeOff, Eye, Filter } from 'lucide-react';
import { PaymentCalendarTable } from '../components/PaymentCalendarTable';
import { useTranslation } from 'react-i18next';

const MONTH_SHORT = ['Янв','Фев','март','апрель','Май','Июн','Июл','август','Сен','Окт','Ноя','Дек'];
const MONTH_FULL  = ['январь','февраль','март','апрель','май','июнь','июль','август','сентябрь','октябрь','ноябрь','декабрь'];

// ─── TopBarSelect ─────────────────────────────────────────────────────────────
const TopBarSelect: React.FC<{ label: string; value: string; options: string[]; onChange: (v: string) => void }> =
({ label, value, options, onChange }) => {
  const { t } = useTranslation(); void t;
    const [open, setOpen] = useState(false);
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', position: 'absolute', top: -7, left: 8,
        background: 'var(--bg-surface)', padding: '0 3px', pointerEvents: 'none', zIndex: 1, whiteSpace: 'nowrap' }}>
        {label}
      </div>
      <button onClick={() => setOpen(o => !o)} style={{ height: 32, padding: '0 10px', gap: 8,
        display: 'flex', alignItems: 'center', background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)', borderRadius: 6, cursor: 'pointer',
        color: 'var(--text-primary)', fontSize: 13, whiteSpace: 'nowrap' }}>
        {value}<ChevronDown size={12} color="var(--text-muted)" />
      </button>
      {open && <>
        <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setOpen(false)} />
        <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, minWidth: '100%',
          background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
          borderRadius: 8, boxShadow: 'var(--shadow-md)', zIndex: 100, overflow: 'hidden' }}>
          {options.map(o => (
            <div key={o} onClick={() => { onChange(o); setOpen(false); }}
              style={{ padding: '8px 14px', fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap',
                color: o === value ? 'var(--color-primary)' : 'var(--text-primary)',
                background: o === value ? 'var(--bg-hover)' : 'transparent' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = o === value ? 'var(--bg-hover)' : 'transparent'}>
              {o}
            </div>
          ))}
        </div>
      </>}
    </div>
  );
};

// ─── PeriodPicker – selects year AND month ────────────────────────────────────
const PeriodPicker: React.FC<{
  year: number; month: number; viewMode: string;
  onYear: (y: number) => void; onMonth: (m: number) => void;
}> = ({ year, month, viewMode, onYear, onMonth }) => {
  const { t } = useTranslation();
    const [open, setOpen] = useState(false);

  const label = viewMode === 'По дням'
    ? `${MONTH_SHORT[month]} ${year}`
    : `Янв — Дек ${year}`;

  return (
    <div style={{ position: 'relative', marginBottom: 16 }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t("Период", "Период")}</div>
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', padding: '7px 10px',
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'var(--bg-base)', border: '1px solid var(--border-subtle)',
        borderRadius: 6, cursor: 'pointer', color: 'var(--text-primary)', fontSize: 13 }}>
        <Calendar size={14} color="var(--text-muted)" />{label}
      </button>
      {open && <>
        <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setOpen(false)} />
        <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, width: 228,
          background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
          borderRadius: 10, boxShadow: 'var(--shadow-lg)', zIndex: 100, padding: 16 }}>
          {/* Year nav */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <button onClick={() => onYear(year - 1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: 4 }}>
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>{year}</span>
            <button onClick={() => onYear(year + 1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: 4 }}>
              <ChevronRight size={16} />
            </button>
          </div>
          {/* Month grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {MONTH_SHORT.map((m, i) => {
              const isActive = viewMode === 'По дням' && i === month;
              return (
                <div key={m} onClick={() => { onMonth(i); if (viewMode === 'По дням') setOpen(false); }}
                  style={{ padding: '7px 4px', textAlign: 'center', fontSize: 12, borderRadius: 6, cursor: 'pointer',
                    fontWeight: isActive ? 700 : 400,
                    background: isActive ? 'var(--color-primary)' : 'var(--bg-base)',
                    color: isActive ? '#fff' : 'var(--text-secondary)' }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg-base)'; }}>
                  {m}
                </div>
              );
            })}
          </div>
          {viewMode !== 'По дням' && (
            <div style={{ marginTop: 12, padding: '8px 0 0', borderTop: '1px solid var(--border-subtle)', fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
              
              {t("Выбор месяца доступен в режиме «По дням»", "Выбор месяца доступен в режиме «По дням»")}
            </div>
          )}
        </div>
      </>}
    </div>
  );
};

// ─── FilterSelect ─────────────────────────────────────────────────────────────
const FilterSelect: React.FC<{ placeholder: string; options?: string[]; value?: string; onChange?: (v: string) => void }> =
({ placeholder, options = [], value = '', onChange }) => {
  const { t } = useTranslation();
    const [open, setOpen] = useState(false);
  return (
    <div style={{ marginBottom: 10, position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', padding: '7px 10px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--bg-base)', border: '1px solid var(--border-subtle)',
        borderRadius: 6, cursor: 'pointer', color: value ? 'var(--text-primary)' : 'var(--text-muted)', fontSize: 13 }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value || placeholder}</span>
        <ChevronDown size={12} color="var(--text-muted)" style={{ flexShrink: 0 }} />
      </button>
      {open && <>
        <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setOpen(false)} />
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
          background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
          borderRadius: 8, boxShadow: 'var(--shadow-md)', zIndex: 100, overflow: 'hidden', maxHeight: 220, overflowY: 'auto' }}>
          <div onClick={() => { onChange?.(''); setOpen(false); }}
            style={{ padding: '8px 12px', fontSize: 13, cursor: 'pointer', color: 'var(--text-muted)' }}>
            
            {t("Все", "Все")}
          </div>
          {options.map(o => (
            <div key={o} onClick={() => { onChange?.(o); setOpen(false); }}
              style={{ padding: '8px 12px', fontSize: 13, cursor: 'pointer',
                color: o === value ? 'var(--color-primary)' : 'var(--text-primary)',
                background: o === value ? 'var(--bg-hover)' : 'transparent' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = o === value ? 'var(--bg-hover)' : 'transparent'}>
              {o}
            </div>
          ))}
        </div>
      </>}
    </div>
  );
};

// ─── MoreMenu ─────────────────────────────────────────────────────────────────
const MoreMenu: React.FC<{
  hideZeroRows: boolean;
  onToggleZeroRows: () => void;
  onExportCsv: () => void;
  onExportExcel: () => void;
  onPrint: () => void;
}> = ({ hideZeroRows, onToggleZeroRows, onExportCsv, onExportExcel, onPrint }) => {
  const { t } = useTranslation();
    const [open, setOpen] = useState(false);

  const item = (icon: React.ReactNode, label: string, onClick: () => void, active = false) => (
    <div onClick={() => { onClick(); setOpen(false); }}
      style={{ padding: '9px 14px', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
        color: active ? 'var(--color-primary)' : 'var(--text-primary)',
        background: 'transparent', borderRadius: 0 }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      {icon}
      {label}
    </div>
  );

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: open ? 'var(--bg-hover)' : 'var(--bg-base)',
          border: '1px solid var(--border-subtle)', borderRadius: 6, cursor: 'pointer',
          color: 'var(--text-muted)' }}>
        <MoreHorizontal size={14} />
      </button>
      {open && <>
        <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setOpen(false)} />
        <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 6, width: 220,
          background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
          borderRadius: 10, boxShadow: 'var(--shadow-lg)', zIndex: 100, overflow: 'hidden', paddingBlock: 4 }}>

          <div style={{ padding: '4px 14px 6px', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t("Экспорт", "Экспорт")}</div>
          {item(<Download size={14} />, 'Скачать CSV', onExportCsv)}
          {item(<FileText size={14} />, 'Скачать Excel (.xls)', onExportExcel)}
          {item(<Printer size={14} />, 'Печать', onPrint)}

          <div style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 0' }} />
          <div style={{ padding: '4px 14px 6px', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t("Вид", "Вид")}</div>
          {item(
            hideZeroRows ? <Eye size={14} /> : <EyeOff size={14} />,
            hideZeroRows ? 'Показать нулевые строки' : 'Скрыть нулевые строки',
            onToggleZeroRows,
            hideZeroRows
          )}
        </div>
      </>}
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────
const BudgetPlanningPage: React.FC = () => {
  const { t } = useTranslation();
    const { budgetScenarios, cloneBudgetScenario, accounts, projects,
    categories, transactions, budgetLines, deals } = useFinanceStore();
  const today = new Date();

  const [viewMode, setViewMode]         = useState('По месяцам');
  const [source, setSource]             = useState('Доходы и расходы');
  const [accounting, setAccounting]     = useState('Кассовый метод');
  const [sidebarOpen, setSidebarOpen]   = useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'f' && !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        setSidebarOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  const [todayTrigger, setTodayTrigger] = useState(0);
  const [periodYear, setPeriodYear]     = useState(today.getFullYear());
  const [periodMonth, setPeriodMonth]   = useState(today.getMonth());
  const [scenarioId, setScenarioId]     = useState(budgetScenarios[0]?.id ?? '');
  const [filterAccount, setFilterAccount] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [filterDeal, setFilterDeal]       = useState('');
  const [hideZeroRows, setHideZeroRows]   = useState(false);

  const scenario = budgetScenarios.find(s => s.id === scenarioId);

  // Resolve filter names → IDs
  const filterAccountId = accounts.find(a => a.name === filterAccount)?.id ?? '';
  const filterProjectId = projects.find(p => p.name === filterProject)?.id ?? '';
  const filterDealId    = deals.find(d => d.name === filterDeal)?.id ?? '';

  const handleClone = () => {
    if (!scenario) return;
    const name = prompt('Название форка:', `${scenario.name} (Копия)`);
    if (name) cloneBudgetScenario(scenario.id, name);
  };

  const handleToday = () => {
    setPeriodYear(today.getFullYear());
    setPeriodMonth(today.getMonth());
    setTodayTrigger(t => t + 1);
  };

  const periodLabel = viewMode === 'По дням'
    ? `${MONTH_FULL[periodMonth]} ${periodYear}`
    : `${periodYear} год`;

  // ── Export helpers ────────────────────────────────────────────────────────────
  const buildCsvData = () => {
    const MONTH_LABELS = ['янв','Фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];
    const incCats = categories.filter(c => c.type === 'income' && !c.parentId);
    const expCats = categories.filter(c => c.type === 'expense' && !c.parentId);
    const months = Array.from({ length: 12 }, (_, m) => m);

    const getFactMonth = (catId: string, type: string, month: number) =>
      transactions.filter(t => {
        const d = new Date(t.date);
        return t.categoryId === catId && t.type === type && d.getFullYear() === periodYear && d.getMonth() === month;
      }).reduce((s, t) => s + (t.baseAmount ?? t.amount), 0);

    const getPlanMonth = (catId: string, month: number) =>
      budgetLines.filter(l => l.scenarioId === scenarioId && l.categoryId === catId && l.month === month)
        .reduce((s, l) => s + l.amount, 0);

    const rows: string[][] = [];
    const header = ['Статья', ...months.flatMap(m => [`${MONTH_LABELS[m]} факт`, `${MONTH_LABELS[m]} план`])];
    rows.push(header);

    [...incCats, ...expCats].forEach(cat => {
      const row = [cat.name, ...months.flatMap(m => [
        String(getFactMonth(cat.id, cat.type, m)),
        String(getPlanMonth(cat.id, m))
      ])];
      rows.push(row);
    });

    return rows.map(r => r.map(v => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n');
  };

  const downloadFile = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = () => {
    downloadFile(buildCsvData(), `payment-calendar-${periodYear}.csv`, 'text/csv;charset=utf-8;');
  };

  const handleExportExcel = () => {
    // Tab-separated for xls compatibility
    const csv = buildCsvData().replace(/,/g, '\t').replace(/"/g, '');
    downloadFile(`\uFEFF${csv}`, `payment-calendar-${periodYear}.xls`, 'application/vnd.ms-excel;charset=utf-8;');
  };

  const handlePrint = () => window.print();

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', background: 'var(--bg-base)' }}>

      {/* ── SIDEBAR ── */}
      {sidebarOpen && (
        <div style={{ width: 244, flexShrink: 0, background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>

          <div style={{ height: 44, padding: '0 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <Filter size={13} color="var(--text-muted)" />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{t("Фильтры и параметры", "Фильтры и параметры")}</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
          </div>

          <div style={{ padding: '0 14px 20px' }}>

            <PeriodPicker year={periodYear} month={periodMonth} viewMode={viewMode}
              onYear={setPeriodYear} onMonth={setPeriodMonth} />

            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase',
              letterSpacing: '0.06em', marginBottom: 8, marginTop: 4 }}>{t("Параметры", "Параметры")}</div>

            <FilterSelect placeholder={t("Юрлица и счета", "Юрлица и счета")} options={accounts.map(a => a.name)}
              value={filterAccount} onChange={setFilterAccount} />
            <FilterSelect placeholder={t("Проектов", "Проектов")} options={projects.map(p => p.name)}
              value={filterProject} onChange={setFilterProject} />
            <FilterSelect placeholder={t("Сделки", "Сделки")} options={deals.map(d => d.name)}
              value={filterDeal} onChange={setFilterDeal} />

            <div style={{ height: 1, background: 'var(--border-subtle)', margin: '14px 0' }} />

            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase',
              letterSpacing: '0.06em', marginBottom: 8 }}>{t("Сценарий планирования", "Сценарий планирования")}</div>

            <select value={scenarioId} onChange={e => setScenarioId(e.target.value)}
              style={{ width: '100%', height: 32, padding: '0 8px', marginBottom: 8,
                background: 'var(--bg-base)', border: '1px solid var(--border-subtle)',
                borderRadius: 6, color: 'var(--text-primary)', fontSize: 13, outline: 'none', cursor: 'pointer' }}>
              {budgetScenarios.map(s => (
                <option key={s.id} value={s.id}>{s.isApproved ? '🔒 ' : ''}{s.name}</option>
              ))}
            </select>

            <button onClick={handleClone}
              style={{ width: '100%', height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                background: 'var(--bg-base)', border: '1px solid var(--border-subtle)',
                borderRadius: 6, color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-base)'}>
              <Copy size={13} />  {t("Создать форк сценария", "Создать форк сценария")}
            </button>
          </div>
        </div>
      )}

      {/* ── MAIN ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* ── HEADER ── */}
        <div className="finance-page-header" style={{ height: 44, padding: '0 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: sidebarOpen ? 'var(--bg-card)' : 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <Filter size={13} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <span style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: -0.01 }}>{t("Платежный календарь", "Платежный календарь")}</span>
              <HelpCircle size={13} color="var(--text-muted)" style={{ cursor: 'pointer', flexShrink: 0 }} />
            </div>

            {/* ── Period navigator – always visible ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 0,
              border: '1px solid var(--border-subtle)', borderRadius: 6, overflow: 'hidden', flexShrink: 0 }}>
              <button
                onClick={() => viewMode === 'По дням'
                  ? (periodMonth === 0 ? (setPeriodYear(y => y - 1), setPeriodMonth(11)) : setPeriodMonth(m => m - 1))
                  : setPeriodYear(y => y - 1)}
                style={{ width: 26, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'var(--bg-base)', border: 'none', borderRight: '1px solid var(--border-subtle)',
                  cursor: 'pointer', color: 'var(--text-muted)' }}>
                <ChevronLeft size={13} />
              </button>
              <span style={{ padding: '0 12px', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)',
                background: 'var(--bg-base)', height: 28, display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', minWidth: 100, justifyContent: 'center' }}>
                {periodLabel}
              </span>
              <button
                onClick={() => viewMode === 'По дням'
                  ? (periodMonth === 11 ? (setPeriodYear(y => y + 1), setPeriodMonth(0)) : setPeriodMonth(m => m + 1))
                  : setPeriodYear(y => y + 1)}
                style={{ width: 26, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'var(--bg-base)', border: 'none', borderLeft: '1px solid var(--border-subtle)',
                  cursor: 'pointer', color: 'var(--text-muted)' }}>
                <ChevronRight size={13} />
              </button>
            </div>

            <button onClick={handleToday}
              style={{ height: 28, padding: '0 10px', fontSize: 12, fontWeight: 500,
                background: 'var(--bg-base)', border: '1px solid var(--border-subtle)',
                borderRadius: 6, cursor: 'pointer', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
              
              {t("На сегодня", "На сегодня")}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <TopBarSelect label={t("Отображение", "Отображение")} value={viewMode}
              options={['По месяцам','По дням','По кварталам']} onChange={setViewMode} />
            <TopBarSelect label={t("Источник", "Источник")} value={source}
              options={['Доходы и расходы','Баланс денег (ДДС)']} onChange={setSource} />
            <TopBarSelect label={t("Начисление", "Начисление")} value={accounting}
              options={['Кассовый метод','Метод начисления']} onChange={setAccounting} />
            <MoreMenu
              hideZeroRows={hideZeroRows}
              onToggleZeroRows={() => setHideZeroRows(h => !h)}
              onExportCsv={handleExportCsv}
              onExportExcel={handleExportExcel}
              onPrint={handlePrint}
            />
          </div>
        </div>

        {/* ── TABLE ── */}
        <div className="finance-page-content" style={{ flex: 1, padding: '14px 20px', display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
          <PaymentCalendarTable
            viewMode={viewMode}
            periodYear={periodYear}
            periodMonth={periodMonth}
            todayTrigger={todayTrigger}
            scenarioId={scenarioId}
            hideZeroRows={hideZeroRows}
            filterAccountId={filterAccountId}
            filterProjectId={filterProjectId}
            filterDealId={filterDealId}
            accountingMethod={accounting}
            source={source}
          />
        </div>
      </div>
    </div>
  );
};

export default BudgetPlanningPage;
