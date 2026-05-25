import React, { useState } from 'react';
import { useHRStore } from '../hrStore';
import { useStore } from '../../../store';
import { Plus, X, Check, XCircle, Clock } from 'lucide-react';

const TYPE_LABELS: Record<string, string> = { vacation: 'Отпуск', sick: 'Больничный', personal: 'Личные', maternity: 'Декрет' };
const TYPE_COLORS: Record<string, string> = { vacation: '#3b82f6', sick: '#ef4444', personal: '#f59e0b', maternity: '#8b5cf6' };
const STATUS_LABELS: Record<string, string> = { pending: 'Ожидает', approved: 'Одобрено', rejected: 'Отклонено' };
const STATUS_COLORS: Record<string, string> = { pending: '#f59e0b', approved: '#10b981', rejected: '#ef4444' };

const AbsencesPage: React.FC = () => {
  const { absences, employees, addAbsence, updateAbsence } = useHRStore();
  const users = useStore(s => s.users);

  const [isModalOpen, setModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [form, setForm] = useState({
    employeeId: '', type: 'vacation' as 'vacation' | 'sick' | 'personal' | 'maternity', startDate: '', endDate: '', note: '',
  });

  const getEmployeeName = (empId: string) => {
    const emp = employees.find(e => e.id === empId);
    if (!emp) return empId;
    return users.find(u => u.id === emp.userId)?.name || emp.userId;
  };

  const filtered = absences.filter(a => {
    const matchType = filterType === 'all' || a.type === filterType;
    const matchStatus = filterStatus === 'all' || a.status === filterStatus;
    return matchType && matchStatus;
  });

  const handleSave = async () => {
    if (!form.employeeId || !form.startDate || !form.endDate) return;
    await addAbsence(form);
    setModalOpen(false);
    setForm({ employeeId: '', type: 'vacation', startDate: '', endDate: '', note: '' });
  };

  const handleApprove = async (id: string) => {
    await updateAbsence(id, { status: 'approved' });
  };

  const handleReject = async (id: string) => {
    await updateAbsence(id, { status: 'rejected' });
  };

  const getDuration = (start: string, end: string) => {
    const diff = Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return diff;
  };

  return (
    <div style={{ padding: 32, height: '100%', overflowY: 'auto', background: 'var(--bg-base)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{
            padding: '8px 12px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
            borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            <option value="all">Все типы</option>
            {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{
            padding: '8px 12px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
            borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            <option value="all">Все статусы</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <button onClick={() => setModalOpen(true)} style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px',
          background: '#8b5cf6', color: '#fff', border: 'none', borderRadius: 8,
          fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}
          onMouseEnter={e => e.currentTarget.style.background = '#7c3aed'}
          onMouseLeave={e => e.currentTarget.style.background = '#8b5cf6'}
        >
          <Plus size={16} /> Заявка на отсутствие
        </button>
      </div>

      {/* Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map(abs => (
          <div key={abs.id} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 12,
            padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16,
            transition: 'border-color 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-hover)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
          >
            {/* Type badge */}
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: `${TYPE_COLORS[abs.type]}15`, color: TYPE_COLORS[abs.type],
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, flexShrink: 0,
            }}>
              {abs.type === 'vacation' ? '🏖️' : abs.type === 'sick' ? '🤒' : abs.type === 'maternity' ? '👶' : '📋'}
            </div>
            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>{getEmployeeName(abs.employeeId)}</span>
                <span style={{
                  padding: '2px 8px', borderRadius: 12,
                  background: `${TYPE_COLORS[abs.type]}15`, color: TYPE_COLORS[abs.type],
                  fontSize: 10, fontWeight: 600,
                }}>{TYPE_LABELS[abs.type]}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {new Date(abs.startDate).toLocaleDateString('ru-RU')} — {new Date(abs.endDate).toLocaleDateString('ru-RU')}
                <span style={{ marginLeft: 8, color: 'var(--text-secondary)' }}>({getDuration(abs.startDate, abs.endDate)} дн.)</span>
              </div>
              {abs.note && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{abs.note}</div>}
            </div>
            {/* Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '4px 10px', borderRadius: 20,
                background: `${STATUS_COLORS[abs.status]}15`, color: STATUS_COLORS[abs.status],
                fontSize: 11, fontWeight: 600,
              }}>
                {abs.status === 'pending' ? <Clock size={11} /> : abs.status === 'approved' ? <Check size={11} /> : <XCircle size={11} />}
                {STATUS_LABELS[abs.status]}
              </span>
              {abs.status === 'pending' && (
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => handleApprove(abs.id)} title="Одобрить" style={{
                    padding: 6, background: '#10b98115', border: 'none', borderRadius: 6,
                    cursor: 'pointer', color: '#10b981', display: 'flex',
                  }}><Check size={14} /></button>
                  <button onClick={() => handleReject(abs.id)} title="Отклонить" style={{
                    padding: 6, background: '#ef444415', border: 'none', borderRadius: 6,
                    cursor: 'pointer', color: '#ef4444', display: 'flex',
                  }}><XCircle size={14} /></button>
                </div>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📅</div>
            <div style={{ fontSize: 14 }}>Нет заявок на отсутствие</div>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={e => e.target === e.currentTarget && setModalOpen(false)}>
          <div style={{ width: 460, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.4)' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Новая заявка на отсутствие</h3>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Сотрудник</label>
                <select value={form.employeeId} onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))} style={{
                  width: '100%', padding: '8px 12px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                  borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, fontFamily: 'inherit',
                }}>
                  <option value="">Выберите</option>
                  {employees.filter(e => e.status === 'active').map(e => (
                    <option key={e.id} value={e.id}>{getEmployeeName(e.id)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Тип</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as 'vacation' | 'sick' | 'personal' | 'maternity' }))} style={{
                  width: '100%', padding: '8px 12px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                  borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, fontFamily: 'inherit',
                }}>
                  {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>С</label>
                  <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} style={{
                    width: '100%', padding: '8px 12px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                    borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box',
                  }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>По</label>
                  <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} style={{
                    width: '100%', padding: '8px 12px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                    borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box',
                  }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Комментарий</label>
                <textarea value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} rows={2} style={{
                  width: '100%', padding: '8px 12px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                  borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box',
                }} />
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setModalOpen(false)} style={{
                padding: '8px 16px', background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)',
                borderRadius: 8, color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer',
              }}>Отмена</button>
              <button onClick={handleSave} style={{
                padding: '8px 20px', background: '#8b5cf6', color: '#fff', border: 'none',
                borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>Создать</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AbsencesPage;
