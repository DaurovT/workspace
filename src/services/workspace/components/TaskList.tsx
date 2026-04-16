import React, { useMemo } from 'react';
import { useStore } from '../../../store';
import type { Priority, StatusId } from '../../../store';
import { format, isPast, isWithinInterval, addDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Filter, ArrowUpDown, CheckCircle2, Check, Link as LinkIcon, Clock, ChevronRight } from 'lucide-react';

const priorityOrder: Record<Priority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

const PRIORITY_LABELS: Record<Priority, string> = {
  urgent: 'Срочно', high: 'Высокий', medium: 'Средний', low: 'Низкий',
};

const STATUS_LABELS: Record<StatusId, string> = {
  todo: 'К выполнению', in_progress: 'В работе', review: 'На проверке', done: 'Готово', blocked: 'Заблокировано',
};

const PriorityDot: React.FC<{ priority: Priority }> = ({ priority }) => {
  const colors: Record<Priority, string> = {
    urgent: 'var(--priority-urgent)', high: 'var(--priority-high)',
    medium: 'var(--priority-medium)', low: 'var(--priority-low)',
  };
  return <div style={{ width: 8, height: 8, borderRadius: '50%', background: colors[priority], flexShrink: 0 }} />;
};

const StatusBadge: React.FC<{ status: StatusId }> = ({ status }) => (
  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
    <span className={`status-dot ${status}`} />
    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{STATUS_LABELS[status]}</span>
  </span>
);

