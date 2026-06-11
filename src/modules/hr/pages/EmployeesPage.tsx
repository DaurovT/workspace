import { apiFetch } from '../../../lib/api';
import { confirmDialog } from '../../../lib/confirm';
import { useState, useEffect } from 'react';
import { useHRStore } from '../hrStore';
import { useStore } from '../../../store';
import { Plus, Search, Edit2, Trash2, X } from 'lucide-react';


const STATUS_LABELS: Record<string, string> = { active: 'Работает', on_leave: 'В отпуске', terminated: 'Уволен' };
const STATUS_COLORS: Record<string, string> = { active: '#10b981', on_leave: '#f59e0b', terminated: '#ef4444' };
const SCH_LABELS: Record<string, string> = { '5_2': '5/2 Пятидневка', '6_1': '6/1 Шестидневка', '2_2': '2/2 Сменный', 'custom': 'Произвольный' };

const EMPTY_FORM = () => ({
  // Личные данные
  lastName: '', firstName: '', middleName: '', birthDate: '', gender: '', nationality: 'Узбекистан',
  passportSeries: '', passportNumber: '', passportIssuedBy: '', passportIssuedDate: '', passportExpiry: '',
  inn: '', pinfl: '', phone: '', address: '', emergencyContact: '', emergencyPhone: '',
  // Рабочие данные
  orgPositionId: '', department: '', position: '', hireDate: new Date().toISOString().slice(0,10),
  status: 'active', terminationDate: '',
  // Финансы
  salary: 0, salaryType: 'monthly', currency: 'UZS', bankAccount: '', taxProfile: 'standard', advancePct: 40, contractorId: '',
  // График
  scheduleType: '5_2', scheduleWorkDays: 5, scheduleRestDays: 2, scheduleHours: 8, scheduleStart: '08:00', scheduleEnd: '17:00', scheduleCycleDate: '',
  // Доп.
  medicalBookDate: '', medicalBookExpiry: '', uniformSize: '', education: '', notes: '',
  // Системный доступ
  userId: '', hasSystemAccess: false,
});

type FormT = ReturnType<typeof EMPTY_FORM>;

