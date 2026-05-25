import React from 'react';
import { useHRStore } from '../hrStore';
import { Users, UserCheck, CalendarOff, Wallet, TrendingUp, Clock, Briefcase } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const PIE_COLORS = ['#8b5cf6', '#6366f1', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b'];
const ABSENCE_COLORS: Record<string, string> = { vacation: '#3b82f6', sick: '#ef4444', personal: '#f59e0b', maternity: '#8b5cf6' };
const ABSENCE_LABELS: Record<string, string> = { vacation: 'Отпуск', sick: 'Больничный', personal: 'Личные', maternity: 'Декрет' };
// const STATUS_LABELS: Record<string, string> = { active: 'Работает', on_leave: 'В отпуске', terminated: 'Уволен' };

const HRDashboard: React.FC = () => {
  const { employees, absences, payrollRuns, employeeKPIs } = useHRStore();

  const activeEmployees = employees.filter(e => e.status === 'active');

  // Today's absences
  const today = new Date().toISOString().slice(0, 10);
  const todayAbsences = absences.filter(a => a.status === 'approved' && a.startDate <= today && a.endDate >= today);

  // Total ФОТ
  const totalPayroll = activeEmployees.reduce((s, e) => s + e.salary, 0);


  // Department distribution
  const deptMap = new Map<string, number>();
  activeEmployees.forEach(e => {
    const dept = e.department || 'Без отдела';
    deptMap.set(dept, (deptMap.get(dept) || 0) + 1);
  });
  const deptData = Array.from(deptMap.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  // Absence by type
  const absTypeMap = new Map<string, number>();
  absences.filter(a => a.status === 'approved').forEach(a => {
    absTypeMap.set(a.type, (absTypeMap.get(a.type) || 0) + 1);
  });
  const absTypeData = Array.from(absTypeMap.entries()).map(([type, count]) => ({
    name: ABSENCE_LABELS[type] || type, value: count, color: ABSENCE_COLORS[type] || '#94a3b8',
  }));

  // Monthly payroll chart from runs
  const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
  const currentYear = new Date().getFullYear();
  const payrollChartData = months.map((name, i) => {
    const run = payrollRuns.find(r => r.month === i + 1 && r.year === currentYear);
    return { name, total: run ? run.totalNet : 0 };
  });

  const formatCurrency = (val: number) => new Intl.NumberFormat('ru-RU').format(val);

  const [chartsReady, setChartsReady] = React.useState(false);
  React.useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setChartsReady(true)));
    return () => cancelAnimationFrame(id);
  }, []);

  const KPICard = ({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string; sub?: string; color: string }) => {
    const isLong = value.length > 6;
    return (
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 12,
        padding: '18px 16px', display: 'flex', alignItems: 'flex-start', gap: 12, minWidth: 0,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: color, flexShrink: 0,
        }}>
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
          <div style={{ fontSize: isLong ? 18 : 22, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
          {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, whiteSpace: 'nowrap' }}>{sub}</div>}
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: 32, overflowY: 'auto', height: '100%', background: 'var(--bg-base)' }}>
      {/* KPI Row — fixed 4-column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        <KPICard icon={<Users size={20} />} label="Всего сотрудников" value={String(employees.length)} sub={`${activeEmployees.length} активных`} color="#8b5cf6" />
        <KPICard icon={<UserCheck size={20} />} label="На работе" value={String(activeEmployees.length - todayAbsences.length)} sub={`из ${activeEmployees.length}`} color="#10b981" />
        <KPICard icon={<CalendarOff size={20} />} label="Отсутствуют сегодня" value={String(todayAbsences.length)} sub={todayAbsences.length > 0 ? todayAbsences.map(a => ABSENCE_LABELS[a.type]).join(', ') : 'Все на месте'} color="#f59e0b" />
        <KPICard icon={<Wallet size={20} />} label="ФОТ/мес" value={formatCurrency(totalPayroll)} sub="сум" color="#3b82f6" />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
        {/* Department Distribution */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: 24 }}>
          <h2 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 20, margin: '0 0 20px 0' }}>
            <Briefcase size={13} style={{ marginRight: 8, verticalAlign: 'middle', opacity: 0.6 }} />
            По отделам
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <div style={{ width: 160, height: 160 }}>
              {chartsReady && deptData.length > 0 && (
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={deptData} innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value" stroke="none">
                      {deptData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {deptData.map((d, i) => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', flex: 1 }}>{d.name}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{d.value}</span>
                </div>
              ))}
              {deptData.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Нет данных</div>}
            </div>
          </div>
        </div>

        {/* Absences by type */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: 24 }}>
          <h2 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 20, margin: '0 0 20px 0' }}>
            <CalendarOff size={13} style={{ marginRight: 8, verticalAlign: 'middle', opacity: 0.6 }} />
            Типы отсутствий
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <div style={{ width: 160, height: 160 }}>
              {chartsReady && absTypeData.length > 0 && (
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={absTypeData} innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value" stroke="none">
                      {absTypeData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {absTypeData.map(d => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', flex: 1 }}>{d.name}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{d.value}</span>
                </div>
              ))}
              {absTypeData.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Нет данных</div>}
            </div>
          </div>
        </div>
      </div>

      {/* Payroll Chart */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: 24, marginBottom: 32 }}>
        <h2 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 20, margin: '0 0 20px 0' }}>
          <TrendingUp size={13} style={{ marginRight: 8, verticalAlign: 'middle', opacity: 0.6 }} />
          ФОТ по месяцам ({currentYear})
        </h2>
        <div style={{ height: 260 }}>
          {chartsReady && (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={payrollChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} tickFormatter={v => v > 0 ? `${(v / 1_000_000).toFixed(1)}M` : '0'} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-primary)' }}
                  formatter={(value: any) => [formatCurrency(Number(value)) + ' сум', 'ФОТ']}
                />
                <Bar dataKey="total" name="ФОТ" fill="#8b5cf6" radius={[6, 6, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Employee KPI Table (from Arcana) */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: 24 }}>
        <h2 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 16, margin: '0 0 16px 0' }}>
          <Clock size={13} style={{ marginRight: 8, verticalAlign: 'middle', opacity: 0.6 }} />
          Продуктивность сотрудников (Arcana)
        </h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <th style={{ textAlign: 'left', padding: '10px 12px', color: 'var(--text-muted)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>Сотрудник</th>
              <th style={{ textAlign: 'right', padding: '10px 12px', color: 'var(--text-muted)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>Задачи выполнены</th>
              <th style={{ textAlign: 'right', padding: '10px 12px', color: 'var(--text-muted)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>Часы</th>
              <th style={{ textAlign: 'right', padding: '10px 12px', color: 'var(--text-muted)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>Оклад</th>
            </tr>
          </thead>
          <tbody>
            {employeeKPIs.map((kpi, i) => (
              <tr
                key={i}
                style={{ borderBottom: i < employeeKPIs.length - 1 ? '1px solid var(--border-subtle)' : 'none', transition: 'background 0.1s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: PIE_COLORS[i % PIE_COLORS.length],
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0,
                    }}>
                      {kpi.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{kpi.name}</span>
                  </div>
                </td>
                <td style={{ padding: '12px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600, color: (kpi.tasksDone || 0) > 0 ? '#10b981' : 'var(--text-muted)' }}>{kpi.tasksDone || 0}</td>
                <td style={{ padding: '12px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{(kpi.hoursThisMonth || 0).toFixed(1)}ч</td>
                <td style={{ padding: '12px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)' }}>{formatCurrency(kpi.salary)}</td>
              </tr>
            ))}
            {employeeKPIs.length === 0 && (
              <tr><td colSpan={4} style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>Нет данных о сотрудниках</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HRDashboard;
