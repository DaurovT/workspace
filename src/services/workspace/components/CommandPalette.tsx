import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../../store';
import { Search, ArrowRight, Plus, List, LayoutGrid, BarChart2, Calendar, Home, Inbox, FolderPlus, Sun } from 'lucide-react';

const CommandPalette: React.FC = () => {
  const {
    tasks, projects, isCommandPaletteOpen, toggleCommandPalette,
    openEditTask, openNewTask, setActivePage, setProjectTab, setActiveProject, activeProjectId,
    toggleTheme, toggleProjectModal
  } = useStore();

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

  if (!isCommandPaletteOpen) return null;

  const q = query.toLowerCase().trim();

  const taskResults = tasks
    .filter(t => t.title.toLowerCase().includes(q) || t.tags.some(tag => tag.toLowerCase().includes(q)))
    .slice(0, 5);

  const projectResults = projects
    .filter(p => p.name.toLowerCase().includes(q))
    .slice(0, 3);

  const actions = [
    { label: 'Новая задача', icon: Plus, action: () => { openNewTask(); toggleCommandPalette(); } },
    { label: 'Новый проект', icon: FolderPlus, action: () => { toggleProjectModal(); toggleCommandPalette(); } },
    { label: 'Переключить тему', icon: Sun, action: () => { toggleTheme(); toggleCommandPalette(); } },
    { label: 'Входящие', icon: Inbox, action: () => { setActivePage('inbox'); toggleCommandPalette(); } },
    { label: 'Дашборд', icon: Home, action: () => { setActivePage('dashboard'); toggleCommandPalette(); } },
    { label: 'Список задач', icon: List, action: () => { setActivePage('project'); setProjectTab('list'); toggleCommandPalette(); } },
    { label: 'Канбан-доска', icon: LayoutGrid, action: () => { setActivePage('project'); setProjectTab('kanban'); toggleCommandPalette(); } },
    { label: 'Диаграмма Ганта', icon: BarChart2, action: () => { setActivePage('project'); setProjectTab('gantt'); toggleCommandPalette(); } },
    { label: 'Календарь', icon: Calendar, action: () => { setActivePage('calendar'); toggleCommandPalette(); } },
  ].filter(a => !q || a.label.toLowerCase().includes(q));

  const allItems = [
    ...actions.map(a => ({ type: 'action' as const, ...a })),
    ...projectResults.map(p => ({ type: 'project' as const, label: p.name, icon: undefined, emoji: p.icon, action: () => { setActiveProject(p.id); toggleCommandPalette(); } })),
    ...taskResults.map(t => ({ type: 'task' as const, label: t.title, icon: ArrowRight, emoji: undefined, action: () => { openEditTask(t.id); toggleCommandPalette(); } })),
  ];

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, allItems.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
    if (e.key === 'Enter' && allItems[selected]) allItems[selected].action();
  };

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
            placeholder="Поиск задач, проектов, действий..."
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
