import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store';
import {
  Briefcase, ShoppingBag, GraduationCap, Search,
  User, X, Check, Aperture, LogOut, Command, Settings
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

// ─── Types ────────────────────────────────────────────────────────────────────
interface App {
  id: string;
  name: string;
  description: string;
  icon: (size: number) => React.ReactElement;
  color: string;
  onClick: () => void;
}

// ─── Main Desktop ─────────────────────────────────────────────────────────────
const OSDesktop: React.FC = () => {
  const { setActiveApp, setActivePage } = useStore();
  const [time, setTime] = useState(new Date());
  const [showProfile, setShowProfile] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const apps: App[] = [
    {
      id: 'workspace',
      name: 'Arcana',
      description: 'Задачи, Канбан, Диаграмма Ганта',
      icon: (size: number) => <Aperture size={size} color="#fff" />,
      color: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      onClick: () => { setActiveApp('workspace'); setActivePage('dashboard'); }
    },
    {
      id: 'kidsplate',
      name: 'Kids Plate',
      description: 'Магазин детского питания',
      icon: (size: number) => <ShoppingBag size={size} color="#fff" />,
      color: 'linear-gradient(135deg, #f59e0b, #d97706)',
      onClick: () => alert('В разработке')
    },
    {
      id: 'lms',
      name: 'LMS Academy',
      description: 'Образовательная платформа',
      icon: (size: number) => <GraduationCap size={size} color="#fff" />,
      color: 'linear-gradient(135deg, #ef4444, #b91c1c)',
      onClick: () => alert('В разработке')
    },
    {
      id: 'profile',
      name: 'Мой профиль',
      description: 'Настройки аккаунта',
      icon: (size: number) => <User size={size} color="#fff" />,
      color: 'linear-gradient(135deg, #a855f7, #7e22ce)',
      onClick: () => setShowProfile(true)
    },
    {
      id: 'settings',
      name: 'Настройки',
      description: 'Управление системой',
      icon: (size: number) => <Settings size={size} color="#fff" />,
      color: 'linear-gradient(135deg, #475569, #1e293b)',
      onClick: () => setActiveApp('settings')
    }
  ];

  // ── Cmd+K global shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(prev => !prev);
      }
      if (e.key === 'Escape') {
        setShowSearch(false);
        setShowProfile(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="os-desktop">
      {/* ── Desktop Canvas ── */}
      <div className="os-desktop-canvas">
        {/* Header bar */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 40,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 20px',
          background: 'rgba(10,10,20,0.6)', backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)', zIndex: 10
        }}>
          <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em' }}>
            WorkSpace Pro
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Search button */}
            <button
              onClick={() => setShowSearch(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 6, padding: '4px 10px', color: 'rgba(255,255,255,0.5)',
                fontSize: 12, cursor: 'pointer', transition: 'all 0.15s'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
            >
              <Search size={12} />
              <span>Поиск</span>
              <span style={{
                background: 'rgba(255,255,255,0.1)', borderRadius: 4,
                padding: '1px 5px', fontSize: 10, letterSpacing: '0.02em'
              }}>⌘K</span>
            </button>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
              {format(time, 'EEEE d MMM, HH:mm', { locale: ru })}
            </span>
          </div>
        </div>

        <div className="os-app-grid">
          {apps.map(app => (
            <div key={app.id} className="os-app-icon-wrapper" onClick={app.onClick}>
              <div className="os-app-icon" style={{ background: app.color }}>
                {app.icon(32)}
              </div>
              <span className="os-app-label">{app.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Dock ── */}
      <div className="os-dock-wrapper">
        <div className="os-dock">
          {apps.map(app => (
            <div
              key={`dock-${app.id}`}
              className="os-dock-icon"
              style={{ background: app.color }}
              onClick={app.onClick}
              title={app.name}
            >
              {app.icon(24)}
            </div>
          ))}
          <div className="os-dock-divider" />
          <div
            className="os-dock-icon"
            style={{ background: 'rgba(255,255,255,0.1)' }}
            onClick={() => setShowSearch(true)}
            title="Поиск (⌘K)"
          >
            <Search size={22} color="#fff" />
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
      {showSearch && <AppSearchPalette apps={apps} onClose={() => setShowSearch(false)} />}
    </div>
  );
};

// ─── App Search Palette ───────────────────────────────────────────────────────
const AppSearchPalette: React.FC<{ apps: App[]; onClose: () => void }> = ({ apps, onClose }) => {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = apps.filter(a =>
    a.name.toLowerCase().includes(query.toLowerCase()) ||
    a.description.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setSelected(0);
  }, [query]);

  const handleKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, filtered.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
    if (e.key === 'Enter' && filtered[selected]) { filtered[selected].onClick(); onClose(); }
    if (e.key === 'Escape') onClose();
  }, [filtered, selected, onClose]);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: '15vh'
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        width: '100%', maxWidth: 560,
        background: 'rgba(18,18,28,0.95)', backdropFilter: 'blur(30px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 16, overflow: 'hidden',
        boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)',
        animation: 'slideDown 0.15s ease-out'
      }}>
        {/* Search input */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 18px',
          borderBottom: '1px solid rgba(255,255,255,0.07)'
        }}>
          <Search size={16} color="rgba(255,255,255,0.4)" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Поиск приложений..."
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: '#fff', fontSize: 15, fontFamily: 'inherit'
            }}
          />
          <kbd style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 5, padding: '2px 7px',
            fontSize: 11, color: 'rgba(255,255,255,0.4)'
          }}>Esc</kbd>
        </div>

        {/* Results */}
        <div style={{ padding: '6px', maxHeight: 320, overflowY: 'auto' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
              Ничего не найдено
            </div>
          ) : (
            filtered.map((app, i) => (
              <div
                key={app.id}
                onClick={() => { app.onClick(); onClose(); }}
                onMouseEnter={() => setSelected(i)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                  background: selected === i ? 'rgba(99,102,241,0.2)' : 'transparent',
                  border: selected === i ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
                  transition: 'all 0.1s'
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                  background: app.color, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {React.cloneElement(app.icon as React.ReactElement, { size: 20 })}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#fff', fontSize: 14, fontWeight: 500 }}>{app.name}</div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 1 }}>{app.description}</div>
                </div>
                {selected === i && (
                  <kbd style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 5, padding: '2px 7px',
                    fontSize: 11, color: 'rgba(255,255,255,0.5)'
                  }}>Enter</kbd>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div style={{
          display: 'flex', gap: 16, padding: '8px 18px',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          color: 'rgba(255,255,255,0.3)', fontSize: 11
        }}>
          <span>↑↓ навигация</span>
          <span>Enter открыть</span>
          <span>Esc закрыть</span>
        </div>
      </div>
    </div>
  );
};

// ─── Profile Modal ────────────────────────────────────────────────────────────
const ProfileModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { currentUserId, users, updateUser, setActiveApp } = useStore();
  const currentUser = users.find(u => u.id === currentUserId);

  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [jobTitle, setJobTitle] = useState(currentUser?.jobTitle || '');
  const [color, setColor] = useState(currentUser?.color || '#6366f1');

  if (!currentUser) return null;

  const AVATAR_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#38bdf8', '#a855f7', '#ec4899', '#14b8a6', '#f97316', '#84cc16'];
  const avatarInitials = name.trim().split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('') || currentUser.avatar;

  const handleSave = () => {
    updateUser(currentUserId, { name: name.trim(), email: email.trim(), jobTitle: jobTitle.trim(), color, avatar: avatarInitials });
    onClose();
  };

  const handleLogout = () => {
    setActiveApp('login');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()} style={{ zIndex: 1000 }}>
      <div className="modal" style={{ maxWidth: 400, background: 'rgba(18,18,28,0.95)', backdropFilter: 'blur(30px)', border: '1px solid rgba(255,255,255,0.1)' }}>

        {/* Header */}
        <div className="modal-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <h2 className="modal-title" style={{ color: '#fff' }}>Мой профиль</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose} style={{ color: '#fff' }}><X size={18} /></button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Avatar + color picker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div className="avatar" style={{ width: 64, height: 64, fontSize: 24, background: color, flexShrink: 0, boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
              {avatarInitials}
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>Цвет аватара</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {AVATAR_COLORS.map(c => (
                  <div key={c} onClick={() => setColor(c)} style={{
                    width: 20, height: 20, borderRadius: '50%', background: c, cursor: 'pointer',
                    border: color === c ? '2px solid #fff' : '2px solid transparent',
                    boxShadow: color === c ? `0 0 0 2px ${c}80` : 'none',
                    transition: 'all 0.15s'
                  }} />
                ))}
              </div>
            </div>
          </div>

          {/* Fields */}
          <div className="form-group">
            <label className="form-label" style={{ color: 'rgba(255,255,255,0.6)' }} htmlFor="profile-name">Имя и фамилия</label>
            <input id="profile-name" name="profile-name" className="form-control"
              style={{ background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
              value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label" style={{ color: 'rgba(255,255,255,0.6)' }} htmlFor="profile-email">Email</label>
            <input id="profile-email" name="profile-email" className="form-control" type="email"
              style={{ background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
              value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label" style={{ color: 'rgba(255,255,255,0.6)' }} htmlFor="profile-jobtitle">Должность</label>
            <input id="profile-jobtitle" name="profile-jobtitle" className="form-control"
              style={{ background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
              value={jobTitle} onChange={e => setJobTitle(e.target.value)} />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
            {/* Logout */}
            <button
              onClick={handleLogout}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                color: '#ef4444', borderRadius: 8, padding: '7px 12px',
                fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
            >
              <LogOut size={14} />
              Выйти
            </button>

            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary" style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }} onClick={onClose}>Отмена</button>
              <button className="btn btn-primary" onClick={handleSave}><Check size={14} /> Сохранить</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OSDesktop;
