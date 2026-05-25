import React, { useState } from 'react';
import { useHRStore, type Employee } from '../hrStore';
import { useStore } from '../../../store';
import { Plus, Search, Edit2, Trash2, X, UserCheck, UserX, Clock } from 'lucide-react';

const STATUS_LABELS: Record<string, string> = { active: 'Работает', on_leave: 'В отпуске', terminated: 'Уволен' };
const STATUS_COLORS: Record<string, string> = { active: '#10b981', on_leave: '#f59e0b', terminated: '#ef4444' };

const EmployeesPage: React.FC = () => {
  const { employees, addEmployee, updateEmployee, deleteEmployee } = useHRStore();
  const users = useStore(s => s.users);

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDept, setFilterDept] = useState<string>('all');
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    userId: '', department: '', position: '', hireDate: new Date().toISOString().slice(0, 10),
    salary: 0, salaryType: 'monthly' as 'monthly' | 'hourly', currency: 'UZS', bankAccount: '', notes: '',
    taxProfile: 'standard', advancePct: 40,
  });

  const departments = Array.from(new Set(employees.map(e => e.department).filter(Boolean))) as string[];

  const getUserName = (userId: string) => users.find(u => u.id === userId)?.name || userId;

  const filtered = employees.filter(e => {
    const userName = getUserName(e.userId).toLowerCase();
    const matchSearch = !search || userName.includes(search.toLowerCase()) || (e.position || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || e.status === filterStatus;
    const matchDept = filterDept === 'all' || e.department === filterDept;
    return matchSearch && matchStatus && matchDept;
  });

  const openCreate = () => {
    setEditingId(null);
    setForm({ userId: '', department: '', position: '', hireDate: new Date().toISOString().slice(0, 10), salary: 0, salaryType: 'monthly' as 'monthly' | 'hourly', currency: 'UZS', bankAccount: '', notes: '', taxProfile: 'standard', advancePct: 40 });
    setModalOpen(true);
  };

  const openEdit = (emp: Employee) => {
    setEditingId(emp.id);
    setForm({
      userId: emp.userId, department: emp.department || '', position: emp.position || '',
      hireDate: emp.hireDate, salary: emp.salary, salaryType: emp.salaryType as any,
      currency: emp.currency, bankAccount: emp.bankAccount || '', notes: emp.notes || '',
      taxProfile: emp.taxProfile || 'standard', advancePct: emp.advancePct ?? 40,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.userId || !form.salary) return;
    if (editingId) {
      await updateEmployee(editingId, form);
    } else {
      await addEmployee(form);
    }
    setModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Удалить сотрудника?')) {
      await deleteEmployee(id);
    }
  };

  // Users not yet linked to employees
  const availableUsers = users.filter(u => !employees.some(e => e.userId === u.id));

  const formatCurrency = (val: number) => new Intl.NumberFormat('ru-RU').format(val);

  return (
    <div style={{ padding: 32, height: '100%', overflowY: 'auto', background: 'var(--bg-base)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Search */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px',
            background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 8, minWidth: 260,
          }}>
            <Search size={14} color="var(--text-muted)" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Поиск сотрудника..."
              style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: 13, flex: 1, fontFamily: 'inherit' }}
            />
          </div>
          {/* Status filter */}
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{
            padding: '8px 12px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
            borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            <option value="all">Все статусы</option>
            <option value="active">Работает</option>
            <option value="on_leave">В отпуске</option>
            <option value="terminated">Уволен</option>
          </select>
          {/* Dept filter */}
          <select value={filterDept} onChange={e => setFilterDept(e.target.value)} style={{
            padding: '8px 12px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
            borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            <option value="all">Все отделы</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <button onClick={openCreate} style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px',
          background: '#8b5cf6', color: '#fff', border: 'none', borderRadius: 8,
          fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
        }}
          onMouseEnter={e => e.currentTarget.style.background = '#7c3aed'}
          onMouseLeave={e => e.currentTarget.style.background = '#8b5cf6'}
        >
          <Plus size={16} /> Добавить сотрудника
        </button>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>Сотрудник</th>
              <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>Должность</th>
              <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>Отдел</th>
              <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>Оклад</th>
              <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>Статус</th>
              <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>Дата найма</th>
              <th style={{ width: 80, padding: '12px 16px' }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((emp, i) => {
              const user = users.find(u => u.id === emp.userId);
              return (
                <tr key={emp.id}
                  style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border-subtle)' : 'none', transition: 'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: user?.color || '#8b5cf6',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0,
                      }}>
                        {(user?.name || emp.userId).split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{user?.name || emp.userId}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user?.email || ''}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{emp.position || '—'}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{emp.department || '—'}</td>
                  <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)' }}>{formatCurrency(emp.salary)} {emp.currency}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '3px 10px', borderRadius: 20,
                      background: `${STATUS_COLORS[emp.status]}15`, color: STATUS_COLORS[emp.status],
                      fontSize: 11, fontWeight: 600,
                    }}>
                      {emp.status === 'active' ? <UserCheck size={11} /> : emp.status === 'terminated' ? <UserX size={11} /> : <Clock size={11} />}
                      {STATUS_LABELS[emp.status]}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: 12 }}>{new Date(emp.hireDate).toLocaleDateString('ru-RU')}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => openEdit(emp)} style={{ padding: 6, background: 'var(--bg-hover)', border: 'none', borderRadius: 6, cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex' }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                      ><Edit2 size={14} /></button>
                      <button onClick={() => handleDelete(emp.id)} style={{ padding: 6, background: 'var(--bg-hover)', border: 'none', borderRadius: 6, cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                      ><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                Нет сотрудников {search ? 'по запросу' : ''}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={e => e.target === e.currentTarget && setModalOpen(false)}>
          <div style={{ width: 520, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.4)' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
                {editingId ? 'Редактировать сотрудника' : 'Новый сотрудник'}
              </h3>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}><X size={18} /></button>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* User select */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Пользователь</label>
                <select value={form.userId} onChange={e => setForm(f => ({ ...f, userId: e.target.value }))} style={{
                  width: '100%', padding: '8px 12px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                  borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, fontFamily: 'inherit',
                }} disabled={!!editingId}>
                  <option value="">Выберите пользователя</option>
                  {(editingId ? users : availableUsers).map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                </select>
              </div>
              {/* Two cols */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Должность</label>
                  <input value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))} style={{
                    width: '100%', padding: '8px 12px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                    borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box',
                  }} placeholder="Разработчик" />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Отдел</label>
                  <input value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} style={{
                    width: '100%', padding: '8px 12px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                    borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box',
                  }} placeholder="Разработка" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Тип оплаты</label>
                  <select value={form.salaryType} onChange={e => setForm(f => ({ ...f, salaryType: e.target.value as 'monthly' | 'hourly' }))} style={{
                    width: '100%', padding: '8px 12px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                    borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box',
                  }}>
                    <option value="monthly">Оклад (в месяц)</option>
                    <option value="hourly">Почасовая (в час)</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>{form.salaryType === 'hourly' ? 'Ставка в час' : 'Оклад'}</label>
                  <input type="number" value={form.salary || ''} onChange={e => setForm(f => ({ ...f, salary: Number(e.target.value) }))} style={{
                    width: '100%', padding: '8px 12px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                    borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box',
                  }} placeholder={form.salaryType === 'hourly' ? "100000" : "5000000"} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Дата найма</label>
                  <input type="date" value={form.hireDate} onChange={e => setForm(f => ({ ...f, hireDate: e.target.value }))} style={{
                    width: '100%', padding: '8px 12px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                    borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box',
                  }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Налоговый профиль</label>
                  <select value={form.taxProfile} onChange={e => setForm(f => ({ ...f, taxProfile: e.target.value }))} style={{
                    width: '100%', padding: '8px 12px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                    borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box',
                  }}>
                    <option value="standard">Штат (НДФЛ 12%, ИНПС 1%)</option>
                    <option value="b2b">ИП / B2B (0%)</option>
                    <option value="non_resident">Нерезидент (20%)</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Процент аванса (%)</label>
                  <input type="number" value={form.advancePct} onChange={e => setForm(f => ({ ...f, advancePct: Number(e.target.value) }))} min="0" max="100" style={{
                    width: '100%', padding: '8px 12px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                    borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box',
                  }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Заметки</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} style={{
                  width: '100%', padding: '8px 12px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                  borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box',
                }} placeholder="Комментарии..." />
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
              }}
                onMouseEnter={e => e.currentTarget.style.background = '#7c3aed'}
                onMouseLeave={e => e.currentTarget.style.background = '#8b5cf6'}
              >{editingId ? 'Сохранить' : 'Добавить'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeesPage;
