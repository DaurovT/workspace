import React, { useState, useRef, useMemo } from 'react';
import { useStore } from '../../store';
import type { Task, StatusId } from '../../store';
import { Plus, AlertTriangle, Users, Link as LinkIcon, Clock } from 'lucide-react';
import { format, isPast } from 'date-fns';
import { ru } from 'date-fns/locale';

const KanbanBoard: React.FC = () => {
  const tasks = useStore(state => state.tasks);
      const users = useStore(state => state.users);
      const columns = useStore(state => state.columns);
      const activeProjectId = useStore(state => state.activeProjectId);
      const openEditTask = useStore(state => state.openEditTask);
      const openNewTask = useStore(state => state.openNewTask);
      const updateTask = useStore(state => state.updateTask);
      const moveTask = useStore(state => state.moveTask);
      const kanbanGroupBy = useStore(state => state.kanbanGroupBy);

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overTargetId, setOverTargetId] = useState<string | null>(null); // "status|assigneeId"
  const [isTouchDragging, setIsTouchDragging] = useState(false);

  const dragData = useRef<{ taskId: string; fromStatus: StatusId; fromAssignee: string | null } | null>(null);
  const touchGhost = useRef<HTMLElement | null>(null);
  const touchOrigin = useRef<{ x: number; y: number } | null>(null);
  const touchTimeout = useRef<number | null>(null);
  const scrollInterval = useRef<number | null>(null);
  const boardContainerRef = useRef<HTMLDivElement | null>(null);

  // Clear timers on unmount
  React.useEffect(() => {
    return () => {
      if (touchTimeout.current) clearTimeout(touchTimeout.current);
      if (scrollInterval.current) clearInterval(scrollInterval.current);
    };
  }, []);

  const projectTasks = tasks.filter(t => t.projectId === activeProjectId && !t.parentId);

  // Определение групп (строк/swimlanes)
  const rows = useMemo(() => {
    if (kanbanGroupBy === 'none') {
      return [{ id: 'all', label: null, assigneeId: undefined, user: null }];
    }
    const assigneeRows = users.map(u => ({ id: u.id, label: u.name, assigneeId: u.id, user: u }));
    const unassignedRow = { id: 'unassigned', label: 'Без исполнителя', assigneeId: null, user: null };
    return [...assigneeRows, unassignedRow];
  }, [kanbanGroupBy, users]);

  const startAutoScroll = (clientX: number, clientY: number) => {
    if (!boardContainerRef.current) return;
    const container = boardContainerRef.current;
    const rect = container.getBoundingClientRect();
    const edgeSize = 65; // wider edge triggers earlier scroll
    const maxSpeed = 16; // speed at the very edge

    let speedX = 0;
    let speedY = 0;

    // Horizontal
    if (clientX > rect.right - edgeSize) {
      const ratio = (clientX - (rect.right - edgeSize)) / edgeSize;
      speedX = Math.min(ratio, 1) * maxSpeed;
    } else if (clientX < rect.left + edgeSize) {
      const ratio = ((rect.left + edgeSize) - clientX) / edgeSize;
      speedX = -Math.min(ratio, 1) * maxSpeed;
    }

    // Vertical
    if (clientY > rect.bottom - edgeSize) {
      const ratio = (clientY - (rect.bottom - edgeSize)) / edgeSize;
      speedY = Math.min(ratio, 1) * maxSpeed;
    } else if (clientY < rect.top + edgeSize) {
      const ratio = ((rect.top + edgeSize) - clientY) / edgeSize;
      speedY = -Math.min(ratio, 1) * maxSpeed;
    }

    if (speedX !== 0 || speedY !== 0) {
      if (!scrollInterval.current) {
        scrollInterval.current = window.setInterval(() => {
          if (boardContainerRef.current) {
            if (speedX !== 0) boardContainerRef.current.scrollLeft += speedX;
            if (speedY !== 0) boardContainerRef.current.scrollTop += speedY;
          }
        }, 16);
      }
    } else {
      stopAutoScroll();
    }
  };

  const stopAutoScroll = () => {
    if (scrollInterval.current) {
      clearInterval(scrollInterval.current);
      scrollInterval.current = null;
    }
  };

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    dragData.current = { taskId: task.id, fromStatus: task.status, fromAssignee: task.assigneeId };
    e.dataTransfer.effectAllowed = 'move';
    
    // Defer setting state to allow browser to capture full-opacity drag image
    setTimeout(() => {
      setDraggingId(task.id);
      setIsTouchDragging(false);
    }, 0);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setOverTargetId(targetId);
    startAutoScroll(e.clientX, e.clientY);
  };

  const handleDrop = (e: React.DragEvent, colId: StatusId, assigneeId: string | null | undefined) => {
    e.preventDefault();
    stopAutoScroll();
    if (!dragData.current) return;
    const { taskId, fromStatus, fromAssignee } = dragData.current;

    const currentTasksInCol = projectTasks.filter(t => t.status === colId).length;

    if (kanbanGroupBy === 'assignee' && assigneeId !== undefined) {
      if (fromStatus !== colId || fromAssignee !== assigneeId) {
        updateTask(taskId, { status: colId, assigneeId });
      }
    } else {
      if (fromStatus !== colId) {
        moveTask(taskId, colId, currentTasksInCol);
      }
    }

    setDraggingId(null);
    setOverTargetId(null);
    dragData.current = null;
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setOverTargetId(null);
    dragData.current = null;
    stopAutoScroll();
  };

  // ─── Touch DnD (mobile) ────────────────────────────────────────────────
  const handleTouchStart = (e: React.TouchEvent, task: Task) => {
    const touch = e.touches[0];
    touchOrigin.current = { x: touch.clientX, y: touch.clientY };

    if (touchTimeout.current) clearTimeout(touchTimeout.current);

    // 220ms long press for premium mobile feel
    touchTimeout.current = window.setTimeout(() => {
      dragData.current = { taskId: task.id, fromStatus: task.status, fromAssignee: task.assigneeId };
      setIsTouchDragging(true);

      // Create ghost clone
      const card = e.currentTarget as HTMLElement;
      const rect = card.getBoundingClientRect();
      const ghost = card.cloneNode(true) as HTMLElement;
      ghost.style.cssText = `
        position: fixed; pointer-events: none; z-index: 9999;
        width: ${rect.width}px; opacity: 0.85;
        left: ${rect.left}px; top: ${rect.top}px;
        transform: scale(1.04) rotate(1.5deg);
        box-shadow: 0 20px 40px rgba(0,0,0,0.25);
        border-radius: 12px;
        transition: none;
      `;
      document.body.appendChild(ghost);
      touchGhost.current = ghost;
      setDraggingId(task.id);

      if (navigator.vibrate) {
        navigator.vibrate(15); // gentle premium haptic click
      }
    }, 220);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];

    // If drag hasn't started yet, cancel if moved beyond threshold
    if (!touchGhost.current) {
      if (touchOrigin.current) {
        const dx = touch.clientX - touchOrigin.current.x;
        const dy = touch.clientY - touchOrigin.current.y;
        if (Math.sqrt(dx * dx + dy * dy) > 10) {
          if (touchTimeout.current) {
            clearTimeout(touchTimeout.current);
            touchTimeout.current = null;
          }
        }
      }
      return; // allow default viewport scrolling
    }

    // Actively dragging: prevent scroll and move ghost
    e.preventDefault();
    const ghost = touchGhost.current;
    if (!ghost) return;

    const w = ghost.offsetWidth;
    ghost.style.left = `${touch.clientX - w / 2}px`;
    ghost.style.top  = `${touch.clientY - 40}px`;

    // Find which column the finger is over (ghost has pointer-events: none)
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const colEl = el?.closest('[data-col-drop]') as HTMLElement | null;
    const targetId = colEl?.dataset.colDrop ?? null;
    setOverTargetId(targetId);

    // Dynamic auto-scrolling
    startAutoScroll(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchTimeout.current) {
      clearTimeout(touchTimeout.current);
      touchTimeout.current = null;
    }
    stopAutoScroll();

    const ghost = touchGhost.current;
    if (ghost) { 
      ghost.remove(); 
      touchGhost.current = null; 
    }

    if (!isTouchDragging) {
      // Tap finished before long press triggered
      setDraggingId(null);
      setOverTargetId(null);
      dragData.current = null;
      touchOrigin.current = null;
      return;
    }

    const touch = e.changedTouches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const colEl = el?.closest('[data-col-drop]') as HTMLElement | null;

    if (colEl && dragData.current) {
      const dropTarget = colEl.dataset.colDrop || '';
      const colId = dropTarget.split('|')[0] as StatusId;
      const assigneeId = colEl.dataset.assignee === 'undefined' ? undefined
        : colEl.dataset.assignee === 'null' ? null
        : colEl.dataset.assignee;
      const { taskId, fromStatus, fromAssignee } = dragData.current;
      const currentTasksInCol = projectTasks.filter(t => t.status === colId).length;

      if (kanbanGroupBy === 'assignee' && assigneeId !== undefined) {
        if (fromStatus !== colId || fromAssignee !== assigneeId) {
          updateTask(taskId, { status: colId, assigneeId });
        }
      } else if (fromStatus !== colId) {
        moveTask(taskId, colId, currentTasksInCol);
      }
    }

    setDraggingId(null);
    setOverTargetId(null);
    dragData.current = null;
    touchOrigin.current = null;
    setIsTouchDragging(false);
  };

  // Компонент одной карточки (чтобы не дублировать код)
  const TaskCard = ({ task }: { task: Task }) => {
    const assignee = users.find(u => u.id === task.assigneeId);
    const isDragging = draggingId === task.id;
    const isOverdue = task.status !== 'done' && isPast(new Date(task.dueDate));

    // Dynamic styling for dragging
    let cardStyle: React.CSSProperties | undefined = undefined;
    let cardClass = `kanban-card ${task.priority}`;

    if (isDragging) {
      if (isTouchDragging) {
        // Mobile ghost dragging: completely hide original card
        cardStyle = { opacity: 0, pointerEvents: 'none' };
      } else {
        // Desktop standard dragging: use beautiful dashed outline placeholder
        cardClass += ' dragging-placeholder';
      }
    }

    return (
      <div
        className={cardClass}
        draggable
        onDragStart={(e) => handleDragStart(e, task)}
        onDragEnd={handleDragEnd}
        onTouchStart={(e) => handleTouchStart(e, task)}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => !isDragging && openEditTask(task.id)}
        id={`kanban-card-${task.id}`}
        style={cardStyle}
      >
        {task.tags.length > 0 && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>
            {task.tags.slice(0, 2).map(tag => (
              <span key={tag} className="tag" style={{ fontSize: 10 }}>{tag}</span>
            ))}
          </div>
        )}
        <div className="kanban-card-title">{task.title}</div>
        {(() => {
          const subIssues = tasks.filter(t => t.parentId === task.id);
          if (subIssues.length === 0) return null;
          const completedSubs = subIssues.filter(t => t.status === 'done').length;
          return (
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{completedSubs}/{subIssues.length} подзадач</span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{Math.round((completedSubs / subIssues.length) * 100)}%</span>
              </div>
              <div className="progress-bar" style={{ height: 3 }}>
                <div className="progress-fill" style={{ width: `${(completedSubs / subIssues.length) * 100}%` }} />
              </div>
            </div>
          );
        })()}
        <div className="kanban-card-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: isOverdue ? 'var(--color-danger)' : 'var(--text-muted)', fontWeight: isOverdue ? 600 : 400 }}>
              {format(new Date(task.dueDate), 'd MMM', { locale: ru })}
            </span>
            {task.estimatedHours > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: (task.loggedHours || 0) > task.estimatedHours ? 'var(--color-warning)' : 'var(--text-muted)' }} title="Списано часов / Оценка">
                <Clock size={10} /> {task.loggedHours || 0}/{task.estimatedHours}ч
              </span>
            )}
            {(task.dependencies?.length || 0) > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--text-muted)' }} title="Связи задач">
                <LinkIcon size={10} /> {(task.dependencies || []).length}
              </span>
            )}
          </div>
          {kanbanGroupBy !== 'assignee' && assignee && (
            <div className="avatar" style={{ width: 22, height: 22, fontSize: 9, background: assignee.color }} data-tooltip={assignee.name}>
              {assignee.avatar}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div
        ref={boardContainerRef}
        style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 40, paddingTop: 12 }}
        onDragOver={(e) => {
          e.preventDefault();
          startAutoScroll(e.clientX, e.clientY);
        }}
        onDragLeave={stopAutoScroll}
        onDrop={stopAutoScroll}
      >
        {rows.map(row => {
          // Отфильтровываем таски конкретной строки
          const rowTasks = row.assigneeId === undefined
            ? projectTasks
            : projectTasks.filter(t => t.assigneeId === row.assigneeId);

          // Если это группировка, скрываем пустые строки (кроме Unassigned, если там ничего нет, можно скрыть)
          if (kanbanGroupBy === 'assignee' && rowTasks.length === 0 && row.id === 'unassigned') return null;

          return (
            <div key={row.id} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Заголовок Swimlane (если есть группировка) */}
              {row.label && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 4, paddingBottom: 4, borderBottom: '2px solid var(--border-subtle)' }}>
                  {row.user ? (
                    <div className="avatar" style={{ width: 24, height: 24, fontSize: 10, background: row.user.color }}>{row.user.avatar}</div>
                  ) : (
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-default)' }}>
                      <Users size={12} color="var(--text-muted)" />
                    </div>
                  )}
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{row.label}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: 10 }}>{rowTasks.length}</span>
                </div>
              )}

              {/* Сама доска (колонки) для текущей строки */}
              <div className="kanban-board" style={{ height: 'auto', paddingBottom: 0, border: 'none', background: 'transparent' }}>
                {columns.map(col => {
                  const colTasks = rowTasks.filter(t => t.status === col.id).sort((a, b) => a.position - b.position);
                  const dropTargetId = `${col.id}|${row.id}`;
                  const isOver = overTargetId === dropTargetId;
                  
                  // Считаем лимиты по всей колонке (независимо от swimlane)
                  const totalTasksInCol = projectTasks.filter(t => t.status === col.id).length;
                  const isExceeded = col.wipLimit !== null && totalTasksInCol > col.wipLimit;

                  return (
                    <div
                      key={col.id}
                      className={`kanban-column ${isOver ? 'drag-over' : ''}`}
                      data-col-drop={dropTargetId}
                      data-assignee={String(row.assigneeId)}
                      style={{
                        background: kanbanGroupBy === 'assignee' ? 'var(--bg-elevated)' : undefined,
                        maxHeight: kanbanGroupBy === 'assignee' ? 'none' : undefined,
                        height: kanbanGroupBy === 'assignee' ? 'max-content' : undefined
                      }}
                      onDragOver={(e) => handleDragOver(e, dropTargetId)}
                      onDrop={(e) => handleDrop(e, col.id, row.assigneeId)}
                    >
                      {/* Шапка колонки рендерится только в верхней строке или если нет группировки */}
                      {(kanbanGroupBy === 'none' || rows.findIndex(r => r.id === row.id) === 0) && (
                        <div className="kanban-column-header">
                          <div style={{ width: 10, height: 10, borderRadius: '50%', background: col.color, flexShrink: 0 }} />
                          <span className="kanban-column-name">{col.name}</span>
                          <span className={`kanban-count ${isExceeded ? 'wip-limit exceeded' : ''}`}>
                            {totalTasksInCol}{col.wipLimit !== null && `/${col.wipLimit}`}
                          </span>
                          {isExceeded && <AlertTriangle size={13} color="var(--color-danger)" data-tooltip="Превышен WIP-лимит!" />}
                          <button className="btn btn-ghost btn-icon" style={{ marginLeft: 'auto' }} onClick={openNewTask}>
                            <Plus size={14} />
                          </button>
                        </div>
                      )}

                      {/* Тело колонки */}
                      <div className="kanban-column-body" style={{ minHeight: kanbanGroupBy === 'assignee' ? 80 : undefined }}>
                        {colTasks.length === 0 && isOver && (
                          <div style={{ height: 60, border: '2px dashed var(--color-primary)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)', fontSize: 12, fontWeight: 600 }}>
                            Перетащите сюда
                          </div>
                        )}
                        {colTasks.map(task => <TaskCard key={task.id} task={task} />)}
                      </div>

                      {/* Кнопка добавления внизу колонки */}
                      <button className="kanban-add-card" onClick={openNewTask} style={{ opacity: kanbanGroupBy === 'assignee' ? 0.3 : 1 }}>
                        <Plus size={13} /> Добавить
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default KanbanBoard;

