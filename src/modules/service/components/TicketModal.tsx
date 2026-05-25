import React, { useState } from 'react';
import { useServiceStore } from '../serviceStore';
import type { TicketPriority } from '../serviceStore';
import { X, MapPin, User, Calendar, Image as ImageIcon, MessageSquare, Send } from 'lucide-react';

const TicketModal: React.FC = () => {
  const { tickets, users, selectedTicketId, closeTicket, updateTicket, postComment } = useServiceStore();
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  if (!selectedTicketId) return null;
  
  const ticket = tickets.find(t => t.id === selectedTicketId);
  if (!ticket) return null;

  const handlePostComment = async () => {
    if (!commentText.trim()) return;
    setIsSubmitting(true);
    await postComment(ticket.id, commentText);
    setCommentText('');
    setIsSubmitting(false);
  };



  const handleAssigneeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateTicket(ticket.id, { assigneeId: e.target.value || null });
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000,
      padding: 'var(--space-4)'
    }}>
      <div className="card" style={{
        width: '100%', maxWidth: 600, maxHeight: '90vh',
        display: 'flex', flexDirection: 'column',
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: 'var(--space-4) var(--space-6)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <span style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--text-primary)' }}>
              Заявка #{ticket.number}
            </span>
            <span className="tag">{ticket.category}</span>
          </div>
          <button 
            onClick={closeTicket}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: 'var(--space-6)', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          
          <div>
            <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>{ticket.title}</h2>
            <p style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
              {ticket.description}
            </p>
          </div>

          {/* Status Actions */}
          <div style={{ 
            display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'center', 
            background: 'var(--bg-elevated)', padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-md)' 
          }}>
            <span style={{ fontWeight: 600, marginRight: 'auto', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              Статус: 
              <span style={{ 
                padding: '4px 12px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-sm)',
                background: ticket.status === 'new' ? 'rgba(59, 130, 246, 0.1)' : 
                           ticket.status === 'in_progress' ? 'rgba(245, 158, 11, 0.1)' : 
                           ticket.status === 'resolved' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                color: ticket.status === 'new' ? '#3b82f6' : 
                       ticket.status === 'in_progress' ? '#f59e0b' : 
                       ticket.status === 'resolved' ? '#10b981' : '#6b7280'
              }}>
                {ticket.status === 'new' ? 'Новая 🆕' : 
                 ticket.status === 'in_progress' ? 'В работе ⏳' : 
                 ticket.status === 'resolved' ? 'Выполнена ✅' : 'Закрыта 🚫'}
              </span>
            </span>

            {ticket.status === 'new' && (
              <>
                <button 
                  onClick={() => updateTicket(ticket.id, { status: 'in_progress' })}
                  style={{ 
                    padding: '8px 16px', background: 'var(--primary)', color: 'white', 
                    border: 'none', borderRadius: 'var(--radius-full)', fontWeight: 600, cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  Взять в работу
                </button>
                <button 
                  onClick={() => updateTicket(ticket.id, { status: 'closed' })}
                  style={{ 
                    padding: '8px 16px', background: 'transparent', color: 'var(--text-secondary)', 
                    border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-full)', fontWeight: 500, cursor: 'pointer'
                  }}
                >
                  Отклонить
                </button>
              </>
            )}

            {ticket.status === 'in_progress' && (
              <>
                <button 
                  onClick={() => updateTicket(ticket.id, { status: 'resolved' })}
                  style={{ 
                    padding: '8px 16px', background: '#10b981', color: 'white', 
                    border: 'none', borderRadius: 'var(--radius-full)', fontWeight: 600, cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  Отметить выполненной
                </button>
                <button 
                  onClick={() => updateTicket(ticket.id, { status: 'closed' })}
                  style={{ 
                    padding: '8px 16px', background: 'transparent', color: 'var(--text-secondary)', 
                    border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-full)', fontWeight: 500, cursor: 'pointer'
                  }}
                >
                  Отменить заявку
                </button>
              </>
            )}

            {(ticket.status === 'resolved' || ticket.status === 'closed') && (
              <button 
                onClick={() => updateTicket(ticket.id, { status: 'in_progress' })}
                style={{ 
                  padding: '8px 16px', background: 'transparent', color: 'var(--primary)', 
                  border: '1px solid var(--primary)', borderRadius: 'var(--radius-full)', fontWeight: 500, cursor: 'pointer'
                }}
              >
                Вернуть в работу
              </button>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-secondary)' }}>Исполнитель</span>
              <div style={{ position: 'relative' }}>
                <select 
                  value={ticket.assigneeId || ''} 
                  onChange={handleAssigneeChange}
                  className="input"
                  style={{ 
                    height: 42, width: '100%', cursor: 'pointer', appearance: 'none', 
                    background: 'var(--bg-surface)', fontWeight: 500,
                    border: '2px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '0 16px'
                  }}
                >
                  <option value="">👤 Не назначен</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>🧑‍🔧 {u.name}</option>
                  ))}
                </select>
                <div style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }}>
                  ▼
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-secondary)' }}>Приоритет</span>
              <div style={{ display: 'flex', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: 4, height: 42 }}>
                {[
                  { id: 'low', label: 'Низкий' },
                  { id: 'medium', label: 'Средний' },
                  { id: 'high', label: 'Высокий' },
                  { id: 'critical', label: 'Критичный' }
                ].map(p => (
                  <button 
                    key={p.id}
                    onClick={() => updateTicket(ticket.id, { priority: p.id as TicketPriority })}
                    style={{ 
                      flex: 1, border: 'none', borderRadius: 'var(--radius-sm)', 
                      background: ticket.priority === p.id ? 'var(--bg-surface)' : 'transparent',
                      color: ticket.priority === p.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                      fontWeight: ticket.priority === p.id ? 600 : 500,
                      boxShadow: ticket.priority === p.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      cursor: 'pointer', transition: 'all 0.2s', fontSize: 'var(--text-sm)'
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
            {ticket.location && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--text-secondary)' }}>
                <MapPin size={16} />
                <span>{ticket.location}</span>
              </div>
            )}
            
            {ticket.reporterName && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--text-secondary)' }}>
                <User size={16} />
                <span>{ticket.reporterName} {ticket.telegramUsername ? `(${ticket.telegramUsername})` : ''}</span>
              </div>
            )}
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--text-secondary)' }}>
              <Calendar size={16} />
              <span>{new Date(ticket.createdAt).toLocaleString()}</span>
            </div>
          </div>

          {ticket.photoUrl && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)', color: 'var(--text-secondary)', fontWeight: 500 }}>
                <ImageIcon size={16} />
                <span>Прикрепленное фото</span>
              </div>
              <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                <img src={ticket.photoUrl} alt="Фото поломки" style={{ width: '100%', display: 'block' }} />
              </div>
            </div>
          )}

          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-6)', marginTop: 'var(--space-2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', fontWeight: 600 }}>
              <MessageSquare size={18} />
              <span>Комментарии ({(ticket.comments || []).length})</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
              {(ticket.comments || []).map(comment => (
                <div key={comment.id} style={{ 
                  background: 'var(--bg-elevated)', 
                  padding: 'var(--space-3)', 
                  borderRadius: 'var(--radius-md)',
                  display: 'flex', flexDirection: 'column', gap: 'var(--space-1)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                    <span>{comment.authorId ? users.find(u => u.id === comment.authorId)?.name || 'Сотрудник' : ticket.reporterName}</span>
                    <span>{new Date(comment.createdAt).toLocaleString()}</span>
                  </div>
                  <p style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: 'var(--text-sm)' }}>
                    {comment.text}
                  </p>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <input
                type="text"
                className="input"
                placeholder="Написать комментарий..."
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handlePostComment()}
                disabled={isSubmitting}
                style={{ flex: 1 }}
              />
              <button 
                className="btn btn-primary" 
                onClick={handlePostComment}
                disabled={isSubmitting || !commentText.trim()}
                style={{ padding: '0 var(--space-4)' }}
              >
                <Send size={16} />
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default TicketModal;