export default function EmployeesPage() {
  const { employees, addEmployee, updateEmployee, deleteEmployee } = useHRStore();
  const users = useStore(s => s.users);

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [modal, setModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormT>(EMPTY_FORM());
  const [section, setSection] = useState(0);
  const [orgPositions, setOrgPositions] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    apiFetch('/api/org-positions').then(r => r.ok ? r.json() : []).then(setOrgPositions).catch(() => {});
  }, []);

  const getName = (e: any) => {
    if (e.lastName || e.firstName) return [e.lastName, e.firstName, e.middleName].filter(Boolean).join(' ');
    const u = users.find(u => u.id === e.userId);
    return u?.name || '—';
  };

  const filtered = employees.filter(e => {
    const name = getName(e).toLowerCase();
    const pos = ((e as any).position || '').toLowerCase();
    const dept = ((e as any).department || '').toLowerCase();
    const ms = !search || name.includes(search.toLowerCase()) || pos.includes(search.toLowerCase()) || dept.includes(search.toLowerCase());
    const mst = filterStatus === 'all' || e.status === filterStatus;
    return ms && mst;
  });

  const openCreate = () => {
    setEditingId(null); setForm(EMPTY_FORM()); setSection(0); setErrors([]); setModal(true);
  };

  const openEdit = (emp: any) => {
    setEditingId(emp.id);
    setForm({
      lastName: emp.lastName||'', firstName: emp.firstName||'', middleName: emp.middleName||'',
      birthDate: emp.birthDate||'', gender: emp.gender||'', nationality: emp.nationality||'Узбекистан',
      passportSeries: emp.passportSeries||'', passportNumber: emp.passportNumber||'',
      passportIssuedBy: emp.passportIssuedBy||'', passportIssuedDate: emp.passportIssuedDate||'',
      passportExpiry: emp.passportExpiry||'', inn: emp.inn||'', pinfl: emp.pinfl||'',
      phone: emp.phone||'', address: emp.address||'', emergencyContact: emp.emergencyContact||'', emergencyPhone: emp.emergencyPhone||'',
      orgPositionId: emp.orgPositionId||'', department: emp.department||'', position: emp.position||'',
      hireDate: emp.hireDate||'', status: emp.status||'active', terminationDate: emp.terminationDate||'',
      salary: emp.salary||0, salaryType: emp.salaryType||'monthly', currency: emp.currency||'UZS',
      bankAccount: emp.bankAccount||'', taxProfile: emp.taxProfile||'standard', advancePct: emp.advancePct??40, contractorId: emp.contractorId||'',
      scheduleType: emp.scheduleType||'5_2', scheduleWorkDays: emp.scheduleWorkDays||5, scheduleRestDays: emp.scheduleRestDays||2,
      scheduleHours: emp.scheduleHours||8, scheduleStart: emp.scheduleStart||'08:00', scheduleEnd: emp.scheduleEnd||'17:00',
      scheduleCycleDate: emp.scheduleCycleDate||'',
      medicalBookDate: emp.medicalBookDate||'', medicalBookExpiry: emp.medicalBookExpiry||'',
      uniformSize: emp.uniformSize||'', education: emp.education||'', notes: emp.notes||'',
      userId: emp.userId||'', hasSystemAccess: emp.hasSystemAccess||false,
    });
    setSection(0); setErrors([]); setModal(true);
  };

  const handleSave = async () => {
    const errs: string[] = [];
    if (!form.firstName) errs.push('Имя обязательно');
    if (!form.lastName) errs.push('Фамилия обязательна');
    if (!form.hireDate) errs.push('Дата найма обязательна');
    if (!form.salary && form.salary !== 0) errs.push('Зарплата обязательна');
    if (errs.length) { setErrors(errs); return; }
    setSaving(true);
    const payload: any = { ...form };
    if (!payload.userId) { payload.userId = null; payload.hasSystemAccess = false; }
    if (!payload.orgPositionId) payload.orgPositionId = null;
    ['terminationDate','passportIssuedDate','passportExpiry','birthDate','scheduleCycleDate',
     'medicalBookDate','medicalBookExpiry','bankAccount','passportSeries','passportNumber',
     'passportIssuedBy','inn','pinfl','phone','address','emergencyContact','emergencyPhone',
     'uniformSize','education','middleName','contractorId'].forEach(k => { if (payload[k] === '') payload[k] = null; });
    try {
      if (editingId) { await updateEmployee(editingId, payload); }
      else { await addEmployee(payload); }
      setModal(false);
    } catch (e) { setErrors(['Ошибка сохранения']); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!(await confirmDialog({ message: `Удалить сотрудника «${name}»?`, danger: true }))) return;
    await deleteEmployee(id);
  };

  // Position info for modal
  const selPos = orgPositions.find(p => p.id === form.orgPositionId);
  const posAvail = selPos ? (selPos.staffLimit ?? 0) - (selPos._count?.employees ?? 0) - (editingId ? 0 : 0) : null;

  // SECTIONS
  const SECTIONS = [
    'Личные данные', 'Работа и должность', 'Финансы и налоги', 'График работы', 'Доп. сведения', 'Системный доступ'
  ];

  const f = form;
  const set = (k: keyof FormT, v: any) => setForm(p => ({ ...p, [k]: v }));
  const inp: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '8px 11px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--bg-hover)', color: 'var(--text-primary)', fontSize: 13 };
  const lbl: React.CSSProperties = { display: 'block', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' };
  const grp = (label: string, el: React.ReactElement, full = false) => (
    <div style={{ ...(full ? { gridColumn: '1/-1' } : {}), marginBottom: 14 }}>
      <label style={lbl}>{label}</label>{el}
    </div>
  );

  const sections: React.ReactElement[] = [
    // 0: Личные
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
      {grp('Фамилия *', <input value={f.lastName} onChange={e=>set('lastName',e.target.value)} style={inp}/>)}
      {grp('Имя *', <input value={f.firstName} onChange={e=>set('firstName',e.target.value)} style={inp}/>)}
      {grp('Отчество', <input value={f.middleName} onChange={e=>set('middleName',e.target.value)} style={inp}/>, false)}
      {grp('Дата рождения', <input type="date" value={f.birthDate} onChange={e=>set('birthDate',e.target.value)} style={inp}/>)}
      {grp('Пол', <select value={f.gender} onChange={e=>set('gender',e.target.value)} style={inp}><option value="">—</option><option value="male">Мужской</option><option value="female">Женский</option></select>)}
      {grp('Гражданство', <input value={f.nationality} onChange={e=>set('nationality',e.target.value)} style={inp}/>)}
      {grp('Серия паспорта', <input value={f.passportSeries} onChange={e=>set('passportSeries',e.target.value)} placeholder="AA" style={inp}/>)}
      {grp('Номер паспорта', <input value={f.passportNumber} onChange={e=>set('passportNumber',e.target.value)} placeholder="1234567" style={inp}/>)}
      {grp('Кем выдан', <input value={f.passportIssuedBy} onChange={e=>set('passportIssuedBy',e.target.value)} style={inp}/>, true)}
      {grp('Дата выдачи', <input type="date" value={f.passportIssuedDate} onChange={e=>set('passportIssuedDate',e.target.value)} style={inp}/>)}
      {grp('Срок действия', <input type="date" value={f.passportExpiry} onChange={e=>set('passportExpiry',e.target.value)} style={inp}/>)}
      {grp('ИНН', <input value={f.inn} onChange={e=>set('inn',e.target.value)} placeholder="123456789" style={inp}/>)}
      {grp('ПИНФЛ', <input value={f.pinfl} onChange={e=>set('pinfl',e.target.value)} placeholder="12345678901234" style={inp}/>)}
      {grp('Телефон', <input value={f.phone} onChange={e=>set('phone',e.target.value)} placeholder="+998 90 000 00 00" style={inp}/>)}
      {grp('Адрес', <input value={f.address} onChange={e=>set('address',e.target.value)} style={inp}/>, true)}
      {grp('Контакт для экстренной связи', <input value={f.emergencyContact} onChange={e=>set('emergencyContact',e.target.value)} style={inp}/>)}
      {grp('Телефон экст. контакта', <input value={f.emergencyPhone} onChange={e=>set('emergencyPhone',e.target.value)} style={inp}/>)}
    </div>,

    // 1: Работа
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
      {grp('Должность по структуре', (
        <div>
          <select value={f.orgPositionId} onChange={e => {
            const pos = orgPositions.find(p => p.id === e.target.value);
            set('orgPositionId', e.target.value);
            if (pos) { set('position', pos.name); set('department', pos.department || ''); }
          }} style={inp}>
            <option value="">— Выберите из структуры —</option>
            {orgPositions.map((p: any) => (
              <option key={p.id} value={p.id}>{p.name}{p.department ? ` (${p.department})` : ''} — {p._count?.employees ?? 0}/{p.staffLimit ?? '∞'}</option>
            ))}
          </select>
          {selPos && (
            <div style={{ marginTop: 5, fontSize: 11, color: posAvail !== null && posAvail <= 0 ? '#ef4444' : '#22c55e' }}>
              {selPos.section} · занято {selPos._count?.employees ?? 0} из {selPos.staffLimit ?? '∞'} мест
              {posAvail !== null && posAvail <= 0 && !editingId && ' ⚠ Мест нет'}
            </div>
          )}
        </div>
      ), true)}
      {grp('Отдел', <input value={f.department} onChange={e=>set('department',e.target.value)} style={inp}/>)}
      {grp('Должность (текст)', <input value={f.position} onChange={e=>set('position',e.target.value)} style={inp}/>)}
      {grp('Дата найма *', <input type="date" value={f.hireDate} onChange={e=>set('hireDate',e.target.value)} style={inp}/>)}
      {grp('Статус', <select value={f.status} onChange={e=>set('status',e.target.value)} style={inp}>
        <option value="active">Работает</option><option value="on_leave">В отпуске</option><option value="terminated">Уволен</option>
      </select>)}
      {f.status === 'terminated' && grp('Дата увольнения', <input type="date" value={f.terminationDate} onChange={e=>set('terminationDate',e.target.value)} style={inp}/>)}
    </div>,

    // 2: Финансы
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
      {grp('Оклад *', <input type="number" min={0} value={f.salary} onChange={e=>set('salary',Number(e.target.value))} style={inp}/>)}
      {grp('Тип занятости', <select value={f.salaryType} onChange={e=>set('salaryType',e.target.value)} style={inp}>
        <option value="monthly">Месячный</option><option value="hourly">Почасовой</option>
      </select>)}
      {grp('Валюта', <select value={f.currency} onChange={e=>set('currency',e.target.value)} style={inp}>
        <option value="UZS">UZS</option><option value="USD">USD</option><option value="EUR">EUR</option>
      </select>)}
      {grp('Аванс, %', <input type="number" min={0} max={100} value={f.advancePct} onChange={e=>set('advancePct',Number(e.target.value))} style={inp}/>)}
      {grp('Налоговый профиль', <select value={f.taxProfile} onChange={e=>set('taxProfile',e.target.value)} style={inp}>
        <option value="standard">Стандарт (НДФЛ 12% + ИНПС 1%)</option>
        <option value="non_resident">Нерезидент (НДФЛ 20%)</option>
        <option value="b2b">B2B (без налогов)</option>
      </select>)}
      {grp('Банковский счёт', <input value={f.bankAccount} onChange={e=>set('bankAccount',e.target.value)} style={inp}/>)}
    </div>,

    // 3: График
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
      {grp('Тип графика', <select value={f.scheduleType} onChange={e => {
        const presets: Record<string, any> = { '5_2': {w:5,r:2}, '6_1': {w:6,r:1}, '2_2': {w:2,r:2}, 'custom': {w:3,r:1} };
        const p = presets[e.target.value];
        setForm(fv => ({ ...fv, scheduleType: e.target.value, scheduleWorkDays: p.w, scheduleRestDays: p.r }));
      }} style={inp}>
        {Object.entries(SCH_LABELS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
      </select>, true)}
      {grp('Рабочих дней', <input type="number" min={1} max={14} value={f.scheduleWorkDays} onChange={e=>set('scheduleWorkDays',Number(e.target.value))} style={inp}/>)}
      {grp('Выходных дней', <input type="number" min={1} max={14} value={f.scheduleRestDays} onChange={e=>set('scheduleRestDays',Number(e.target.value))} style={inp}/>)}
      {grp('Часов в смену', <input type="number" min={1} max={24} step={0.5} value={f.scheduleHours} onChange={e=>set('scheduleHours',Number(e.target.value))} style={inp}/>)}
      {grp('Начало смены', <input type="time" value={f.scheduleStart} onChange={e=>set('scheduleStart',e.target.value)} style={inp}/>)}
      {grp('Конец смены', <input type="time" value={f.scheduleEnd} onChange={e=>set('scheduleEnd',e.target.value)} style={inp}/>)}
      {(f.scheduleType === '2_2' || f.scheduleType === 'custom') && grp('Опорная дата цикла', (
        <div>
          <input type="date" value={f.scheduleCycleDate} onChange={e=>set('scheduleCycleDate',e.target.value)} style={inp}/>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>С этой даты начинается первый рабочий день цикла</div>
        </div>
      ), true)}
      <div style={{ gridColumn: '1/-1', marginTop: 4, padding: '10px 14px', background: 'rgba(99,102,241,0.08)', borderRadius: 8, border: '1px solid rgba(99,102,241,0.2)', fontSize: 12, color: 'var(--text-secondary)' }}>
        <strong style={{ color: 'var(--text-primary)' }}>Итог:</strong> {f.scheduleWorkDays} раб. / {f.scheduleRestDays} вых. · {f.scheduleHours} ч/смену · {f.scheduleStart}–{f.scheduleEnd}
        {f.scheduleType === '2_2' || f.scheduleType === 'custom' ? ' · Цикл: ' + (f.scheduleCycleDate || 'не задан') : ''}
      </div>
    </div>,

    // 4: Доп. сведения
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
      {grp('Медкнижка — дата', <input type="date" value={f.medicalBookDate} onChange={e=>set('medicalBookDate',e.target.value)} style={inp}/>)}
      {grp('Медкнижка — срок действия', <input type="date" value={f.medicalBookExpiry} onChange={e=>set('medicalBookExpiry',e.target.value)} style={inp}/>)}
      {grp('Размер формы', <input value={f.uniformSize} onChange={e=>set('uniformSize',e.target.value)} placeholder="XL, 48, 50..." style={inp}/>)}
      {grp('Образование', <select value={f.education} onChange={e=>set('education',e.target.value)} style={inp}>
        <option value="">—</option>
        <option value="basic">Основное общее</option>
        <option value="secondary">Среднее общее</option>
        <option value="vocational">Среднее профессиональное</option>
        <option value="higher">Высшее</option>
        <option value="postgraduate">Послевузовское</option>
      </select>)}
      {grp('Заметки', <textarea value={f.notes} onChange={e=>set('notes',e.target.value)} rows={3} style={{ ...inp, resize: 'vertical' }}/>, true)}
    </div>,

    // 5: Системный доступ
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'var(--bg-hover)', borderRadius: 10, border: '1px solid var(--border-subtle)', marginBottom: 16 }}>
        <input type="checkbox" id="sysacc" checked={f.hasSystemAccess} onChange={e => set('hasSystemAccess', e.target.checked)} style={{ width: 16, height: 16, cursor: 'pointer' }}/>
        <label htmlFor="sysacc" style={{ cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>
          Сотрудник имеет доступ к системе
        </label>
      </div>
      {f.hasSystemAccess && (
        <div style={{ marginBottom: 14 }}>
          <label style={lbl}>Учётная запись (User)</label>
          <select value={f.userId} onChange={e=>set('userId',e.target.value)} style={inp}>
            <option value="">— Выберите пользователя —</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email}) · {u.role}</option>)}
          </select>
        </div>
      )}
      {!f.hasSystemAccess && (
        <div style={{ padding: '12px 16px', background: 'rgba(100,116,139,0.08)', borderRadius: 8, border: '1px solid rgba(100,116,139,0.2)', fontSize: 13, color: 'var(--text-secondary)' }}>
          Сотрудник добавляется только для кадрового учёта. Логин в систему не нужен.
        </div>
      )}
    </div>,
  ];

  return (
    <div style={{ padding: '24px 28px', flex: 1, overflowY: 'auto', fontFamily: 'var(--font-family,Inter,sans-serif)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Сотрудники</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>{filtered.length} из {employees.length}</p>
        </div>
        <button onClick={openCreate} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'var(--color-primary,#6366f1)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
          <Plus size={15}/> Добавить сотрудника
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Поиск по имени, должности..." style={{ width: '100%', boxSizing: 'border-box', paddingLeft: 32, padding: '8px 12px 8px 32px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--bg-panel)', color: 'var(--text-primary)', fontSize: 13 }}/>
        </div>
        <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--bg-panel)', color: 'var(--text-primary)', fontSize: 13 }}>
          <option value="all">Все статусы</option>
          {Object.entries(STATUS_LABELS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--bg-panel)', borderRadius: 12, border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
              {['Сотрудник','Должность','Отдел','Статус','График','Оклад',''].map(h => (
                <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontWeight: 500, color: 'var(--text-secondary)', whiteSpace: 'nowrap', borderBottom: '1px solid var(--border-subtle)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Нет сотрудников</td></tr>
            )}
            {filtered.map((emp: any) => (
              <tr key={emp.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '11px 16px' }}>
                  <div style={{ fontWeight: 500 }}>{getName(emp)}</div>
                  {emp.phone && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{emp.phone}</div>}
                  {!emp.hasSystemAccess && <div style={{ fontSize: 10, marginTop: 2, color: '#64748b' }}>кадр. учёт</div>}
                  {emp.hasSystemAccess && <div style={{ fontSize: 10, marginTop: 2, color: '#22c55e' }}>доступ к системе</div>}
                </td>
                <td style={{ padding: '11px 16px', color: 'var(--text-secondary)' }}>{emp.position || (emp.orgPosition?.name) || '—'}</td>
                <td style={{ padding: '11px 16px', color: 'var(--text-secondary)' }}>{emp.department || '—'}</td>
                <td style={{ padding: '11px 16px' }}>
                  <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: `${STATUS_COLORS[emp.status]||'#64748b'}22`, color: STATUS_COLORS[emp.status]||'#64748b' }}>
                    {STATUS_LABELS[emp.status]||emp.status}
                  </span>
                </td>
                <td style={{ padding: '11px 16px', color: 'var(--text-secondary)', fontSize: 11 }}>{SCH_LABELS[emp.scheduleType]||emp.scheduleType||'—'}</td>
                <td style={{ padding: '11px 16px', fontWeight: 500 }}>{Number(emp.salary).toLocaleString()} {emp.currency}</td>
                <td style={{ padding: '11px 16px' }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => openEdit(emp)} style={{ background: 'none', border: '1px solid var(--border-subtle)', borderRadius: 6, cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px 7px', display: 'inline-flex' }}><Edit2 size={13}/></button>
                    <button onClick={() => handleDelete(emp.id, getName(emp))} style={{ background: 'none', border: '1px solid var(--border-subtle)', borderRadius: 6, cursor: 'pointer', color: '#ef4444', padding: '4px 7px', display: 'inline-flex' }}><Trash2 size={13}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-panel)', borderRadius: 16, width: '90vw', maxWidth: 680, maxHeight: '90vh', display: 'flex', flexDirection: 'column', border: '1px solid var(--border-subtle)' }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{editingId ? 'Редактировать сотрудника' : 'Новый сотрудник'}</h3>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4, display: 'flex' }}><X size={18}/></button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 0, padding: '0 24px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0, overflowX: 'auto' }}>
              {SECTIONS.map((s, i) => (
                <button key={i} onClick={() => setSection(i)} style={{
                  padding: '11px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap',
                  color: section === i ? 'var(--color-primary,#6366f1)' : 'var(--text-secondary)',
                  borderBottom: section === i ? '2px solid var(--color-primary,#6366f1)' : '2px solid transparent',
                  marginBottom: -1,
                }}>{s}</button>
              ))}
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
              {errors.length > 0 && (
                <div style={{ marginBottom: 14, padding: '10px 14px', background: '#ef444420', borderRadius: 8, border: '1px solid #ef444440', fontSize: 13, color: '#ef4444' }}>
                  {errors.map((e, i) => <div key={i}>{e}</div>)}
                </div>
              )}
              {sections[section]}
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px', borderTop: '1px solid var(--border-subtle)', flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {section > 0 && <button onClick={() => setSection(s => s-1)} style={{ padding: '8px 14px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13 }}>← Назад</button>}
                {section < SECTIONS.length-1 && <button onClick={() => setSection(s => s+1)} style={{ padding: '8px 14px', background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-primary)', cursor: 'pointer', fontSize: 13 }}>Далее →</button>}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setModal(false)} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13 }}>Отмена</button>
                <button onClick={handleSave} disabled={saving} style={{ padding: '8px 18px', background: 'var(--color-primary,#6366f1)', color: '#fff', border: 'none', borderRadius: 8, cursor: saving ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 500, opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Сохранение...' : editingId ? 'Сохранить' : 'Создать'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
