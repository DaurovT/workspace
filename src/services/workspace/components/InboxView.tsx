import React, { useMemo } from 'react';
import { useStore } from '../../../store';
import { 
  Bell, AtSign, UserPlus, Clock, CheckCircle2,
  MoreHorizontal, CheckSquare
} from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { ru } from 'date-fns/locale';

const getNotifIcon = (type: string) => {
  switch (type) {
    case 'mention': return <AtSign size={16} color="var(--color-info)" />;
    case 'assigned': return <UserPlus size={16} color="var(--color-primary)" />;
    case 'due_soon': return <Clock size={16} color="var(--color-warning)" />;
    case 'completed': return <CheckCircle2 size={16} color="var(--color-success)" />;
    default: return <Bell size={16} color="var(--text-muted)" />;
  }
};

const formatTime = (isoString: string) => {
  const d = new Date(isoString);
  if (isToday(d)) return format(d, 'HH:mm', { locale: ru });
  if (isYesterday(d)) return 'Вчера, ' + format(d, 'HH:mm', { locale: ru });
  return format(d, 'd MMM HH:mm', { locale: ru });
};

const InboxView: React.FC = () => {
  const { notifications, markRead, markAllRead, openEditTask } = useStore();

  const { unread, read } = useMemo(() => {
    return {
      unread: notifications.filter(n => !n.read).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      read: notifications.filter(n => n.read).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    };
  }, [notifications]);

  const handleNotifClick = (id: string, taskId: string | null) => {
    markRead(id);
    if (taskId) {
      openEditTask(taskId);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
            <InboxIcon /> Входящие
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0', fontSize: 13 }}>
            {unread.length > 0 ? `У вас ${unread.length} непрочитанных уведомлений` : 'У вас нет новых уведомлений'}
          </p>
        </div>
        {unread.length > 0 && (
          <button className="btn btn-secondary" onClick={markAllRead}>
            <CheckSquare size={14} /> Пометить все как прочитанные
          </button>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 40 }}>
        {/* UNREAD SECTION */}
        {unread.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Новые
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {unread.map(n => (
                <div 
                  key={n.id}
                  className="kanban-card"
                  style={{ 
                    cursor: 'pointer', padding: '16px', display: 'flex', gap: 16, 
                    borderLeft: '3px solid var(--color-primary)'
                  }}
                  onClick={() => handleNotifClick(n.id, n.taskId)}
                >
                  <div style={{ padding: 6, background: 'var(--bg-elevated)', borderRadius: '50%', height: 28, width: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {getNotifIcon(n.type)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{n.title}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatTime(n.createdAt)}</span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {n.body}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {unread.length === 0 && read.length === 0 && (
          <div className="empty-state" style={{ marginTop: 60 }}>
            <div className="empty-state-icon">
              <CheckCircle2 size={32} color="var(--color-success)" />
            </div>
            <div className="empty-state-title">Входящие пусты</div>
            <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Вы прочитали все уведомления!</p>
          </div>
        )}

        {/* READ SECTION */}
        {read.length > 0 && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Прочитанные
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {read.map(n => (
                <div 
                  key={n.id}
                  className="kanban-card"
                  style={{ 
                    cursor: 'pointer', padding: '16px', display: 'flex', gap: 16,
                    opacity: 0.6, boxShadow: 'none', background: 'transparent',
                    border: '1px solid var(--border-subtle)'
                  }}
                  onClick={() => handleNotifClick(n.id, n.taskId)}
                >
                  <div style={{ padding: 6, background: 'var(--bg-elevated)', borderRadius: '50%', height: 28, width: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {getNotifIcon(n.type)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{n.title}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatTime(n.createdAt)}</span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {n.body}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// SVG Icon specific for page header
const InboxIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline>
    <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path>
  </svg>
);

export default InboxView;
