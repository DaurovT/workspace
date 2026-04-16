import React, { useMemo, useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../../../store';
import {
  startOfWeek, format, addDays, subDays, differenceInDays, startOfDay,
  isToday, isWeekend, addWeeks, subWeeks, addMonths, subMonths,
  startOfMonth, endOfMonth, getDaysInMonth, isBefore,
} from 'date-fns';
import { ru } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Download, Layers, CornerDownRight, AlertTriangle } from 'lucide-react';
import { validateDrag, findAllConflicts, DEP_LABELS } from '../utils/ganttDeps';

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const CELL_W  = { day: 44, week: 120, month: 60 } as const;
const COL_COUNT = { day: 365, week: 156, month: 36 } as const;

const STATUS_STYLE: Record<string, { background: string; opacity?: number; dashed?: boolean }> = {
  done:        { background: 'linear-gradient(90deg,#22c55e,#4ade80)', opacity: 0.7 },
  in_progress: { background: 'linear-gradient(90deg,#6366f1,#818cf8)' },
  review:      { background: 'linear-gradient(90deg,#f59e0b,#fbbf24)' },
  todo:        { background: 'linear-gradient(90deg,#5a6278,#6b7280)' },
  blocked:     { background: 'linear-gradient(90deg,#ef4444,#f87171)', dashed: true },
};

const PRIORITY_DOT: Record<string, string> = {
  urgent: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#6366f1',
};

// Status badge labels
const STATUS_LABEL: Record<string, string> = {
  done: '✓', in_progress: '●', review: '◐', todo: '○', blocked: '✕',
};

// ─────────────────────────────────────────────
// Pure utility: date → pixel X (relative to viewStart)
// ─────────────────────────────────────────────
function dateToPixel(
  date: Date,
  viewStart: Date,
  scale: 'day' | 'week' | 'month',
): number {
  const d  = startOfDay(date);
  const vs = startOfDay(viewStart);
  const cw = CELL_W[scale];

  if (scale === 'day') return differenceInDays(d, vs) * cw;
  if (scale === 'week') return (differenceInDays(d, vs) / 7) * cw;

  // month: exact months + fractional day
  const mDiff =
    (d.getFullYear() - vs.getFullYear()) * 12 +
    (d.getMonth() - vs.getMonth());
  const frac = (d.getDate() - 1) / getDaysInMonth(d);
  return (mDiff + frac) * cw;
}

// ─────────────────────────────────────────────
// Pure utility: drag pixel delta → days
// ─────────────────────────────────────────────
function pixelToDays(deltaX: number, scale: 'day' | 'week' | 'month'): number {
  const cw = CELL_W[scale];
  if (scale === 'day')  return Math.round(deltaX / cw);
  if (scale === 'week') return Math.round((deltaX / cw) * 7);
  return Math.round((deltaX / cw) * 30);
}

// ─────────────────────────────────────────────
// Smart viewStart: always anchored to today ± buffer
// ─────────────────────────────────────────────
function smartViewStart(scale: 'day' | 'week' | 'month', earliestDate: Date | null = null): Date {
  const today = new Date();
  let baseAnchor = today;
  if (earliestDate && earliestDate < today) {
    baseAnchor = earliestDate;
  }

  let anchor: Date;
  if (scale === 'day')        anchor = subWeeks(baseAnchor, 1);
  else if (scale === 'week')  anchor = subWeeks(baseAnchor, 2);
  else                        anchor = subMonths(baseAnchor, 1);

  if (scale === 'week')  return startOfWeek(anchor, { weekStartsOn: 1 });
  if (scale === 'month') return startOfMonth(anchor);
  return startOfDay(anchor);
}

