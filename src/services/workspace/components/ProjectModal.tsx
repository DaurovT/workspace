import React, { useState, useEffect } from 'react';
import { useStore } from '../../../store';
import type { Project, ProjectMemberRole } from '../../../store';
import { X, Users, Plus, Trash2 } from 'lucide-react';

const ICONS = ['📁', '🚀', '🌐', '📱', '💡', '🎯', '⚡', '🔧', '🎨', '📊', '🏆', '🔬'];
const COLORS = ['#654ef1', '#22c55e', '#f97316', '#ef4444', '#0284c7', '#ec4899', '#14b8a6', '#f59e0b'];

const ROLE_LABELS: Record<ProjectMemberRole, string> = {
  admin: 'Администратор',
  member: 'Участник',
  viewer: 'Наблюдатель',
};

const ProjectModal: React.FC = () => {
  const {
    isProjectModalOpen, projectModalMode, closeProjectModal, createProject, updateProject,
    users, activeProjectId, projects,
    addProjectMember, removeProjectMember, updateProjectMemberRole, toggleProjectModal
  } = useStore();

  const [tab, setTab] = useState<'settings' | 'members'>('settings');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('📁');
  const [color, setColor] = useState('#654ef1');

  // For adding new members to active project
  const [addUserId, setAddUserId] = useState('');
  const [addRole, setAddRole] = useState<ProjectMemberRole>('member');

  const activeProject = projects.find(p => p.id === activeProjectId);

  const isEdit = projectModalMode === 'edit';

  useEffect(() => {
    if (isProjectModalOpen) {
      if (isEdit && activeProject) {
        setName(activeProject.name);
        setDescription(activeProject.description);
        setIcon(activeProject.icon);
        setColor(activeProject.color);
        setTab('settings');
      } else {
        setName('');
        setDescription('');
        setIcon('📁');
        setColor('#654ef1');
        setTab('settings');
      }
    }
  }, [isProjectModalOpen, isEdit, activeProject]);

  if (!isProjectModalOpen) return null;

  const handleSave = () => {
    if (!name.trim()) return;
    if (isEdit && activeProject) {
      updateProject(activeProject.id, { name: name.trim(), description, icon, color });
      closeProjectModal();
    } else {
      createProject({ name: name.trim(), description, icon, color });
      // createProject implicitly closes modal
    }
  };

  const memberUserIds = activeProject?.members.map(m => m.userId) || [];
  const nonMembers = users.filter(u => !memberUserIds.includes(u.id));

  const handleAddMember = () => {
    if (!addUserId || !activeProject) return;
    addProjectMember(activeProject.id, addUserId, addRole);
    setAddUserId('');
  };

  const closeModal = closeProjectModal || toggleProjectModal; // fallback

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
      <div className="modal" style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', gap: 2 }}>
            <button
              className="btn btn-ghost"
              style={{ fontSize: 12, padding: '4px 10px', fontWeight: tab === 'settings' ? 700 : 400, borderBottom: tab === 'settings' ? '2px solid var(--color-primary)' : '2px solid transparent', borderRadius: 0 }}
              onClick={() => setTab('settings')}
            >
              Настройки
            </button>
            {isEdit && activeProject && (
              <button
                className="btn btn-ghost"
                style={{ fontSize: 12, padding: '4px 10px', fontWeight: tab === 'members' ? 700 : 400, borderBottom: tab === 'members' ? '2px solid var(--color-primary)' : '2px solid transparent', borderRadius: 0, display: 'flex', alignItems: 'center', gap: 6 }}
                onClick={() => setTab('members')}
              >
                <Users size={12} /> Участники
                <span style={{ fontSize: 10, background: 'var(--bg-elevated)', padding: '1px 6px', borderRadius: 10, color: 'var(--text-secondary)' }}>
                  {activeProject.members.length}
                </span>
              </button>
            )}
          </div>
          <button className="btn btn-ghost btn-icon" onClick={closeModal}><X size={16} /></button>
        </div>

        {tab === 'settings' && (
          <>
            <div className="modal-body">
              {/* Icon + color */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                  {icon}
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>ИКОНКА</div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', maxWidth: 240 }}>
                    {ICONS.map(ic => (
                      <button key={ic} onClick={() => setIcon(ic)} style={{ fontSize: 16, width: 28, height: 28, borderRadius: 6, border: `1.5px solid ${ic === icon ? color : 'var(--border-subtle)'}`, cursor: 'pointer', background: ic === icon ? `${color}20` : 'var(--bg-elevated)', transition: 'all 0.1s' }}>
                        {ic}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Colors */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>ЦВЕТ</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {COLORS.map(c => (
                    <button key={c} onClick={() => setColor(c)} style={{ width: 22, height: 22, borderRadius: '50%', background: c, border: `2px solid ${c === color ? 'var(--text-primary)' : 'transparent'}`, cursor: 'pointer', transition: 'all 0.1s' }} />
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Название проекта *</label>
                <input
                  className="form-control"
                  placeholder="Например, Мобильное приложение"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && handleSave()}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Описание</label>
                <textarea
                  className="form-control"
                  placeholder="Краткое описание проекта..."
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  style={{ resize: 'none' }}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={closeModal}>Отмена</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={!name.trim()}>
                {isEdit ? 'Сохранить настройки' : 'Создать проект'}
              </button>
            </div>
          </>
        )}

        {tab === 'members' && activeProject && (
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Add new member */}
            {nonMembers.length > 0 && (
              <div style={{ display: 'flex', gap: 8 }}>
                <select
                  className="form-control select-control"
                  style={{ flex: 1 }}
                  value={addUserId}
                  onChange={e => setAddUserId(e.target.value)}
                >
                  <option value="">Выбрать участника...</option>
                  {nonMembers.map(u => (
                    <option key={u.id} value={u.id}>{u.name} — {u.jobTitle || u.email}</option>
                  ))}
                </select>
                <select
                  className="form-control select-control"
                  style={{ width: 140 }}
                  value={addRole}
                  onChange={e => setAddRole(e.target.value as ProjectMemberRole)}
                >
                  <option value="admin">Администратор</option>
                  <option value="member">Участник</option>
                  <option value="viewer">Наблюдатель</option>
                </select>
                <button className="btn btn-primary" onClick={handleAddMember} disabled={!addUserId} style={{ flexShrink: 0 }}>
                  <Plus size={14} />
                </button>
              </div>
            )}

            {/* Members list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {activeProject.members.map(member => {
                const user = users.find(u => u.id === member.userId);
                if (!user) return null;
                return (
                  <div key={member.userId} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 12px', borderRadius: 8,
                    background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                  }}>
                    <div className="avatar" style={{ width: 32, height: 32, fontSize: 12, background: user.color, flexShrink: 0 }}>
                      {user.avatar}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{user.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user.jobTitle || user.email}</div>
                    </div>
                    <select
                      className="form-control select-control"
                      style={{ width: 140, height: 30, fontSize: 12 }}
                      value={member.role}
                      onChange={e => updateProjectMemberRole(activeProject.id, member.userId, e.target.value as ProjectMemberRole)}
                    >
                      <option value="admin">Администратор</option>
                      <option value="member">Участник</option>
                      <option value="viewer">Наблюдатель</option>
                    </select>
                    <button
                      className="btn btn-ghost btn-icon"
                      style={{ color: 'var(--text-muted)' }}
                      onClick={() => removeProjectMember(activeProject.id, member.userId)}
                      title="Удалить из проекта"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}
            </div>

            <div style={{ fontSize: 11, color: 'var(--text-muted)', paddingBottom: 4 }}>
              {activeProject.members.length} участник{activeProject.members.length === 1 ? '' : activeProject.members.length < 5 ? 'а' : 'ов'} в проекте «{activeProject.name}»
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectModal;
