/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { useFinanceStore } from '../modules/finance/financeStore';
import { Search, ArrowRight, Plus, List, LayoutGrid, BarChart2, Calendar, Home, Inbox, FolderPlus, Sun, Briefcase, FileText, PieChart, Users, DollarSign, Wallet } from 'lucide-react';
import Fuse from 'fuse.js';

const CommandPalette: React.FC = () => {
  const tasks = useStore(state => state.tasks);
      const projects = useStore(state => state.projects);
      const users = useStore(state => state.users);
      const isCommandPaletteOpen = useStore(state => state.isCommandPaletteOpen);
      const toggleCommandPalette = useStore(state => state.toggleCommandPalette);
      const openEditTask = useStore(state => state.openEditTask);
      const openNewTask = useStore(state => state.openNewTask);
      const setActivePage = useStore(state => state.setActivePage);
      const setProjectTab = useStore(state => state.setProjectTab);
      const setActiveProject = useStore(state => state.setActiveProject);
      const toggleTheme = useStore(state => state.toggleTheme);
      const openProjectModal = useStore(state => state.openProjectModal);
      const setActiveApp = useStore(state => state.setActiveApp);

  const { setActiveView, contractors, deals, accounts } = useFinanceStore();

  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggleCommandPalette();
      }
      if (e.key === 'Escape') toggleCommandPalette();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggleCommandPalette]);

  useEffect(() => {
    if (isCommandPaletteOpen) {
      setQuery('');
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [isCommandPaletteOpen]);

  const q = query.toLowerCase().trim();

  const baseActions = React.useMemo(() => [
    // Управление задачами (Workspace)
    { label: 'Новая задача', icon: Plus, action: () => { setActiveApp('workspace'); openNewTask(); toggleCommandPalette(); } },
    { label: 'Новый проект', icon: FolderPlus, action: () => { setActiveApp('workspace'); openProjectModal('create'); toggleCommandPalette(); } },
    { label: 'Переключить тему', icon: Sun, action: () => { toggleTheme(); toggleCommandPalette(); } },
    { label: 'Входящие уведомления', icon: Inbox, action: () => { setActiveApp('workspace'); setActivePage('inbox'); toggleCommandPalette(); } },
    { label: 'Дашборд проектов', icon: Home, action: () => { setActiveApp('workspace'); setActivePage('dashboard'); toggleCommandPalette(); } },
    { label: 'Список задач', icon: List, action: () => { setActiveApp('workspace'); setActivePage('project'); setProjectTab('list'); toggleCommandPalette(); } },
    { label: 'Канбан-доска', icon: LayoutGrid, action: () => { setActiveApp('workspace'); setActivePage('project'); setProjectTab('kanban'); toggleCommandPalette(); } },
    { label: 'Календарь задач', icon: Calendar, action: () => { setActiveApp('workspace'); setActivePage('calendar'); toggleCommandPalette(); } },

    // Финансы (Finance)
    { label: 'Финансы: Главный Дашборд', icon: PieChart, action: () => { setActiveApp('finance'); setActiveView('main'); toggleCommandPalette(); } },
    { label: 'Финансы: Сделки по продажам', icon: DollarSign, action: () => { setActiveApp('finance'); setActiveView('deals', 'sales'); toggleCommandPalette(); } },
    { label: 'Финансы: Сделки по закупкам', icon: Briefcase, action: () => { setActiveApp('finance'); setActiveView('deals', 'purchase'); toggleCommandPalette(); } },
    { label: 'Финансы: Выставленные счета', icon: FileText, action: () => { setActiveApp('finance'); setActiveView('deals', 'invoices'); toggleCommandPalette(); } },
    { label: 'Отчет: Движение денег (ДДС)', icon: BarChart2, action: () => { setActiveApp('finance'); setActiveView('reports', 'cashflow'); toggleCommandPalette(); } },
    { label: 'Отчет: Прибыли и Убытки (ОПУ)', icon: BarChart2, action: () => { setActiveApp('finance'); setActiveView('reports', 'pnl'); toggleCommandPalette(); } },
    { label: 'Отчет: Управленческий Баланс', icon: BarChart2, action: () => { setActiveApp('finance'); setActiveView('reports', 'balance'); toggleCommandPalette(); } },
    { label: 'Справочник: Контрагенты', icon: Users, action: () => { setActiveApp('finance'); setActiveView('references', 'contractors'); toggleCommandPalette(); } },
    { label: 'Справочник: Счета и кассы', icon: Wallet, action: () => { setActiveApp('finance'); setActiveView('references', 'accounts'); toggleCommandPalette(); } },
    { label: 'Справочник: Юрлица', icon: Briefcase, action: () => { setActiveApp('finance'); setActiveView('references', 'entities'); toggleCommandPalette(); } },
    { label: 'Учет активов', icon: Briefcase, action: () => { setActiveApp('finance'); setActiveView('assets'); toggleCommandPalette(); } },
    { label: 'Кабинет CFO (Аутсорсер)', icon: PieChart, action: () => { setActiveApp('finance'); setActiveView('cfo'); toggleCommandPalette(); } },
    { label: 'Документооборот', icon: FileText, action: () => { setActiveApp('finance'); setActiveView('documents'); toggleCommandPalette(); } },
  ], [openNewTask, openProjectModal, setActivePage, setProjectTab, toggleCommandPalette, toggleTheme, setActiveApp, setActiveView]);

  const fuseOptions = { threshold: 0.5, ignoreLocation: true, findAllMatches: true };
  const taskFuse = React.useMemo(() => new Fuse(tasks, { ...fuseOptions, keys: ['title', 'tags'] }), [tasks]);
  const projectFuse = React.useMemo(() => new Fuse(projects, { ...fuseOptions, keys: ['name'] }), [projects]);
  const actionFuse = React.useMemo(() => new Fuse(baseActions, { ...fuseOptions, keys: ['label'] }), [baseActions]);
  const contractorFuse = React.useMemo(() => new Fuse(contractors, { ...fuseOptions, keys: ['name', 'inn'] }), [contractors]);
  const dealFuse = React.useMemo(() => new Fuse(deals, { ...fuseOptions, keys: ['name'] }), [deals]);
  const accountFuse = React.useMemo(() => new Fuse(accounts, { ...fuseOptions, keys: ['name', 'bankName'] }), [accounts]);
  const userFuse = React.useMemo(() => new Fuse(users, { ...fuseOptions, keys: ['name', 'email', 'jobTitle'] }), [users]);

  let taskResults = tasks.slice(0, 5);
  let projectResults = projects.slice(0, 3);
  let actions = baseActions;
  let matchedContractors: typeof contractors = [];
  let matchedDeals: typeof deals = [];
  let matchedAccounts: typeof accounts = [];
  let matchedUsers: typeof users = [];

  if (q) {
    taskResults = taskFuse.search(q).map(res => res.item).slice(0, 3);
    projectResults = projectFuse.search(q).map(res => res.item).slice(0, 3);
    actions = actionFuse.search(q).map(res => res.item);
    matchedContractors = contractorFuse.search(q).map(res => res.item).slice(0, 3);
    matchedDeals = dealFuse.search(q).map(res => res.item).slice(0, 3);
    matchedAccounts = accountFuse.search(q).map(res => res.item).slice(0, 2);
    matchedUsers = userFuse.search(q).map(res => res.item).slice(0, 2);
  }

  const allItems: Array<{ type: 'action' | 'project' | 'task' | 'contractor' | 'deal' | 'account' | 'user', label: string, icon?: any, emoji?: string, action: () => void }> = [
    ...actions.map(a => ({ type: 'action' as const, emoji: undefined, ...a })),
    ...projectResults.map(p => ({ type: 'project' as const, label: p.name, icon: undefined, emoji: p.icon, action: () => { setActiveProject(p.id); toggleCommandPalette(); } })),
    ...taskResults.map(t => ({ type: 'task' as const, label: t.title, icon: ArrowRight, emoji: undefined, action: () => { openEditTask(t.id); toggleCommandPalette(); } })),
    ...matchedContractors.map(c => ({ type: 'contractor' as const, label: c.name, emoji: '🏢', action: () => { setActiveApp('finance'); setActiveView('references', 'contractors'); toggleCommandPalette(); } })),
    ...matchedDeals.map(d => ({ type: 'deal' as const, label: d.name, emoji: '🤝', action: () => { setActiveApp('finance'); setActiveView('deals', d.type === 'sale' ? 'sales' : 'purchase'); toggleCommandPalette(); } })),
    ...matchedAccounts.map(a => ({ type: 'account' as const, label: a.name, emoji: '💳', action: () => { setActiveApp('finance'); setActiveView('references', 'accounts'); toggleCommandPalette(); } })),
    ...matchedUsers.map(u => ({ type: 'user' as const, label: u.name, emoji: '👤', action: () => { setActiveApp('workspace'); setActivePage('team'); toggleCommandPalette(); } })),
  ];

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, allItems.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
    if (e.key === 'Enter' && allItems[selected]) allItems[selected].action();
  };

  if (!isCommandPaletteOpen) return null;

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 2000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '20vh' }}
      onClick={(e) => e.target === e.currentTarget && toggleCommandPalette()}
    >
      <div style={{
        width: '100%', maxWidth: 520,
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 10,
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden',
        animation: 'slideUp 0.12s ease',
      }}>
        {/* Поисковая строка */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)' }}>
          <Search size={14} color="var(--text-muted)" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setSelected(0); }}
            onKeyDown={handleKey}
            placeholder="Что вы ищете? (Задачи, финансы, сотрудники, действия...)"
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}
          />
          <kbd style={{ fontSize: 10, color: 'var(--text-muted)', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 4, padding: '1px 5px' }}>ESC</kbd>
        </div>

        {/* Результаты */}
        <div style={{ maxHeight: 360, overflow: 'auto', padding: '6px 6px' }}>
          {allItems.length === 0 && (
            <div style={{ padding: '24px 14px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
              Ничего не найдено по запросу «{query}»
            </div>
          )}

          {/* Действия */}
          {!q && <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', padding: '4px 10px 2px' }}>Действия</div>}
          {allItems.map((item, i) => {
            const isSelected = i === selected;
            return (
              <div
                key={i}
                onClick={item.action}
                onMouseEnter={() => setSelected(i)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '7px 10px',
                  borderRadius: 6,
                  background: isSelected ? 'var(--bg-active)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'background 0.08s',
                }}
              >
                <div style={{ width: 24, height: 24, borderRadius: 6, background: isSelected ? 'var(--color-primary-light)' : 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {item.emoji
                    ? <span style={{ fontSize: 13 }}>{item.emoji}</span>
                    : item.icon && <item.icon size={13} color={isSelected ? 'var(--color-primary)' : 'var(--text-muted)'} />
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: isSelected ? 'var(--color-primary)' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.label}
                  </div>
                  {item.type === 'task' && (
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Задача</div>
                  )}
                  {item.type === 'project' && (
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Проект</div>
                  )}
                  {item.type === 'contractor' && (
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Контрагент</div>
                  )}
                  {item.type === 'deal' && (
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Сделка</div>
                  )}
                  {item.type === 'account' && (
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Счет / Касса</div>
                  )}
                  {item.type === 'user' && (
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Сотрудник</div>
                  )}
                </div>
                {isSelected && <ArrowRight size={12} color="var(--color-primary)" />}
              </div>
            );
          })}
        </div>

        {/* Подсказки */}
        <div style={{ display: 'flex', gap: 14, padding: '6px 14px', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)' }}>
          {[['↑↓', 'выбор'], ['↵', 'открыть'], ['⌘K', 'закрыть']].map(([key, label]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <kbd style={{ fontSize: 10, color: 'var(--text-secondary)', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 4, padding: '1px 5px' }}>{key}</kbd>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
