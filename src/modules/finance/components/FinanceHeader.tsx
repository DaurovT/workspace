import React from 'react';
import { useStore } from '../../../store';
import { useFinanceStore } from '../financeStore';
import { HelpCircle, Sun, Moon, Sparkles, Search, Share2 } from 'lucide-react';
import { GlobalNotificationDropdown } from '../../workspace/GlobalNotificationDropdown';


const FinanceHeader: React.FC = () => {
  const theme = useStore(state => state.theme);
      const toggleTheme = useStore(state => state.toggleTheme);
      const toggleCommandPalette = useStore(state => state.toggleCommandPalette);
      const isGlobalAIOpen = useStore(state => state.isGlobalAIOpen);
      const setGlobalAIOpen = useStore(state => state.setGlobalAIOpen);
      const setSidebarMobileOpen = useFinanceStore(state => state.setSidebarMobileOpen);

  const { activeView } = useFinanceStore();

  const getTitle = () => {
    switch (activeView) {
      case 'main': return 'Показатели';
      case 'transactions': return 'Операции';
      case 'deals': return 'Сделки';
      case 'plan': return 'План';
      case 'projects': return 'Проекты';
      case 'reports': return 'Отчёты';
      case 'references': return 'Справочники';
      case 'assets': return 'Активы';
      case 'liabilities': return 'Займы';
      case 'treasury': return 'Казначейство';
      case 'documents': return 'Документы';
      case 'settings': return 'Настройки';
      default: return 'Финансы';
    }
  };

  return (
    <header className="header">
      {/* Бургер для мобильных */}
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

      {/* Название раздела */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <h1 className="header-title" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {getTitle()}
        </h1>
      </div>

      <div className="header-spacer" />

      {/* Global Search (Command Palette) */}
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
      <button className="theme-toggle" onClick={toggleTheme} data-tooltip-bottom={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}>
        {theme === 'dark' ? <Sun size={12} /> : <Moon size={12} />}
      </button>

      {/* Help Toggle */}
      <button className="theme-toggle hide-on-mobile" data-tooltip-bottom="Система помощи">
        <HelpCircle size={12} />
      </button>

      {/* Share Toggle */}
      <button className="theme-toggle hide-on-mobile" data-tooltip-bottom="Поделиться">
        <Share2 size={12} />
      </button>

      {/* Уведомления */}
      <GlobalNotificationDropdown />

      {/* AI Copilot Action */}
      <button 
        className="btn btn-ghost btn-icon" 
        onClick={() => setGlobalAIOpen(!isGlobalAIOpen)} 
        style={{ width: 28, height: 28, color: isGlobalAIOpen ? 'var(--color-primary)' : 'var(--text-muted)' }}
        title="Finance AI Copilot"
      >
        <Sparkles size={14} />
      </button>

    </header>
  );
};

export default FinanceHeader;
