import React, { useState } from 'react';
import { useStore } from '../../../store';
import type { Task, Priority, StatusId } from '../../../store';
import {
  X, Flag, User, Calendar, Tag, Clock, CheckSquare,
  Plus, Trash2, Send, Link as LinkIcon, AlertTriangle,
  Activity, ChevronDown, ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { MarkdownEditor } from './MarkdownEditor';
import { MarkdownViewer } from './MarkdownViewer';
import { MentionsInput, Mention } from 'react-mentions';
import type { DependencyType } from '../utils/ganttDeps';
import { DEP_LABELS } from '../utils/ganttDeps';

// ─── Constants ─────────────────────────────────────────────────────────────────

const PRIORITIES: { value: Priority; label: string; color: string; bg: string }[] = [
  { value: 'urgent', label: 'Срочно',  color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  { value: 'high',   label: 'Высокий', color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
  { value: 'medium', label: 'Средний', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  { value: 'low',    label: 'Низкий',  color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
];

const STATUSES: { value: StatusId; label: string; color: string }[] = [
  { value: 'todo',        label: 'К выполнению',  color: '#64748b' },
  { value: 'in_progress', label: 'В работе',      color: '#6366f1' },
  { value: 'review',      label: 'На проверке',   color: '#f59e0b' },
  { value: 'done',        label: 'Готово',         color: '#22c55e' },
  { value: 'blocked',     label: 'Заблокировано', color: '#ef4444' },
];

// ─── Small helpers ──────────────────────────────────────────────────────────────

const SectionLabel: React.FC<{ icon: React.ReactNode; label: string; right?: React.ReactNode }> = ({ icon, label, right }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
      {icon}{label}
    </div>
    {right}
  </div>
);

const PropRow: React.FC<{ icon: React.ReactNode; label: string; children: React.ReactNode }> = ({ icon, label, children }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, minHeight: 32 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 100, paddingTop: 6 }}>
      <span style={{ color: 'var(--text-muted)', display: 'flex' }}>{icon}</span>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
    </div>
    <div style={{ flex: 1 }}>{children}</div>
  </div>
);

// ─── Main TaskModal ─────────────────────────────────────────────────────────────

const TaskModal: React.FC = () => {
  const {
    isTaskModalOpen, editingTaskId, tasks, users, comments, closeModal,
    createTask, updateTask, deleteTask, activeProjectId, addComment, openEditTask,
    addDependency, removeDependency
  } = useStore();

  const existingTask = editingTaskId ? tasks.find(t => t.id === editingTaskId) : null;

  // ── State ──────────────────────────────────────────────────────────────────
  const [title,          setTitle]          = useState(existingTask?.title ?? '');
  const [description,    setDescription]    = useState(existingTask?.description ?? '');
  const [priority,       setPriority]       = useState<Priority>(existingTask?.priority ?? 'medium');
  const [status,         setStatus]         = useState<StatusId>(existingTask?.status ?? 'todo');
  const [assigneeId,     setAssigneeId]     = useState<string>(existingTask?.assigneeId ?? '');
  const [dueDate,        setDueDate]        = useState(existingTask?.dueDate  ? format(new Date(existingTask.dueDate),   'yyyy-MM-dd') : '');
  const [startDate,      setStartDate]      = useState(existingTask?.startDate ? format(new Date(existingTask.startDate), 'yyyy-MM-dd') : '');
  const [estimatedHours, setEstimatedHours] = useState(existingTask?.estimatedHours ?? 0);
  const [tagInput,       setTagInput]       = useState('');
  const [tags,           setTags]           = useState<string[]>(existingTask?.tags ?? []);
  const [newSubtask,     setNewSubtask]     = useState('');
  const [newDepType,     setNewDepType]     = useState<DependencyType>('FS');
  const [newDepTarget,   setNewDepTarget]   = useState<string>('');
  const [newDepLag,      setNewDepLag]      = useState<number>(0);
  const [depError,       setDepError]       = useState<string>('');
  const [addH,           setAddH]           = useState('');
  const [showSystemLogs, setShowSystemLogs] = useState(false);
  const [commentText,    setCommentText]    = useState('');
  const [showDeps,       setShowDeps]       = useState(false);

  React.useEffect(() => {
    if (existingTask) {
      setTitle(existingTask.title);
      setDescription(existingTask.description);
      setPriority(existingTask.priority);
      setStatus(existingTask.status);
      setAssigneeId(existingTask.assigneeId ?? '');
      setDueDate(existingTask.dueDate  ? format(new Date(existingTask.dueDate),   'yyyy-MM-dd') : '');
      setStartDate(existingTask.startDate ? format(new Date(existingTask.startDate), 'yyyy-MM-dd') : '');
      setEstimatedHours(existingTask.estimatedHours);
      setTags(existingTask.tags);
    } else {
      setTitle(''); setDescription(''); setPriority('medium'); setStatus('todo');
      setAssigneeId(''); setDueDate(''); setStartDate(''); setEstimatedHours(0); setTags([]);
    }
  }, [editingTaskId, isTaskModalOpen]);

  if (!isTaskModalOpen) return null;

  const prioConfig   = PRIORITIES.find(p => p.value === priority)!;
  const statusConfig = STATUSES.find(s => s.value === status)!;
  const assignee     = users.find(u => u.id === assigneeId);
  const subIssues    = existingTask ? tasks.filter(t => t.parentId === existingTask.id) : [];
  const parentIssue  = existingTask?.parentId ? tasks.find(t => t.id === existingTask.parentId) : null;
  const taskComments = existingTask ? comments.filter(c => c.taskId === existingTask.id) : [];
  const sysCount     = taskComments.filter(c => c.isSystem).length;
  const visibleComments = taskComments.filter(c => showSystemLogs || !c.isSystem);

  const handleSave = () => {
    const taskData: Partial<Task> = {
      title: title || 'Без названия',
      description, priority, status,
      assigneeId: assigneeId || null,
      startDate: startDate ? new Date(startDate).toISOString() : new Date().toISOString(),
      dueDate:   dueDate   ? new Date(dueDate).toISOString()   : new Date(Date.now() + 7*86400000).toISOString(),
      estimatedHours, tags, projectId: activeProjectId,
    };
    if (existingTask) updateTask(existingTask.id, taskData);
    else createTask(taskData);
    closeModal();
  };

  const handleAddSubtask = () => {
    if (!newSubtask.trim() || !existingTask) return;
    createTask({
      title: newSubtask.trim(), parentId: existingTask.id, projectId: activeProjectId,
      startDate: existingTask.startDate || new Date().toISOString(),
      dueDate:   existingTask.dueDate   || new Date(Date.now() + 7*86400000).toISOString(),
    });
    setNewSubtask('');
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleSendComment = () => {
    if (!commentText.trim() || !existingTask) return;
    addComment(existingTask.id, commentText.trim());
    setCommentText('');
  };

  const loggedH = existingTask?.loggedHours ?? 0;
  const progress = estimatedHours > 0 ? Math.min((loggedH / estimatedHours) * 100, 100) : 0;

  // ── Blocking check ───────────────────────────────────────────────────────────
  const blockingTasks = existingTask
    ? (existingTask.dependencies || [])
        .filter(d => d.type === 'blocked_by')
        .map(d => tasks.find(t => t.id === d.taskId))
        .filter(t => t && t.status !== 'done') as Task[]
    : [];

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
      <div
        style={{
          background: 'var(--bg-surface)',
          borderRadius: 14,
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-lg)',
          width: '90vw', maxWidth: 900,
          maxHeight: '90vh',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
        }}
        onKeyDown={e => {
          // Enter (without Shift) from input fields — save
          if (e.key === 'Enter' && !e.shiftKey) {
            const tag = (e.target as HTMLElement).tagName.toLowerCase();
            if (tag === 'textarea' || tag === 'select') return; // allow newline in textareas, don't intercept selects
            e.preventDefault();
            handleSave();
          }
          // Esc — close
          if (e.key === 'Escape') closeModal();
        }}
      >

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          gap: 12, flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Status dot */}
            <div style={{
              width: 10, height: 10, borderRadius: '50%',
              background: statusConfig.color, flexShrink: 0,
              boxShadow: `0 0 6px ${statusConfig.color}60`,
            }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
              {existingTask ? 'Редактирование задачи' : 'Новая задача'}
            </span>
            {/* Priority pill */}
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 9px', borderRadius: 20,
              background: prioConfig.bg, color: prioConfig.color,
              border: `1px solid ${prioConfig.color}30`,
            }}>
              {prioConfig.label}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {existingTask && (
              <button className="btn btn-ghost btn-icon" onClick={() => { deleteTask(existingTask.id); closeModal(); }} title="Удалить" id="btn-delete-task" style={{ color: 'var(--color-danger)' }}>
                <Trash2 size={15} />
              </button>
            )}
            <button className="btn btn-ghost btn-icon" onClick={closeModal} id="btn-close-modal">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── Body ───────────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

          {/* Left — main content */}
          <div style={{
            flex: 1, overflow: 'auto', padding: '20px 20px 20px',
            display: 'flex', flexDirection: 'column', gap: 18,
            minWidth: 0,
          }}>

            {/* Blocking warning */}
            {blockingTasks.length > 0 && (
              <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <AlertTriangle size={14} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#ef4444' }}>Задача заблокирована</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                    Сначала завершите: {blockingTasks.map(t => t.title).join(', ')}
                  </div>
                </div>
              </div>
            )}

            {/* Title */}
            <input
              id="task-title"
              className="form-control"
              style={{ fontSize: 20, fontWeight: 700, padding: '10px 14px', letterSpacing: '-0.01em', lineHeight: 1.3, border: '1px solid transparent', background: 'var(--bg-elevated)' }}
              placeholder="Название задачи..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              autoFocus
            />

            {/* Description */}
            <div>
              <SectionLabel icon={null} label="Описание" />
              <MarkdownEditor
                value={description}
                onChange={setDescription}
                placeholder="Добавьте описание (поддерживается Markdown)..."
              />
            </div>

            {/* Parent task */}
            {parentIssue && (
              <div>
                <SectionLabel icon={<ChevronRight size={11} />} label="Родительская задача" />
                <div
                  onClick={() => openEditTask(parentIssue.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', cursor: 'pointer', transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-card)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)'}
                >
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUSES.find(s => s.value === parentIssue.status)?.color ?? '#888', flexShrink: 0 }} />
                  <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>{parentIssue.title}</span>
                </div>
              </div>
            )}

            {/* Subtasks */}
            {existingTask && (
              <div>
                <SectionLabel
                  icon={<CheckSquare size={11} />}
                  label={`Подзадачи (${subIssues.filter(s => s.status === 'done').length}/${subIssues.length})`}
                  right={
                    subIssues.length > 0 ? (
                      <div style={{
                        height: 4, width: 80, background: 'var(--bg-elevated)', borderRadius: 4, overflow: 'hidden',
                      }}>
                        <div style={{ height: '100%', background: 'var(--color-primary)', width: `${(subIssues.filter(s => s.status === 'done').length / subIssues.length) * 100}%`, borderRadius: 4 }} />
                      </div>
                    ) : null
                  }
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
                  {subIssues.map(st => {
                    const stAssignee = users.find(u => u.id === st.assigneeId);
                    return (
                      <div
                        key={st.id}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 8, background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', cursor: 'pointer', transition: 'background 0.1s' }}
                        onClick={() => openEditTask(st.id)}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-card)'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)'}
                      >
                        <div
                          onClick={e => { e.stopPropagation(); updateTask(st.id, { status: st.status === 'done' ? 'todo' : 'done' }); }}
                          className={`task-checkbox ${st.status === 'done' ? 'checked' : ''}`}
                          style={{ flexShrink: 0 }}
                        >
                          {st.status === 'done' && <svg width="9" height="7" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </div>
                        <span style={{ flex: 1, fontSize: 12, color: st.status === 'done' ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: st.status === 'done' ? 'line-through' : 'none' }}>
                          {st.title}
                        </span>
                        {stAssignee && (
                          <div className="avatar" style={{ width: 20, height: 20, fontSize: 8, background: stAssignee.color, flexShrink: 0 }}>
                            {stAssignee.avatar}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    id="new-subtask"
                    className="form-control"
                    placeholder="Новая подзадача..."
                    value={newSubtask}
                    onChange={e => setNewSubtask(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddSubtask()}
                    style={{ flex: 1, height: 34, fontSize: 12 }}
                  />
                  <button className="btn btn-secondary btn-icon" onClick={handleAddSubtask} style={{ height: 34, width: 34 }}>
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* Dependencies (collapsible) */}
            {existingTask && (
              <div>
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', marginBottom: showDeps ? 10 : 0, userSelect: 'none' }}
                  onClick={() => setShowDeps(!showDeps)}
                >
                  {showDeps ? <ChevronDown size={11} color="var(--text-muted)" /> : <ChevronRight size={11} color="var(--text-muted)" />}
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    <LinkIcon size={11} style={{ display: 'inline', marginRight: 4 }} />
                    Связи задач {(existingTask.dependencies || []).length > 0 && `(${existingTask.dependencies!.length})`}
                  </span>
                </div>
                {showDeps && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {(existingTask.dependencies || []).map((dep, idx) => {
                      const tgt = tasks.find(t => t.id === dep.taskId);
                      const depColors: Record<string, string> = { FS: '#6366f1', SS: '#22c55e', FF: '#f59e0b', SF: '#a855f7', relates_to: '#64748b', blocks: '#ef4444', blocked_by: '#f97316' };
                      return (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: depColors[dep.type] ?? '#888', background: `${depColors[dep.type] ?? '#888'}18`, padding: '2px 6px', borderRadius: 4, whiteSpace: 'nowrap' }}>
                            {DEP_LABELS[dep.type as keyof typeof DEP_LABELS] ?? dep.type}
                          </span>
                          <span style={{ flex: 1, fontSize: 12, color: 'var(--text-primary)', cursor: 'pointer' }} onClick={() => openEditTask(dep.taskId)}>
                            {tgt?.title ?? dep.taskId}
                          </span>
                          {dep.lag !== 0 && <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{dep.lag > 0 ? `+${dep.lag}д` : `${dep.lag}д`}</span>}
                          <button className="btn btn-ghost btn-icon" style={{ width: 22, height: 22 }} onClick={() => removeDependency(existingTask.id, dep.taskId)}><X size={11} /></button>
                        </div>
                      );
                    })}
                    <div style={{ display: 'flex', gap: 6 }}>
                      <select className="form-control select-control" style={{ flex: '0 0 140px', height: 32, fontSize: 11 }} value={newDepType} onChange={e => { setNewDepType(e.target.value as DependencyType); setDepError(''); }}>
                        {(Object.entries(DEP_LABELS) as [DependencyType, string][]).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                      <select className="form-control select-control" style={{ flex: 1, height: 32, fontSize: 11 }} value={newDepTarget} onChange={e => { setNewDepTarget(e.target.value); setDepError(''); }}>
                        <option value="">Выбрать задачу...</option>
                        {tasks.filter(t => t.id !== existingTask.id && !(existingTask.dependencies || []).some(d => d.taskId === t.id) && t.projectId === activeProjectId).map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                      </select>
                      <input type="number" className="form-control" style={{ width: 60, height: 32, fontSize: 11 }} placeholder="Лаг" value={newDepLag || ''} onChange={e => setNewDepLag(Number(e.target.value) || 0)} />
                      <button className="btn btn-secondary btn-icon" style={{ height: 32, width: 32 }} onClick={() => {
                        if (!newDepTarget) return;
                        const res = addDependency(existingTask.id, newDepTarget, newDepType, newDepLag || undefined);
                        if (res.ok) { setNewDepTarget(''); setNewDepLag(0); setDepError(''); }
                        else setDepError(res.error || 'Ошибка');
                      }}><Plus size={13} /></button>
                    </div>
                    {depError && <div style={{ fontSize: 11, color: 'var(--color-danger)', display: 'flex', gap: 4, alignItems: 'center' }}><AlertTriangle size={11} />{depError}</div>}
                  </div>
                )}
              </div>
            )}

            {/* Comments */}
            {existingTask && (
              <div>
                <SectionLabel
                  icon={null}
                  label={`Обсуждение (${taskComments.filter(c => !c.isSystem).length})`}
                  right={sysCount > 0 ? (
                    <button className="btn btn-ghost" style={{ fontSize: 10, padding: '1px 6px', height: 22 }} onClick={() => setShowSystemLogs(!showSystemLogs)}>
                      {showSystemLogs ? 'Скрыть историю' : `История (${sysCount})`}
                    </button>
                  ) : undefined}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
                  {visibleComments.map(c => {
                    if (c.isSystem) return (
                      <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 4 }}>
                        <Activity size={10} color="var(--text-muted)" />
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.text}</span>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)', opacity: 0.7 }}>
                          {new Date(c.createdAt).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                    const author = useStore.getState().users.find(u => u.id === c.authorId);
                    return (
                      <div key={c.id} style={{ display: 'flex', gap: 10 }}>
                        <div className="avatar" style={{ width: 26, height: 26, fontSize: 9, background: author?.color ?? '#654ef1', flexShrink: 0 }}>
                          {author?.avatar ?? '?'}
                        </div>
                        <div style={{ flex: 1, background: 'var(--bg-elevated)', borderRadius: 8, padding: '8px 12px', border: '1px solid var(--border-subtle)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>{author?.name.split(' ')[0]}</span>
                            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                              {new Date(c.createdAt).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                            <MarkdownViewer text={c.text} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <MentionsInput
                    className="md-mentions-container form-control"
                    style={{ flex: 1, minHeight: 36, fontSize: 12 }}
                    placeholder="Написать комментарий (@Имя)..."
                    value={commentText}
                    onChange={(e: any) => setCommentText(e.target.value)}
                  >
                    <Mention trigger="@" data={users.map(u => ({ id: u.name, display: u.name }))} markup="@[__display__]" className="md-mention-highlight" style={{ background: 'var(--color-primary-light)', padding: '0 2px', borderRadius: 4 }} />
                  </MentionsInput>
                  <button className="btn btn-primary btn-icon" style={{ height: 36, width: 36 }} onClick={handleSendComment} disabled={!commentText.trim()}>
                    <Send size={13} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right — properties sidebar */}
          <div style={{
            width: 240, flexShrink: 0,
            borderLeft: '1px solid var(--border-subtle)',
            background: 'var(--bg-elevated)',
            padding: '20px 16px',
            overflow: 'auto',
            display: 'flex', flexDirection: 'column', gap: 4,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
              Свойства
            </div>

            {/* Status */}
            <PropRow icon={<Flag size={11} />} label="Статус">
              <select
                id="task-status"
                className="form-control select-control"
                style={{ height: 30, fontSize: 11, paddingLeft: 8 }}
                value={status}
                onChange={e => setStatus(e.target.value as StatusId)}
              >
                {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </PropRow>

            {/* Priority */}
            <PropRow icon={<Flag size={11} />} label="Приоритет">
              <select
                id="task-priority"
                className="form-control select-control"
                style={{ height: 30, fontSize: 11, paddingLeft: 8 }}
                value={priority}
                onChange={e => setPriority(e.target.value as Priority)}
              >
                {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </PropRow>

            {/* Assignee */}
            <PropRow icon={<User size={11} />} label="Исполнитель">
              {assignee ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div className="avatar" style={{ width: 20, height: 20, fontSize: 8, background: assignee.color, flexShrink: 0 }}>{assignee.avatar}</div>
                  <select
                    id="task-assignee"
                    className="form-control select-control"
                    style={{ height: 30, fontSize: 11, flex: 1 }}
                    value={assigneeId}
                    onChange={e => setAssigneeId(e.target.value)}
                  >
                    <option value="">Не назначен</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
              ) : (
                <select
                  id="task-assignee"
                  className="form-control select-control"
                  style={{ height: 30, fontSize: 11 }}
                  value={assigneeId}
                  onChange={e => setAssigneeId(e.target.value)}
                >
                  <option value="">Не назначен</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              )}
            </PropRow>

            {/* Divider */}
            <div style={{ height: 1, background: 'var(--border-subtle)', margin: '8px 0' }} />

            {/* Start date */}
            <PropRow icon={<Calendar size={11} />} label="Начало">
              <input
                id="task-start-date"
                type="date"
                className="form-control"
                style={{ height: 30, fontSize: 11 }}
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
            </PropRow>

            {/* Due date */}
            <PropRow icon={<Calendar size={11} />} label="Срок">
              <input
                id="task-due-date"
                type="date"
                className="form-control"
                style={{ height: 30, fontSize: 11 }}
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
              />
            </PropRow>

            {/* Divider */}
            <div style={{ height: 1, background: 'var(--border-subtle)', margin: '8px 0' }} />

            {/* Estimated hours */}
            <PropRow icon={<Clock size={11} />} label="Оценка (ч)">
              <input
                id="task-hours"
                type="number" min={0}
                className="form-control"
                style={{ height: 30, fontSize: 11 }}
                value={estimatedHours}
                onChange={e => setEstimatedHours(Number(e.target.value))}
              />
            </PropRow>

            {/* Time logged */}
            {existingTask && (
              <div style={{ background: 'var(--bg-card)', borderRadius: 8, padding: '10px 10px', border: '1px solid var(--border-subtle)', marginTop: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Затрачено</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: loggedH > estimatedHours && estimatedHours > 0 ? 'var(--color-warning)' : 'var(--text-primary)' }}>
                    {loggedH}ч {estimatedHours > 0 ? `/ ${estimatedHours}ч` : ''}
                  </span>
                </div>
                {estimatedHours > 0 && (
                  <div style={{ height: 4, background: 'var(--bg-elevated)', borderRadius: 2, marginBottom: 8, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 2, background: loggedH > estimatedHours ? 'var(--color-warning)' : 'var(--color-primary)', width: `${progress}%`, transition: 'width 0.3s' }} />
                  </div>
                )}
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    type="number" step="0.5" min={0.5}
                    className="form-control"
                    style={{ height: 26, fontSize: 11, flex: 1 }}
                    placeholder="+ часы"
                    value={addH}
                    onChange={e => setAddH(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && addH) {
                        useStore.getState().logTime(existingTask.id, Number(addH));
                        setAddH('');
                      }
                    }}
                  />
                  <button
                    className="btn btn-secondary"
                    style={{ height: 26, padding: '0 10px', fontSize: 10, whiteSpace: 'nowrap' }}
                    disabled={!addH}
                    onClick={() => { useStore.getState().logTime(existingTask.id, Number(addH)); setAddH(''); }}
                  >
                    Списать
                  </button>
                </div>
              </div>
            )}

            {/* Divider */}
            <div style={{ height: 1, background: 'var(--border-subtle)', margin: '8px 0' }} />

            {/* Tags */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
                <Tag size={11} color="var(--text-muted)" />
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Теги</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                {tags.map(tag => (
                  <span
                    key={tag}
                    style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                    onClick={() => setTags(tags.filter(t => t !== tag))}
                  >
                    #{tag} ×
                  </span>
                ))}
              </div>
              <input
                id="task-tags"
                className="form-control"
                style={{ height: 28, fontSize: 11 }}
                placeholder="Тег + Enter..."
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
              />
            </div>
          </div>
        </div>

        {/* ── Footer ──────────────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8,
          padding: '12px 20px',
          borderTop: '1px solid var(--border-subtle)',
          flexShrink: 0,
        }}>
          <button className="btn btn-ghost" onClick={closeModal} id="btn-cancel">Отмена</button>
          <button className="btn btn-primary" onClick={handleSave} id="btn-save-task">
            {existingTask ? 'Сохранить изменения' : 'Создать задачу'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;
