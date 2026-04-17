import React, { useState } from 'react';
import { useStore } from '../store';
import { Shield, Mail, Lock } from 'lucide-react';

export default function LoginPage() {
  const { setActiveApp } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === 'maylantim@gmail.com' && password === '1320253') {
      setError('');
      setActiveApp('desktop');
    } else {
      setError('Неверный корпоративный email или пароль');
    }
  };

  return (
    <div style={{ height: '100vh', width: '100vw', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      
      <div style={{ background: 'var(--bg-surface)', padding: 'var(--space-10)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-subtle)', width: '100%', maxWidth: '420px', boxShadow: 'var(--shadow-lg)' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 'var(--space-8)' }}>
          <div style={{ width: 56, height: 56, background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)', marginBottom: 'var(--space-5)' }}>
            <Shield size={28} />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)', textAlign: 'center', letterSpacing: '-0.02em' }}>
            Корпоративный портал
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
            Авторизуйтесь для доступа к WorkSpace Pro
          </p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <div className="form-group">
            <label className="form-label">Корпоративный Email</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                <Mail size={16} />
              </div>
              <input 
                type="email" 
                required 
                className="form-control" 
                style={{ paddingLeft: '36px', height: '36px' }} 
                placeholder="employee@workspace.local" 
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Пароль</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                <Lock size={16} />
              </div>
              <input 
                type="password" 
                required 
                className="form-control" 
                style={{ paddingLeft: '36px', height: '36px' }} 
                placeholder="••••••••" 
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div style={{ color: 'var(--color-danger)', fontSize: '13px', textAlign: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '6px', borderRadius: '4px' }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', height: '40px', fontSize: '14px', marginTop: '4px' }}>
            Войти в систему
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 'var(--space-6)' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Для получения доступа обратитесь в ИТ-отдел
          </p>
        </div>
      </div>
    </div>
  );
}
