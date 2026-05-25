import React, { useState } from 'react';
import { useStore } from '../../store';
import { Settings, Users, Shield, Grid, Bell, ChevronLeft, Building2, UserCircle } from 'lucide-react';
import ProfileSection from './components/ProfileSection';
import GeneralSection from './components/GeneralSection';
import EmployeesSection from './components/EmployeesSection';
import AppsSection from './components/AppsSection';
import SecuritySection from './components/SecuritySection';
import NotificationsSection from './components/NotificationsSection';

type SettingsSection = 'profile' | 'general' | 'employees' | 'apps' | 'security' | 'notifications';

const SettingsApp: React.FC = () => {
  const setActiveApp = useStore(state => state.setActiveApp);
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile');

  const navItems = [
    { id: 'profile' as SettingsSection, label: 'Мой профиль', icon: UserCircle },
    { id: 'general' as SettingsSection, label: 'Общие', icon: Building2 },
    { id: 'employees' as SettingsSection, label: 'Сотрудники', icon: Users },
    { id: 'apps' as SettingsSection, label: 'Приложения', icon: Grid },
    { id: 'security' as SettingsSection, label: 'Безопасность', icon: Shield },
    { id: 'notifications' as SettingsSection, label: 'Уведомления', icon: Bell },
  ];

  return (
    <div style={{ height: '100vh', width: '100vw', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column', fontFamily: 'inherit', color: 'var(--text-primary)' }}>
      {/* Top bar */}
      <div style={{ height: 52, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 20px', gap: 12, borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
        <button
          onClick={() => setActiveApp('desktop')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13, padding: '4px 8px', borderRadius: 6, transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        >
          <ChevronLeft size={14} />
          Назад
        </button>
        <div style={{ width: 1, height: 18, background: 'var(--border-subtle)' }} />
        <Settings size={16} color="var(--color-primary)" />
        <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}>Настройки</span>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Sidebar nav */}
        <div style={{ width: 220, flexShrink: 0, borderRight: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', padding: '16px 8px', overflowY: 'auto' }}>
          {navItems.map(({ id, label, icon: Icon }) => (
            <div
              key={id}
              onClick={() => setActiveSection(id)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500, color: activeSection === id ? 'var(--text-primary)' : 'var(--text-secondary)', background: activeSection === id ? 'var(--bg-elevated)' : 'transparent', marginBottom: 2, transition: 'all 0.15s', position: 'relative' }}
              onMouseEnter={e => { if (activeSection !== id) { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-primary)'; } }}
              onMouseLeave={e => { if (activeSection !== id) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; } }}
            >
              {activeSection === id && <div style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 3, borderRadius: 2, background: 'var(--color-primary)' }} />}
              <Icon size={15} />
              {label}
            </div>
          ))}
        </div>

        {/* Content area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px' }}>
          {activeSection === 'profile'       && <ProfileSection />}
          {activeSection === 'general'       && <GeneralSection />}
          {activeSection === 'employees'     && <EmployeesSection />}
          {activeSection === 'apps'          && <AppsSection />}
          {activeSection === 'security'      && <SecuritySection />}
          {activeSection === 'notifications' && <NotificationsSection />}
        </div>
      </div>
    </div>
  );
};

export default SettingsApp;
