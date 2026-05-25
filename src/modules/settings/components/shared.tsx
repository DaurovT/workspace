import React from 'react';

export const ROLE_LABELS: Record<string, string> = {
  owner: 'Владелец',
  admin: 'Администратор',
  member: 'Участник',
  viewer: 'Наблюдатель',
  cfo: 'Финансовый директор',
  accountant: 'Бухгалтер',
};

export const ROLE_COLORS: Record<string, string> = {
  owner: '#6366f1',
  admin: '#22c55e',
  member: '#f59e0b',
  viewer: '#64748b',
  cfo: '#a855f7',
  accountant: '#14b8a6',
};

export const AVATAR_COLORS = [
  '#6366f1', '#22c55e', '#f59e0b', '#ef4444',
  '#38bdf8', '#a855f7', '#ec4899', '#14b8a6', '#f97316', '#84cc16',
];

export const ALL_APPS = [
  { id: 'arcana', name: 'Arcana', description: 'Трекер задач, Канбан, Диаграмма Ганта', color: 'linear-gradient(135deg, #6366f1, #8b5cf6)' },
  { id: 'bpmn', name: 'BPMN Studio', description: 'Редактор бизнес-процессов', color: 'linear-gradient(135deg, #6366f1, #4f46e5)' },
  { id: 'kidsplate', name: 'Kids Plate', description: 'Магазин детского питания', color: 'linear-gradient(135deg, #f59e0b, #d97706)' },
  { id: 'tms', name: 'TMS', description: 'Транспортная система', color: 'linear-gradient(135deg, #ef4444, #b91c1c)' },
];

export const SectionHeader: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
  <div style={{ marginBottom: 28 }}>
    <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>{title}</h1>
    <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '6px 0 0' }}>{subtitle}</p>
  </div>
);

export const SettingsCard: React.FC<{ title: string; icon: React.ElementType; children: React.ReactNode }> = ({ title, icon: Icon, children }) => (
  <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '20px', marginBottom: 18 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
      <Icon size={15} color="var(--color-primary)" />
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</span>
    </div>
    {children}
  </div>
);

export const SettingRow: React.FC<{ label: string; description: string; children: React.ReactNode }> = ({ label, description, children }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
    <div>
      <div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{description}</div>
    </div>
    {children}
  </div>
);

export const Divider = () => (
  <div style={{ height: 1, background: 'var(--border-subtle)', margin: '14px 0' }} />
);

export const ToggleSwitch: React.FC<{ value: boolean; onChange: (v: boolean) => void; disabled?: boolean }> = ({ value, onChange, disabled }) => (
  <button
    onClick={() => !disabled && onChange(!value)}
    style={{
      width: 40, height: 22, borderRadius: 11, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
      background: value ? 'var(--color-primary)' : 'var(--bg-elevated)',
      position: 'relative', transition: 'background 0.2s', flexShrink: 0,
      boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)', opacity: disabled ? 0.6 : 1,
    }}
  >
    <div style={{
      position: 'absolute', top: 3, left: value ? 21 : 3,
      width: 16, height: 16, borderRadius: '50%', background: '#fff',
      transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
    }} />
  </button>
);
