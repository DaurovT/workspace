import React, { useState } from 'react';
import { useStore } from '../../../store';
import type { User, UserRole, ProjectMemberRole, Project } from '../../../store';
import { X, Plus, Pencil, Trash2, Check, Search, Eye, AlertTriangle, ToggleLeft, ToggleRight, Smartphone, Copy } from 'lucide-react';
import { SectionHeader, ROLE_LABELS, ROLE_COLORS, AVATAR_COLORS, ALL_APPS } from './shared';

// ─── Employee Modal ───────────────────────────────────────────────────────────
const EmployeeModal: React.FC<{
  user?: User;
  projects: Project[];
  readOnly?: boolean;
  onClose: () => void;
  onSave: (data: Partial<User>, projectRoles: Record<string, ProjectMemberRole | 'none'>) => void;
}> = ({ user, projects, readOnly, onClose, onSave }) => {
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [jobTitle, setJobTitle] = useState(user?.jobTitle || '');
  const [role, setRole] = useState<UserRole>(user?.role || 'member');
  const [color, setColor] = useState(user?.color || '#6366f1');
  const [allowedApps, setAllowedApps] = useState<string[]>(user?.allowedApps ?? ['arcana', 'bpmn', 'kidsplate', 'tms']);
  const [projectRoles, setProjectRoles] = useState<Record<string, ProjectMemberRole | 'none'>>(() => {
    const map: Record<string, ProjectMemberRole | 'none'> = {};
    projects.forEach(p => {
      const m = p.members.find(m => m.userId === user?.id);
      map[p.id] = m ? m.role : 'none';
    });
    return map;
  });
  const [bindCode, setBindCode] = useState<string | null>(user?.telegramBindCode || null);
  const [isGenerating, setIsGenerating] = useState(false);
  const generateTelegramBindCode = useStore(state => state.generateTelegramBindCode);

  const handleGenerateBindCode = async () => {
    if (!user) return;
    setIsGenerating(true);
    const code = await generateTelegramBindCode(user.id);
    if (code) {
      setBindCode(code);
    }
    setIsGenerating(false);
  };

  const avatarInitials = name.trim().split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('') || '?';

  const handleSave = () => {
    if (!name.trim() || !email.trim()) return;
    onSave({ name: name.trim(), email: email.trim(), jobTitle: jobTitle.trim(), role, color, avatar: avatarInitials, allowedApps }, projectRoles);
  };

  const toggleApp = (appId: string) => {
    if (readOnly) return;
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
                  <div key={c} onClick={() => !readOnly && setColor(c)} style={{
                    width: 20, height: 20, borderRadius: '50%', background: c, cursor: readOnly ? 'default' : 'pointer',
                    border: color === c ? '2px solid var(--text-primary)' : '2px solid transparent', transition: 'all 0.15s'
                  }} />
                ))}
              </div>
            </div>
          </div>

          {/* Basic info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Имя и фамилия *</label>
              <input className="form-control" value={name} onChange={e => setName(e.target.value)} placeholder="Иван Иванов" disabled={readOnly} />
            </div>
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input className="form-control" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="ivan@workspace.local" disabled={readOnly} />
            </div>
            <div className="form-group">
              <label className="form-label">Должность</label>
              <input className="form-control" value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="Frontend Developer" disabled={readOnly} />
            </div>
            <div className="form-group">
              <label className="form-label">Роль в системе</label>
              <select className="form-control" value={role} onChange={e => setRole(e.target.value as UserRole)} disabled={readOnly}>
                <option value="owner">Владелец</option>
                <option value="admin">Администратор</option>
                <option value="member">Участник</option>
                <option value="viewer">Наблюдатель</option>
                <option value="cfo">Финансовый директор</option>
                <option value="accountant">Бухгалтер</option>
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
                  onClick={() => !readOnly && toggleApp(app.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
                    border: `1px solid ${allowedApps.includes(app.id) ? 'var(--color-primary)' : 'var(--border-subtle)'}`,
                    background: allowedApps.includes(app.id) ? 'rgba(99,102,241,0.06)' : 'var(--bg-elevated)', transition: 'all 0.15s'
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
                  <div key={project.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)' }}>
                    <span style={{ fontSize: 14 }}>{project.icon}</span>
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{project.name}</span>
                    <select
                      className="form-control"
                      style={{ width: 150, height: 30, fontSize: 12 }}
                      value={projectRoles[project.id] ?? 'none'}
                      onChange={e => setProjectRoles(prev => ({ ...prev, [project.id]: e.target.value as ProjectMemberRole | 'none' }))}
                      disabled={readOnly}
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

          {/* Telegram Bind Code */}
          {user && (
            <div>
              <label className="form-label" style={{ marginBottom: 10, display: 'block' }}>Telegram Бот</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)' }}>
                <Smartphone size={20} color="var(--color-primary)" />
                <div style={{ flex: 1 }}>
                  {bindCode ? (
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Код привязки аккаунта:</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                        <code style={{ fontSize: 16, fontWeight: 700, padding: '4px 8px', background: 'rgba(99,102,241,0.1)', color: 'var(--color-primary)', borderRadius: 4, letterSpacing: '0.1em' }}>
                          {bindCode}
                        </code>
                        <button className="btn btn-ghost btn-icon" onClick={() => navigator.clipboard.writeText(bindCode)} title="Копировать"><Copy size={14} /></button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Сотрудник не привязан к Telegram боту.</div>
                  )}
                </div>
                {!readOnly && (
                  <button className="btn btn-secondary" onClick={handleGenerateBindCode} disabled={isGenerating}>
                    {isGenerating ? 'Генерация...' : bindCode ? 'Сбросить код' : 'Создать код'}
                  </button>
                )}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button className="btn btn-secondary" onClick={onClose}>{readOnly ? 'Закрыть' : 'Отмена'}</button>
            {!readOnly && (
              <button className="btn btn-primary" onClick={handleSave} disabled={!name.trim() || !email.trim()}>
                <Check size={14} /> {user ? 'Сохранить' : 'Создать сотрудника'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Employees Section ────────────────────────────────────────────────────────
const EmployeesSection: React.FC = () => {
  const users = useStore(state => state.users);
      const projects = useStore(state => state.projects);
      const deleteUser = useStore(state => state.deleteUser);
      const updateUser = useStore(state => state.updateUser);
      const createUser = useStore(state => state.createUser);
      const addProjectMember = useStore(state => state.addProjectMember);
      const removeProjectMember = useStore(state => state.removeProjectMember);
      const updateProjectMemberRole = useStore(state => state.updateProjectMemberRole);
      const currentUserId = useStore(state => state.currentUserId);
  const currentUser = users.find(u => u.id === currentUserId);
  const isAdmin = currentUser?.role === 'owner' || currentUser?.role === 'admin';

  const [search, setSearch] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

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
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setShowCreate(true)} style={{ flexShrink: 0, gap: 6, display: 'flex', alignItems: 'center' }}>
            <Plus size={15} />
            Добавить сотрудника
          </button>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Всего', value: users.length, color: 'var(--color-primary)' },
          { label: 'Активных', value: users.filter(u => u.isActive).length, color: '#22c55e' },
          { label: 'Неактивных', value: users.filter(u => !u.isActive).length, color: '#ef4444' },
          { label: 'Администраторов', value: users.filter(u => u.role === 'admin' || u.role === 'owner').length, color: '#f59e0b' },
        ].map(stat => (
          <div key={stat.label} style={{ flex: 1, padding: '12px 16px', borderRadius: 10, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: 'var(--bg-surface)', borderRadius: 12, border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1.5fr 80px', padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          <span>Сотрудник</span><span>Email / Должность</span><span>Роль</span><span>Статус</span><span>Действия</span>
        </div>

        {filtered.map((user, idx) => (
          <div
            key={user.id}
            style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1.5fr 80px', padding: '12px 16px', alignItems: 'center', borderBottom: idx < filtered.length - 1 ? '1px solid var(--border-subtle)' : 'none', transition: 'background 0.1s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: user.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                {user.avatar}
              </div>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{user.name}</span>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{user.email}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{user.jobTitle || '—'}</div>
            </div>
            <div>
              <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: ROLE_COLORS[user.role] + '20', color: ROLE_COLORS[user.role] }}>
                {ROLE_LABELS[user.role]}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: user.isActive ? '#22c55e' : '#64748b' }} />
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{user.isActive ? 'Активен' : 'Деактивирован'}</span>
              {isAdmin && (
                <button onClick={() => updateUser(user.id, { isActive: !user.isActive })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, display: 'flex' }} title={user.isActive ? 'Деактивировать' : 'Активировать'}>
                  {user.isActive ? <ToggleRight size={18} color="#22c55e" /> : <ToggleLeft size={18} />}
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {isAdmin ? (
                <>
                  <button onClick={() => setEditingUser(user)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, borderRadius: 6, display: 'flex', transition: 'all 0.15s' }} onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-primary)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }} title="Редактировать"><Pencil size={14} /></button>
                  {user.role !== 'owner' && (
                    <button onClick={() => setConfirmDelete(user.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, borderRadius: 6, display: 'flex', transition: 'all 0.15s' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#ef4444'; }} onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }} title="Удалить"><Trash2 size={14} /></button>
                  )}
                </>
              ) : (
                <button onClick={() => setEditingUser(user)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, borderRadius: 6, display: 'flex', transition: 'all 0.15s' }} onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-primary)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }} title="Просмотр"><Eye size={14} /></button>
              )}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: 13 }}>Сотрудники не найдены</div>
        )}
      </div>

      {/* Employee modal */}
      {(editingUser || showCreate) && (
        <EmployeeModal
          user={editingUser ?? undefined}
          projects={projects}
          readOnly={!isAdmin}
          onClose={() => { setEditingUser(null); setShowCreate(false); }}
          onSave={(data, newProjectRoles) => {
            let userId = editingUser?.id;
            if (editingUser) {
              updateUser(editingUser.id, data);
            } else {
              userId = `u${Date.now()}`;
              createUser({ ...data, id: userId });
            }
            Object.entries(newProjectRoles).forEach(([projectId, role]) => {
              const project = projects.find(p => p.id === projectId);
              if (!project || !userId) return;
              const currentMember = project.members.find(m => m.userId === userId);
              if (role === 'none') { if (currentMember) removeProjectMember(projectId, userId); }
              else { if (!currentMember) addProjectMember(projectId, userId, role as ProjectMemberRole); else if (currentMember.role !== role) updateProjectMemberRole(projectId, userId, role as ProjectMemberRole); }
            });
            setEditingUser(null); setShowCreate(false);
          }}
        />
      )}

      {/* Delete confirmation */}
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
                <button className="btn" style={{ background: '#ef4444', color: '#fff', border: 'none' }} onClick={() => { deleteUser(confirmDelete); setConfirmDelete(null); }}>Удалить</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeesSection;
