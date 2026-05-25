import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store';
import {
  Truck, Search,
  Aperture, Settings, Rat, Origami, Lock, UserPlus, ShoppingCart, Wrench
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
  const setActiveApp = useStore(state => state.setActiveApp);
      const setActivePage = useStore(state => state.setActivePage);
      const currentUserId = useStore(state => state.currentUserId);
      const users = useStore(state => state.users);
  const [time, setTime] = useState(new Date());
  const [showSearch, setShowSearch] = useState(false);
  const [accessDenied, setAccessDenied] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const currentUser = users.find(u => u.id === currentUserId);
  // Owners and admins always have full access
  const isAdmin = !currentUser || currentUser.role === 'owner' || currentUser.role === 'admin';

  const canOpenApp = (appId: string) => {
    if (isAdmin) return true;
    if (!currentUser?.allowedApps) return true; // no restriction set
    return currentUser.allowedApps.includes(appId);
  };

  const tryOpenApp = (appId: string, action: () => void) => {
    if (canOpenApp(appId)) {
      action();
    } else {
      setAccessDenied(appId);
      setTimeout(() => setAccessDenied(null), 2500);
    }
  };

  const apps: App[] = [
    {
      id: 'workspace',
      name: 'Arcana',
      description: 'Задачи, Канбан, Диаграмма Ганта',
      icon: (size: number) => <Aperture size={size} color="#fff" />,
      color: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      onClick: () => tryOpenApp('workspace', () => { setActiveApp('workspace'); setActivePage('dashboard'); })
    },
    {
      id: 'bpmn',
      name: 'BPMN Studio',
      description: 'Редактор бизнес-процессов',
      icon: (size: number) => <Rat size={size} color="#fff" />,
      color: 'linear-gradient(135deg, #6366f1, #4f46e5)',
      onClick: () => tryOpenApp('bpmn', () => setActiveApp('bpmn'))
    },
    {
      id: 'finance',
      name: 'Manor',
      description: 'Управленческий учет',
      icon: (size: number) => <Origami size={size} color="#fff" />,
      color: 'linear-gradient(135deg, #10b981, #059669)',
      onClick: () => tryOpenApp('finance', () => setActiveApp('finance'))
    },
    {
      id: 'hr',
      name: 'HR Pulse',
      description: 'Кадры, зарплата, отсутствия',
      icon: (size: number) => <UserPlus size={size} color="#fff" />,
      color: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
      onClick: () => tryOpenApp('hr', () => setActiveApp('hr'))
    },
    {
      id: 'tms',
      name: 'TMS',
      description: 'Транспортная система',
      icon: (size: number) => <Truck size={size} color="#fff" />,
      color: 'linear-gradient(135deg, #ef4444, #b91c1c)',
      onClick: () => tryOpenApp('tms', () => setActiveApp('tms'))
    },
    {
      id: 'settings',
      name: 'Настройки',
      description: 'Управление системой',
      icon: (size: number) => <Settings size={size} color="#fff" />,
      color: 'linear-gradient(135deg, #475569, #1e293b)',
      onClick: () => tryOpenApp('settings', () => setActiveApp('settings'))
    },
    {
      id: 'procurement',
      name: 'Закупки',
      description: 'Закупочный контроль',
      icon: (size: number) => <ShoppingCart size={size} color="#fff" />,
      color: 'linear-gradient(135deg, #f59e0b, #d97706)',
      onClick: () => tryOpenApp('procurement', () => setActiveApp('procurement'))
    },
    {
      id: 'service',
      name: 'Service Desk',
      description: 'Ремонт и сервис',
      icon: (size: number) => <Wrench size={size} color="#fff" />,
      color: 'linear-gradient(135deg, #0ea5e9, #0369a1)',
      onClick: () => tryOpenApp('service', () => setActiveApp('service'))
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
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="os-desktop">
      {/* ── Access Denied Toast ── */}
      {accessDenied && (
        <div style={{
          position: 'fixed', top: 56, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(239,68,68,0.95)', backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,80,80,0.4)',
          borderRadius: 10, padding: '10px 18px',
          display: 'flex', alignItems: 'center', gap: 8,
          color: '#fff', fontSize: 13, fontWeight: 500,
          boxShadow: '0 8px 32px rgba(239,68,68,0.3)',
          zIndex: 9999, animation: 'slideDown 0.2s ease-out'
        }}>
          <Lock size={14} />
          Нет доступа к приложению «{apps.find(a => a.id === accessDenied)?.name ?? accessDenied}»
        </div>
      )}

      {/* ── Desktop Canvas ── */}
      <div className="os-desktop-canvas">
        {/* Header bar */}
        <div className="os-desktop-header">
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
              <span className="hide-on-mobile">Поиск</span>
              <span className="hide-on-mobile" style={{
                background: 'rgba(255,255,255,0.1)', borderRadius: 4,
                padding: '1px 5px', fontSize: 10, letterSpacing: '0.02em'
              }}>⌘K</span>
            </button>
            <span className="hide-on-mobile" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
              {format(time, 'EEEE d MMM, HH:mm', { locale: ru })}
            </span>
          </div>
        </div>

        <div className="os-app-grid">
          {apps.map(app => {
            const locked = !canOpenApp(app.id);
            return (
              <div key={app.id} className="os-app-icon-wrapper" onClick={app.onClick}
                style={{ opacity: locked ? 0.6 : 1 }}>
                <div className="os-app-icon" style={{ background: app.color, position: 'relative' }}>
                  {app.icon(32)}
                  {locked && (
                    <div style={{
                      position: 'absolute', bottom: 2, right: 2,
                      width: 16, height: 16, borderRadius: '50%',
                      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <Lock size={9} color="#fff" />
                    </div>
                  )}
                </div>
                <span className="os-app-label">{app.name}</span>
              </div>
            );
          })}
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
                  {app.icon(20)}
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

// ─── Profile section moved to SettingsApp ─────────────────────────────────────

export default OSDesktop;