const TaskList: React.FC = () => {
  const {
    tasks, users, activeProjectId, activePage, currentUserId, searchQuery, filterStatus, filterPriority, filterAssignee,
    openEditTask, openNewTask, updateTask, setFilterStatus, setFilterPriority, setFilterAssignee,
    selectedTaskIds, toggleTaskSelection, clearTaskSelection, bulkUpdateTasks,
  } = useStore();

  const projectTasks = useMemo(() => {
    let list = tasks.filter(t => !t.parentId);
    if (activePage === 'my_tasks') {
      list = list.filter(t => t.assigneeId === currentUserId);
    } else {
      list = list.filter(t => t.projectId === activeProjectId);
      if (filterAssignee) list = list.filter(t => t.assigneeId === filterAssignee);
    }
    
    if (searchQuery) list = list.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()));
    if (filterStatus) list = list.filter(t => t.status === filterStatus);
    if (filterPriority) list = list.filter(t => t.priority === filterPriority);
    
    return list.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  }, [tasks, activeProjectId, activePage, currentUserId, searchQuery, filterStatus, filterPriority, filterAssignee]);

  const stats = useMemo(() => ({
    total: projectTasks.length,
    done: projectTasks.filter(t => t.status === 'done').length,
    inProgress: projectTasks.filter(t => t.status === 'in_progress').length,
    overdue: projectTasks.filter(t => t.status !== 'done' && isPast(new Date(t.dueDate))).length,
  }), [projectTasks]);

  const toggleDone = (taskId: string, currentStatus: StatusId, e: React.MouseEvent) => {
    e.stopPropagation();
    updateTask(taskId, { status: currentStatus === 'done' ? 'todo' : 'done' });
  };

  const getDueDateStyle = (dueDate: string, status: StatusId) => {
    if (status === 'done') return { color: 'var(--text-muted)' };
    const date = new Date(dueDate);
    if (isPast(date)) return { color: 'var(--color-danger)', fontWeight: 600 };
    if (isWithinInterval(date, { start: new Date(), end: addDays(new Date(), 3) }))
      return { color: 'var(--color-warning)', fontWeight: 600 };
    return { color: 'var(--text-secondary)' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 16 }}>
      {/* Статистика */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {[
          { label: 'Всего задач', value: stats.total, color: '#6366f1' },
          { label: 'Выполнено', value: stats.done, color: '#22c55e' },
          { label: 'В работе', value: stats.inProgress, color: '#818cf8' },
          { label: 'Просрочено', value: stats.overdue, color: '#ef4444' },
        ].map(({ label, value, color }) => (
          <div key={label} className="stat-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
            </div>
            <div className="stat-value" style={{ color }}>{value}</div>
            {stats.total > 0 && (
              <div style={{ marginTop: 8 }}>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${(value / stats.total) * 100}%`, background: color }} />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Фильтры */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
          <Filter size={13} /> Фильтры:
        </span>
        <select
          className="form-control select-control"
          style={{ width: 'auto', fontSize: 12, padding: '4px 24px 4px 10px' }}
          value={filterStatus ?? ''}
          onChange={e => setFilterStatus(e.target.value as StatusId || null)}
          id="filter-status"
        >
          <option value="">Все статусы</option>
          {(Object.entries(STATUS_LABELS) as [StatusId, string][]).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
        <select
          className="form-control select-control"
          style={{ width: 'auto', fontSize: 12, padding: '4px 24px 4px 10px' }}
          value={filterPriority ?? ''}
          onChange={e => setFilterPriority(e.target.value as Priority || null)}
          id="filter-priority"
        >
          <option value="">Все приоритеты</option>
          {(Object.entries(PRIORITY_LABELS) as [Priority, string][]).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
        <select
          className="form-control select-control"
          style={{ width: 'auto', fontSize: 12, padding: '4px 24px 4px 10px' }}
          value={filterAssignee ?? ''}
          onChange={e => setFilterAssignee(e.target.value || null)}
          id="filter-assignee"
        >
          <option value="">Все участники</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        {(filterStatus || filterPriority || filterAssignee) && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => { setFilterStatus(null); setFilterPriority(null); setFilterAssignee(null); }}
          >
            Сбросить
          </button>
        )}
      </div>

      {/* Таблица */}
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)', overflow: 'hidden', flex: 1,
      }}>
        {/* Table header */}
        <div className="task-list-header" style={{ gridTemplateColumns: '30px 24px 1fr 130px 110px 130px 90px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <input
              type="checkbox"
              id="select-all-tasks"
              name="select-all-tasks"
              aria-label="Выбрать все задачи"
              checked={projectTasks.length > 0 && selectedTaskIds.length === projectTasks.length}
              onChange={(e) => toggleTaskSelection('', true, e.target.checked ? projectTasks.map(t => t.id) : [])}
              style={{ cursor: 'pointer' }}
            />
          </div>
          <div />
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            Задача <ArrowUpDown size={10} style={{ opacity: 0.5 }} />
          </div>
          <div>Статус</div>
          <div>Приоритет</div>
          <div>Исполнитель</div>
          <div>Срок</div>
        </div>

        {/* Rows */}
        <div style={{ overflow: 'auto', maxHeight: 'calc(100vh - 340px)' }}>
          {projectTasks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <CheckCircle2 size={28} color="var(--text-muted)" />
              </div>
              <div className="empty-state-title">Нет задач</div>
              <p style={{ fontSize: 13 }}>Нажмите «Новая задача» в правом верхнем углу, чтобы начать</p>
            </div>
          ) : (
            projectTasks.map(task => {
              const assignee = users.find(u => u.id === task.assigneeId);
              const isDone = task.status === 'done';
              const subIssues = tasks.filter(t => t.parentId === task.id);
              const completedSubs = subIssues.filter(t => t.status === 'done').length;
              const depCount = task.dependencies?.length || 0;
              const isOverlogged = (task.loggedHours || 0) > task.estimatedHours;

              return (
                <div
                  key={task.id}
                  className={`task-row ${selectedTaskIds.includes(task.id) ? 'selected' : ''}`}
                  onClick={() => openEditTask(task.id)}
                  id={`task-row-${task.id}`}
                  style={{ gridTemplateColumns: '30px 24px 1fr 130px 110px 130px 90px', alignItems: 'center' }}
                >
                  {/* Select checkbox */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={e => e.stopPropagation()}>
                    <input 
                      type="checkbox" 
                      id={`task-select-${task.id}`}
                      name={`task-select-${task.id}`}
                      aria-label="Выбрать задачу"
                      checked={selectedTaskIds.includes(task.id)} 
                      onChange={() => toggleTaskSelection(task.id)} 
                      style={{ cursor: 'pointer' }} 
                    />
                  </div>

                  {/* Done toggle */}
                  <div className={`task-checkbox ${isDone ? 'checked' : ''}`} onClick={(e) => toggleDone(task.id, task.status, e)}>
                    {isDone && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>

                  {/* Title + inline meta chips */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <PriorityDot priority={task.priority} />
                    <span className={`task-title ${isDone ? 'done' : ''}`} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {task.title}
                    </span>
                    {/* Inline chips */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                      {task.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="tag" style={{ fontSize: 10, padding: '1px 6px' }}>{tag}</span>
                      ))}
                      {subIssues.length > 0 && (
                        <span style={{ fontSize: 10, color: 'var(--text-muted)', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 4, padding: '1px 5px', display: 'flex', alignItems: 'center', gap: 2, whiteSpace: 'nowrap' }}>
                          <ChevronRight size={8} />{completedSubs}/{subIssues.length}
                        </span>
                      )}
                      {depCount > 0 && (
                        <span style={{ fontSize: 10, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 2 }}>
                          <LinkIcon size={9} />{depCount}
                        </span>
                      )}
                      {task.estimatedHours > 0 && (
                        <span style={{ fontSize: 10, color: isOverlogged ? 'var(--color-warning)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Clock size={9} />{task.loggedHours || 0}/{task.estimatedHours}ч
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status */}
                  <StatusBadge status={task.status} />

                  {/* Priority */}
                  <span className={`badge priority-badge ${task.priority}`}>
                    {PRIORITY_LABELS[task.priority]}
                  </span>

                  {/* Assignee */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {assignee ? (
                      <>
                        <div className="avatar" style={{ width: 22, height: 22, fontSize: 9, background: assignee.color }}>
                          {assignee.avatar}
                        </div>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 80, fontSize: 12, color: 'var(--text-secondary)' }}>
                          {assignee.name.split(' ')[0]}
                        </span>
                      </>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>
                    )}
                  </div>

                  {/* Due date */}
                  <div style={{ ...getDueDateStyle(task.dueDate, task.status), fontSize: 12 }}>
                    {task.dueDate ? format(new Date(task.dueDate), 'd MMM', { locale: ru }) : '—'}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Action Bar (Плаварющая панель при выделении) */}
      {selectedTaskIds.length > 0 && (
        <div style={{
          position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
          borderRadius: 12, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 16,
          boxShadow: 'var(--shadow-lg), 0 0 0 1px rgba(0,0,0,0.05)', zIndex: 1000,
          animation: 'slideUp 0.2s ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, borderRight: '1px solid var(--border-subtle)', paddingRight: 16 }}>
            <div style={{ background: 'var(--color-primary)', color: '#fff', fontSize: 11, fontWeight: 700, borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {selectedTaskIds.length}
            </div>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>задач выбрано</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <select
              className="form-control select-control" style={{ width: 140, fontSize: 12 }}
              onChange={e => { if (e.target.value) bulkUpdateTasks({ status: e.target.value as StatusId }); e.target.value = ''; }}
            >
              <option value="">Сменить статус...</option>
              {(Object.entries(STATUS_LABELS) as [StatusId, string][]).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>

            <select
              className="form-control select-control" style={{ width: 140, fontSize: 12 }}
              onChange={e => { if (e.target.value) bulkUpdateTasks({ priority: e.target.value as Priority }); e.target.value = ''; }}
            >
              <option value="">Сменить приоритет...</option>
              {(Object.entries(PRIORITY_LABELS) as [Priority, string][]).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          <button className="btn btn-ghost" onClick={clearTaskSelection} style={{ marginLeft: 8 }}>Отмена</button>
        </div>
      )}
    </div>
  );
};

export default TaskList;
