import React from 'react';
import { useConfirmStore } from '../lib/confirm';
import { Button } from './ui';

export const ConfirmHost: React.FC = () => {
  const { req, close } = useConfirmStore();
  if (!req) return null;

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
          <Button variant="ghost" onClick={() => close(false)}>{req.cancelLabel || 'Отмена'}</Button>
          <Button variant={req.danger ? 'danger' : 'primary'} onClick={() => close(true)}>{req.confirmLabel || 'Подтвердить'}</Button>
        </div>
      </div>
    </div>
  );
};
