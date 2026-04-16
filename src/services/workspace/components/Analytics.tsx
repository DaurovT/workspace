import React, { useMemo } from 'react';
import { useStore, STATUS_LABELS } from '../../../store';
import { Download, TrendingUp, BarChart2 as BarIcon, CheckCircle2, PieChart as PieIcon, Clock } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

const Analytics: React.FC = () => {
  const { tasks, projects, users } = useStore();

  const handleExportCSV = () => {
    const headers = ['ID', 'Проект', 'Заголовок', 'Статус', 'Приоритет', 'Исполнитель', 'Дедлайн', 'Часы', 'Создано'];
    
    const rows = tasks.map(t => {
      const p = projects.find(pr => pr.id === t.projectId)?.name ?? '';
      const u = users.find(ur => ur.id === t.assigneeId)?.name ?? 'Не назначен';
      return [
        t.id, p, `"${t.title.replace(/"/g, '""')}"`,
        t.status, t.priority, u,
        format(new Date(t.dueDate), 'yyyy-MM-dd'),
        t.estimatedHours.toString(),
        format(new Date(t.createdAt), 'yyyy-MM-dd')
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `workspace_export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const projectStats = useMemo(() => {
    return projects.map(p => {
      const pTasks = tasks.filter(t => t.projectId === p.id);
      const done = pTasks.filter(t => t.status === 'done').length;
      const total = pTasks.length;
      const progress = total > 0 ? (done / total) * 100 : 0;
      return { project: p, done, total, progress };
    }).sort((a, b) => b.progress - a.progress);
  }, [projects, tasks]);

  const assigneeStats = useMemo(() => {
    return users.map(u => {
      const uTasks = tasks.filter(t => t.assigneeId === u.id);
      const done = uTasks.filter(t => t.status === 'done').length;
      return { user: u, total: uTasks.length, done };
    }).sort((a, b) => b.done - a.done);
  }, [users, tasks]);

  const averageCompletionTime = useMemo(() => {
    const completedTasks = tasks.filter(t => t.status === 'done');
    if (completedTasks.length === 0) return 0;
    const totalDays = completedTasks.reduce((sum, t) => {
      return sum + differenceInDays(new Date(t.updatedAt), new Date(t.createdAt));
    }, 0);
    return Math.round(totalDays / completedTasks.length);
  }, [tasks]);

  const statusData = useMemo(() => {
    const counts: Record<string, number> = { todo: 0, in_progress: 0, review: 0, done: 0, blocked: 0 };
    tasks.forEach(t => counts[t.status]++);
    return Object.entries(counts)
      .filter(([_, count]) => count > 0)
      .map(([status, count]) => ({
        name: STATUS_LABELS[status as keyof typeof STATUS_LABELS],
        value: count,
        color: status === 'done' ? '#10b981' : status === 'in_progress' ? '#3b82f6' : status === 'review' ? '#f59e0b' : status === 'blocked' ? '#ef4444' : '#64748b'
      }));
  }, [tasks]);

  const timeData = useMemo(() => {
    return projects.map(p => {
      const pTasks = tasks.filter(t => t.projectId === p.id);
      const est = pTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
      const log = pTasks.reduce((sum, t) => sum + (t.loggedHours || 0), 0);
      return {
        name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
        'Оценка (ч)': est,
        'Затрачено (ч)': log
      };
    }).filter(d => d['Оценка (ч)'] > 0 || d['Затрачено (ч)'] > 0);
  }, [projects, tasks]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '8px 12px', boxShadow: 'var(--shadow-lg)' }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{payload[0].payload.name}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
              <div style={{ width: 8, height: 8, borderRadius: 4, background: entry.color }} />
              {entry.name}: <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Аналитика и отчёты</h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Глобальная статистика по всем проектам и команде</p>
        </div>
        <button className="btn btn-secondary" onClick={handleExportCSV} style={{ gap: 6 }}>
          <Download size={14} /> Скачать CSV
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <div className="stat-card" style={{ padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Всего задач в системе
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)' }}>{tasks.length}</div>
        </div>
        <div className="stat-card" style={{ padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Выполнено задач
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-success)' }}>{tasks.filter(t => t.status === 'done').length}</div>
        </div>
        <div className="stat-card" style={{ padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Проектов в работе
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-primary)' }}>{projects.length}</div>
        </div>
        <div className="stat-card" style={{ padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Ср. время выполнения
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-warning)' }}>
            {averageCompletionTime} <span style={{ fontSize: 14, fontWeight: 500 }}>дн.</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(400px, 1.5fr)', gap: 16 }}>
        {/* График Статусов */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <PieIcon size={16} color="var(--color-primary)" />
            <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Распределение статусов</h2>
          </div>
          <div style={{ height: 260, width: '100%' }}>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%" cy="50%"
                    innerRadius={70} outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    animationBegin={0} animationDuration={800}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="var(--bg-surface)" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Нет данных</div>
            )}
          </div>
        </div>

        {/* График Времени */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Clock size={16} color="var(--color-warning)" />
            <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Экономика времени (План / Факт)</h2>
          </div>
          <div style={{ height: 260, width: '100%' }}>
            {timeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={timeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-elevated)', opacity: 0.5 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Оценка (ч)" fill="var(--color-primary)" radius={[4, 4, 0, 0]} animationDuration={1000} />
                  <Bar dataKey="Затрачено (ч)" fill="var(--color-warning)" radius={[4, 4, 0, 0]} animationDuration={1000} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Нет данных</div>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Команда Топ (Старый вид) */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <TrendingUp size={16} color="var(--color-success)" />
            <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Рейтинг эффективности</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {assigneeStats.map((as, idx) => (
              <div key={as.user.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
                <div style={{ width: 24, fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textAlign: 'center' }}>
                  #{idx + 1}
                </div>
                <div className="avatar" style={{ width: 28, height: 28, background: as.user.color, fontSize: 10 }}>{as.user.avatar}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{as.user.name}</div>
                  <div style={{ paddingTop: 2, display: 'flex', gap: 8 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>В работе: <span style={{ color: 'var(--text-primary)' }}>{as.total - as.done}</span></div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Всего: <span style={{ color: 'var(--text-primary)' }}>{as.total}</span></div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-success)', fontWeight: 600, fontSize: 14 }}>
                    <CheckCircle2 size={14} />
                    {as.done}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>выполнено</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Прогресс по проектам (Старый вид) */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <BarIcon size={16} color="var(--color-primary)" />
            <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Прогресс по проектам</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {projectStats.map((ps) => (
              <div key={ps.project.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 14 }}>{ps.project.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{ps.project.name}</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {Math.round(ps.progress)}% <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({ps.done}/{ps.total})</span>
                  </span>
                </div>
                <div className="progress-bar" style={{ height: 6 }}>
                  <div className="progress-fill" style={{ width: `${ps.progress}%`, background: ps.project.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
