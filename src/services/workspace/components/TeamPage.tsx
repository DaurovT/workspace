import React, { useState, useMemo } from 'react';
import { useStore } from '../../../store';
import type { User, UserRole } from '../../../store';
import { UserPlus, X, Check, Crown, Shield, Eye, Users, Briefcase, Mail, LayoutList, Edit2, ChevronDown } from 'lucide-react';

const ROLE_LABELS: Record<UserRole, string> = {
  owner: 'Владелец',
  admin: 'Администратор',
  member: 'Участник',
  viewer: 'Наблюдатель',
};

const ROLE_COLORS: Record<UserRole, string> = {
  owner: '#f59e0b',
  admin: '#6366f1',
  member: '#22c55e',
  viewer: '#94a3b8',
};

const ROLE_ICONS: Record<UserRole, React.ReactNode> = {
  owner: <Crown size={10} />,
  admin: <Shield size={10} />,
  member: <Users size={10} />,
  viewer: <Eye size={10} />,
};

const AVATAR_COLORS = [
  '#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#38bdf8',
  '#a855f7', '#ec4899', '#14b8a6', '#f97316', '#84cc16',
];

// ── Role badge ────────────────────────────────────────────────────────────────
const RoleBadge: React.FC<{ role: UserRole }> = ({ role }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 3,
    fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
    background: `${ROLE_COLORS[role]}18`,
    color: ROLE_COLORS[role],
    border: `1px solid ${ROLE_COLORS[role]}30`,
    whiteSpace: 'nowrap',
  }}>
    {ROLE_ICONS[role]}
    {ROLE_LABELS[role]}
  </span>
);

