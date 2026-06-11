import { useHRStore } from '../hrStore';
import { useStore } from '../../../store';
import { ChevronLeft, LayoutDashboard, Users, CalendarOff, Wallet, Network, UserPlus, User, Clock, CalendarDays } from 'lucide-react';

const HRSidebar = () => {
  const { activeView, setActiveView, isSidebarCollapsed, toggleSidebar } = useHRStore();
  const { setActiveApp, currentUserId, users } = useStore();
  const currentUser = users.find(u => u.id === currentUserId);
  const isHRAdmin = currentUser?.role === 'admin' || currentUser?.role === 'cfo' || (currentUser?.role as string) === 'hr';

  const menuItems = isHRAdmin ? [
    { id: 'dashboard',  label: 'Дашборд',            icon: LayoutDashboard },
    { id: 'employees',  label: 'Сотрудники',          icon: Users },
    { id: 'absences',   label: 'Отсутствия',          icon: CalendarOff },
    { id: 'payroll',    label: 'Зарплата',             icon: Wallet },
    { id: 'schedules',  label: 'Графики работы',       icon: Clock },
    { id: 'calendar',   label: 'Производ. календарь', icon: CalendarDays },
    { id: 'org',        label: 'Структура',            icon: Network },
  ] : [
    { id: 'my-dashboard', label: 'Мой профиль', icon: User },
  ];

  return (
    <div className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`} style={{ height: '100%' }}>
      <div className="sidebar-logo" style={{ cursor: 'pointer', justifyContent: isSidebarCollapsed ? 'center' : 'space-between', padding: isSidebarCollapsed ? '0' : '0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => toggleSidebar()}>
          <div className="sidebar-logo-icon" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UserPlus size={16} color="#ffffff" />
          </div>
          {!isSidebarCollapsed && <div className="sidebar-logo-text" style={{ fontSize: 16, fontWeight: 700, whiteSpace: 'nowrap' }}>HR Pulse</div>}
        </div>
        {!isSidebarCollapsed && (
          <button onClick={() => setActiveApp('desktop')} style={{ padding: 6, borderRadius: 6, background: 'var(--bg-hover)', color: 'var(--text-secondary)', display: 'flex', border: 'none', cursor: 'pointer' }}>
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      <div className="sidebar-nav" style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: isSidebarCollapsed ? '0 6px' : '0 8px', marginTop: 8 }}>
        {!isSidebarCollapsed && <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '16px 12px 8px' }}>Навигация</div>}
        {menuItems.map(item => {
          const isActive = activeView === item.id;
          const Icon = item.icon;
          return (
            <div key={item.id} className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setActiveView(item.id as any)}
              style={{ display: 'flex', alignItems: 'center', padding: isSidebarCollapsed ? '10px 0' : '8px 12px', gap: 12, cursor: 'pointer',
                justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                color: isActive ? 'var(--color-primary)' : 'var(--text-secondary)',
                background: isActive ? 'var(--bg-active)' : 'transparent',
                borderRadius: 8, transition: 'all 0.15s', fontSize: 13, fontWeight: isActive ? 500 : 400,
              }}
              title={isSidebarCollapsed ? item.label : undefined}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--bg-hover)'; } }}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; } }}
            >
              <Icon size={16} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.7 }} />
              {!isSidebarCollapsed && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HRSidebar;
