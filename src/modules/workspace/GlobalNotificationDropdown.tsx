import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useStore } from '../../store';
import { useFinanceStore } from '../finance/financeStore';
import { Bell, CheckCircle2, Clock } from 'lucide-react';

export const GlobalNotificationDropdown: React.FC = () => {
  const arcanaNotifs = useStore(state => state.notifications);
      const markArcanaRead = useStore(state => state.markRead);
      const markAllArcanaRead = useStore(state => state.markAllRead);
      const setGlobalNotificationsOpen = useStore(state => state.setGlobalNotificationsOpen);
      const setActivePage = useStore(state => state.setActivePage);
      const setActiveApp = useStore(state => state.setActiveApp);
  const { notifications: financeNotifs, markNotificationRead: markFinanceRead, markAllNotificationsRead: markAllFinanceRead, setActiveView } = useFinanceStore();
  
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const allNotifs = useMemo(() => {
    const mappedArcana = arcanaNotifs.map(n => ({
      id: `arcana-${n.id}`,
      originalId: n.id,
      source: 'arcana' as const,
      title: n.title,
      body: n.body,
      isRead: n.read,
      timestamp: new Date(n.createdAt).getTime(),
      type: n.type,
      taskId: n.taskId
    }));

    const mappedFinance = financeNotifs.map(n => ({
      id: `finance-${n.id}`,
      originalId: n.id,
      source: 'finance' as const,
      title: n.title,
      body: n.body,
      isRead: n.isRead,
      timestamp: new Date(n.timestamp).getTime(),
      type: n.type
    }));

    return [...mappedArcana, ...mappedFinance].sort((a, b) => b.timestamp - a.timestamp);
  }, [arcanaNotifs, financeNotifs]);

  const unreadCount = allNotifs.filter(n => !n.isRead).length;

  const handleMarkAllRead = () => {
    markAllArcanaRead();
    markAllFinanceRead();
  };

  const handleNotifClick = (notif: any) => {
    if (notif.source === 'arcana') {
      markArcanaRead(notif.originalId);
      setActiveApp('workspace');
      setActivePage('inbox');
    } else {
      markFinanceRead(notif.originalId);
      setActiveApp('finance');
      setActiveView('notifications');
    }
    setIsOpen(false);
  };

  const alertColor = { danger: '#ef4444', warning: '#f59e0b', info: '#3b82f6', mention: '#3b82f6', assigned: '#6366f1', due_soon: '#f59e0b', completed: '#10b981' };

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        className="theme-toggle"
        onClick={() => setIsOpen(o => !o)}
        data-tooltip-bottom="Уведомления"
        style={{ position: 'relative' }}
      >
        <Bell size={13} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: -2, right: -2,
            width: 8, height: 8, borderRadius: '50%',
            background: 'var(--color-primary)',
            border: '1.5px solid var(--bg-surface)',
          }} />
        )}
      </button>

      {isOpen && (
        <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 340, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8, boxShadow: '0 8px 32px rgba(0,0,0,0.1)', overflow: 'hidden', zIndex: 999 }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>Все уведомления</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{unreadCount} новых</div>
          </div>

          <div style={{ maxHeight: 380, overflowY: 'auto' }}>
            {allNotifs.filter(n => !n.isRead).length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                <CheckCircle2 size={24} style={{ margin: '0 auto 8px', display: 'block', color: 'var(--text-muted)' }} />
                Нет новых уведомлений.
              </div>
            ) : allNotifs.filter(n => !n.isRead).map(notif => (
              <div 
                key={notif.id} 
                onClick={() => handleNotifClick(notif)}
                style={{ 
                  padding: '12px 16px', 
                  borderBottom: '1px solid var(--border-subtle)', 
                  background: 'var(--bg-hover)', 
                  display: 'flex', 
                  gap: 12, 
                  alignItems: 'flex-start',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
              >
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: (alertColor as any)[notif.type] || '#3b82f6', marginTop: 5, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>
                    <span style={{ fontSize: 10, padding: '1px 4px', borderRadius: 4, background: notif.source === 'arcana' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(16, 185, 129, 0.2)', color: notif.source === 'arcana' ? '#6366f1' : '#10b981', marginRight: 6 }}>
                      {notif.source === 'arcana' ? 'Tracker' : 'Finance'}
                    </span>
                    {notif.title}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{notif.body}</div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={10} /> {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>

          <div style={{ padding: '8px', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <button 
              onClick={() => { setGlobalNotificationsOpen(true); setIsOpen(false); }}
              style={{ background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: 12, fontWeight: 500, cursor: 'pointer', padding: '6px 12px', borderRadius: 4, width: '100%', marginBottom: 4 }}
            >
              Открыть в окне
            </button>
            <button 
              onClick={handleMarkAllRead}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: 12, fontWeight: 500, cursor: 'pointer', padding: '6px 12px', borderRadius: 4, width: '100%', transition: 'background 0.15s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
              Отметить всё прочитанным
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
