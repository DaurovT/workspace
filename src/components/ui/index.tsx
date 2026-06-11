import React from 'react';

// Minimal UI kit (audit P3 #19): shared primitives so new code stops hand-rolling
// style={{}} blobs. Tokens come from index.css (--color-*, --bg-*, --border-*).

type BtnVariant = 'primary' | 'ghost' | 'danger';

const BTN_BASE: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  height: 32, padding: '0 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
  cursor: 'pointer', border: '1px solid transparent', transition: 'opacity 0.15s',
};
const BTN_VARIANTS: Record<BtnVariant, React.CSSProperties> = {
  primary: { background: 'var(--color-primary)', color: '#fff' },
  ghost: { background: 'transparent', color: 'var(--text-primary)', borderColor: 'var(--border-default)' },
  danger: { background: 'var(--color-danger)', color: '#fff' },
};

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant }> =
({ variant = 'primary', style, disabled, ...rest }) => (
  <button
    {...rest}
    disabled={disabled}
    style={{ ...BTN_BASE, ...BTN_VARIANTS[variant], opacity: disabled ? 0.55 : 1, cursor: disabled ? 'default' : 'pointer', ...style }}
  />
);

export const IconButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }> =
({ label, style, ...rest }) => (
  <button
    {...rest}
    aria-label={label}
    title={label}
    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 5, borderRadius: 6, ...style }}
  />
);

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ style, ...rest }) => (
  <div
    {...rest}
    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: 16, ...style }}
  />
);

export const FieldLabel: React.FC<React.HTMLAttributes<HTMLLabelElement>> = ({ style, ...rest }) => (
  <label
    {...rest}
    style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 6, ...style }}
  />
);

export const TextInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ style, ...rest }) => (
  <input
    {...rest}
    style={{ width: '100%', height: 32, padding: '0 10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box', outline: 'none', ...style }}
  />
);
