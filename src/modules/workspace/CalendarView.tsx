import React, { useMemo, useState } from 'react';
import { useStore } from '../../store';
import { ChevronLeft, ChevronRight, Plus, Smartphone, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, isSameMonth, isToday,
  isSameDay, addMonths, subMonths,
} from 'date-fns';
import { ru } from 'date-fns/locale';

const PRIORITY_COLORS: Record<string, string> = {
  urgent: '#ef4444',
  high:   '#f97316',
  medium: '#eab308',
  low:    '#6366f1',
};

const STATUS_LABEL: Record<string, string> = {
  todo: 'К выполнению', in_progress: 'В работе', review: 'На проверке', done: 'Готово', blocked: 'Заблокировано',
};

const StatusIcon: React.FC<{ status: string }> = ({ status }) => {
  if (status === 'done')        return <CheckCircle2 size={12} color="#16a34a" />;
  if (status === 'in_progress') return <Clock size={12} color="#6366f1" />;
  if (status === 'blocked')     return <AlertCircle size={12} color="#ef4444" />;
  return <div style={{ width: 10, height: 10, borderRadius: '50%', border: '1.5px solid var(--text-muted)', flexShrink: 0 }} />;
};

const WEEKDAYS = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];

const CalendarView: React.FC = () => {
  const tasks = useStore(state => state.tasks);
  const projects = useStore(state => state.projects);
  const activeProjectId = useStore(state => state.activeProjectId);
  const openEditTask = useStore(state => state.openEditTask);
  const openNewTask = useStore(state => state.openNewTask);
  const users = useStore(state => state.users);
  
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());

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

  const selectedTasks = getTasksForDay(selectedDay);

  const handleDayClick = (day: Date) => {
    setSelectedDay(day);
  };

  const exportICS = () => {
    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Arcana//Calendar//EN',
      'CALSCALE:GREGORIAN',
    ];

    projectTasks.forEach(task => {
      if (!task.dueDate) return;
      const date = new Date(task.dueDate);
      const start = format(date, "yyyyMMdd");
      const end = format(new Date(date.getTime() + 24*60*60*1000), "yyyyMMdd");
      
      icsContent.push(
        'BEGIN:VEVENT',
        `UID:${task.id}@arcana.local`,
        `DTSTAMP:${format(new Date(), "yyyyMMdd'T'HHmmss'Z'")}`,
        `DTSTART;VALUE=DATE:${start}`,
        `DTEND;VALUE=DATE:${end}`,
        `SUMMARY:${task.title}`,
        `DESCRIPTION:Priority: ${task.priority}\\nStatus: ${task.status}`,
        'END:VEVENT'
      );
    });

    icsContent.push('END:VCALENDAR');

    const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `arcana_calendar_${format(new Date(), 'yyyy-MM-dd')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 0, overflow: 'hidden', background: 'var(--bg-base)' }}>
      
      {/* ─── Apple-Style Header Bar ─── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px',
        background: 'var(--bg-base)',
        flexShrink: 0,
      }}>
        {/* Left: title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'capitalize', letterSpacing: '-0.03em', lineHeight: 1 }}>
            {format(viewDate, 'LLLL yyyy', { locale: ru })}
          </span>
          {activeProject && (
            <span className="hide-on-mobile" style={{
              fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20,
              background: `${activeProject.color}18`, color: activeProject.color,
            }}>
              {activeProject.icon} {activeProject.name}
            </span>
          )}
        </div>

        {/* Right: navigation & actions */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn btn-ghost btn-icon" onClick={() => setViewDate(d => subMonths(d, 1))} style={{ color: 'var(--color-primary)' }}>
            <ChevronLeft size={22} strokeWidth={2.5} />
          </button>
          <button className="btn btn-ghost btn-icon" onClick={() => setViewDate(d => addMonths(d, 1))} style={{ color: 'var(--color-primary)' }}>
            <ChevronRight size={22} strokeWidth={2.5} />
          </button>
          
          <button className="btn btn-ghost btn-icon" onClick={() => { setViewDate(new Date()); setSelectedDay(new Date()); }} style={{ color: 'var(--color-primary)' }} title="Сегодня">
            <span style={{ fontSize: 13, fontWeight: 600 }}>Cег</span>
          </button>
          
          <button className="btn btn-ghost btn-icon" onClick={exportICS} style={{ color: 'var(--color-primary)' }} title="Синхронизация">
            <Smartphone size={20} strokeWidth={2.5} />
          </button>
          
          <button className="btn btn-ghost btn-icon" onClick={openNewTask} style={{ color: 'var(--color-primary)' }} title="Новая задача">
            <Plus size={24} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* ─── Main Content ─── */}
      <div className="mobile-calendar-container" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* ─── Calendar Grid ─── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '0 16px 16px 16px' }}>
          <div style={{ flex: 1, overflow: 'auto' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gridTemplateRows: `40px repeat(${Math.ceil(days.length / 7)}, minmax(60px, 1fr))`,
              height: '100%',
            }}>
              {/* Header row */}
              {WEEKDAYS.map((d, i) => (
                <div key={d} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  paddingBottom: 8,
                  fontSize: 11, fontWeight: 600,
                  color: i >= 5 ? 'var(--text-muted)' : 'var(--text-secondary)',
                  borderBottom: '1px solid var(--border-subtle)',
                }}>
                  {d}
                </div>
              ))}

              {/* Day cells */}
              {days.map((day) => {
                const dayTasks = getTasksForDay(day);
                const isCurrentMonth = isSameMonth(day, viewDate);
                const isTodayDay = isToday(day);
                const isSelected = selectedDay && isSameDay(day, selectedDay);
                
                // Get up to 3 priority colors for dots
                const dots = dayTasks.map(t => PRIORITY_COLORS[t.priority]).slice(0, 3);

                return (
                  <div
                    key={day.toISOString()}
                    onClick={() => handleDayClick(day)}
                    style={{
                      borderBottom: 'none',
                      borderRight: 'none',
                      padding: '4px',
                      cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      background: 'transparent',
                    }}
                  >
                    {/* Day number */}
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16, fontWeight: isSelected || isTodayDay ? 600 : 400,
                      lineHeight: 1,
                      color: isSelected 
                              ? '#fff' 
                              : isTodayDay 
                                ? 'var(--color-primary)' 
                                : !isCurrentMonth ? 'var(--text-muted)' : 'var(--text-primary)',
                      background: isSelected ? 'var(--color-primary)' : 'transparent',
                      marginTop: 2,
                      transition: 'all 0.15s',
                    }}>
                      {format(day, 'd')}
                    </div>

                    {/* Event Dots */}
                    <div style={{ display: 'flex', gap: 3, marginTop: 4 }}>
                      {dots.map((color, i) => (
                        <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: color }} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ─── Schedule View (Side/Bottom Panel) ─── */}
        <div className="mobile-calendar-side" style={{
          width: 340, flexShrink: 0,
          display: 'flex', flexDirection: 'column',
          background: 'var(--bg-base)',
          borderLeft: '1px solid var(--border-subtle)',
          overflow: 'hidden',
        }}>
          {/* Panel header */}
          <div style={{
            padding: '20px 24px 10px 24px',
          }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'capitalize', letterSpacing: '-0.02em' }}>
              {format(selectedDay, 'EEEE', { locale: ru })}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
              {format(selectedDay, 'd MMMM yyyy', { locale: ru })}
            </div>
          </div>

          {/* Task list */}
          <div style={{ flex: 1, overflow: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {selectedTasks.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 14, paddingTop: 20 }}>Нет событий</div>
            ) : (
              selectedTasks.map(task => {
                const color = PRIORITY_COLORS[task.priority];
                const assignee = users.find(u => u.id === task.assigneeId);
                return (
                  <div
                    key={task.id}
                    onClick={() => openEditTask(task.id)}
                    style={{
                      flex: 1, padding: '10px 14px', borderRadius: 12,
                      background: 'var(--bg-surface)',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                      border: '1px solid var(--border-subtle)',
                      borderLeft: `4px solid ${color}`,
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{
                      fontSize: 14, fontWeight: 600, color: 'var(--text-primary)',
                      marginBottom: 6,
                    }}>
                        {task.title}
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <StatusIcon status={task.status} />
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            {STATUS_LABEL[task.status] || task.status}
                          </span>
                        </div>
                        {assignee && (
                          <div style={{
                            width: 20, height: 20, borderRadius: '50%',
                            background: assignee.color, fontSize: 9, fontWeight: 700,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff',
                          }}>
                            {assignee.avatar}
                          </div>
                        )}
                      </div>
                    </div>
                );
              })
            )}
            
            {/* Divider line for timeline feel */}
            <div style={{ position: 'relative', marginTop: 10 }}>
              <div style={{ borderTop: '1px solid var(--border-subtle)', width: '100%' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
