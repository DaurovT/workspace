import React from 'react';
import { useStore } from '../../store';
import { Sparkles, Search, Sun, Moon, Plus, Settings } from 'lucide-react';
import { GlobalNotificationDropdown } from './GlobalNotificationDropdown';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';

const Header: React.FC = () => {
  const projects = useStore(state => state.projects);
      const activeProjectId = useStore(state => state.activeProjectId);
      const activePage = useStore(state => state.activePage);
      const openNewTask = useStore(state => state.openNewTask);
      const theme = useStore(state => state.theme);
      const toggleTheme = useStore(state => state.toggleTheme);
      const toggleCommandPalette = useStore(state => state.toggleCommandPalette);
      const openProjectModal = useStore(state => state.openProjectModal);
      const setGlobalAIOpen = useStore(state => state.setGlobalAIOpen);
      const isGlobalAIOpen = useStore(state => state.isGlobalAIOpen);
      const toggleSidebarMobile = useStore(state => state.toggleSidebarMobile);

  const project = projects.find(p => p.id === activeProjectId);





  return (
    <header className="header">
      {/* Бургер для мобильных */}
      <button 
        className="hide-on-desktop btn btn-ghost btn-icon" 
        onClick={toggleSidebarMobile}
        style={{ width: 32, height: 32, color: 'var(--text-primary)', marginRight: 8, flexShrink: 0 }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>

      {/* Название проекта / раздела */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        {project && activePage === 'project' && <span className="hide-on-mobile" style={{ fontSize: 15, lineHeight: 1 }}>{project.icon}</span>}
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

      <div 
        className="header-search cmd-trigger" 
        onClick={toggleCommandPalette}
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 8 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Search className="header-search-icon" style={{ position: 'static' }} />
          <span className="hide-on-mobile" style={{ fontSize: 13, color: 'var(--text-muted)' }}>Поиск...</span>
        </div>
        <kbd className="hide-on-mobile" style={{ fontSize: 10, color: 'var(--text-muted)', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 3, padding: '1px 4px', marginLeft: 8 }}>⌘K</kbd>
      </div>

      {/* Тема */}
      <button className="theme-toggle" onClick={toggleTheme} id="btn-theme" data-tooltip={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}>
        {theme === 'dark' ? <Sun size={12} /> : <Moon size={12} />}
      </button>

      {/* Language Switcher */}
      <LanguageSwitcher />

      {/* AI Copilot */}
      <button 
        className="btn btn-ghost btn-icon" 
        onClick={() => setGlobalAIOpen(!isGlobalAIOpen)}
        style={{ width: 28, height: 28, color: isGlobalAIOpen ? 'var(--color-primary)' : 'var(--text-muted)' }}
        title="AI Copilot (Cmd+J)"
      >
        <Sparkles size={14} />
      </button>

      {/* Уведомления */}
      <GlobalNotificationDropdown />

      {/* Новая задача */}
      <button className="header-btn header-btn-primary" onClick={openNewTask} id="btn-new-task">
        <Plus size={11} />
        <span className="hide-on-mobile">Новая задача</span>
      </button>

    </header>
  );
};

export default Header;
