import React from 'react';
import { useStore } from '../../../store';
import { Search, Plus, Bell, List, LayoutGrid, BarChart2, Sun, Moon, Command, Settings } from 'lucide-react';

const Header: React.FC = () => {
  const {
    projects, activeProjectId, activePage, setActivePage,
    searchQuery, setSearchQuery, openNewTask,
    theme, toggleTheme,
    notifications, toggleCommandPalette, openProjectModal
  } = useStore();

  const project = projects.find(p => p.id === activeProjectId);
  const unread = notifications.filter(n => !n.read).length;

  const views = [
    { id: 'list', label: 'Список', Icon: List },
    { id: 'kanban', label: 'Канбан', Icon: LayoutGrid },
    { id: 'gantt', label: 'Гант', Icon: BarChart2 },
  ];



  return (
    <header className="header">
      {/* Название проекта / раздела */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        {project && activePage === 'project' && <span style={{ fontSize: 15, lineHeight: 1 }}>{project.icon}</span>}
        <h1 className="header-title" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {activePage === 'dashboard' ? 'Дашборд'
            : activePage === 'calendar' ? 'Календарь'
            : activePage === 'analytics' ? 'Аналитика'
            : activePage === 'inbox' ? 'Входящие'
            : activePage === 'my_tasks' ? 'Мои задачи'
            : project?.name ?? 'Проект'}
        </h1>
        {project && activePage === 'project' && (
          <button 
            className="btn btn-ghost btn-icon" 
            style={{ width: 24, height: 24, color: 'var(--text-muted)' }}
            onClick={() => openProjectModal('edit')}
            title="Настройки проекта"
          >
            <Settings size={14} />
          </button>
        )}
      </div>

      {/* Переключатель вида (только для проектных вью) */}
      {/* Переключатель вида удален, так как он перенесен в ViewsTabBar */}

      <div className="header-spacer" />

      {/* Command Palette Trigger */}
      <div 
        className="header-search cmd-trigger" 
        onClick={toggleCommandPalette}
        style={{ minWidth: 160, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 8 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Search className="header-search-icon" style={{ position: 'static' }} />
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Поиск...</span>
        </div>
        <kbd style={{ fontSize: 10, color: 'var(--text-muted)', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 3, padding: '1px 4px' }}>⌘K</kbd>
      </div>

      {/* Тема */}
      <button className="theme-toggle" onClick={toggleTheme} id="btn-theme" data-tooltip={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}>
        {theme === 'dark' ? <Sun size={12} /> : <Moon size={12} />}
      </button>

      {/* Уведомления */}
      <button
        className="theme-toggle"
        onClick={() => setActivePage('inbox')}
        id="btn-notifications"
        data-tooltip="Входящие"
        style={{ position: 'relative' }}
      >
        <Bell size={12} />
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: 4, right: 4,
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--color-primary)',
            border: '1.5px solid var(--bg-surface)',
          }} />
        )}
      </button>

      {/* Новая задача */}
      <button className="header-btn header-btn-primary" onClick={openNewTask} id="btn-new-task">
        <Plus size={11} />
        Новая задача
      </button>

    </header>
  );
};

export default Header;
