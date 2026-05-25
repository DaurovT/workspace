import React, { useState } from 'react';
import { Shield, Mail, Lock, Loader2 } from 'lucide-react';

interface LoginPageProps {
  onSuccess: (user: AuthUser, token: string) => void;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  avatar?: string;
}

export default function LoginPage({ onSuccess }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Ошибка авторизации');
        return;
      }

      // Store JWT in localStorage
      localStorage.setItem('has_session', '1');
      localStorage.setItem('auth_user', JSON.stringify(data.user));

      onSuccess(data.user, data.token);
    } catch {
      setError('Нет соединения с сервером. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      height: '100vh', width: '100vw',
      background: 'var(--bg-base)',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        background: 'var(--bg-surface)',
        padding: 'var(--space-10)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border-subtle)',
        width: '100%', maxWidth: '400px',
        boxShadow: 'var(--shadow-lg)'
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 'var(--space-8)' }}>
          <div style={{
            width: 52, height: 52,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
            borderRadius: '14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--color-primary)',
            marginBottom: 'var(--space-5)'
          }}>
            <Shield size={26} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', textAlign: 'center', letterSpacing: '-0.02em', margin: 0 }}>
            Корпоративный портал
          </h2>
          <p style={{ color: 'var(--text-muted)', marginTop: 6, fontSize: 13, textAlign: 'center' }}>
            Авторизуйтесь для доступа к WorkSpace Pro
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Email */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Корпоративный Email
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                <Mail size={15} />
              </div>
              <input
                type="email"
                required
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder="employee@workspace.local"
                value={email}
                onChange={e => setEmail(e.target.value.trim())}
                style={{
                  width: '100%', height: 36, paddingLeft: 32, paddingRight: 12,
                  borderRadius: 6, border: '1px solid var(--border-default)',
                  background: 'var(--bg-elevated)', color: 'var(--text-primary)',
                  fontSize: 13, outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Пароль
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                <Lock size={15} />
              </div>
              <input
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{
                  width: '100%', height: 36, paddingLeft: 32, paddingRight: 12,
                  borderRadius: 6, border: '1px solid var(--border-default)',
                  background: 'var(--bg-elevated)', color: 'var(--text-primary)',
                  fontSize: 13, outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              color: '#ef4444', fontSize: 12, textAlign: 'center',
              background: 'rgba(239,68,68,0.08)', padding: '8px 12px',
              borderRadius: 6, border: '1px solid rgba(239,68,68,0.2)'
            }}>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', height: 38, marginTop: 4,
              background: loading ? 'var(--color-primary-hover)' : 'var(--color-primary)',
              border: 'none', borderRadius: 6,
              color: '#fff', fontSize: 13, fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'background 160ms ease',
              opacity: loading ? 0.8 : 1,
            }}
          >
            {loading ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Вход...</> : 'Войти в систему'}
          </button>
        </form>

        <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 20 }}>
          Для получения доступа обратитесь в ИТ-отдел
        </p>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
