import React, { useState } from 'react';
import { useStore } from '../../../store';
import { Lock, UserCircle, LogOut } from 'lucide-react';
import { Check } from 'lucide-react';
import { SectionHeader, SettingsCard, ROLE_LABELS, AVATAR_COLORS } from './shared';

const ProfileSection: React.FC = () => {
  const currentUserId = useStore(state => state.currentUserId);
      const users = useStore(state => state.users);
      const updateUser = useStore(state => state.updateUser);
  const currentUser = users.find(u => u.id === currentUserId);

  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [jobTitle, setJobTitle] = useState(currentUser?.jobTitle || '');
  const [color, setColor] = useState(currentUser?.color || '#6366f1');
  const [password, setPassword] = useState('');
  const [saved, setSaved] = useState(false);

  if (!currentUser) return null;

  const avatarInitials = name.trim().split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('') || currentUser.avatar;

  const handleSave = () => {
    updateUser(currentUserId, {
      name: name.trim(),
      email: email.trim(),
      jobTitle: jobTitle.trim(),
      color,
      avatar: avatarInitials,
      ...(password ? { password } : {})
    });
    setPassword('');
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ maxWidth: 560 }}>
      <SectionHeader title="Мой профиль" subtitle="Личные данные и настройки аккаунта" />

      <SettingsCard title="Аватар" icon={UserCircle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: color, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, fontWeight: 700, color: '#fff', flexShrink: 0,
            boxShadow: `0 4px 20px ${color}60`
          }}>
            {avatarInitials}
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 2 }}>{currentUser.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>{currentUser.jobTitle || 'Должность не указана'}</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {AVATAR_COLORS.map(c => (
                <div key={c} onClick={() => setColor(c)} style={{
                  width: 22, height: 22, borderRadius: '50%', background: c, cursor: 'pointer',
                  border: color === c ? '2px solid var(--text-primary)' : '2px solid transparent',
                  boxShadow: color === c ? `0 0 0 2px ${c}60` : 'none', transition: 'all 0.15s'
                }} />
              ))}
            </div>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard title="Личные данные" icon={UserCircle}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="form-group">
            <label className="form-label" htmlFor="ps-name">Имя и фамилия</label>
            <input id="ps-name" className="form-control" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="ps-email">Email</label>
            <input id="ps-email" className="form-control" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="ps-job">Должность</label>
            <input id="ps-job" className="form-control" value={jobTitle} onChange={e => setJobTitle(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Роль в системе</label>
            <input className="form-control" value={ROLE_LABELS[currentUser.role]} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <button className="btn btn-primary" onClick={handleSave}>
            {saved ? <><Check size={14} /> Сохранено</> : 'Сохранить изменения'}
          </button>
        </div>
      </SettingsCard>

      <SettingsCard title="Безопасность" icon={Lock}>
        <div className="form-group">
          <label className="form-label" htmlFor="ps-pwd">Новый пароль</label>
          <input
            id="ps-pwd"
            className="form-control"
            type="password"
            placeholder="Оставьте пустым, чтобы не менять"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            Минимум 8 символов. Рекомендуем использовать сложный пароль.
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <button className="btn btn-primary" onClick={handleSave}>
            {saved ? <><Check size={14} /> Сохранено</> : 'Сохранить пароль'}
          </button>
        </div>
      </SettingsCard>

      <div style={{ padding: '20px', borderRadius: 12, border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#ef4444' }}>Выйти из системы</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Вы будете возвращены на страницу входа</div>
          </div>
          <button
            onClick={() => useStore.getState().logout()}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              color: '#ef4444', borderRadius: 8, padding: '8px 16px',
              fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
          >
            <LogOut size={14} />
            Выйти
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSection;
