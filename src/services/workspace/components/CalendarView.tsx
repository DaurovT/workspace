import React, { useMemo, useState } from 'react';
import { useStore } from '../../../store';
import { ChevronLeft, ChevronRight, Plus, Clock, CheckCircle2, Calendar, AlertCircle } from 'lucide-react';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, isSameMonth, isToday,
  isSameDay, addMonths, subMonths, getDay,
} from 'date-fns';
import { ru } from 'date-fns/locale';

const PRIORITY_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  urgent: { bg: 'rgba(239,68,68,0.12)', text: '#ef4444', border: 'rgba(239,68,68,0.3)', dot: '#ef4444' },
  high:   { bg: 'rgba(249,115,22,0.12)', text: '#f97316', border: 'rgba(249,115,22,0.3)', dot: '#f97316' },
  medium: { bg: 'rgba(234,179,8,0.12)',  text: '#eab308', border: 'rgba(234,179,8,0.3)',  dot: '#eab308' },
  low:    { bg: 'rgba(99,102,241,0.12)', text: '#6366f1', border: 'rgba(99,102,241,0.3)', dot: '#6366f1' },
};

const STATUS_LABEL: Record<string, string> = {
  todo: 'К выполнению', in_progress: 'В работе', review: 'На проверке', done: 'Готово', blocked: 'Заблокировано',
};