// ─────────────────────────────────────────────
// DragState
// ─────────────────────────────────────────────
interface DragState {
  taskId: string;
  type: 'move' | 'left' | 'right';
  startX: number;
  initialStart: Date;
  initialDue: Date;
  currentDeltaDays: number;
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────
const GanttChart: React.FC = () => {
  const { tasks, users, activeProjectId, ganttScale, updateTask, cascadeUpdate, openEditTask, setGanttScale } = useStore();

  // ── Subtask Toggle State ──
  const [showSubtasks, setShowSubtasks] = useState(false);

  // ── Tasks for this project (sorted, with optional subtasks nested) ──
  const projectTasks = useMemo(() => {
    let sortedRootTasks = tasks
      .filter((t) => t.projectId === activeProjectId && !t.parentId)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
      
    if (showSubtasks) {
      const flattened: typeof tasks = [];
      sortedRootTasks.forEach(root => {
        flattened.push(root);
        const children = tasks.filter(t => t.parentId === root.id)
                              .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
        flattened.push(...children);
      });
      return flattened;
    }
    
    return sortedRootTasks;
  }, [tasks, activeProjectId, showSubtasks]);

  // ── Conflict detection ──
  const conflictTaskIds = useMemo(() => findAllConflicts(tasks as Parameters<typeof findAllConflicts>[0]), [tasks]);

  // ── Earliest Date computation ──
  const earliestDate = useMemo(() => {
    const pts = tasks.filter((t) => t.projectId === activeProjectId && !t.parentId);
    if (!pts.length) return null;
    const times = pts.map((t) => new Date(t.startDate).getTime()).filter(t => !isNaN(t));
    return times.length ? new Date(Math.min(...times)) : null;
  }, [tasks, activeProjectId]);

  // ── viewStart ──
  const [viewStart, setViewStart] = useState<Date>(() =>
    smartViewStart(useStore.getState().ganttScale, null), // Initial null is fine, useEffect will catch up
  );

  // ── Scroll container ref ──
  const containerRef = useRef<HTMLDivElement>(null);

  // ── On mount: scroll to earliest task (not just "today") ──
  useEffect(() => {
    if (!containerRef.current) return;
    const pts = useStore.getState().tasks.filter(
      (t) => t.projectId === useStore.getState().activeProjectId && !t.parentId,
    );
    let targetPx: number;
    if (pts.length > 0) {
      const earliest = new Date(Math.min(...pts.map((t) => new Date(t.startDate).getTime())));
      targetPx = dateToPixel(earliest, viewStart, ganttScale);
    } else {
      targetPx = dateToPixel(new Date(), viewStart, ganttScale);
    }
    const w = containerRef.current.clientWidth || 800;
    containerRef.current.scrollLeft = Math.max(0, targetPx - w * 0.15);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Re-fit when project changes ──
  const prevProjectId = useRef(activeProjectId);
  useEffect(() => {
    if (prevProjectId.current !== activeProjectId) {
      prevProjectId.current = activeProjectId;
      const vs = smartViewStart(ganttScale, earliestDate);
      setViewStart(vs);
      if (!containerRef.current) return;
      const pts = tasks.filter((t) => t.projectId === activeProjectId && !t.parentId);
      if (pts.length > 0) {
        const earliest = new Date(Math.min(...pts.map((t) => new Date(t.startDate).getTime())));
        const px = dateToPixel(earliest, vs, ganttScale);
        containerRef.current.scrollLeft = Math.max(0, px - (containerRef.current.clientWidth || 800) * 0.15);
      }
    }
  }, [activeProjectId, ganttScale, tasks, earliestDate]);

  // ── Column generation ──
  const columns = useMemo<Date[]>(() => {
    const n = COL_COUNT[ganttScale];
    if (ganttScale === 'day')   return Array.from({ length: n }, (_, i) => addDays(viewStart, i));
    if (ganttScale === 'week')  return Array.from({ length: n }, (_, i) => addDays(viewStart, i * 7));
    return Array.from({ length: n }, (_, i) => addMonths(viewStart, i));
  }, [viewStart, ganttScale]);

  const viewEnd = useMemo(() => {
    if (!columns.length) return viewStart;
    const last = columns[columns.length - 1];
    if (ganttScale === 'week')  return addDays(last, 6);
    if (ganttScale === 'month') return endOfMonth(last);
    return last;
  }, [columns, ganttScale, viewStart]);

  const cellW      = CELL_W[ganttScale];
  const totalWidth = columns.length * cellW;

  // ── Drag & Drop ──
  const [dragState, setDragState] = useState<DragState | null>(null);
  const isClickPrevented = useRef(false);

  useEffect(() => {
    if (!dragState) return;

    const onMove = (e: MouseEvent) => {
      const deltaDays = pixelToDays(e.clientX - dragState.startX, ganttScale);
      setDragState((prev) => (prev ? { ...prev, currentDeltaDays: deltaDays } : null));
    };

    const onUp = () => {
      if (dragState.currentDeltaDays !== 0) {
        isClickPrevented.current = true;
        setTimeout(() => { isClickPrevented.current = false; }, 150);

        const d    = dragState.currentDeltaDays;
        const task = tasks.find((t) => t.id === dragState.taskId);
        if (task) {
          let ns = dragState.initialStart;
          let nd = dragState.initialDue;
          if (dragState.type === 'move') {
            ns = addDays(ns, d); nd = addDays(nd, d);
          } else if (dragState.type === 'left') {
            ns = addDays(ns, d); if (ns > nd) ns = nd;
          } else {
            nd = addDays(nd, d); if (nd < ns) nd = ns;
          }

          if (task.parentId) {
            const parent = tasks.find(t => t.id === task.parentId);
            if (parent) {
              const pStart = startOfDay(new Date(parent.startDate));
              const pDue = startOfDay(new Date(parent.dueDate));
              
              if (dragState.type === 'move') {
                const duration = differenceInDays(dragState.initialDue, dragState.initialStart);
                if (ns < pStart) {
                  ns = pStart; nd = addDays(ns, duration);
                }
                if (nd > pDue) {
                  nd = pDue; ns = subDays(nd, duration);
                  if (ns < pStart) ns = pStart;
                }
              } else {
                if (ns < pStart) ns = pStart;
                if (ns > pDue) ns = pDue;
                if (nd > pDue) nd = pDue;
                if (nd < pStart) nd = pStart;
              }
            }
          }

          const oldDeltaDays = dragState.currentDeltaDays;

          // Validate incoming dependency constraints
          const violations = validateDrag(
            dragState.taskId,
            ns,
            nd,
            tasks as Parameters<typeof validateDrag>[3]
          );

          if (violations.length > 0) {
            // Roll back — don't save
            setDragState(null);
            return;
          }

          updateTask(dragState.taskId, {
            startDate: ns.toISOString(),
            dueDate:   nd.toISOString(),
          });

          // Cascade right-shift to successors
          if (dragState.type === 'move' && oldDeltaDays > 0) {
            cascadeUpdate(dragState.taskId, oldDeltaDays);
          }
        }
      }
      setDragState(null);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dragState, ganttScale, tasks, updateTask]);

  // ── Bar geometry ──
  const getBar = (task: { startDate: string; dueDate: string; id?: string; parentId?: string }) => {
    const parsedStart = new Date(task.startDate);
    const parsedEnd = new Date(task.dueDate);
    let start = isNaN(parsedStart.getTime()) ? null : startOfDay(parsedStart);
    let end   = isNaN(parsedEnd.getTime()) ? null : startOfDay(parsedEnd);

    // Fall back to parent dates if invalid
    if ((!start || isNaN(start.getTime()) || !end || isNaN(end.getTime())) && task.parentId) {
      const parent = tasks.find((t) => t.id === task.parentId);
      if (parent) {
        if (!start || isNaN(start.getTime())) {
          const pt = new Date(parent.startDate);
          start = isNaN(pt.getTime()) ? null : startOfDay(pt);
        }
        if (!end || isNaN(end.getTime())) {
          const pt = new Date(parent.dueDate);
          end = isNaN(pt.getTime()) ? null : startOfDay(pt);
        }
      }
    }
    
    // Fall back to today if still invalid
    start = start && !isNaN(start.getTime()) ? start : new Date();
    end   = end && !isNaN(end.getTime()) ? end : new Date(start.getTime() + 86400000 * 7);
    if (dragState && task.id === dragState.taskId) {
      const d = dragState.currentDeltaDays;
      if (dragState.type === 'move') {
        start = addDays(dragState.initialStart, d);
        end   = addDays(dragState.initialDue,   d);
      } else if (dragState.type === 'left') {
        start = addDays(dragState.initialStart, d);
        if (start > end) start = end;
      } else {
        end = addDays(dragState.initialDue, d);
        if (end < start) end = start;
      }
    }

    let left  = dateToPixel(start, viewStart, ganttScale);
    let right = dateToPixel(addDays(end, 1), viewStart, ganttScale);

    // Hard visual bounding to parent
    if (task.parentId) {
      const parent = tasks.find((t) => t.id === task.parentId);
      if (parent) {
        const pStart = startOfDay(new Date(parent.startDate));
        const pEnd = startOfDay(new Date(parent.dueDate));
        const pLeft = dateToPixel(pStart, viewStart, ganttScale);
        const pRight = dateToPixel(addDays(pEnd, 1), viewStart, ganttScale);
        
        if (left < pLeft) left = pLeft;
        if (right > pRight) right = pRight;
        if (left > pRight) left = pRight;
        if (right < left) right = left;
      }
    }

    const rawWidth = right - left;
    // Only apply minimum width for root tasks; subtasks must not poke outside parent
    const minWidth = task.parentId ? 0 : 10;
    return { left, width: Math.max(rawWidth, minWidth) };
  };

  // ── "Today" marker pixel ──
  const todayPx = dateToPixel(new Date(), viewStart, ganttScale);

  // ── Dependency arrows (SVG) ──
  // Map taskId -> { rowIndex, bar }
  const taskRowMap = useMemo(() => {
    const m = new Map<string, { index: number; left: number; width: number }>();
    projectTasks.forEach((task, idx) => {
      const { left, width } = getBar(task);
      m.set(task.id, { index: idx, left, width });
    });
    return m;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectTasks, viewStart, ganttScale, dragState]);

  const parentBoxMap = useMemo(() => {
    const m = new Map<string, { top: number; bottom: number; left: number; width: number }>();
    for (const task of projectTasks) {
      if (!task.parentId) {
        const children = projectTasks.filter(t => t.parentId === task.id);
        if (children.length > 0) {
          const parentRow = taskRowMap.get(task.id);
          if (parentRow) {
            // Use date-based pixel calculation for the box bounds (same as clamping logic)
            const pStart = startOfDay(new Date(task.startDate));
            const pEnd = startOfDay(new Date(task.dueDate));
            const pLeft = dateToPixel(pStart, viewStart, ganttScale);
            const pRight = dateToPixel(addDays(pEnd, 1), viewStart, ganttScale);
            const lastChildRowIndex = taskRowMap.get(children[children.length - 1].id)?.index ?? parentRow.index;
            m.set(task.id, {
              top: parentRow.index * 34,
              bottom: (lastChildRowIndex + 1) * 34,
              left: pLeft,
              width: pRight - pLeft,
            });
          }
        }
      }
    }
    return m;
  }, [projectTasks, taskRowMap, viewStart, ganttScale]);

  // ── Drag & Drop ──
  const ROW_H = 34;
  const SVG_Y_OFFSET = 3; // Nudging visual center to perfectly match DOM element Optical center
  const navigateBack = () => {
    if (ganttScale === 'day')       setViewStart((s) => subWeeks(s, 2));
    else if (ganttScale === 'week') setViewStart((s) => subWeeks(s, 6));
    else                            setViewStart((s) => subMonths(s, 3));
  };
  const navigateForward = () => {
    if (ganttScale === 'day')       setViewStart((s) => addWeeks(s, 2));
    else if (ganttScale === 'week') setViewStart((s) => addWeeks(s, 6));
    else                            setViewStart((s) => addMonths(s, 3));
  };
  const goToToday = (scale: 'day' | 'week' | 'month' = ganttScale) => {
    const vs = smartViewStart(scale, earliestDate);
    setViewStart(vs);
    if (!containerRef.current) return;
    // scroll to earliest task OR today
    const pts = projectTasks;
    let targetPx: number;
    if (pts.length > 0) {
      const earliest = new Date(Math.min(...pts.map((t) => new Date(t.startDate).getTime())));
      targetPx = dateToPixel(earliest, vs, scale);
    } else {
      targetPx = dateToPixel(new Date(), vs, scale);
    }
    const w = containerRef.current.clientWidth || 800;
    containerRef.current.scrollLeft = Math.max(0, targetPx - w * 0.15);
  };

  // ── Column header formatter ──
  const colHeader = (date: Date) => {
    if (ganttScale === 'day')   return { top: format(date, 'EEE', { locale: ru }), bottom: format(date, 'd') };
    if (ganttScale === 'week')  return { top: `Нед ${format(date, 'w')}`, bottom: format(date, 'd MMM', { locale: ru }) };
    return { top: format(date, 'LLL', { locale: ru }), bottom: format(date, 'yyyy') };
  };

  // ── Scale button handler ──
  const handleScaleChange = (scale: 'day' | 'week' | 'month') => {
    setGanttScale(scale);
    setViewStart(smartViewStart(scale, earliestDate));
    // Scroll after next tick
    setTimeout(() => {
      if (!containerRef.current) return;
      const vs = smartViewStart(scale);
      const pts = projectTasks;
      let targetPx: number;
      if (pts.length > 0) {
        const earliest = new Date(Math.min(...pts.map((t) => new Date(t.startDate).getTime())));
        targetPx = dateToPixel(earliest, vs, scale);
      } else {
        targetPx = dateToPixel(new Date(), vs, scale);
      }
      const w = containerRef.current.clientWidth || 800;
      containerRef.current.scrollLeft = Math.max(0, targetPx - w * 0.15);
    }, 50);
  };

  // ───────────────────────────────────────────
  // RENDER
  // ───────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 12 }}>

      {/* ── Toolbar ── */}
      {(() => {
        const portalRoot = document.getElementById('view-toolbar-portal');
        const toolbarContent = (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            
            {/* Scale Dropdown */}
            <select
              className="form-control"
              style={{ border: 'none', background: 'var(--bg-elevated)', fontSize: 11, padding: '4px 8px', borderRadius: 4, height: 'auto', fontWeight: 500, cursor: 'pointer', outline: 'none' }}
              value={ganttScale}
              onChange={(e) => handleScaleChange(e.target.value as any)}
            >
              <option value="day">Дни</option>
              <option value="week">Недели</option>
              <option value="month">Месяцы</option>
            </select>

            {/* Nav */}
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-elevated)', borderRadius: 4 }}>
              <button className="btn btn-ghost btn-icon" onClick={navigateBack} id="gantt-nav-back" style={{ width: 24, height: 24 }}>
                <ChevronLeft size={14} />
              </button>
              <button className="btn btn-ghost" onClick={() => goToToday()} id="gantt-today" style={{ fontSize: 11, height: 24, padding: '0 8px' }}>Сегодня</button>
              <button className="btn btn-ghost btn-icon" onClick={navigateForward} id="gantt-nav-forward" style={{ width: 24, height: 24 }}>
                <ChevronRight size={14} />
              </button>
            </div>
            
            {/* Subtasks Toggle */}
            <button 
              className={`btn btn-sm ${showSubtasks ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setShowSubtasks(!showSubtasks)} 
              id="gantt-toggle-subtasks" 
              style={{ height: 24, display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, padding: '0 8px' }}
            >
              <Layers size={12} />
              Подзадачи
            </button>

            {/* Export (Icon Only) */}
            <button
              className="btn btn-ghost btn-icon"
              style={{ height: 24, width: 24, background: 'var(--bg-elevated)', borderRadius: 4 }}
              onClick={() => {/* export */}}
              title="Экспорт"
              id="gantt-export"
            >
              <Download size={12} />
            </button>

          </div>
        );

        return portalRoot ? createPortal(toolbarContent, portalRoot) : null;
      })()}

      {/* ── Two-column body ── */}
      <div className="gantt-body">

        {/* ── LEFT: fixed task names ── */}
        <div 
          className="gantt-tasks-panel" 
          ref={(node) => {
             // Create a local ref to handle the sync without re-renders
             if (node) {
                (node as any)._isLeftPanel = true;
                // store it somewhere stable, actually let's just use a dedicated ref hook at the top
                // wait, I can just do document.getElementById if I add an ID, or use a ref.
             }
          }}
          id="gantt-left-panel"
        >
          <div className="gantt-tasks-header">Название задачи</div>
          {projectTasks.map((task) => {
            const assignee = users.find((u) => u.id === task.assigneeId);
            const isOverdue = !['done'].includes(task.status) && isBefore(new Date(task.dueDate), new Date());
            return (
              <div
                key={task.id}
                className="gantt-task-name-row"
                onClick={() => openEditTask(task.id)}
                id={`gantt-row-${task.id}`}
                style={{ 
                  opacity: task.status === 'done' ? 0.65 : 1,
                  paddingLeft: task.parentId ? '36px' : undefined
                }}
              >
                {task.parentId && <CornerDownRight size={14} style={{ marginRight: 6, opacity: 0.5, flexShrink: 0 }} />}
                
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                  background: PRIORITY_DOT[task.priority] ?? '#6366f1',
                }} />
                <span style={{
                  flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  fontSize: 13, fontWeight: task.parentId ? 400 : 500,
                  textDecoration: task.status === 'done' ? 'line-through' : 'none',
                  color: isOverdue ? 'var(--color-danger)' : 'inherit',
                }}>
                  {task.title || 'Без названия'}
                </span>
                {/* Dependency indicator */}
                {task.dependencies && task.dependencies.length > 0 && (
                  <span style={{ fontSize: 9, color: 'var(--text-muted)', flexShrink: 0 }}>
                    {task.dependencies.some(d => d.type === 'blocked_by') ? '🔗' : '→'}
                  </span>
                )}
                {assignee && (
                  <div className="avatar" style={{ width: 20, height: 20, fontSize: 8, background: assignee.color, flexShrink: 0 }}>
                    {assignee.avatar}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── RIGHT: scrollable timeline ── */}
        <div 
          className="gantt-timeline-scroll" 
          ref={containerRef}
          onScroll={(e) => {
             const leftPanel = document.getElementById('gantt-left-panel');
             if (leftPanel) {
                leftPanel.scrollTop = e.currentTarget.scrollTop;
             }
          }}
        >
          <div style={{ width: totalWidth, minWidth: totalWidth, position: 'relative' }}>

            {/* Column headers */}
            <div className="gantt-timeline-header" style={{ width: totalWidth, position: 'relative' }}>
              {columns.map((colDate, i) => {
                const { top, bottom } = colHeader(colDate);
                return (
                  <div
                    key={i}
                    className="gantt-day-cell"
                    style={{
                      position: 'absolute',
                      left: i * cellW,
                      top: 0,
                      bottom: 0,
                      width: cellW,
                      background: isToday(colDate)
                        ? 'rgba(99,102,241,0.12)'
                        : ganttScale === 'day' && isWeekend(colDate)
                          ? 'rgba(99,102,241,0.03)'
                          : undefined,
                    }}
                  >
                    <span className="gantt-day-label">{top}</span>
                    <span className="gantt-date-label">{bottom}</span>
                  </div>
                );
              })}
            </div>
            {/* Task rows + bars */}
            <div style={{ position: 'relative', width: totalWidth }}>
              {/* Today marker */}
              {todayPx >= 0 && todayPx <= totalWidth && (
                <div style={{
                  position: 'absolute', left: todayPx, top: 0, bottom: 0,
                  width: 2, background: 'var(--color-primary)', opacity: 0.7,
                  zIndex: 4, pointerEvents: 'none',
                }}>
                  <div style={{
                    position: 'absolute', top: -4, left: -4,
                    width: 10, height: 10, borderRadius: '50%',
                    background: 'var(--color-primary)',
                  }} />
                </div>
              )}

              {/* Parent grouping boxes */}
              {Array.from(parentBoxMap.entries()).map(([parentId, box]) => (
                 <div
                   key={`parent-box-${parentId}`}
                   style={{
                     position: 'absolute',
                     top: box.top,
                     height: box.bottom - box.top,
                     left: box.left,
                     width: box.width,
                     background: 'rgba(99, 102, 241, 0.05)',
                     border: '1px dashed rgba(99, 102, 241, 0.5)',
                     borderRadius: '6px',
                     zIndex: 2,
                     pointerEvents: 'none'
                   }}
                 />
              ))}

              {/* SVG dependency arrows */}
              <svg
                style={{ position: 'absolute', top: 0, left: 0, width: totalWidth, height: projectTasks.length * ROW_H, pointerEvents: 'none', zIndex: 5, overflow: 'visible' }}
              >
                <defs>
                  <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L5,3 z" fill="#64748b" />
                  </marker>
                </defs>
                {projectTasks.map((task) => {
                  if (!task.dependencies) return null;
                  return task.dependencies
                    .filter(dep => dep.type !== 'relates_to')
                    .map((dep) => {
                      // In the new model, the 'task' is the successor, and 'dep.taskId' is the predecessor.
                      const fromRow = taskRowMap.get(dep.taskId);
                      const toRow   = taskRowMap.get(task.id);
                      if (!fromRow || !toRow) return null;


                      const isConflict = conflictTaskIds.has(task.id) || conflictTaskIds.has(dep.taskId);
                      const arrowColors: Record<string, string> = {
                        FS: '#6366f1', SS: '#22c55e', FF: '#f59e0b', SF: '#a855f7', relates_to: '#64748b',
                      };
                      const strokeColor = isConflict ? '#ef4444' : (arrowColors[dep.type] ?? '#64748b');
                      const markerId = `arrowhead-${strokeColor.replace('#', '')}`;

                      const x1 = fromRow.left + fromRow.width;
                      const y1 = fromRow.index * ROW_H + ROW_H / 2 + SVG_Y_OFFSET;
                      const x2 = toRow.left;
                      const y2 = toRow.index * ROW_H + ROW_H / 2 + SVG_Y_OFFSET;
                      
                      const offset = 12; // Outset from starting block

                      let pts: [number, number][];
                      if (x2 > x1 + offset + 4) {
                        pts = [
                          [x1, y1],
                          [x1 + offset, y1],
                          [x1 + offset, y2],
                          [x2, y2]
                        ];
                      } else {
                        const dir = y2 > y1 ? 1 : -1;
                        // To perfectly snake between rows, calculate exact mid-point line
                        // Note: we remove SVG_Y_OFFSET here so the horizontal line drops directly onto the CSS border!
                        const yDrop = (fromRow.index * ROW_H + ROW_H / 2) + (ROW_H / 2) * dir;
                        pts = [
                          [x1, y1],
                          [x1 + offset, y1],
                          [x1 + offset, yDrop],
                          [x2 - offset, yDrop],
                          [x2 - offset, y2],
                          [x2, y2]
                        ];
                      }

                      // Convert pts to rounded path
                      let pathD = `M ${pts[0][0]},${pts[0][1]}`;
                      const r = 5;
                      for (let i = 1; i < pts.length - 1; i++) {
                        const curr = pts[i];
                        const prev = pts[i - 1];
                        const next = pts[i + 1];
                        const dx1 = prev[0] - curr[0], dy1 = prev[1] - curr[1];
                        const len1 = Math.hypot(dx1, dy1);
                        const dx2 = next[0] - curr[0], dy2 = next[1] - curr[1];
                        const len2 = Math.hypot(dx2, dy2);
                        const rad = Math.min(r, len1 / 2, len2 / 2);
                        if (rad <= 0) {
                          pathD += ` L ${curr[0]},${curr[1]}`;
                          continue;
                        }
                        const sX = curr[0] + (dx1 / len1) * rad;
                        const sY = curr[1] + (dy1 / len1) * rad;
                        const eX = curr[0] + (dx2 / len2) * rad;
                        const eY = curr[1] + (dy2 / len2) * rad;
                        pathD += ` L ${sX},${sY} Q ${curr[0]},${curr[1]} ${eX},${eY}`;
                      }
                      pathD += ` L ${pts[pts.length - 1][0]},${pts[pts.length - 1][1]}`;

                      return (
                        <g key={`${task.id}-${dep.taskId}`}>
                          <defs>
                            <marker id={markerId} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                              <path d="M0,0 L0,6 L5,3 z" fill={strokeColor} />
                            </marker>
                          </defs>
                          <path
                            d={pathD}
                            stroke={strokeColor}
                            strokeWidth={isConflict ? 2 : 1.5}
                            strokeDasharray={isConflict ? '5,3' : undefined}
                            fill="none"
                            markerEnd={`url(#${markerId})`}
                          />
                          {/* Type label (shown for non-FS or when lag exists) */}
                          {(dep.type !== 'FS' || (dep.lag && dep.lag !== 0)) && (
                            <text
                              x={(x1 + x2) / 2}
                              y={Math.min(y1, y2) - 4}
                              fontSize="9"
                              fill={strokeColor}
                              textAnchor="middle"
                              style={{ pointerEvents: 'none', userSelect: 'none' }}
                            >
                              {dep.type !== 'FS' ? dep.type : ''}{dep.lag && dep.lag !== 0 ? ` ${dep.lag > 0 ? '+' : ''}${dep.lag}д` : ''}
                            </text>
                          )}
                        </g>
                      );
                    });
                })}
              </svg>

              {/* Task rows */}
              {projectTasks.map((task) => {
                let { left, width } = getBar(task);
                
                // FORCE: Render-loop re-clamp — derived directly from parent DATES, not bar geometry
                if (task.parentId) {
                  const parent = tasks.find(t => t.id === task.parentId);
                  if (parent && parent.startDate && parent.dueDate) {
                    const pdStart = new Date(parent.startDate);
                    const pdDue = new Date(parent.dueDate);
                    if (!isNaN(pdStart.getTime()) && !isNaN(pdDue.getTime())) {
                      const pLeft = dateToPixel(startOfDay(pdStart), viewStart, ganttScale);
                      const pRight = dateToPixel(addDays(startOfDay(pdDue), 1), viewStart, ganttScale);
                      if (left < pLeft) left = pLeft;
                      if (left > pRight) left = pRight;
                      const myRight = left + width;
                      if (myRight > pRight) width = Math.max(0, pRight - left);
                    }
                  }
                }

                const isDragging = dragState?.taskId === task.id;
                const style = STATUS_STYLE[task.status] ?? STATUS_STYLE.todo;
                const isOverdue = !['done'].includes(task.status) && isBefore(new Date(task.dueDate), new Date());

                return (
                  <div key={task.id} className="gantt-row-area" style={{ width: totalWidth }}>
                    {/* Column background cells */}
                    {columns.map((colDate, i) => (
                      <div
                        key={i}
                        className={`gantt-col-cell ${ganttScale === 'day' && isWeekend(colDate) ? 'weekend' : ''}`}
                        style={{
                          position: 'absolute',
                          left: i * cellW,
                          top: 0,
                          bottom: 0,
                          width: cellW,
                        }}
                      />
                    ))}

                    {/* Task bar */}
                    <div
                      className={`gantt-bar${conflictTaskIds.has(task.id) ? ' conflict' : ''}`}
                      style={{
                        left,
                        width,
                        background: isOverdue ? 'linear-gradient(90deg,#dc2626,#ef4444)' : style.background,
                        opacity: isDragging ? 0.8 : style.opacity ?? 1,
                        cursor: isDragging ? 'grabbing' : 'grab',
                        boxShadow: isDragging
                          ? '0 6px 20px rgba(0,0,0,0.4)'
                          : conflictTaskIds.has(task.id)
                          ? '0 0 0 2px #ef4444, 0 2px 8px rgba(239,68,68,0.4)'
                          : '0 2px 6px rgba(0,0,0,0.15)',
                        zIndex: isDragging ? 10 : 1,
                        pointerEvents: dragState && !isDragging ? 'none' : 'auto',
                        userSelect: 'none',
                        outline: style.dashed ? '2px dashed rgba(239,68,68,0.8)' : 'none',
                        outlineOffset: 1,
                      }}
                      data-tooltip={!isDragging ? `${task.title} — ${task.progress}%` : undefined}
                      onMouseDown={(e) => {
                        if (e.button !== 0) return;
                        e.preventDefault();
                        setDragState({
                          taskId: task.id, type: 'move', startX: e.clientX,
                          initialStart: new Date(task.startDate),
                          initialDue:   new Date(task.dueDate),
                          currentDeltaDays: 0,
                        });
                      }}
                      onClick={(e) => {
                        if (isClickPrevented.current) { e.stopPropagation(); return; }
                        openEditTask(task.id);
                      }}
                    >
                      {/* Progress fill */}
                      <div className="gantt-progress" style={{ width: `${task.progress}%` }} />

                      {/* Conflict warning icon */}
                      {conflictTaskIds.has(task.id) && (
                        <span style={{
                          position: 'absolute', left: 4, top: '50%', transform: 'translateY(-50%)',
                          display: 'flex', alignItems: 'center', pointerEvents: 'none',
                        }}>
                          <AlertTriangle size={10} color="#fff" />
                        </span>
                      )}

                      {/* Status label */}
                      <span style={{
                        position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)',
                        fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.85)',
                        pointerEvents: 'none', lineHeight: 1,
                      }}>
                        {STATUS_LABEL[task.status]}
                      </span>

                      {/* Left resize handle */}
                      <div
                        style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 8, cursor: 'ew-resize', zIndex: 11 }}
                        onMouseDown={(e) => {
                          e.stopPropagation(); e.preventDefault();
                          if (e.button !== 0) return;
                          setDragState({ taskId: task.id, type: 'left', startX: e.clientX, initialStart: new Date(task.startDate), initialDue: new Date(task.dueDate), currentDeltaDays: 0 });
                        }}
                      />
                      {/* Right resize handle */}
                      <div
                        style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 8, cursor: 'ew-resize', zIndex: 11 }}
                        onMouseDown={(e) => {
                          e.stopPropagation(); e.preventDefault();
                          if (e.button !== 0) return;
                          setDragState({ taskId: task.id, type: 'right', startX: e.clientX, initialStart: new Date(task.startDate), initialDue: new Date(task.dueDate), currentDeltaDays: 0 });
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default GanttChart;
