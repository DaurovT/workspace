import React, { useState, useEffect } from 'react';
import { X, ChevronDown, Check, Briefcase } from 'lucide-react';
import type { Project } from '../financeStore';

type Status = 'Плановый' | 'В работе' | 'Завершен';
const STATUSES: Status[] = ['Плановый', 'В работе', 'Завершен'];
const STATUS_COLORS: Record<Status, { color: string; bg: string; border: string }> = {
  'Плановый':  { color: '#38bdf8', bg: 'rgba(56,189,248,0.12)',  border: 'rgba(56,189,248,0.3)' },
  'В работе':  { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' },
  'Завершен':  { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.2)' },
};

export const ALL_GROUPS = ['IT Инфраструктура', 'Маркетинг', 'Развитие сети', 'HR', 'Операционная деятельность', 'Финансы'];

interface Props {
  project?: Project;
  onSave: (data: Omit<Project, 'id'>) => void;
  onClose: () => void;
}

export const ProjectFormModal: React.FC<Props> = ({ project, onSave, onClose }) => {
  const [name, setName]           = useState(project?.name ?? '');
  const [group, setGroup]         = useState(project?.group ?? '');
  const [status, setStatus]       = useState<Status>((project?.status as Status) ?? 'Плановый');
  const [dateStart, setDateStart] = useState(project?.dateStart ?? '');
  const [dateEnd, setDateEnd]     = useState(project?.dateEnd ?? '');
  const [budget, setBudget]       = useState(String(project?.budget ?? ''));
  const [description, setDescription] = useState(project?.description ?? '');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const valid = name.trim().length > 0;
  const handleSave = () => {
    if (!valid) return;
    onSave({ name: name.trim(), group, status, dateStart, dateEnd, budget: budget ? Number(budget) : undefined, description: description || undefined });
  };

  const inp: React.CSSProperties = {
    width: '100%', padding: '0 10px', height: 34, background: 'var(--bg-base)',
    border: '1px solid var(--border-subtle)', borderRadius: 6,
    color: 'var(--text-primary)', fontSize: 12, outline: 'none', boxSizing: 'border-box',
  };
  const label: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 5, letterSpacing: 0.3 };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12, width: 500, padding: 28, boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
          <div style={{ background: 'rgba(99,102,241,0.12)', padding: 8, borderRadius: 8 }}>
            <Briefcase size={16} color="var(--color-primary)" />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
              {project ? 'Редактировать проект' : 'Новый проект'}
            </h2>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>Заполните параметры проекта</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, borderRadius: 6 }}>
            <X size={18} />
          </button>
        </div>

        {/* Name */}
        <div style={{ marginBottom: 14 }}>
          <label style={label}>НАЗВАНИЕ *</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Название проекта"
            style={{ ...inp, borderColor: !name.trim() ? 'rgba(239,68,68,0.4)' : 'var(--border-subtle)' }}
            autoFocus />
        </div>

        {/* Group + Status side by side */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div>
            <label style={label}>ГРУППА</label>
            <div style={{ position: 'relative' }}>
              <select value={group} onChange={e => setGroup(e.target.value)}
                style={{ ...inp, paddingRight: 28, appearance: 'none', cursor: 'pointer' }}>
                <option value="">Без группы</option>
                {ALL_GROUPS.map(g => <option key={g}>{g}</option>)}
              </select>
              <ChevronDown size={12} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
            </div>
          </div>
          <div>
            <label style={label}>СТАТУС</label>
            <div style={{ display: 'flex', gap: 4 }}>
              {STATUSES.map(s => {
                const c = STATUS_COLORS[s];
                const active = status === s;
                return (
                  <button key={s} type="button" onClick={() => setStatus(s)} style={{
                    flex: 1, height: 34, borderRadius: 6, border: `1px solid ${active ? c.border : 'var(--border-subtle)'}`,
                    background: active ? c.bg : 'transparent', color: active ? c.color : 'var(--text-muted)',
                    fontSize: 10, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3,
                  }}>
                    {active && <Check size={9} />}
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Dates */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div>
            <label style={label}>НАЧАЛО</label>
            <input type="date" value={dateStart} onChange={e => setDateStart(e.target.value)} style={inp} />
          </div>
          <div>
            <label style={label}>КОНЕЦ</label>
            <input type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)} style={inp} />
          </div>
        </div>

        {/* Budget */}
        <div style={{ marginBottom: 14 }}>
          <label style={label}>ПЛАНОВЫЙ БЮДЖЕТ (сум)</label>
          <input type="number" value={budget} onChange={e => setBudget(e.target.value)}
            placeholder="0" min="0" style={inp} />
        </div>

        {/* Description */}
        <div style={{ marginBottom: 22 }}>
          <label style={label}>ОПИСАНИЕ</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)}
            placeholder="Краткое описание проекта..."
            style={{ ...inp, height: 'auto', minHeight: 56, paddingTop: 8, paddingBottom: 8, resize: 'vertical' }} />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, height: 36, background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>
            Отмена
          </button>
          <button onClick={handleSave} disabled={!valid} style={{
            flex: 2, height: 36, background: valid ? 'var(--color-primary)' : 'var(--bg-hover)',
            border: 'none', borderRadius: 8, color: valid ? '#fff' : 'var(--text-muted)',
            fontSize: 12, fontWeight: 600, cursor: valid ? 'pointer' : 'not-allowed',
            boxShadow: valid ? '0 4px 12px rgba(99,102,241,0.3)' : 'none',
          }}>
            {project ? 'Сохранить изменения' : 'Создать проект'}
          </button>
        </div>
      </div>
    </div>
  );
};
