import React, { useMemo } from 'react';
import { useStore } from '../../../store';
import {
  CheckCircle2, Clock, AlertCircle, TrendingUp, Users,
  BarChart2, Plus, ArrowRight, Circle
} from 'lucide-react';
import { format, isPast, isThisWeek, differenceInDays } from 'date-fns';
import { ru } from 'date-fns/locale';

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'var(--priority-urgent)',
  high: 'var(--priority-high)',
  medium: 'var(--priority-medium)',
  low: 'var(--priority-low)',
};

const STATUS_LABELS: Record<string, string> = {
  todo: 'К выполнению', in_progress: 'В работе',
  review: 'На проверке', done: 'Готово', blocked: 'Заблокировано',
};

const Dashboard: React.FC = () => {
  const { tasks, users, projects, comments, currentUserId, openEditTask, openNewTask, setActivePage, setActiveProject } = useStore();

  const allTasks = tasks;

  const stats = useMemo(() => ({
    total: allTasks.length,
    done: allTasks.filter(t => t.status === 'done').length,
    inProgress: allTasks.filter(t => t.status === 'in_progress').length,
    overdue: allTasks.filter(t => t.status !== 'done' && isPast(new Date(t.dueDate))).length,
    dueThisWeek: allTasks.filter(t => t.status !== 'done' && isThisWeek(new Date(t.dueDate), { weekStartsOn: 1 })).length,
    myTasks: allTasks.filter(t => t.assigneeId === currentUserId && t.status !== 'done').length,
  }), [allTasks, currentUserId]);

  const recentActivity = useMemo(() => {
    const items = [
      ...comments.map(c => ({
        id: c.id, type: 'comment' as const,
        task: tasks.find(t => t.id === c.taskId),
        user: users.find(u => u.id === c.authorId),
        text: c.text, createdAt: c.createdAt,
      })),
      ...tasks.filter(t => t.status === 'done').map(t => ({
        id: `done-${t.id}`, type: 'done' as const,
        task: t, user: users.find(u => u.id === t.assigneeId),
        text: '', createdAt: t.updatedAt,
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 8);
    return items;
  }, [comments, tasks, users]);

  const myTasks = useMemo(
    () => allTasks.filter(t => t.assigneeId === currentUserId && t.status !== 'done')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).slice(0, 5),
    [allTasks, currentUserId]
  );

  const teamWorkload = useMemo(() =>
    users.map(u => ({
      user: u,
      total: allTasks.filter(t => t.assigneeId === u.id && t.status !== 'done').length,
      done: allTasks.filter(t => t.assigneeId === u.id && t.status === 'done').length,
    })).sort((a, b) => b.total - a.total),
    [allTasks, users]
  );

  const completionRate = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Приветствие */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
            Добрый день, Тимур 👋
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {format(new Date(), 'EEEE, d MMMM yyyy', { locale: ru })}
          </p>
        </div>
        <button className="btn btn-primary" onClick={openNewTask} style={{ gap: 6 }}>
          <Plus size={13} /> Новая задача
        </button>
      </div>

      {/* Главные метрики */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
        {[
          { label: 'Всего задач', value: stats.total, icon: BarChart2, color: '#654ef1' },
          { label: 'Выполнено', value: stats.done, icon: CheckCircle2, color: '#16a34a' },
          { label: 'В работе', value: stats.inProgress, icon: Clock, color: '#654ef1' },
          { label: 'Просрочено', value: stats.overdue, icon: AlertCircle, color: '#dc2626' },
          { label: 'На неделе', value: stats.dueThisWeek, icon: TrendingUp, color: '#d97706' },
          { label: 'Мои задачи', value: stats.myTasks, icon: Users, color: '#0284c7' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="stat-card" style={{ padding: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
              <Icon size={13} color={color} />
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color, lineHeight: 1, letterSpacing: '-0.02em' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Прогресс проектов + Загрузка команды */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* Прогресс проектов */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Проекты</h2>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{completionRate}% общий прогресс</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {projects.map(p => {
              const pt = allTasks.filter(t => t.projectId === p.id);
              const pdone = pt.filter(t => t.status === 'done').length;
              const pct = pt.length > 0 ? Math.round((pdone / pt.length) * 100) : 0;
              return (
                <div key={p.id} style={{ cursor: 'pointer' }} onClick={() => { setActiveProject(p.id); setActivePage('project'); }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>
                      <span>{p.icon}</span> {p.name}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{pdone}/{pt.length}</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${pct}%`, background: p.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Загрузка команды */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 16 }}>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 14 }}>Загрузка команды</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {teamWorkload.map(({ user, total, done }) => {
              const all = total + done;
              const pct = all > 0 ? Math.round((done / all) * 100) : 0;
              return (
                <div key={user.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="avatar" style={{ width: 22, height: 22, fontSize: 8, background: user.color, flexShrink: 0 }}>{user.avatar}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name.split(' ')[0]}</span>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0 }}>{total} активных</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${pct}%`, background: user.color }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Мои задачи + Активность */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* Мои задачи */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)' }}>
            <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Мои задачи</h2>
            <button className="btn btn-ghost btn-sm" style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
              onClick={() => setActivePage('my_tasks')}>
              Все <ArrowRight size={11} />
            </button>
          </div>
          {myTasks.length === 0
            ? <div style={{ padding: '24px 14px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>Нет активных задач 🎉</div>
            : myTasks.map(task => {
              const overdue = isPast(new Date(task.dueDate));
              const daysLeft = differenceInDays(new Date(task.dueDate), new Date());
              return (
                <div key={task.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '7px 14px', borderBottom: '1px solid var(--border-subtle)',
                  cursor: 'pointer', transition: 'background 0.1s',
                }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}
                  onClick={() => openEditTask(task.id)}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: PRIORITY_COLORS[task.priority], flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</span>
                  <span style={{ fontSize: 11, color: overdue ? 'var(--color-danger)' : daysLeft <= 2 ? 'var(--color-warning)' : 'var(--text-muted)', flexShrink: 0, fontWeight: overdue ? 600 : 400 }}>
                    {overdue ? `просрочено ${Math.abs(daysLeft)}д` : daysLeft === 0 ? 'сегодня' : `${daysLeft}д`}
                  </span>
                </div>
              );
            })
          }
        </div>

        {/* Последняя активность */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)' }}>
            <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Последняя активность</h2>
          </div>
          <div style={{ overflow: 'auto', maxHeight: 280 }}>
            {recentActivity.map(item => (
              <div key={item.id} style={{
                display: 'flex', gap: 10, padding: '8px 14px',
                borderBottom: '1px solid var(--border-subtle)',
                cursor: item.task ? 'pointer' : 'default',
                transition: 'background 0.1s',
              }}
                onMouseEnter={e => item.task && ((e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)')}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}
                onClick={() => item.task && openEditTask(item.task.id)}>
                {item.user
                  ? <div className="avatar" style={{ width: 22, height: 22, fontSize: 8, background: item.user.color, flexShrink: 0 }}>{item.user.avatar}</div>
                  : <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {item.type === 'done' ? <CheckCircle2 size={11} color="var(--color-success)" /> : <Circle size={11} color="var(--text-muted)" />}
                  </div>
                }
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 1 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>{item.user?.name.split(' ')[0] ?? 'Система'}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {item.type === 'comment' ? 'прокомментировал(а)' : 'завершил(а)'}
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                    {item.type === 'comment' ? item.text : STATUS_LABELS['done'] + ': ' + item.task?.title}
                  </span>
                </div>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0, paddingTop: 1 }}>
                  {format(new Date(item.createdAt), 'HH:mm', { locale: ru })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
