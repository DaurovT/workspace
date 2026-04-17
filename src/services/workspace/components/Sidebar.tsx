import React from 'react';
import { useStore } from '../../../store';
import {
  LayoutGrid, List, BarChart2, Bell, Settings,
  Plus, Home, Calendar, TrendingUp, Inbox,
  ChevronRight, Search, Users, Aperture
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const {
    projects, activeProjectId, setActiveProject,
    activePage, setActivePage, projectTab, setProjectTab,
    tasks, notifications, users, currentUserId,
    toggleCommandPalette, openProjectModal,
  } = useStore();

  const currentUser = users.find(u => u.id === currentUserId);
  const myActiveTasks = tasks.filter(t => t.assigneeId === currentUserId && t.status !== 'done');
  const unreadNotifs  = notifications.filter(n => !n.read).length;

  return (
    <aside className="sidebar">
      {/* Лого */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Aperture size={16} color="white" strokeWidth={2.2} />
        </div>
        <span className="sidebar-logo-text">Arcana</span>
      </div>

      {/* Поиск / command palette */}
      <div style={{ padding: '8px 10px 4px' }}>
        <button
          onClick={toggleCommandPalette}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 7,
            padding: '5px 9px', borderRadius: 6,
            background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
            color: 'var(--text-muted)', fontSize: 11, fontWeight: 500,
            cursor: 'pointer', transition: 'all 0.1s', height: 28,
          }}
          onMouseEnter={e => { (e.currentTarget).style.borderColor = 'var(--border-default)'; (e.currentTarget).style.color = 'var(--text-secondary)'; }}
          onMouseLeave={e => { (e.currentTarget).style.borderColor = 'var(--border-subtle)'; (e.currentTarget).style.color = 'var(--text-muted)'; }}
          id="btn-cmd-palette"
        >
          <Search size={11} />
          <span style={{ flex: 1, textAlign: 'left' }}>Поиск...</span>
          <kbd style={{ fontSize: 9, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 3, padding: '1px 4px', color: 'var(--text-muted)' }}>⌘K</kbd>
        </button>
      </div>

      <nav className="sidebar-nav">
        {/* Основная навигация */}
        <div
          className={`nav-item ${activePage === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActivePage('dashboard')}
        >
          <Home className="nav-icon" size={13} />
          <span>Дашборд</span>
        </div>
        <div
          className={`nav-item ${activePage === 'inbox' ? 'active' : ''}`}
          onClick={() => setActivePage('inbox')}
        >
          <Inbox className="nav-icon" size={13} />
          <span>Inbox</span>
          {unreadNotifs > 0 && <span className="nav-badge" style={{ background: 'var(--color-primary)', color: 'white' }}>{unreadNotifs}</span>}
        </div>
        <div
          className={`nav-item ${activePage === 'calendar' ? 'active' : ''}`}
          onClick={() => setActivePage('calendar')}
        >
          <Calendar className="nav-icon" size={13} />
          <span>Календарь</span>
        </div>
        <div
          className={`nav-item ${activePage === 'my_tasks' ? 'active' : ''}`}
          onClick={() => setActivePage('my_tasks')}
        >
          <Inbox className="nav-icon" size={13} />
          <span>Мои задачи</span>
          {myActiveTasks.length > 0 && (
            <span className="nav-badge">{myActiveTasks.length}</span>
          )}
        </div>
        <div
          className={`nav-item ${activePage === 'analytics' ? 'active' : ''}`}
          onClick={() => setActivePage('analytics')}
        >
          <TrendingUp className="nav-icon" size={13} />
          <span>Аналитика</span>
        </div>
        <div
          className={`nav-item ${activePage === 'team' ? 'active' : ''}`}
          onClick={() => setActivePage('team')}
          id="nav-team"
        >
          <Users className="nav-icon" size={13} />
          <span>Команда</span>
          <span className="nav-badge" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>{users.length}</span>
        </div>

        {/* Проекты */}
        <div className="sidebar-section-label">Проекты</div>
        {projects.map(p => (
          <div
            key={p.id}
            className={`nav-item ${activeProjectId === p.id && activePage === 'project' ? 'active' : ''}`}
            onClick={() => {
              setActiveProject(p.id);
              setActivePage('project');
            }}
          >
            <span style={{ fontSize: 12, lineHeight: 1, flexShrink: 0 }}>{p.icon}</span>
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0 }}>
              {tasks.filter(t => t.projectId === p.id && t.status !== 'done').length}
            </span>
          </div>
        ))}
        <div className="nav-item" onClick={() => openProjectModal('create')} style={{ color: 'var(--text-muted)' }}>
          <Plus className="nav-icon" size={13} />
          <span>Новый проект</span>
        </div>

        {/* Представления активного проекта */}
        {activeProjectId && activePage === 'project' && (
          <>
            <div className="sidebar-section-label">Представления</div>
            {[
              { id: 'list', label: 'Список', Icon: List },
              { id: 'kanban', label: 'Канбан', Icon: LayoutGrid },
              { id: 'gantt', label: 'Диаграмма Ганта', Icon: BarChart2 },
            ].map(({ id, label, Icon }) => (
              <div
                key={id}
                className={`nav-item ${projectTab === id ? 'active' : ''}`}
                onClick={() => setProjectTab(id as 'list' | 'kanban' | 'gantt')}
                style={{ paddingLeft: 20 }}
              >
                <Icon className="nav-icon" size={12} />
                <span>{label}</span>
              </div>
            ))}
          </>
        )}

        {/* Настройки */}
        <div className="sidebar-section-label">Система</div>
        <div className="nav-item">
          <Settings className="nav-icon" size={13} />
          <span>Настройки</span>
        </div>
      </nav>

    </aside>
  );
};

export default Sidebar;
