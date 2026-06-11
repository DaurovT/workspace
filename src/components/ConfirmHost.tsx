import React from 'react';
import { useConfirmStore } from '../lib/confirm';

export const ConfirmHost: React.FC = () => {
  const { req, close } = useConfirmStore();
  if (!req) return null;
  const btn: React.CSSProperties = { padding: '8px 14px', fontSize: 13, borderRadius: 8, cursor: 'pointer' };
  return (
    <div
      onClick={() => close(false)}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: 20, width: 400, maxWidth: '90vw', boxShadow: '0 16px 48px rgba(0,0,0,0.3)' }}
      >
        {req.title && <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>{req.title}</div>}
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 18 }}>{req.message}</div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={() => close(false)} style={{ ...btn, fontWeight: 500, border: '1px solid var(--border-default)', background: 'transparent', color: 'var(--text-primary)' }}>
            {req.cancelLabel || 'Отмена'}
          </button>
          <button onClick={() => close(true)} style={{ ...btn, fontWeight: 600, border: 'none', background: req.danger ? '#ef4444' : 'var(--color-primary)', color: '#fff' }}>
            {req.confirmLabel || 'Подтвердить'}
          </button>
        </div>
      </div>
    </div>
  );
};
