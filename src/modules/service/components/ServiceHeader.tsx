import React from 'react';
import { useStore } from '../../../store';
import { useServiceStore } from '../serviceStore';
import { Sun, Moon, Search } from 'lucide-react';

const ServiceHeader: React.FC = () => {
  const theme = useStore(state => state.theme);
  const toggleTheme = useStore(state => state.toggleTheme);
  const toggleCommandPalette = useStore(state => state.toggleCommandPalette);
  const setSidebarMobileOpen = useServiceStore(state => state.setSidebarMobileOpen);

  const { activeView } = useServiceStore();

  const getTitle = () => {
    switch (activeView) {
      case 'dashboard': return 'Дашборд';
      case 'tickets': return 'Заявки (Канбан)';
      case 'references': return 'Справочники';
      case 'settings': return 'Настройки';
      default: return 'Service Desk';
    }
  };

  return (
    <header className="header">
      {/* Mobile Burger */}
      <button 
        className="hide-on-desktop btn btn-ghost btn-icon" 
        onClick={() => setSidebarMobileOpen(true)}
        style={{ width: 32, height: 32, color: 'var(--text-primary)', marginRight: 8, flexShrink: 0 }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <h1 className="header-title" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {getTitle()}
        </h1>
      </div>

      <div className="header-spacer" />

      {/* Global Search */}
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

      {/* Theme Toggle */}
      <button className="theme-toggle" onClick={toggleTheme} title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: 8 }}>
        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
      </button>

    </header>
  );
};

export default ServiceHeader;
