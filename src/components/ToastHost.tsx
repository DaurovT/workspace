import React from 'react';
import { useToastStore } from '../lib/toast';

const COLORS: Record<string, string> = { success: '#10b981', error: '#ef4444', info: 'var(--color-primary)' };
const ICONS: Record<string, string> = { success: '✓', error: '✕', info: 'ℹ' };

export const ToastHost: React.FC = () => {
  const { toasts, dismiss } = useToastStore();
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 99999, pointerEvents: 'none' }}>
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          onClick={() => dismiss(t.id)}
          style={{
            pointerEvents: 'auto', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
            borderLeft: `3px solid ${COLORS[t.kind]}`, borderRadius: 8, padding: '10px 16px', fontSize: 13,
            color: 'var(--text-primary)', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', display: 'flex',
            alignItems: 'center', gap: 8, cursor: 'pointer', maxWidth: 380,
          }}
        >
          <span style={{ color: COLORS[t.kind], fontWeight: 700, flexShrink: 0 }}>{ICONS[t.kind]}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
};