const StatusIcon: React.FC<{ status: string }> = ({ status }) => {
  if (status === 'done')        return <CheckCircle2 size={10} color="#16a34a" />;
  if (status === 'in_progress') return <Clock size={10} color="#6366f1" />;
  if (status === 'blocked')     return <AlertCircle size={10} color="#ef4444" />;
  return <div style={{ width: 8, height: 8, borderRadius: '50%', border: '1.5px solid var(--text-muted)', flexShrink: 0 }} />;
};

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const CalendarView: React.FC = () => {
  const { tasks, projects, activeProjectId, openEditTask, openNewTask, users } = useStore();
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const projectTasks = tasks.filter(t => t.projectId === activeProjectId);
  const activeProject = projects.find(p => p.id === activeProjectId);

  const days = useMemo(() => {
    const monthStart = startOfMonth(viewDate);
    const monthEnd = endOfMonth(viewDate);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const gridEnd   = endOfWeek(monthEnd,     { weekStartsOn: 1 });
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [viewDate]);

  const getTasksForDay = (day: Date) =>
    projectTasks.filter(t => isSameDay(new Date(t.dueDate), day));

  const selectedTasks = selectedDay ? getTasksForDay(selectedDay) : [];

  // Stats for header
  const monthTasks = projectTasks.filter(t => {
    const d = new Date(t.dueDate);
    return d.getMonth() === viewDate.getMonth() && d.getFullYear() === viewDate.getFullYear();
  });
  const doneTasks = monthTasks.filter(t => t.status === 'done').length;
  const urgentTasks = monthTasks.filter(t => t.priority === 'urgent' || t.priority === 'high').length;

  const handleDayClick = (day: Date) => {
    setSelectedDay(prev => prev && isSameDay(day, prev) ? null : day);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 0, overflow: 'hidden' }}>

      {/* ─── Top Header Bar ─── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 20px',
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        flexShrink: 0,
        gap: 16,
      }}>
        {/* Left: nav + title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', align: 'center', gap: 2 }}>
            <button className="btn btn-ghost btn-icon" style={{ width: 30, height: 30 }} onClick={() => setViewDate(d => subMonths(d, 1))}>
              <ChevronLeft size={16} />
            </button>
            <button className="btn btn-ghost btn-icon" style={{ width: 30, height: 30 }} onClick={() => setViewDate(d => addMonths(d, 1))}>
              <ChevronRight size={16} />
            </button>
          </div>
          <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'capitalize', letterSpacing: '-0.02em' }}>
            {format(viewDate, 'LLLL yyyy', { locale: ru })}
          </span>
          {activeProject && (
            <span style={{
              fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
              background: `${activeProject.color}18`, color: activeProject.color,
              border: `1px solid ${activeProject.color}28`,
            }}>
              {activeProject.icon} {activeProject.name}
            </span>
          )}
        </div>

        {/* Center: stats chips */}
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-elevated)', borderRadius: 8, padding: '5px 10px', border: '1px solid var(--border-subtle)' }}>
            <Calendar size={12} color="var(--color-primary)" />
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Задач в месяце:</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{monthTasks.length}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-elevated)', borderRadius: 8, padding: '5px 10px', border: '1px solid var(--border-subtle)' }}>
            <CheckCircle2 size={12} color="#16a34a" />
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Завершено:</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#16a34a' }}>{doneTasks}</span>
          </div>
          {urgentTasks > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(239,68,68,0.08)', borderRadius: 8, padding: '5px 10px', border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertCircle size={12} color="#ef4444" />
              <span style={{ fontSize: 12, color: '#ef4444', fontWeight: 600 }}>{urgentTasks} срочных</span>
            </div>
          )}
        </div>

        {/* Right: buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => { setViewDate(new Date()); setSelectedDay(new Date()); }}>
            Сегодня
          </button>
          <button className="btn btn-primary" onClick={openNewTask} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Plus size={13} /> Новая задача
          </button>
        </div>
      </div>

      {/* ─── Main Content ─── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ─── Calendar Grid ─── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Single unified grid: headers + day cells */}
          <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gridTemplateRows: `34px repeat(${Math.ceil(days.length / 7)}, 110px)`,
            }}>
              {/* Header row — fixed height via special row */}
              {WEEKDAYS.map((d, i) => (
                <div key={d} style={{
                  height: 34,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                  color: i >= 5 ? 'var(--color-primary)' : 'var(--text-muted)',
                  background: 'var(--bg-elevated)',
                  borderRight: i < 6 ? '1px solid var(--border-subtle)' : 'none',
                  borderBottom: '1px solid var(--border-subtle)',
                  position: 'sticky', top: 0, zIndex: 2,
                }}>
                  {d}
                </div>
              ))}

              {/* Day cells */}
              {days.map((day, idx) => {
                const dayTasks = getTasksForDay(day);
                const isCurrentMonth = isSameMonth(day, viewDate);
                const isTodayDay = isToday(day);
                const isSelected = selectedDay && isSameDay(day, selectedDay);
                const isWeekend = idx % 7 >= 5;
                const visibleTasks = dayTasks.slice(0, 2);
                const overflow = dayTasks.length - visibleTasks.length;

                return (
                  <div
                    key={day.toISOString()}
                    onClick={() => handleDayClick(day)}
                    style={{
                      borderRight: (idx + 1) % 7 !== 0 ? '1px solid var(--border-subtle)' : 'none',
                      borderBottom: '1px solid var(--border-subtle)',
                      padding: '8px 8px 6px',
                      cursor: 'pointer',
                      background: isSelected
                        ? 'rgba(101,78,241,0.1)'
                        : !isCurrentMonth
                          ? 'rgba(0,0,0,0.15)'
                          : isWeekend
                            ? 'rgba(101,78,241,0.02)'
                            : 'transparent',
                      transition: 'background 0.15s',
                      position: 'relative',
                      outline: isSelected ? '2px solid rgba(101,78,241,0.4)' : 'none',
                      outlineOffset: '-2px',
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.background = isSelected
                        ? 'rgba(101,78,241,0.1)'
                        : !isCurrentMonth ? 'rgba(0,0,0,0.15)' : isWeekend ? 'rgba(101,78,241,0.02)' : '';
                    }}
                  >
                    {/* Day number */}
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: isTodayDay ? 700 : 500,
                      color: isTodayDay ? '#fff' : !isCurrentMonth ? 'var(--text-secondary)' : isWeekend ? 'var(--color-primary)' : 'var(--text-primary)',
                      background: isTodayDay ? 'var(--color-primary)' : 'transparent',
                      boxShadow: isTodayDay ? '0 2px 8px rgba(101,78,241,0.4)' : 'none',
                      marginBottom: 5,
                      flexShrink: 0,
                    }}>
                      {format(day, 'd')}
                    </div>

                    {/* Task chips */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {visibleTasks.map(task => {
                        const p = PRIORITY_COLORS[task.priority];
                        return (
                          <div
                            key={task.id}
                            onClick={e => { e.stopPropagation(); openEditTask(task.id); }}
                            style={{
                              fontSize: 10, fontWeight: 500,
                              padding: '2px 6px', borderRadius: 4,
                              background: p.bg,
                              color: p.text,
                              border: `1px solid ${p.border}`,
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                              cursor: 'pointer',
                              display: 'flex', alignItems: 'center', gap: 4,
                              transition: 'opacity 0.1s',
                            }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.75'}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
                          >
                            <div style={{ width: 5, height: 5, borderRadius: '50%', background: p.dot, flexShrink: 0 }} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</span>
                          </div>
                        );
                      })}
                      {overflow > 0 && (
                        <div style={{
                          fontSize: 10, fontWeight: 600, color: 'var(--text-muted)',
                          padding: '1px 4px',
                          textAlign: 'center',
                        }}>
                          +{overflow} ещё
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ─── Side Panel ─── */}
        <div style={{
          width: 280, flexShrink: 0,
          display: 'flex', flexDirection: 'column',
          background: 'var(--bg-surface)',
          borderLeft: '1px solid var(--border-subtle)',
          overflow: 'hidden',
        }}>
          {/* Panel header */}
          <div style={{
            padding: '14px 16px',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--bg-elevated)',
          }}>
            {selectedDay ? (
              <>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                  {format(selectedDay, 'EEEE', { locale: ru })}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                  {format(selectedDay, 'd MMMM yyyy', { locale: ru })}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <div style={{
                    fontSize: 11, fontWeight: 600,
                    background: selectedTasks.length > 0 ? 'var(--color-primary-light)' : 'var(--bg-card)',
                    color: selectedTasks.length > 0 ? 'var(--color-primary)' : 'var(--text-muted)',
                    padding: '3px 10px', borderRadius: 20,
                    border: `1px solid ${selectedTasks.length > 0 ? 'var(--border-strong)' : 'var(--border-subtle)'}`,
                  }}>
                    {selectedTasks.length} {selectedTasks.length === 1 ? 'задача' : selectedTasks.length < 5 ? 'задачи' : 'задач'}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Выберите день</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  Кликните на ячейку для просмотра задач
                </div>
              </>
            )}
          </div>

          {/* Task list */}
          <div style={{ flex: 1, overflow: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {!selectedDay && (
              <div style={{ textAlign: 'center', padding: '40px 16px' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📅</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Нет выбранного дня</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Нажмите на дату в календаре</div>
              </div>
            )}

            {selectedDay && selectedTasks.length === 0 && (
              <div style={{ textAlign: 'center', padding: '32px 16px' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>✅</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>День свободен!</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, marginBottom: 14 }}>Нет задач на этот день</div>
                <button className="btn btn-primary" onClick={openNewTask} style={{ display: 'flex', alignItems: 'center', gap: 5, margin: '0 auto', fontSize: 12 }}>
                  <Plus size={12} /> Добавить задачу
                </button>
              </div>
            )}

            {selectedTasks.map(task => {
              const p = PRIORITY_COLORS[task.priority];
              const assignee = users.find(u => u.id === task.assigneeId);
              return (
                <div
                  key={task.id}
                  onClick={() => openEditTask(task.id)}
                  style={{
                    padding: '10px 12px', borderRadius: 10,
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderLeft: `3px solid ${p.dot}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.background = 'var(--bg-card)';
                    el.style.transform = 'translateX(2px)';
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.background = 'var(--bg-elevated)';
                    el.style.transform = 'translateX(0)';
                  }}
                >
                  {/* Title */}
                  <div style={{
                    fontSize: 12, fontWeight: 600, color: 'var(--text-primary)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    marginBottom: 6,
                  }}>
                    {task.title}
                  </div>

                  {/* Meta row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <StatusIcon status={task.status} />
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500 }}>
                        {STATUS_LABEL[task.status] || task.status}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {/* Priority badge */}
                      <span style={{
                        fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 20,
                        background: p.bg, color: p.text, border: `1px solid ${p.border}`,
                        textTransform: 'uppercase', letterSpacing: '0.04em',
                      }}>
                        {task.priority === 'urgent' ? 'Срочно' : task.priority === 'high' ? 'Высокий' : task.priority === 'medium' ? 'Средний' : 'Низкий'}
                      </span>
                      {/* Assignee avatar */}
                      {assignee && (
                        <div style={{
                          width: 18, height: 18, borderRadius: '50%',
                          background: assignee.color, fontSize: 8, fontWeight: 700,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', flexShrink: 0,
                        }}>
                          {assignee.avatar}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tags */}
                  {task.tags.length > 0 && (
                    <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                      {task.tags.slice(0, 3).map(tag => (
                        <span key={tag} style={{
                          fontSize: 9, padding: '1px 6px', borderRadius: 10,
                          background: 'var(--bg-card)', color: 'var(--text-muted)',
                          border: '1px solid var(--border-subtle)',
                        }}>
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Add task button at the bottom if day selected */}
            {selectedDay && selectedTasks.length > 0 && (
              <button
                className="btn btn-ghost"
                onClick={openNewTask}
                style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', fontSize: 12, marginTop: 4, borderStyle: 'dashed' }}
              >
                <Plus size={12} /> Добавить задачу
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
