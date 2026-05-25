import React, { useState } from 'react';
import { useServiceStore } from '../serviceStore';
import type { TicketStatus, Ticket } from '../serviceStore';
import { Plus, Search } from 'lucide-react';
import TicketModal from '../components/TicketModal';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core';

const getCategoryInfo = (category: string) => {
  switch (category) {
    case 'it': return { label: 'IT', bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' };
    case 'electric': return { label: 'Электрика', bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' };
    case 'plumbing': return { label: 'Сантехника', bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981' };
    case 'furniture': return { label: 'Мебель', bg: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' };
    default: return { label: 'Другое', bg: 'rgba(107, 114, 128, 0.1)', color: '#6b7280' };
  }
};

const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins} мин назад`;
  if (diffHours < 24) return `${diffHours} ч назад`;
  if (diffDays === 1) return `Вчера в ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
  return date.toLocaleDateString();
};

// --- Sortable Item ---
const DraggableTicket = ({ ticket, getPriorityLabel }: { ticket: Ticket, getPriorityLabel: (p: string) => string }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: ticket.id,
    data: ticket
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: isDragging ? 999 : undefined,
    opacity: isDragging ? 0.4 : 1,
  } : undefined;

  const catInfo = getCategoryInfo(ticket.category);

  return (
    <div 
      ref={setNodeRef}
      style={{ 
        ...style, cursor: 'grab', padding: 'var(--space-4)', 
        display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', position: 'relative',
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)', border: '1px solid var(--border-subtle)'
      }}
      {...listeners}
      {...attributes}
      className="stat-card group hover-elevate"
      onClick={() => {
        // Only open ticket if not dragging (handled automatically by pointer sensor tolerance)
        useServiceStore.getState().openTicket(ticket.id);
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)' }}>
          SD-{ticket.number || ticket.id.slice(0, 6)}
        </span>
        <span className={`badge priority-badge ${ticket.priority === 'critical' ? 'urgent' : ticket.priority}`}>
          {getPriorityLabel(ticket.priority)}
        </span>
      </div>
      
      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, lineHeight: 1.4 }}>{ticket.title}</div>
      
      {ticket.photoUrl && (
        <div style={{ borderRadius: 'var(--radius-sm)', overflow: 'hidden', height: 120, border: '1px solid var(--border-subtle)' }}>
          <img src={ticket.photoUrl} alt="Фото проблемы" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
      )}
      
      {(ticket.location || ticket.reporterName) && (
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {ticket.location && <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>📍 {ticket.location}</div>}
          {ticket.reporterName && <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>👤 {ticket.reporterName} {ticket.telegramUsername ? <span style={{ color: 'var(--text-muted)' }}>({ticket.telegramUsername})</span> : ''}</div>}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
        <span style={{ 
          background: catInfo.bg, color: catInfo.color, padding: '2px 8px', 
          borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', fontWeight: 600 
        }}>
          {catInfo.label}
        </span>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>
          {formatRelativeTime(ticket.createdAt)}
        </span>
      </div>
    </div>
  );
};

// --- Droppable Column ---
const DroppableColumn = ({ id, title, tickets, getPriorityLabel }: { id: string, title: string, tickets: Ticket[], getPriorityLabel: (p: string) => string }) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className="kanban-column" style={{ background: isOver ? 'var(--bg-elevated)' : undefined }}>
      <div style={{ padding: 'var(--space-4)', fontWeight: 600, display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)' }}>
        <span>{title}</span>
        <span className="badge" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>{tickets.length}</span>
      </div>
      <div ref={setNodeRef} style={{ padding: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', overflowY: 'auto', flex: 1, minHeight: 100 }}>
        {tickets.map(ticket => (
          <DraggableTicket key={ticket.id} ticket={ticket} getPriorityLabel={getPriorityLabel} />
        ))}
      </div>
    </div>
  );
};

const TicketsBoard: React.FC = () => {
  const { tickets, searchQuery, filterStatus, setSearchQuery, setFilterStatus } = useServiceStore();
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  
  const columns: { id: TicketStatus; title: string }[] = [
    { id: 'new', title: 'Открытые' },
    { id: 'in_progress', title: 'В работе' },
    { id: 'resolved', title: 'Выполнены' },
  ];

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'critical': return 'Критичный';
      case 'high': return 'Высокий';
      case 'medium': return 'Средний';
      case 'low': return 'Низкий';
      default: return priority;
    }
  };

  const handleCreateTicket = () => {
    useServiceStore.getState().createTicket({
      title: 'Новая поломка',
      description: 'Описание проблемы...',
      category: 'it',
      priority: 'medium',
    });
  };

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus ? t.status === filterStatus : true;
    return matchesSearch && matchesStatus && t.status !== 'closed';
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: any) => {
    const { active } = event;
    setActiveTicket(tickets.find(t => t.id === active.id) || null);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    setActiveTicket(null);
    
    if (over && active.id !== over.id) {
      const ticket = tickets.find(t => t.id === active.id);
      if (ticket && ticket.status !== over.id) {
        useServiceStore.getState().updateTicket(ticket.id, { status: over.id as TicketStatus });
      }
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: 'var(--space-4) var(--space-6)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)' }}>
        
        <div style={{ display: 'flex', gap: 'var(--space-4)', flex: 1, maxWidth: 800 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, maxWidth: 300, background: 'var(--bg-surface)', padding: '0 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', height: 38 }}>
            <Search size={16} color="var(--text-muted)" style={{ minWidth: 16 }} />
            <input 
              type="text" 
              placeholder="Номер, название..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%', fontSize: 'var(--text-sm)', height: '100%', padding: 0 }} 
            />
          </div>
          
          <div style={{ display: 'flex', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: 4, height: 38 }}>
            {[
              { id: '', label: 'Все' },
              { id: 'new', label: 'Новые' },
              { id: 'in_progress', label: 'В работе' },
              { id: 'resolved', label: 'Выполнены' }
            ].map(f => (
              <button 
                key={f.id}
                onClick={() => setFilterStatus((f.id as TicketStatus) || null)}
                style={{ 
                  padding: '0 16px', border: 'none', borderRadius: 'var(--radius-sm)', 
                  background: filterStatus === (f.id || null) ? 'var(--bg-surface)' : 'transparent',
                  color: filterStatus === (f.id || null) ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: filterStatus === (f.id || null) ? 600 : 500,
                  boxShadow: filterStatus === (f.id || null) ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  cursor: 'pointer', transition: 'all 0.2s', fontSize: 'var(--text-sm)'
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <button className="btn btn-secondary" onClick={() => useServiceStore.getState().setActiveView('archive')}>
            🗄 Архив
          </button>
          <button className="btn btn-primary" onClick={handleCreateTicket}>
            <Plus size={16} /> Создать заявку
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 'var(--space-6)' }}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="kanban-board">
            {columns.map(col => (
              <DroppableColumn 
                key={col.id} 
                id={col.id} 
                title={col.title} 
                tickets={filteredTickets.filter(t => t.status === col.id)} 
                getPriorityLabel={getPriorityLabel} 
              />
            ))}
          </div>
          
          <DragOverlay>
            {activeTicket ? (
              <div 
                className="stat-card"
                style={{ 
                  padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', 
                  transform: 'scale(1.05)', opacity: 0.95, boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    SD-{activeTicket.number || activeTicket.id.slice(0, 6)}
                  </span>
                  <span className={`badge priority-badge ${activeTicket.priority === 'critical' ? 'urgent' : activeTicket.priority}`}>
                    {getPriorityLabel(activeTicket.priority)}
                  </span>
                </div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, lineHeight: 1.4 }}>{activeTicket.title}</div>
                {activeTicket.photoUrl && (
                  <div style={{ borderRadius: 'var(--radius-sm)', overflow: 'hidden', height: 120, border: '1px solid var(--border-subtle)' }}>
                    <img src={activeTicket.photoUrl} alt="Фото проблемы" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  </div>
                )}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
      
      <TicketModal />
    </div>
  );
};

export default TicketsBoard;
