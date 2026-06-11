import React, { useState, useMemo } from 'react';
import { useFinanceStore } from '../financeStore';
import type { Project } from '../financeStore';
import { LayoutGrid, Plus, Filter, Trash2, TrendingUp, TrendingDown, Briefcase, AlertTriangle } from 'lucide-react';
import { ProjectFormModal, ALL_GROUPS } from '../components/ProjectFormModal';
import { ProjectsTable } from '../components/ProjectsTable';
import type { EnrichedProject } from '../components/ProjectsTable';
import { isAfter, parseISO } from 'date-fns';
import { APP_CURRENCY_SYMBOL } from '../config/currency';
import { useTranslation } from 'react-i18next';

const fmt = (n: number) => new Intl.NumberFormat('ru-RU').format(Math.round(n));
type Status = 'Плановый' | 'В работе' | 'Завершен';
const ALL_STATUSES: Status[] = ['Плановый', 'В работе', 'Завершен'];
const STATUS_COLORS: Record<Status, string> = { 'Плановый': '#38bdf8', 'В работе': '#f59e0b', 'Завершен': '#94a3b8' };
const TODAY = new Date();

const ProjectsPage: React.FC = () => {
  const { t } = useTranslation();
    const { projects, transactions, addProject, updateProject, deleteProject } = useFinanceStore();


  const [groupF, setGroupF]     = useState('');
  const [statusF, setStatusF]   = useState<Set<Status>>(new Set(ALL_STATUSES));
  const [modal, setModal]       = useState<{ open: boolean; project?: Project }>({ open: false });
  const [deleteId, setDeleteId] = useState<string | null>(null);
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

  const toggleStatus = (s: Status) => setStatusF(prev => {
    const n = new Set(prev);
    if (n.has(s)) n.delete(s); else n.add(s);
    return n;
  });

  const enriched = useMemo<EnrichedProject[]>(() => projects.map(p => {
    let income = 0, expense = 0;
    transactions.filter(t => t.projectId === p.id && t.isPaidConfirmed && t.type !== 'transfer').forEach(t => {
      if (t.type === 'income') income += (t.baseAmount ?? t.amount);
      if (t.type === 'expense') expense += (t.baseAmount ?? t.amount);
    });
    const profit = income - expense;
    const margin = income > 0 ? (profit / income) * 100 : 0;
    const isOverdue = !!p.dateEnd && isAfter(TODAY, parseISO(p.dateEnd));
    return { ...p, income, expense, profit, margin, isOverdue };
  }), [projects, transactions]);

  const filtered = useMemo(() => enriched
    .filter(p => statusF.has((p.status || 'Плановый') as Status))
    .filter(p => !groupF || p.group === groupF),
  [enriched, statusF, groupF]);

  const totals = useMemo(() => {
    const income  = filtered.reduce((s, p) => s + p.income, 0);
    const expense = filtered.reduce((s, p) => s + p.expense, 0);
    const profit  = income - expense;
    const budget  = filtered.reduce((s, p) => s + (p.budget ?? 0), 0);
    const margin  = income > 0 ? (profit / income) * 100 : 0;
    const overdue = filtered.filter(p => p.isOverdue && p.status !== 'Завершен').length;
    return { income, expense, profit, budget, margin, overdue };
  }, [filtered]);

  const handleSave = (data: Omit<Project, 'id'>) => {
    if (modal.project) updateProject(modal.project.id, data);
    else addProject(data);
    setModal({ open: false });
  };


  const StatCard = ({ label, value, sub, color, icon }: { label: string; value: string; sub?: string; color: string; icon: React.ReactNode }) => (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '13px 16px', flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</span>
        <span style={{ color, opacity: 0.8 }}>{icon}</span>
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', background: 'var(--bg-base)' }}>

      {/* ─── LEFT SIDEBAR ─── */}
      {isSidebarOpen && (
      <div style={{ width: 240, flexShrink: 0, borderRight: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <div style={{ height: 44, padding: '0 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <Filter size={13} color="var(--text-muted)" />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{t("Параметры", "Параметры")}</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
        </div>

        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Status filter */}
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>{t("Статус проекта", "Статус проекта")}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {ALL_STATUSES.map(s => {
                const active = statusF.has(s);
                return (
                  <label key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
                    <input type="checkbox" checked={active} onChange={() => toggleStatus(s)}
                      style={{ accentColor: 'var(--color-primary)', width: 13, height: 13, margin: 0 }} />
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS[s], flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: active ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: active ? 500 : 400 }}>{s}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Group filter */}
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>{t("Группа", "Группа")}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {['', ...ALL_GROUPS].map(g => (
                <button key={g || '_all'} onClick={() => setGroupF(g)} style={{
                  background: groupF === g ? 'rgba(99,102,241,0.1)' : 'none',
                  border: groupF === g ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
                  borderRadius: 6, padding: '5px 8px', textAlign: 'left',
                  fontSize: 12, color: groupF === g ? 'var(--color-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer', fontWeight: groupF === g ? 600 : 400,
                }}>
                  {g || 'Все группы'}
                </button>
              ))}
            </div>
          </div>

          {/* Alert overdue */}
          {totals.overdue > 0 && (
            <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, padding: '10px 12px', display: 'flex', gap: 8 }}>
              <AlertTriangle size={14} color="#f59e0b" style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 11, color: '#f59e0b', fontWeight: 500 }}>
                {totals.overdue} {totals.overdue === 1 ? 'проекта просрочено' : 'проекта просрочено'}
              </div>
            </div>
          )}
        </div>
      </div>
      )}

      {/* ─── MAIN CONTENT ─── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Header */}
        <div style={{ height: 44, padding: '0 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <button onClick={() => setSidebarOpen(!isSidebarOpen)} style={{ background: isSidebarOpen ? 'var(--bg-card)' : 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <Filter size={13} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <span style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: -0.01 }}>{t("Проектов", "Проектов")}</span>
              <span title={t("Рентабельность и бюджеты по направлениям", "Рентабельность и бюджеты по направлениям")} style={{ cursor: 'pointer', display: 'flex', color: 'var(--text-muted)' }}>
                <LayoutGrid size={13} />
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => setModal({ open: true })} style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', padding: '0 14px', height: 28, borderRadius: 6, fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', boxShadow: '0 2px 8px rgba(99,102,241,0.25)' }}>
              <Plus size={13} />  {t("Создать проект", "Создать проект")}
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div style={{ flex: 1, overflowY: 'auto', paddingTop: 24, paddingLeft: 24, paddingRight: 24 }}>

          {/* Stat cards */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
            <StatCard label={t("Проектов", "Проектов")} value={String(filtered.length)} color="var(--text-primary)" icon={<Briefcase size={13} />} sub={`из ${projects.length} всего`} />
            <StatCard label={t("Бюджет", "Бюджет")} value={`${fmt(totals.budget)} ${APP_CURRENCY_SYMBOL}`} color="var(--text-secondary)" icon={<Briefcase size={13} />} sub={t("плановый", "плановый")} />
            <StatCard label={t("Выручка (Revenue)", "Выручка (Revenue)")} value={`${fmt(totals.income)} ${APP_CURRENCY_SYMBOL}`} color="#10b981" icon={<TrendingUp size={13} />} sub={t("фактические", "фактические")} />
            <StatCard label={t("Расходы", "Расходы")} value={`${fmt(totals.expense)} ${APP_CURRENCY_SYMBOL}`} color="#ef4444" icon={<TrendingDown size={13} />} sub={t("фактические", "фактические")} />
            <StatCard label={t("Прибыль", "Прибыль")} value={`${fmt(totals.profit)} ${APP_CURRENCY_SYMBOL}`} color={totals.profit >= 0 ? '#10b981' : '#ef4444'} icon={<TrendingUp size={13} />} sub={`рент-ть ${totals.margin.toFixed(1)}%`} />
          </div>

        {/* Table area */}
        <div style={{ flex: 1 }}>
          {filtered.length === 0 ? (
            <div style={{ padding: 80, textAlign: 'center', color: 'var(--text-muted)' }}>
              <LayoutGrid size={36} style={{ margin: '0 auto 14px', display: 'block', opacity: 0.2 }} />
              <div style={{ fontSize: 14, marginBottom: 6 }}>{t("Проекты не найдены", "Проекты не найдены")}</div>
              <div style={{ fontSize: 12, marginBottom: 20 }}>
                
                {t("Создайте первый проект", "Создайте первый проект")}
              </div>
              <button onClick={() => setModal({ open: true })} style={{ padding: '0 18px', height: 34, background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                
                {t("+ Создать проект", "+ Создать проект")}
              </button>
            </div>
          ) : (
            <ProjectsTable
              data={filtered}
              onEdit={p => setModal({ open: true, project: p })}
              onDelete={id => setDeleteId(id)}
            />
          )}
        </div>
        </div>

        {/* Footer totals */}
        {filtered.length > 0 && (
          <div style={{ flexShrink: 0, borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', padding: '10px 28px', display: 'flex', gap: 24, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t("Итого по фильтру:", "Итого по фильтру:")} <b style={{ color: 'var(--text-primary)' }}>{filtered.length}</b>  {t("проектов", "проектов")}</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t("Доходы:", "Доходы:")} <b style={{ color: '#10b981' }}>{fmt(totals.income)}  {t("сум", "сум")}</b></span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t("Расходы:", "Расходы:")} <b style={{ color: '#ef4444' }}>{fmt(totals.expense)}  {t("сум", "сум")}</b></span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t("Прибыль:", "Прибыль:")} <b style={{ color: totals.profit >= 0 ? '#10b981' : '#ef4444' }}>{fmt(totals.profit)}  {t("сум", "сум")}</b></span>
            <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>{t("Рентабельность:", "Рентабельность:")} <b style={{ color: 'var(--color-primary)' }}>{totals.margin.toFixed(1)}%</b></span>
          </div>
        )}
      </div>

      {/* Modals */}
      {modal.open && (
        <ProjectFormModal
          project={modal.project}
          onSave={handleSave}
          onClose={() => setModal({ open: false })}
        />
      )}

      {deleteId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12, width: 360, padding: 24 }}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
              <div style={{ background: 'rgba(239,68,68,0.1)', borderRadius: 8, padding: 8, flexShrink: 0, height: 36, width: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Trash2 size={16} color="#ef4444" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 5 }}>{t("Удалить проект?", "Удалить проект?")}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  «{projects.find(p => p.id === deleteId)?.name}{t("» будет удалён. Транзакции сохранятся.", "» будет удалён. Транзакции сохранятся.")}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setDeleteId(null)} style={{ flex: 1, height: 34, background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer' }}>{t("Отозвать", "Отозвать")}</button>
              <button onClick={() => { deleteProject(deleteId); setDeleteId(null); }} style={{ flex: 1, height: 34, background: '#ef4444', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>{t("Удалить", "Удалить")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
