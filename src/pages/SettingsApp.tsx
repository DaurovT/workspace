import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import type { User, UserRole, ProjectMemberRole, Project } from '../store';
import {
  Settings, Users, Shield, Grid, Bell, Lock,
  X, Plus, Pencil, Trash2, Check, ChevronLeft,
  Building2, Globe, Clock, Mail, Smartphone,
  ToggleLeft, ToggleRight, AlertTriangle, Search,
  Eye, EyeOff
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
type SettingsSection = 'general' | 'employees' | 'apps' | 'security' | 'notifications';

const ALL_APPS = [
  { id: 'arcana', name: 'Arcana', description: 'Трекер задач, Канбан, Диаграмма Ганта', color: 'linear-gradient(135deg, #6366f1, #8b5cf6)' },
  { id: 'kidsplate', name: 'Kids Plate', description: 'Магазин детского питания', color: 'linear-gradient(135deg, #f59e0b, #d97706)' },
  { id: 'lms', name: 'LMS Academy', description: 'Образовательная платформа', color: 'linear-gradient(135deg, #ef4444, #b91c1c)' },
];

const ROLE_LABELS: Record<UserRole, string> = {
  owner: 'Владелец',
  admin: 'Администратор',
  member: 'Участник',
  viewer: 'Наблюдатель',
};

const ROLE_COLORS: Record<UserRole, string> = {
  owner: '#6366f1',
  admin: '#22c55e',
  member: '#f59e0b',
  viewer: '#64748b',
};

const AVATAR_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#38bdf8', '#a855f7', '#ec4899', '#14b8a6', '#f97316', '#84cc16'];

// ─── Main Component ───────────────────────────────────────────────────────────
const SettingsApp: React.FC = () => {
  const { setActiveApp } = useStore();
  const [activeSection, setActiveSection] = useState<SettingsSection>('general');

  const navItems = [
    { id: 'general' as SettingsSection, label: 'Общие', icon: Building2 },
    { id: 'employees' as SettingsSection, label: 'Сотрудники', icon: Users },
    { id: 'apps' as SettingsSection, label: 'Приложения', icon: Grid },
    { id: 'security' as SettingsSection, label: 'Безопасность', icon: Shield },
    { id: 'notifications' as SettingsSection, label: 'Уведомления', icon: Bell },
  ];

  return (
    <div style={{
      height: '100vh', width: '100vw',
      background: 'var(--bg-base)',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'inherit', color: 'var(--text-primary)'
    }}>
      {/* Top bar */}
      <div style={{
        height: 52, flexShrink: 0,
        display: 'flex', alignItems: 'center',
        padding: '0 20px', gap: 12,
        borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--bg-surface)',
      }}>
        <button
          onClick={() => setActiveApp('desktop')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'none', border: 'none',
            color: 'var(--text-secondary)', cursor: 'pointer',
            fontSize: 13, padding: '4px 8px',
            borderRadius: 6, transition: 'all 0.15s'
          }}
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
        <div style={{
          width: 220, flexShrink: 0,
          borderRight: '1px solid var(--border-subtle)',
          background: 'var(--bg-surface)',
          padding: '16px 8px',
          overflowY: 'auto'
        }}>
          {navItems.map(({ id, label, icon: Icon }) => (
            <div
              key={id}
              onClick={() => setActiveSection(id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 12px', borderRadius: 8,
                cursor: 'pointer', fontSize: 13, fontWeight: 500,
                color: activeSection === id ? 'var(--text-primary)' : 'var(--text-secondary)',
                background: activeSection === id ? 'var(--bg-elevated)' : 'transparent',
                marginBottom: 2, transition: 'all 0.15s',
                position: 'relative'
              }}
              onMouseEnter={e => {
                if (activeSection !== id) {
                  e.currentTarget.style.background = 'var(--bg-elevated)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={e => {
                if (activeSection !== id) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              {activeSection === id && (
                <div style={{
                  position: 'absolute', left: 0, top: '20%', bottom: '20%',
                  width: 3, borderRadius: 2, background: 'var(--color-primary)'
                }} />
              )}
              <Icon size={15} />
              {label}
            </div>
          ))}
        </div>

        {/* Content area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px' }}>
          {activeSection === 'general' && <GeneralSection />}
          {activeSection === 'employees' && <EmployeesSection />}
          {activeSection === 'apps' && <AppsSection />}
          {activeSection === 'security' && <SecuritySection />}
          {activeSection === 'notifications' && <NotificationsSection />}
        </div>
      </div>
    </div>
  );
};

// ─── Section: General ─────────────────────────────────────────────────────────
const GeneralSection: React.FC = () => {
  const [company, setCompany] = useState('WorkSpace Pro');
  const [timezone, setTimezone] = useState('Europe/Moscow');
  const [language, setLanguage] = useState('ru');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ maxWidth: 660 }}>
      <SectionHeader title="Общие настройки" subtitle="Основная информация о вашей организации" />

      <SettingsCard title="Организация" icon={Building2}>
        <SettingRow label="Название компании" description="Отображается в заголовке системы">
          <input className="form-control" style={{ maxWidth: 320 }} value={company} onChange={e => setCompany(e.target.value)} />
        </SettingRow>
        <Divider />
        <SettingRow label="Домен" description="Корпоративный домен для приглашений">
          <input className="form-control" style={{ maxWidth: 320 }} defaultValue="workspace.local" />
        </SettingRow>
      </SettingsCard>

      <SettingsCard title="Региональные настройки" icon={Globe}>
        <SettingRow label="Часовой пояс" description="Используется для дат и дедлайнов">
          <select className="form-control" style={{ maxWidth: 240 }} value={timezone} onChange={e => setTimezone(e.target.value)}>
            <option value="Europe/Moscow">Москва (UTC+3)</option>
            <option value="Europe/London">Лондон (UTC+0)</option>
            <option value="America/New_York">Нью-Йорк (UTC-5)</option>
            <option value="Asia/Almaty">Алматы (UTC+5)</option>
          </select>
        </SettingRow>
        <Divider />
        <SettingRow label="Язык интерфейса" description="Язык для всех пользователей">
          <select className="form-control" style={{ maxWidth: 240 }} value={language} onChange={e => setLanguage(e.target.value)}>
            <option value="ru">Русский</option>
            <option value="en">English</option>
            <option value="kk">Қазақша</option>
          </select>
        </SettingRow>
        <Divider />
        <SettingRow label="Рабочая неделя" description="Начало рабочей недели">
          <select className="form-control" style={{ maxWidth: 240 }}>
            <option>Понедельник</option>
            <option>Воскресенье</option>
          </select>
        </SettingRow>
      </SettingsCard>

      <button className="btn btn-primary" onClick={handleSave} style={{ marginTop: 8 }}>
        {saved ? <><Check size={14} /> Сохранено</> : 'Сохранить изменения'}
      </button>
    </div>
  );
};

// ─── Section: Employees ───────────────────────────────────────────────────────
const EmployeesSection: React.FC = () => {
  const { users, projects, deleteUser, updateUser, createUser } = useStore();
  const [search, setSearch] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = useMemo(() =>
    users.filter(u =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    ), [users, search]);

  return (
    <div style={{ maxWidth: 900 }}>
      <SectionHeader title="Управление сотрудниками" subtitle="Создание, редактирование и управление доступами сотрудников" />

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="form-control"
            style={{ paddingLeft: 32 }}
            placeholder="Поиск по имени или email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)} style={{ flexShrink: 0, gap: 6, display: 'flex', alignItems: 'center' }}>
          <Plus size={15} />
          Добавить сотрудника
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Всего', value: users.length, color: 'var(--color-primary)' },
          { label: 'Активных', value: users.filter(u => u.isActive).length, color: '#22c55e' },
          { label: 'Неактивных', value: users.filter(u => !u.isActive).length, color: '#ef4444' },
          { label: 'Администраторов', value: users.filter(u => u.role === 'admin' || u.role === 'owner').length, color: '#f59e0b' },
        ].map(stat => (
          <div key={stat.label} style={{
            flex: 1, padding: '12px 16px', borderRadius: 10,
            background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)'
          }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: 'var(--bg-surface)', borderRadius: 12, border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
        {/* Table header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1.5fr 80px',
          padding: '10px 16px',
          borderBottom: '1px solid var(--border-subtle)',
          fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
          textTransform: 'uppercase', letterSpacing: '0.05em'
        }}>
          <span>Сотрудник</span>
          <span>Email / Должность</span>
          <span>Роль</span>
          <span>Статус</span>
          <span>Действия</span>
        </div>

        {filtered.map((user, idx) => (
          <div
            key={user.id}
            style={{
              display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1.5fr 80px',
              padding: '12px 16px', alignItems: 'center',
              borderBottom: idx < filtered.length - 1 ? '1px solid var(--border-subtle)' : 'none',
              transition: 'background 0.1s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: user.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0
              }}>
                {user.avatar}
              </div>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{user.name}</span>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{user.email}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{user.jobTitle || '—'}</div>
            </div>
            <div>
              <span style={{
                display: 'inline-flex', alignItems: 'center',
                fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                background: ROLE_COLORS[user.role] + '20',
                color: ROLE_COLORS[user.role]
              }}>
                {ROLE_LABELS[user.role]}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 7, height: 7, borderRadius: '50%',
                background: user.isActive ? '#22c55e' : '#64748b'
              }} />
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                {user.isActive ? 'Активен' : 'Деактивирован'}
              </span>
              <button
                onClick={() => updateUser(user.id, { isActive: !user.isActive })}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, display: 'flex' }}
                title={user.isActive ? 'Деактивировать' : 'Активировать'}
              >
                {user.isActive ? <ToggleRight size={18} color="#22c55e" /> : <ToggleLeft size={18} />}
              </button>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                onClick={() => setEditingUser(user)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, borderRadius: 6, display: 'flex', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                title="Редактировать"
              >
                <Pencil size={14} />
              </button>
              {user.role !== 'owner' && (
                <button
                  onClick={() => setConfirmDelete(user.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, borderRadius: 6, display: 'flex', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#ef4444'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                  title="Удалить"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: 13 }}>
            Сотрудники не найдены
          </div>
        )}
      </div>

      {/* Modals */}
      {(editingUser || showCreate) && (
        <EmployeeModal
          user={editingUser ?? undefined}
          projects={projects}
          onClose={() => { setEditingUser(null); setShowCreate(false); }}
          onSave={(data) => {
            if (editingUser) {
              updateUser(editingUser.id, data);
            } else {
              createUser(data);
            }
            setEditingUser(null);
            setShowCreate(false);
          }}
        />
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="modal-overlay" style={{ zIndex: 1000 }} onClick={() => setConfirmDelete(null)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-body" style={{ textAlign: 'center', padding: '32px 24px' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <AlertTriangle size={22} color="#ef4444" />
              </div>
              <h3 style={{ margin: '0 0 8px', fontSize: 16 }}>Удалить сотрудника?</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '0 0 24px' }}>
                Сотрудник будет удалён из системы и всех проектов. Это действие нельзя отменить.
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>Отмена</button>
                <button
                  className="btn"
                  style={{ background: '#ef4444', color: '#fff', border: 'none' }}
                  onClick={() => { deleteUser(confirmDelete); setConfirmDelete(null); }}
                >
                  Удалить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Employee Modal (create / edit) ───────────────────────────────────────────
const EmployeeModal: React.FC<{
  user?: User;
  projects: Project[];
  onClose: () => void;
  onSave: (data: Partial<User>) => void;
}> = ({ user, projects, onClose, onSave }) => {
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [jobTitle, setJobTitle] = useState(user?.jobTitle || '');
  const [role, setRole] = useState<UserRole>(user?.role || 'member');
  const [color, setColor] = useState(user?.color || '#6366f1');
  const [allowedApps, setAllowedApps] = useState<string[]>(user?.allowedApps ?? ['arcana', 'kidsplate', 'lms']);
  const [projectRoles, setProjectRoles] = useState<Record<string, ProjectMemberRole | 'none'>>(() => {
    const map: Record<string, ProjectMemberRole | 'none'> = {};
    projects.forEach(p => {
      const m = p.members.find(m => m.userId === user?.id);
      map[p.id] = m ? m.role : 'none';
    });
    return map;
  });

  const avatarInitials = name.trim().split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('') || '?';

  const handleSave = () => {
    if (!name.trim() || !email.trim()) return;
    onSave({ name: name.trim(), email: email.trim(), jobTitle: jobTitle.trim(), role, color, avatar: avatarInitials, allowedApps });
  };

  const toggleApp = (appId: string) => {
    setAllowedApps(prev => prev.includes(appId) ? prev.filter(a => a !== appId) : [...prev, appId]);
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <h2 className="modal-title">{user ? 'Редактировать сотрудника' : 'Добавить сотрудника'}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Avatar preview */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
              {avatarInitials}
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Цвет аватара</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {AVATAR_COLORS.map(c => (
                  <div key={c} onClick={() => setColor(c)} style={{
                    width: 20, height: 20, borderRadius: '50%', background: c, cursor: 'pointer',
                    border: color === c ? '2px solid var(--text-primary)' : '2px solid transparent',
                    transition: 'all 0.15s'
                  }} />
                ))}
              </div>
            </div>
          </div>

          {/* Basic info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Имя и фамилия *</label>
              <input className="form-control" value={name} onChange={e => setName(e.target.value)} placeholder="Иван Иванов" />
            </div>
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input className="form-control" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="ivan@workspace.local" />
            </div>
            <div className="form-group">
              <label className="form-label">Должность</label>
              <input className="form-control" value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="Frontend Developer" />
            </div>
            <div className="form-group">
              <label className="form-label">Роль в системе</label>
              <select className="form-control" value={role} onChange={e => setRole(e.target.value as UserRole)}>
                <option value="admin">Администратор</option>
                <option value="member">Участник</option>
                <option value="viewer">Наблюдатель</option>
              </select>
            </div>
          </div>

          {/* App access */}
          <div>
            <label className="form-label" style={{ marginBottom: 10, display: 'block' }}>Доступ к приложениям</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ALL_APPS.map(app => (
                <div
                  key={app.id}
                  onClick={() => toggleApp(app.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
                    border: `1px solid ${allowedApps.includes(app.id) ? 'var(--color-primary)' : 'var(--border-subtle)'}`,
                    background: allowedApps.includes(app.id) ? 'rgba(99,102,241,0.06)' : 'var(--bg-elevated)',
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: app.color, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{app.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{app.description}</div>
                  </div>
                  <div style={{
                    width: 18, height: 18, borderRadius: 4,
                    border: `2px solid ${allowedApps.includes(app.id) ? 'var(--color-primary)' : 'var(--border-default)'}`,
                    background: allowedApps.includes(app.id) ? 'var(--color-primary)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {allowedApps.includes(app.id) && <Check size={11} color="#fff" />}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Project access */}
          {projects.length > 0 && (
            <div>
              <label className="form-label" style={{ marginBottom: 10, display: 'block' }}>Доступ к проектам</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {projects.map(project => (
                  <div key={project.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '8px 14px', borderRadius: 8,
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-elevated)'
                  }}>
                    <span style={{ fontSize: 14 }}>{project.icon}</span>
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{project.name}</span>
                    <select
                      className="form-control"
                      style={{ width: 150, height: 30, fontSize: 12 }}
                      value={projectRoles[project.id] ?? 'none'}
                      onChange={e => setProjectRoles(prev => ({ ...prev, [project.id]: e.target.value as ProjectMemberRole | 'none' }))}
                    >
                      <option value="none">Нет доступа</option>
                      <option value="admin">Администратор</option>
                      <option value="member">Участник</option>
                      <option value="viewer">Наблюдатель</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button className="btn btn-secondary" onClick={onClose}>Отмена</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={!name.trim() || !email.trim()}>
              <Check size={14} /> {user ? 'Сохранить' : 'Создать сотрудника'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Section: Apps ────────────────────────────────────────────────────────────
const AppsSection: React.FC = () => {
  const { users } = useStore();

  return (
    <div style={{ maxWidth: 700 }}>
      <SectionHeader title="Приложения и доступы" subtitle="Управление доступами пользователей к приложениям" />
      {ALL_APPS.map(app => {
        const withAccess = users.filter(u => !u.allowedApps || u.allowedApps.includes(app.id));
        return (
          <div key={app.id} style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
            borderRadius: 12, padding: '20px', marginBottom: 16
          }}>
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
                  <div key={u.id} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '4px 10px', borderRadius: 20, fontSize: 12,
                    background: hasAccess ? u.color + '20' : 'var(--bg-elevated)',
                    border: `1px solid ${hasAccess ? u.color + '60' : 'var(--border-subtle)'}`,
                    color: hasAccess ? u.color : 'var(--text-muted)'
                  }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: u.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: '#fff' }}>
                      {u.avatar}
                    </div>
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

// ─── Section: Security ────────────────────────────────────────────────────────
const SecuritySection: React.FC = () => {
  const [sessionTimeout, setSessionTimeout] = useState('480');
  const [twoFactor, setTwoFactor] = useState(false);
  const [ipWhitelist, setIpWhitelist] = useState(false);
  const [passwordMinLength, setPasswordMinLength] = useState('8');

  return (
    <div style={{ maxWidth: 660 }}>
      <SectionHeader title="Безопасность" subtitle="Настройки авторизации, сессий и защиты системы" />

      <SettingsCard title="Сессии" icon={Clock}>
        <SettingRow label="Время жизни сессии" description="Время бездействия до автоматического выхода (минуты)">
          <select className="form-control" style={{ maxWidth: 200 }} value={sessionTimeout} onChange={e => setSessionTimeout(e.target.value)}>
            <option value="60">1 час</option>
            <option value="480">8 часов</option>
            <option value="1440">24 часа</option>
            <option value="10080">7 дней</option>
          </select>
        </SettingRow>
        <Divider />
        <SettingRow label="Принудительный выход" description="Завершать сессию при закрытии браузера">
          <ToggleSwitch value={false} onChange={() => {}} />
        </SettingRow>
      </SettingsCard>

      <SettingsCard title="Пароли" icon={Lock}>
        <SettingRow label="Минимальная длина пароля" description="Количество символов">
          <select className="form-control" style={{ maxWidth: 120 }} value={passwordMinLength} onChange={e => setPasswordMinLength(e.target.value)}>
            <option value="6">6</option>
            <option value="8">8</option>
            <option value="12">12</option>
            <option value="16">16</option>
          </select>
        </SettingRow>
        <Divider />
        <SettingRow label="Обязательные цифры" description="Требовать наличие цифр в пароле">
          <ToggleSwitch value={true} onChange={() => {}} />
        </SettingRow>
        <Divider />
        <SettingRow label="Обязательные спецсимволы" description="Требовать !@#$% и т.п.">
          <ToggleSwitch value={false} onChange={() => {}} />
        </SettingRow>
      </SettingsCard>

      <SettingsCard title="Дополнительная защита" icon={Shield}>
        <SettingRow label="Двухфакторная аутентификация" description="Требовать 2FA для всех сотрудников">
          <ToggleSwitch value={twoFactor} onChange={setTwoFactor} />
        </SettingRow>
        <Divider />
        <SettingRow label="Белый список IP" description="Разрешить вход только с определённых IP-адресов">
          <ToggleSwitch value={ipWhitelist} onChange={setIpWhitelist} />
        </SettingRow>
        {ipWhitelist && (
          <div style={{ marginTop: 12 }}>
            <textarea
              className="form-control"
              style={{ minHeight: 80, fontSize: 12, fontFamily: 'monospace', resize: 'vertical' }}
              placeholder="192.168.1.0/24&#10;10.0.0.1"
            />
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Каждый IP/CIDR с новой строки</p>
          </div>
        )}
      </SettingsCard>
    </div>
  );
};

// ─── Section: Notifications ───────────────────────────────────────────────────
const NotificationsSection: React.FC = () => {
  const [emailAssign, setEmailAssign] = useState(true);
  const [emailMention, setEmailMention] = useState(true);
  const [emailDue, setEmailDue] = useState(true);
  const [pushAll, setPushAll] = useState(true);
  const [digestFreq, setDigestFreq] = useState('daily');

  return (
    <div style={{ maxWidth: 660 }}>
      <SectionHeader title="Уведомления" subtitle="Настройте, как и когда пользователи получают уведомления" />

      <SettingsCard title="Email-уведомления" icon={Mail}>
        <SettingRow label="Назначение задачи" description="Отправлять email, когда задача назначена на пользователя">
          <ToggleSwitch value={emailAssign} onChange={setEmailAssign} />
        </SettingRow>
        <Divider />
        <SettingRow label="Упоминания" description="Оповещать при @упоминании в комментариях">
          <ToggleSwitch value={emailMention} onChange={setEmailMention} />
        </SettingRow>
        <Divider />
        <SettingRow label="Дедлайны" description="Предупреждать за 24 часа до дедлайна">
          <ToggleSwitch value={emailDue} onChange={setEmailDue} />
        </SettingRow>
        <Divider />
        <SettingRow label="Дайджест" description="Периодический отчёт по задачам">
          <select className="form-control" style={{ maxWidth: 200 }} value={digestFreq} onChange={e => setDigestFreq(e.target.value)}>
            <option value="none">Выключен</option>
            <option value="daily">Ежедневно</option>
            <option value="weekly">Еженедельно</option>
          </select>
        </SettingRow>
      </SettingsCard>

      <SettingsCard title="Push-уведомления" icon={Smartphone}>
        <SettingRow label="Все события" description="Показывать push-уведомления в браузере">
          <ToggleSwitch value={pushAll} onChange={setPushAll} />
        </SettingRow>
        <Divider />
        <SettingRow label="Звук уведомлений" description="Воспроизводить звук при новых уведомлениях">
          <ToggleSwitch value={false} onChange={() => {}} />
        </SettingRow>
      </SettingsCard>
    </div>
  );
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const SectionHeader: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
  <div style={{ marginBottom: 28 }}>
    <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>{title}</h1>
    <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '6px 0 0' }}>{subtitle}</p>
  </div>
);

const SettingsCard: React.FC<{ title: string; icon: React.ElementType; children: React.ReactNode }> = ({ title, icon: Icon, children }) => (
  <div style={{
    background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
    borderRadius: 12, padding: '20px', marginBottom: 18
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
      <Icon size={15} color="var(--color-primary)" />
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</span>
    </div>
    {children}
  </div>
);

const SettingRow: React.FC<{ label: string; description: string; children: React.ReactNode }> = ({ label, description, children }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
    <div>
      <div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{description}</div>
    </div>
    {children}
  </div>
);

const Divider = () => (
  <div style={{ height: 1, background: 'var(--border-subtle)', margin: '14px 0' }} />
);

const ToggleSwitch: React.FC<{ value: boolean; onChange: (v: boolean) => void }> = ({ value, onChange }) => (
  <button
    onClick={() => onChange(!value)}
    style={{
      width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
      background: value ? 'var(--color-primary)' : 'var(--bg-elevated)',
      position: 'relative', transition: 'background 0.2s', flexShrink: 0,
      boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)'
    }}
  >
    <div style={{
      position: 'absolute', top: 3, left: value ? 21 : 3,
      width: 16, height: 16, borderRadius: '50%',
      background: '#fff',
      transition: 'left 0.2s',
      boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
    }} />
  </button>
);

export default SettingsApp;
