import React from 'react';

interface State { hasError: boolean; message?: string; }

// Global error boundary: a crashed view shows a recoverable message instead of
// a white screen (audit P2 #15).
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(err: unknown): State {
    return { hasError: true, message: err instanceof Error ? err.message : String(err) };
  }

  componentDidCatch(err: unknown) {
    console.error('[ErrorBoundary]', err);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 14, background: 'var(--bg-base)', color: 'var(--text-primary)', padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 40 }}>⚠️</div>
        <div style={{ fontSize: 16, fontWeight: 700 }}>Что-то пошло не так</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 420, wordBreak: 'break-word' }}>{this.state.message}</div>
        <button onClick={() => { this.setState({ hasError: false }); }} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border-default)', background: 'var(--bg-surface)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: 13 }}>
          Попробовать снова
        </button>
        <button onClick={() => window.location.reload()} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--color-primary)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
          Перезагрузить страницу
        </button>
      </div>
    );
  }
}
