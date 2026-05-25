import React from 'react';
import { useStore } from '../../../store';
import { Eye, EyeOff } from 'lucide-react';
import { SectionHeader, ALL_APPS } from './shared';

const AppsSection: React.FC = () => {
  const users = useStore(state => state.users);

  return (
    <div style={{ maxWidth: 700 }}>
      <SectionHeader title="Приложения и доступы" subtitle="Управление доступами пользователей к приложениям" />
      {ALL_APPS.map(app => {
        const withAccess = users.filter(u => !u.allowedApps || u.allowedApps.includes(app.id));
        return (
          <div key={app.id} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '20px', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: app.color }} />
              <div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{app.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{app.description}</div>
              </div>
              <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-secondary)' }}>
                {withAccess.length} из {users.length} пользователей
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {users.map(u => {
                const hasAccess = !u.allowedApps || u.allowedApps.includes(app.id);
                return (
                  <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20, fontSize: 12, background: hasAccess ? u.color + '20' : 'var(--bg-elevated)', border: `1px solid ${hasAccess ? u.color + '60' : 'var(--border-subtle)'}`, color: hasAccess ? u.color : 'var(--text-muted)' }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: u.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: '#fff' }}>{u.avatar}</div>
                    {u.name.split(' ')[0]}
                    {hasAccess ? <Eye size={10} /> : <EyeOff size={10} />}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AppsSection;
