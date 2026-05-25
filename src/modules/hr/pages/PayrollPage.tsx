import React, { useState } from 'react';
import { useHRStore } from '../hrStore';
import { useStore } from '../../../store';
import { Plus, Check, FileText, Trash2 } from 'lucide-react';

const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const STATUS_LABELS: Record<string, string> = { draft: 'Черновик', calculated: 'Рассчитано', approved: 'Утверждено', paid: 'Выплачено' };
const STATUS_COLORS: Record<string, string> = { draft: '#94a3b8', calculated: '#f59e0b', approved: '#3b82f6', paid: '#10b981' };

const PayrollPage: React.FC = () => {
  const { payrollRuns, employees, createPayrollRun, updatePayrollRun, deletePayrollRun } = useHRStore();
  const users = useStore(s => s.users);

  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const [newMonth, setNewMonth] = useState(currentMonth);
  const [newYear, setNewYear] = useState(currentYear);
  const [newType, setNewType] = useState('final');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const getEmployeeName = (empId: string) => {
    const emp = employees.find(e => e.id === empId);
    if (!emp) return empId;
    return users.find(u => u.id === emp.userId)?.name || emp.userId;
  };

  const handleCreate = async () => {
    const exists = payrollRuns.some(r => r.month === newMonth && r.year === newYear && r.type === newType);
    if (exists) {
      setErrorMsg(`Ведомость за ${MONTHS[newMonth - 1]} ${newYear} (${newType === 'advance' ? 'Аванс' : 'Расчет'}) уже существует`);
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }
    setErrorMsg(null);
    await createPayrollRun(newMonth, newYear, newType);
  };

  const handleApprove = async (id: string) => {
    await updatePayrollRun(id, { status: 'approved' });
  };

  const handleMarkPaid = async (id: string) => {
    await updatePayrollRun(id, { status: 'paid' });
  };

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (deleteConfirmId === id) {
      await deletePayrollRun(id);
      setDeleteConfirmId(null);
    } else {
      setDeleteConfirmId(id);
      setTimeout(() => setDeleteConfirmId(null), 3000); // Auto-cancel after 3s
    }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('ru-RU').format(val);

  return (
    <div style={{ padding: 32, height: '100%', overflowY: 'auto', background: 'var(--bg-base)' }}>
      {/* Create bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24,
        padding: '16px 20px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 12,
      }}>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>Создать ведомость:</span>
        <select value={newMonth} onChange={e => setNewMonth(Number(e.target.value))} style={{
          padding: '6px 10px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
          borderRadius: 6, color: 'var(--text-primary)', fontSize: 13, fontFamily: 'inherit',
        }}>
          {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <input type="number" value={newYear} onChange={e => setNewYear(Number(e.target.value))} min={2024} max={2030} style={{
          padding: '6px 10px', width: 80, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
          borderRadius: 6, color: 'var(--text-primary)', fontSize: 13, fontFamily: 'inherit',
        }} />
        <select value={newType} onChange={e => setNewType(e.target.value)} style={{
          padding: '6px 10px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
          borderRadius: 6, color: 'var(--text-primary)', fontSize: 13, fontFamily: 'inherit',
        }}>
          <option value="advance">Аванс</option>
          <option value="final">Расчет</option>
        </select>
        <button onClick={handleCreate} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px',
          background: '#8b5cf6', color: '#fff', border: 'none', borderRadius: 8,
          fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}
          onMouseEnter={e => e.currentTarget.style.background = '#7c3aed'}
          onMouseLeave={e => e.currentTarget.style.background = '#8b5cf6'}
        >
          <Plus size={14} /> Рассчитать
        </button>
      </div>

      <div style={{ padding: '0 20px 24px', marginTop: -12, fontSize: 12, color: 'var(--text-muted)' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#10b98115', color: '#10b981', padding: '4px 10px', borderRadius: 20, fontWeight: 600 }}>
          <Check size={12} /> Данные из Arcana (Таймшиты) синхронизируются автоматически
        </span>
      </div>

      {/* Payroll runs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {payrollRuns.map(run => {
          const isExpanded = expandedRunId === run.id;
          return (
            <div key={run.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 12, overflow: 'hidden' }}>
              {/* Run header */}
              <div
                onClick={() => setExpandedRunId(isExpanded ? null : run.id)}
                style={{
                  padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  borderBottom: isExpanded ? '1px solid var(--border-subtle)' : 'none',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: `${STATUS_COLORS[run.status]}15`, color: STATUS_COLORS[run.status],
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <FileText size={20} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
                        Зарплата за {MONTHS[run.month - 1]} {run.year}
                      </span>
                      <span style={{
                        padding: '2px 8px', borderRadius: 4, background: run.type === 'advance' ? '#3b82f620' : '#8b5cf620',
                        color: run.type === 'advance' ? '#3b82f6' : '#8b5cf6', fontSize: 11, fontWeight: 700, textTransform: 'uppercase'
                      }}>
                        {run.type === 'advance' ? 'Аванс' : 'Расчет'}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      {run.entries.length} сотрудников
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                      {formatCurrency(run.totalNet)} <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-muted)' }}>сум</span>
                    </div>
                  </div>
                  <span style={{
                    padding: '4px 10px', borderRadius: 20,
                    background: `${STATUS_COLORS[run.status]}15`, color: STATUS_COLORS[run.status],
                    fontSize: 11, fontWeight: 600,
                  }}>
                    {STATUS_LABELS[run.status]}
                  </span>
                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                    {run.status === 'calculated' && (
                      <button onClick={() => handleApprove(run.id)} title="Утвердить" style={{
                        padding: 6, background: '#3b82f615', border: 'none', borderRadius: 6,
                        cursor: 'pointer', color: '#3b82f6', display: 'flex',
                      }}><Check size={14} /></button>
                    )}
                    {run.status === 'approved' && (
                      <button onClick={() => handleMarkPaid(run.id)} title="Отметить выплату" style={{
                        padding: 6, background: '#10b98115', border: 'none', borderRadius: 6,
                        cursor: 'pointer', color: '#10b981', display: 'flex',
                      }}><Check size={14} /></button>
                    )}
                    {run.status !== 'paid' && (
                      <button onClick={() => handleDelete(run.id)} title={deleteConfirmId === run.id ? 'Нажмите ещё раз для подтверждения' : 'Удалить'} style={{
                        padding: deleteConfirmId === run.id ? '4px 10px' : 6, 
                        background: deleteConfirmId === run.id ? '#ef4444' : '#ef444415', 
                        border: 'none', borderRadius: 6,
                        cursor: 'pointer', color: deleteConfirmId === run.id ? '#fff' : '#ef4444', 
                        display: 'flex', alignItems: 'center', gap: 4,
                        fontSize: 11, fontWeight: deleteConfirmId === run.id ? 600 : 400,
                        transition: 'all 0.15s',
                      }}>{deleteConfirmId === run.id ? 'Удалить?' : <Trash2 size={14} />}</button>
                    )}
                  </div>
                </div>
              </div>

              {/* Entries table */}
              {isExpanded && (
                <div style={{ padding: 0 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <th style={{ textAlign: 'left', padding: '10px 20px', color: 'var(--text-muted)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>Сотрудник</th>
                        <th style={{ textAlign: 'right', padding: '10px 16px', color: 'var(--text-muted)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>Оклад</th>
                        <th style={{ textAlign: 'right', padding: '10px 16px', color: 'var(--text-muted)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>Бонус</th>
                        <th style={{ textAlign: 'right', padding: '10px 16px', color: 'var(--text-muted)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>Вычеты</th>
                        <th style={{ textAlign: 'right', padding: '10px 20px', color: 'var(--text-muted)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>К выплате</th>
                      </tr>
                    </thead>
                    <tbody>
                      {run.entries.map((entry, i) => (
                        <React.Fragment key={entry.id}>
                          <tr
                            onClick={() => setExpandedEntryId(expandedEntryId === entry.id ? null : entry.id)}
                            style={{ 
                              borderBottom: (i < run.entries.length - 1 && expandedEntryId !== entry.id) ? '1px solid var(--border-subtle)' : 'none', 
                              transition: 'background 0.1s',
                              cursor: 'pointer'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <td style={{ padding: '12px 20px', fontWeight: 500, color: 'var(--text-primary)' }}>{getEmployeeName(entry.employeeId)}</td>
                            <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{formatCurrency(entry.baseSalary)}</td>
                            <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: entry.bonus > 0 ? '#10b981' : 'var(--text-muted)' }}>{entry.bonus > 0 ? `+${formatCurrency(entry.bonus)}` : '—'}</td>
                            <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: entry.deductions > 0 ? '#ef4444' : 'var(--text-muted)' }}>{entry.deductions > 0 ? `-${formatCurrency(entry.deductions)}` : '—'}</td>
                            <td style={{ padding: '12px 20px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)' }}>{formatCurrency(entry.netAmount)}</td>
                          </tr>
                          {expandedEntryId === entry.id && entry.details && entry.details.length > 0 && (
                            <tr style={{ background: 'var(--bg-hover)', borderBottom: i < run.entries.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                              <td colSpan={5} style={{ padding: '12px 20px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12, background: 'var(--bg-surface)', padding: 16, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', gridColumn: '1 / -1', marginBottom: 4 }}>Расчетный листок (детализация)</div>
                                  {entry.details.map(d => (
                                    <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 6, borderBottom: '1px dashed var(--border-subtle)' }}>
                                      <span style={{ color: 'var(--text-secondary)' }}>{d.label}</span>
                                      <span style={{ fontFamily: 'var(--font-mono)', color: d.amount > 0 ? '#10b981' : '#ef4444', fontWeight: 500 }}>
                                        {d.amount > 0 ? '+' : ''}{formatCurrency(d.amount)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ borderTop: '2px solid var(--border-subtle)', background: 'var(--bg-hover)' }}>
                        <td style={{ padding: '12px 20px', fontWeight: 700, color: 'var(--text-primary)' }}>Итого</td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)' }}>{formatCurrency(run.entries.reduce((s, e) => s + e.baseSalary, 0))}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#10b981' }}>{formatCurrency(run.entries.reduce((s, e) => s + e.bonus, 0))}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#ef4444' }}>{formatCurrency(run.entries.reduce((s, e) => s + e.deductions, 0))}</td>
                        <td style={{ padding: '12px 20px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>{formatCurrency(run.totalNet)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          );
        })}
        {payrollRuns.length === 0 && (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 12 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>💰</div>
            <div style={{ fontSize: 14, marginBottom: 6 }}>Нет зарплатных ведомостей</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Создайте первую ведомость, чтобы рассчитать зарплату</div>
          </div>
        )}
      </div>

      {errorMsg && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#ef4444', color: '#fff', padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)', zIndex: 9999, display: 'flex', alignItems: 'center', gap: 8 }}>
          {errorMsg}
        </div>
      )}
    </div>
  );
};

export default PayrollPage;
