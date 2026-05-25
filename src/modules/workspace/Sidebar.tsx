import React from 'react';
import { useStore } from '../../store';
import {
  LayoutGrid, List, BarChart2, ChevronLeft,
  Plus, Home, Calendar, TrendingUp, Inbox,
  Search, Users, Aperture
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const projects = useStore(state => state.projects);
      const activeProjectId = useStore(state => state.activeProjectId);
      const setActiveProject = useStore(state => state.setActiveProject);
      const activePage = useStore(state => state.activePage);
      const setActivePage = useStore(state => state.setActivePage);
      const projectTab = useStore(state => state.projectTab);
      const setProjectTab = useStore(state => state.setProjectTab);
      const tasks = useStore(state => state.tasks);
      const notifications = useStore(state => state.notifications);
      const users = useStore(state => state.users);
      const currentUserId = useStore(state => state.currentUserId);
      const toggleCommandPalette = useStore(state => state.toggleCommandPalette);
      const openProjectModal = useStore(state => state.openProjectModal);
      const isSidebarMobileOpen = useStore(state => state.isSidebarMobileOpen);
      const setSidebarMobileOpen = useStore(state => state.setSidebarMobileOpen);
      const setActiveApp = useStore(state => state.setActiveApp);

    const myActiveTasks = tasks.filter(t => t.assigneeId === currentUserId && t.status !== 'done');
  const unreadNotifs  = notifications.filter(n => !n.read).length;

  return (
    <>
      {/* Mobile overlay */}
      {isSidebarMobileOpen && (
        <div 
          className="sidebar-mobile-overlay" 
          onClick={() => setSidebarMobileOpen(false)} 
        />
      )}
      <aside className={`sidebar ${isSidebarMobileOpen ? 'sidebar-mobile-open' : ''}`}>
      {/* Лого */}
      <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="sidebar-logo-icon">
            <Aperture size={16} color="white" strokeWidth={2.2} />
          </div>
          <span className="sidebar-logo-text">Arcana</span>
        </div>
        <button 
          onClick={() => setActiveApp('desktop')} 
          style={{ 
            padding: 5, borderRadius: 6, 
            background: 'var(--bg-elevated)', 
            color: 'var(--text-secondary)', 
            display: 'flex', border: '1px solid var(--border-subtle)', 
            cursor: 'pointer', transition: 'all 0.15s',
            alignItems: 'center', justifyContent: 'center'
          }}
          onMouseEnter={e => { (e.currentTarget).style.borderColor = 'var(--border-default)'; (e.currentTarget).style.color = 'var(--text-primary)'; }}
          onMouseLeave={e => { (e.currentTarget).style.borderColor = 'var(--border-subtle)'; (e.currentTarget).style.color = 'var(--text-secondary)'; }}
          title="Вернуться на рабочий стол"
        >
          <ChevronLeft size={14} />
        </button>
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

      <nav className="sidebar-nav" onClick={() => setSidebarMobileOpen(false)}>
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
      </nav>

      {/* Sidebar Footer with explicit back to Super App button */}
      <div style={{
        padding: '12px 10px',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        marginTop: 'auto'
      }}>
        <button
          onClick={() => setActiveApp('desktop')}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '7px 12px',
            borderRadius: 6,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-secondary)',
            fontSize: 11,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'var(--border-default)';
            e.currentTarget.style.color = 'var(--text-primary)';
            e.currentTarget.style.background = 'var(--bg-hover)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
            e.currentTarget.style.color = 'var(--text-secondary)';
            e.currentTarget.style.background = 'var(--bg-elevated)';
          }}
        >
          <Home size={12} />
          <span>Выйти в супер-апп</span>
        </button>
      </div>

    </aside>
    </>
  );
};

export default Sidebar;
