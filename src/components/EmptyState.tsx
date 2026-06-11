import React from 'react';

// Reusable empty-state block (audit P2 #15).
export const EmptyState: React.FC<{ icon?: React.ReactNode; title: string; hint?: string; action?: React.ReactNode }> =
({ icon, title, hint, action }) => (
  <div role="status" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '48px 16px', color: 'var(--text-muted)', textAlign: 'center' }}>
    <div style={{ fontSize: 28, opacity: 0.5 }}>{icon ?? '📭'}</div>
    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>{title}</div>
    {hint && <div style={{ fontSize: 12, maxWidth: 360 }}>{hint}</div>}
    {action}
  </div>
);