// ── Invite Modal ──────────────────────────────────────────────────────────────
const InviteModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { createUser } = useStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [role, setRole] = useState<UserRole>('member');
  const [color, setColor] = useState(AVATAR_COLORS[0]);

  const avatarInitials = name.trim().split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('') || 'НУ';

  const handleSubmit = () => {
    if (!name.trim()) return;
    createUser({ name: name.trim(), email: email.trim(), jobTitle: jobTitle.trim(), role, color, avatar: avatarInitials });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 460 }}>
        <div className="modal-header">
          <h2 className="modal-title">Пригласить участника</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div className="avatar" style={{ width: 52, height: 52, fontSize: 18, background: color, flexShrink: 0 }}>
              {avatarInitials}
            </div>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              {AVATAR_COLORS.map(c => (
                <div key={c} onClick={() => setColor(c)} style={{ width: 22, height: 22, borderRadius: '50%', background: c, cursor: 'pointer', border: color === c ? '2px solid var(--text-primary)' : '2px solid transparent', transition: 'border 0.1s' }} />
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Имя и фамилия *</label>
            <input className="form-control" placeholder="Иван Иванов" value={name} onChange={e => setName(e.target.value)} autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-control" type="email" placeholder="ivan@company.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Должность</label>
              <input className="form-control" placeholder="Разработчик" value={jobTitle} onChange={e => setJobTitle(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Роль</label>
              <select className="form-control select-control" value={role} onChange={e => setRole(e.target.value as UserRole)}>
                <option value="admin">Администратор</option>
                <option value="member">Участник</option>
                <option value="viewer">Наблюдатель</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={onClose}>Отмена</button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={!name.trim()}>
              <UserPlus size={14} /> Добавить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Edit User Modal ───────────────────────────────────────────────────────────
const EditUserModal: React.FC<{ user: User; onClose: () => void }> = ({ user, onClose }) => {
  const { updateUser } = useStore();
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [jobTitle, setJobTitle] = useState(user.jobTitle || '');
  const [role, setRole] = useState<UserRole>(user.role);
  const [color, setColor] = useState(user.color);
  const avatarInitials = name.trim().split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('') || user.avatar;

  const handleSave = () => {
    updateUser(user.id, { name: name.trim(), email: email.trim(), jobTitle: jobTitle.trim(), role, color, avatar: avatarInitials });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 460 }}>
        <div className="modal-header">
          <h2 className="modal-title">Редактировать участника</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div className="avatar" style={{ width: 52, height: 52, fontSize: 18, background: color, flexShrink: 0 }}>{avatarInitials}</div>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              {AVATAR_COLORS.map(c => (
                <div key={c} onClick={() => setColor(c)} style={{ width: 22, height: 22, borderRadius: '50%', background: c, cursor: 'pointer', border: color === c ? '2px solid var(--text-primary)' : '2px solid transparent', transition: 'border 0.1s' }} />
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Имя и фамилия</label>
            <input className="form-control" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-control" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Должность</label>
              <input className="form-control" value={jobTitle} onChange={e => setJobTitle(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Роль</label>
              <select className="form-control select-control" value={role} onChange={e => setRole(e.target.value as UserRole)} disabled={user.role === 'owner'}>
                <option value="owner">Владелец</option>
                <option value="admin">Администратор</option>
                <option value="member">Участник</option>
                <option value="viewer">Наблюдатель</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: user.role !== 'owner' ? 'space-between' : 'flex-end', gap: 8 }}>
            {user.role !== 'owner' && (
              <button className="btn btn-secondary" style={{ color: 'var(--color-danger)', fontSize: 12 }}
                onClick={() => { updateUser(user.id, { isActive: !user.isActive }); onClose(); }}>
                {user.isActive ? 'Деактивировать' : 'Активировать'}
              </button>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary" onClick={onClose}>Отмена</button>
              <button className="btn btn-primary" onClick={handleSave}><Check size={14} /> Сохранить</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Owner view: full list ─────────────────────────────────────────────────────
const OwnerView: React.FC<{ onEdit: (u: User) => void }> = ({ onEdit }) => {
  const { users, projects } = useStore();
  const [filterRole, setFilterRole] = useState<UserRole | 'all'>('all');

  const getUserProjects = (userId: string) =>
    projects.filter(p => p.members.some(m => m.userId === userId));

  const filtered = filterRole === 'all' ? users : users.filter(u => u.role === filterRole);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Filter row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {(['all', 'owner', 'admin', 'member', 'viewer'] as const).map(r => (
          <button
            key={r}
            onClick={() => setFilterRole(r)}
            style={{
              padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
              border: '1px solid',
              borderColor: filterRole === r ? 'var(--color-primary)' : 'var(--border-subtle)',
              background: filterRole === r ? 'var(--color-primary)' : 'transparent',
              color: filterRole === r ? 'white' : 'var(--text-secondary)',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {r === 'all' ? `Все (${users.length})` : ROLE_LABELS[r]}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 12, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '2fr 1.2fr 1.5fr 2fr auto',
          padding: '10px 20px', borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-elevated)',
        }}>
          {['Участник', 'Роль', 'Должность', 'Проекты', ''].map((h, i) => (
            <div key={i} style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {h}
            </div>
          ))}
        </div>

        {/* Rows */}
        {filtered.map((user, idx) => {
          const userProjects = getUserProjects(user.id);
          return (
            <div
              key={user.id}
              style={{
                display: 'grid', gridTemplateColumns: '2fr 1.2fr 1.5fr 2fr auto',
                padding: '12px 20px', alignItems: 'center',
                borderBottom: idx < filtered.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                opacity: user.isActive ? 1 : 0.45,
                transition: 'background 0.1s',
                cursor: 'pointer',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-elevated)'}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = ''}
              onClick={() => onEdit(user)}
            >
              {/* Name + avatar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div className="avatar" style={{ width: 34, height: 34, fontSize: 13, background: user.color }}>
                    {user.avatar}
                  </div>
                  <div style={{
                    position: 'absolute', bottom: -1, right: -1,
                    width: 9, height: 9, borderRadius: '50%',
                    background: user.isActive ? '#22c55e' : '#94a3b8',
                    border: '1.5px solid var(--bg-card)',
                  }} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{user.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user.email}</div>
                </div>
              </div>

              {/* Role */}
              <div><RoleBadge role={user.role} /></div>

              {/* Job title */}
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                {user.jobTitle || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>—</span>}
              </div>

              {/* Projects */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {userProjects.length > 0 ? userProjects.map(p => (
                  <span key={p.id} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    fontSize: 11, padding: '2px 8px', borderRadius: 6,
                    background: `${p.color}18`, color: p.color,
                    border: `1px solid ${p.color}30`,
                  }}>
                    {p.icon} {p.name}
                  </span>
                )) : (
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>Нет проектов</span>
                )}
              </div>

              {/* Edit */}
              <button
                className="btn btn-ghost btn-icon"
                onClick={e => { e.stopPropagation(); onEdit(user); }}
                style={{ opacity: 0.3, width: 28, height: 28 }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '0.3')}
              >
                <Edit2 size={13} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Member view: grouped by project ──────────────────────────────────────────
const MemberView: React.FC<{ currentUserId: string }> = ({ currentUserId }) => {
  const { users, projects } = useStore();
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  // Only projects the current user is in
  const myProjects = useMemo(
    () => projects.filter(p => p.members.some(m => m.userId === currentUserId)),
    [projects, currentUserId]
  );

  const toggle = (id: string) => {
    setCollapsed(s => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {myProjects.map(project => {
        const memberUsers = project.members
          .map(m => ({ ...m, user: users.find(u => u.id === m.userId) }))
          .filter(m => m.user) as { userId: string; role: string; user: User }[];
        const isOpen = !collapsed.has(project.id);

        return (
          <div key={project.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 12, overflow: 'hidden' }}>
            {/* Project header */}
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 20px', cursor: 'pointer',
                background: 'var(--bg-elevated)',
                borderBottom: isOpen ? '1px solid var(--border-subtle)' : 'none',
                transition: 'background 0.1s',
              }}
              onClick={() => toggle(project.id)}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-card)'}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-elevated)'}
            >
              <div style={{ width: 32, height: 32, borderRadius: 8, background: project.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                {project.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{project.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{memberUsers.length} участников</div>
              </div>
              {/* Avatars preview */}
              <div style={{ display: 'flex' }}>
                {memberUsers.slice(0, 5).map((m, i) => (
                  <div key={m.userId} className="avatar" style={{ width: 26, height: 26, fontSize: 10, background: m.user.color, marginLeft: i > 0 ? -8 : 0, border: '2px solid var(--bg-elevated)', zIndex: 5 - i }}>
                    {m.user.avatar}
                  </div>
                ))}
              </div>
              <ChevronDown size={14} style={{ color: 'var(--text-muted)', transform: isOpen ? 'rotate(180deg)' : '', transition: 'transform 0.2s', marginLeft: 8 }} />
            </div>

            {/* Members list */}
            {isOpen && memberUsers.map((m, idx) => (
              <div
                key={m.userId}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 20px',
                  borderBottom: idx < memberUsers.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-elevated)'}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = ''}
              >
                <div className="avatar" style={{ width: 34, height: 34, fontSize: 13, background: m.user.color, flexShrink: 0 }}>
                  {m.user.avatar}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    {m.user.name}
                    {m.userId === currentUserId && (
                      <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 10, background: 'var(--color-primary)', color: 'white', fontWeight: 500 }}>Вы</span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8, marginTop: 1 }}>
                    {m.user.jobTitle && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Briefcase size={9} />{m.user.jobTitle}</span>}
                    {m.user.email && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Mail size={9} />{m.user.email}</span>}
                  </div>
                </div>
                <RoleBadge role={m.user.role} />
              </div>
            ))}
          </div>
        );
      })}

      {myProjects.length === 0 && (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)', fontSize: 14 }}>
          Вы пока не добавлены ни в один проект
        </div>
      )}
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const TeamPage: React.FC = () => {
  const { users, projects, currentUserId } = useStore();
  const [showInvite, setShowInvite] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);

  const currentUser = users.find(u => u.id === currentUserId);
  const isOwnerOrAdmin = currentUser?.role === 'owner' || currentUser?.role === 'admin';

  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter(u => u.isActive).length,
    projects: projects.length,
  }), [users, projects]);

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: '24px 28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Команда</h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
            {isOwnerOrAdmin
              ? 'Все участники рабочего пространства'
              : 'Участники ваших проектов'}
          </p>
        </div>
        {isOwnerOrAdmin && (
          <button className="btn btn-primary" onClick={() => setShowInvite(true)} id="btn-invite-member">
            <UserPlus size={14} /> Пригласить
          </button>
        )}
      </div>

      {/* Stats — only for owner/admin */}
      {isOwnerOrAdmin && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Всего участников', value: stats.total, color: '#6366f1', icon: <Users size={15} /> },
            { label: 'Активных', value: stats.active, color: '#22c55e', icon: <Check size={15} /> },
            { label: 'Проектов', value: stats.projects, color: '#f59e0b', icon: <LayoutList size={15} /> },
          ].map(s => (
            <div key={s.label} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
              borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: `${s.color}1a`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>
                {s.icon}
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Content — owner sees full list, member sees project groups */}
      {isOwnerOrAdmin
        ? <OwnerView onEdit={setEditUser} />
        : <MemberView currentUserId={currentUserId} />
      }

      {showInvite && <InviteModal onClose={() => setShowInvite(false)} />}
      {editUser && <EditUserModal user={editUser} onClose={() => setEditUser(null)} />}
    </div>
  );
};

export default TeamPage;
