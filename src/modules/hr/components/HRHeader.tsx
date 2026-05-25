import React from 'react';
import { useHRStore, type HRViewState } from '../hrStore';
import { useStore } from '../../../store';

const VIEW_TITLES: Record<HRViewState, string> = {
  dashboard: 'HR Дашборд',
  employees: 'Сотрудники',
  absences: 'Отсутствия',
  payroll: 'Зарплатная ведомость',
  org: 'Оргструктура',
  'my-dashboard': 'Мой кабинет',
};

const HRHeader: React.FC = () => {
  const activeView = useHRStore(s => s.activeView);
  const currentUserId = useStore(s => s.currentUserId);
  const users = useStore(s => s.users);
  const currentUser = users.find(u => u.id === currentUserId);

  return (
    <div style={{
      height: 48, padding: '0 24px', borderBottom: '1px solid var(--border-subtle)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: 'var(--bg-surface)', flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <h1 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
          {VIEW_TITLES[activeView]}
        </h1>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {currentUser && (
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: currentUser.color || 'var(--color-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: '#fff',
          }}>
            {(currentUser.avatar || currentUser.name?.slice(0, 2) || '??').toUpperCase()}
          </div>
        )}
      </div>
    </div>
  );
};

export default HRHeader;
