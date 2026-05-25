import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { useFinanceStore } from '../modules/finance/financeStore';
import { 
  Bell, CheckCircle2, Clock, CheckSquare, 
  Info, AlertTriangle, AlertCircle, AtSign, UserPlus
} from 'lucide-react';

export const GlobalNotificationsPage: React.FC = () => {
  const arcanaNotifs = useStore(state => state.notifications);
      const markArcanaRead = useStore(state => state.markRead);
      const markAllArcanaRead = useStore(state => state.markAllRead);
      const openEditTask = useStore(state => state.openEditTask);
      const setActiveApp = useStore(state => state.setActiveApp);
      const setActivePage = useStore(state => state.setActivePage);
      const setGlobalNotificationsOpen = useStore(state => state.setGlobalNotificationsOpen);
  const { notifications: financeNotifs, markNotificationRead: markFinanceRead, markAllNotificationsRead: markAllFinanceRead } = useFinanceStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

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

  const filteredNotifications = useMemo(() => {
    return allNotifs.filter(n => {
      const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            n.body.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === 'all' ? true : 
                          filterType === 'unread' ? !n.isRead : 
                          n.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [allNotifs, searchQuery, filterType]);



  const typeIcons: Record<string, React.ReactNode> = {
    danger: <AlertCircle size={14} color="#ef4444" />,
    warning: <AlertTriangle size={14} color="#f59e0b" />,
    info: <Info size={14} color="#3b82f6" />,
    mention: <AtSign size={14} color="#3b82f6" />,
    assigned: <UserPlus size={14} color="#6366f1" />,
    due_soon: <Clock size={14} color="#f59e0b" />,
    completed: <CheckCircle2 size={14} color="#10b981" />
  };

  const typeLabels: Record<string, string> = {
    danger: 'Критично',
    warning: 'Предупреждение',
    info: 'Инфо',
    mention: 'Упоминание',
    assigned: 'Назначено',
    due_soon: 'Дедлайн',
    completed: 'Готово'
  };

  const handleMarkAllRead = () => {
    markAllArcanaRead();
    markAllFinanceRead();
  };

  const handleNotifClick = (notif: any) => {
    setGlobalNotificationsOpen(false); // Close modal automatically
    
    if (notif.source === 'arcana') {
      markArcanaRead(notif.originalId);
      if (notif.taskId) {
        setActiveApp('workspace');
        setActivePage('my_tasks');
        openEditTask(notif.taskId);
      }
    } else {
      markFinanceRead(notif.originalId);
      setActiveApp('finance');
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-base)', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
        <div className="mobile-stack-wrap" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
              <Bell size={16} />
            </div>
            <div>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Архив уведомлений</span>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>События из Трекера и Финансов</p>
            </div>
          </div>
          <button 
            onClick={handleMarkAllRead}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <CheckSquare size={14} /> Отметить всё прочитанным
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: 16, alignItems: 'center', background: 'var(--bg-surface)', flexWrap: 'wrap' }}>
        <input 
          type="text" 
          placeholder="Поиск..." 
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-base)', color: 'var(--text-primary)', fontSize: 12, minWidth: 150 }}
        />
        <div style={{ display: 'flex', gap: 4 }}>
          {[
            { id: 'all', label: 'Все' },
            { id: 'unread', label: 'Новые' },
            { id: 'danger', label: 'Важные' },
            { id: 'assigned', label: 'Задачи' }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              style={{ 
                padding: '4px 10px', 
                fontSize: 12, 
                fontWeight: 500, 
                borderRadius: 6, 
                border: 'none', 
                background: filterType === tab.id ? 'var(--bg-elevated)' : 'transparent',
                color: filterType === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filteredNotifications.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
            <CheckCircle2 size={32} style={{ marginBottom: 12, opacity: 0.2 }} />
            <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>Уведомлений не найдено</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filteredNotifications.map(notif => (
              <div 
                key={notif.id}
                onClick={() => handleNotifClick(notif)}
                style={{ 
                  padding: '12px 20px', 
                  background: notif.isRead ? 'transparent' : 'var(--bg-surface)', 
                  borderBottom: '1px solid var(--border-subtle)', 
                  display: 'flex', 
                  gap: 12, 
                  alignItems: 'flex-start',
                  cursor: 'pointer',
                  position: 'relative',
                  opacity: notif.isRead ? 0.7 : 1,
                  transition: 'background 0.1s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--bg-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = notif.isRead ? 'transparent' : 'var(--bg-surface)';
                }}
              >
                {!notif.isRead && (
                  <div style={{ position: 'absolute', left: 0, top: 16, width: 3, height: 24, background: 'var(--color-primary)', borderRadius: '0 4px 4px 0' }} />
                )}
                
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {typeIcons[notif.type] || <Info size={14} />}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{notif.title}</span>
                      <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: notif.source === 'arcana' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: notif.source === 'arcana' ? '#6366f1' : '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                        {notif.source === 'arcana' ? 'Трекер' : 'Финансы'}
                        {typeLabels[notif.type] && <span style={{ opacity: 0.6 }}>•</span>}
                        {typeLabels[notif.type]}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                      {new Date(notif.timestamp).toLocaleString('ru-RU', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                    </div>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>{notif.body}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
