import React from 'react';
import { useServiceStore } from '../serviceStore';
import { useStore } from '../../../store';
import { LayoutGrid, CheckSquare, BookOpen, Settings, ChevronLeft, Wrench } from 'lucide-react';

const ServiceSidebar: React.FC = () => {
  const { activeView, setActiveView, isSidebarCollapsed, toggleSidebar, isSidebarMobileOpen, setSidebarMobileOpen } = useServiceStore();
  const setActiveApp = useStore(state => state.setActiveApp);

  const menuItems = [
    { id: 'dashboard', label: 'Дашборд', icon: LayoutGrid },
    { id: 'tickets', label: 'Заявки', icon: CheckSquare },
    { id: 'references', label: 'Справочники', icon: BookOpen },
    { id: 'settings', label: 'Настройки', icon: Settings },
  ] as const;

  return (
    <>
      {isSidebarMobileOpen && (
        <div 
          className="sidebar-mobile-overlay" 
          onClick={() => setSidebarMobileOpen(false)} 
        />
      )}
      <div className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''} ${isSidebarMobileOpen ? 'sidebar-mobile-open' : ''}`} style={{ height: '100%' }}>
        <div className="sidebar-logo" style={{ cursor: 'pointer', justifyContent: isSidebarCollapsed ? 'center' : 'space-between', padding: isSidebarCollapsed ? '0' : '0 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => toggleSidebar()}>
            <div className="sidebar-logo-icon" style={{ background: '#0ea5e9', width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wrench size={16} color="#ffffff" />
            </div>
            {!isSidebarCollapsed && <div className="sidebar-logo-text" style={{ fontSize: 16, fontWeight: 700 }}>Service Desk</div>}
          </div>
          {!isSidebarCollapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button 
                onClick={() => setActiveApp('desktop')} 
                style={{ padding: 6, borderRadius: 6, background: 'var(--bg-hover)', color: 'var(--text-secondary)', display: 'flex', border: 'none', cursor: 'pointer' }}
                title="Вернуться на рабочий стол"
              >
                <ChevronLeft size={16} />
              </button>
            </div>
          )}
        </div>

        <div className="sidebar-nav" style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: isSidebarCollapsed ? '0 6px' : '0 8px', marginTop: 8 }}>
          {!isSidebarCollapsed && <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '16px 12px 8px' }}>Навигация</div>}

          {menuItems.map(item => {
            const isActive = activeView === item.id;
            const Icon = item.icon;
            
            return (
              <div
                key={item.id}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  setActiveView(item.id as any);
                  if (isSidebarMobileOpen) setSidebarMobileOpen(false);
                }}
                style={{
                  display: 'flex', alignItems: 'center', padding: isSidebarCollapsed ? '10px 0' : '8px 12px', gap: 12, cursor: 'pointer',
                  justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                  color: isActive ? 'var(--color-primary)' : 'var(--text-secondary)',
                  background: isActive ? 'var(--bg-active)' : 'transparent',
                  borderRadius: 8, transition: 'all 0.15s',
                  fontSize: 13, fontWeight: isActive ? 500 : 400,
                }}
                title={isSidebarCollapsed ? item.label : undefined}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--bg-hover)'; } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; } }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                  <Icon size={16} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.7 }} />
                  {!isSidebarCollapsed && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default ServiceSidebar;
