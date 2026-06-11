import { apiFetch } from '../../../lib/api';
import { confirmDialog } from '../../../lib/confirm';
import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Clock, Users } from 'lucide-react';


const SCHEDULE_TYPES = [
  { value: '5_2',    label: '5/2 — Пятидневка',        workDays: 5, restDays: 2, desc: 'Пн–Пт рабочие, Сб–Вс выходные' },
  { value: '6_1',    label: '6/1 — Шестидневка',        workDays: 6, restDays: 1, desc: 'Пн–Сб рабочие, Вс выходной' },
  { value: '2_2',    label: '2/2 — Сменный',            workDays: 2, restDays: 2, desc: '2 рабочих / 2 выходных, циклично' },
  { value: 'custom', label: 'Произвольный',              workDays: 3, restDays: 1, desc: 'Настраиваемый цикл' },
];

const TYPE_COLOR: Record<string, string> = { '5_2':'#6366f1', '6_1':'#f59e0b', '2_2':'#14b8a6', custom:'#ec4899' };

const EMPTY = { name:'', type:'5_2', workDays:5, restDays:2, hoursPerDay:8, startTime:'08:00', endTime:'17:00', cycleStart:'', note:'' };

export default function ShiftSchedulesPage() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [isNew, setIsNew] = useState(false);

  const load = async () => {
    const r = await apiFetch('/api/shift-schedules');
    if (r.ok) setSchedules(await r.json());
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!editing?.name) return;
    const body = { ...editing, workDays: Number(editing.workDays), restDays: Number(editing.restDays), hoursPerDay: Number(editing.hoursPerDay) };
    if (isNew) {
      await apiFetch('/api/shift-schedules', { method:'POST', body: JSON.stringify(body) });
    } else {
      await apiFetch(`/api/shift-schedules/${editing.id}`, { method:'PUT', body: JSON.stringify(body) });
    }
    setEditing(null); setIsNew(false); load();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!(await confirmDialog({ message: `Удалить график «${name}»? Сотрудники будут откреплены.`, danger: true }))) return;
    await apiFetch(`/api/shift-schedules/${id}`, { method:'DELETE' });
    load();
  };

  const openNew = () => {
    setEditing({ ...EMPTY });
    setIsNew(true);
  };

  const onTypeChange = (type: string) => {
    const preset = SCHEDULE_TYPES.find(t => t.value === type);
    setEditing((e: any) => ({ ...e, type, workDays: preset?.workDays ?? e.workDays, restDays: preset?.restDays ?? e.restDays }));
  };

  return (
    <div style={{ padding:'24px 28px', flex:1, overflowY:'auto', fontFamily:'var(--font-family,Inter,sans-serif)' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <h2 style={{ margin:0, fontSize:20, fontWeight:700 }}>Графики работы</h2>
          <p style={{ margin:'4px 0 0', fontSize:13, color:'var(--text-muted,#94a3b8)' }}>Смены и режимы работы сотрудников</p>
        </div>
        <button onClick={openNew} style={btnSt('#6366f1')}><Plus size={15}/> Новый график</button>
      </div>

      {/* Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:14 }}>
        {schedules.map(s => (
          <div key={s.id} style={{ background:'var(--bg-panel,#1e293b)', borderRadius:12, padding:18, border:`1px solid ${TYPE_COLOR[s.type]||'#334155'}40`, position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:TYPE_COLOR[s.type]||'#6366f1' }}/>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
              <div>
                <div style={{ fontSize:15, fontWeight:700 }}>{s.name}</div>
                <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>{SCHEDULE_TYPES.find(t=>t.value===s.type)?.label || s.type}</div>
              </div>
              <div style={{ display:'flex', gap:6 }}>
                <button onClick={() => { setEditing(s); setIsNew(false); }} style={iconBtn}><Edit2 size={14}/></button>
                <button onClick={() => handleDelete(s.id, s.name)} style={iconBtn}><Trash2 size={14}/></button>
              </div>
            </div>
            <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
              {[
                { icon:<Clock size={13}/>, val:`${s.workDays}р/${s.restDays}в`, label:'цикл' },
                { icon:<Clock size={13}/>, val:`${s.hoursPerDay}ч`, label:'в смену' },
                { icon:<Clock size={13}/>, val:`${s.startTime}–${s.endTime}`, label:'время' },
                { icon:<Users size={13}/>, val:s._count?.employees ?? 0, label:'сотрудников' },
              ].map((item, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:'#94a3b8' }}>
                  {item.icon}<span style={{ fontWeight:600, color:'var(--text-primary,#e2e8f0)' }}>{item.val}</span> {item.label}
                </div>
              ))}
            </div>
            {s.cycleStart && <div style={{ marginTop:8, fontSize:11, color:'#64748b' }}>Опорная дата цикла: {s.cycleStart}</div>}
            {s.note && <div style={{ marginTop:8, fontSize:12, color:'#64748b', fontStyle:'italic' }}>{s.note}</div>}
          </div>
        ))}
        {schedules.length === 0 && (
          <div style={{ gridColumn:'1/-1', textAlign:'center', padding:48, color:'#64748b' }}>
            <Clock size={32} style={{ opacity:0.3, marginBottom:12 }}/><br/>
            Графиков пока нет. Создайте первый.
          </div>
        )}
      </div>

      {/* Presets hint */}
      {schedules.length === 0 && (
        <div style={{ marginTop:24, background:'var(--bg-panel,#1e293b)', borderRadius:12, padding:18, border:'1px solid rgba(255,255,255,0.07)' }}>
          <h3 style={{ margin:'0 0 14px', fontSize:14, fontWeight:600 }}>Быстрое создание стандартных графиков</h3>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            {SCHEDULE_TYPES.map(t => (
              <button key={t.value} onClick={() => { setEditing({ ...EMPTY, name:t.label.split('—')[1].trim(), type:t.value, workDays:t.workDays, restDays:t.restDays }); setIsNew(true); }}
                style={{ ...btnSt(TYPE_COLOR[t.value]||'#6366f1'), flexDirection:'column' as any, alignItems:'flex-start', gap:2, padding:'10px 16px' }}>
                <span style={{ fontWeight:600 }}>{t.label}</span>
                <span style={{ fontSize:11, opacity:0.8 }}>{t.desc}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {editing && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'var(--bg-panel,#1e293b)', borderRadius:14, padding:28, width:420, border:'1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ margin:'0 0 20px', fontSize:16, fontWeight:600 }}>{isNew ? 'Новый график' : 'Редактировать график'}</h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div style={{ gridColumn:'1/-1' }}>
                <label style={labelSt}>Название</label>
                <input value={editing.name} onChange={e=>setEditing((f:any)=>({...f,name:e.target.value}))} placeholder="5/2 Производство" style={inpSt}/>
              </div>
              <div style={{ gridColumn:'1/-1' }}>
                <label style={labelSt}>Тип графика</label>
                <select value={editing.type} onChange={e=>onTypeChange(e.target.value)} style={inpSt}>
                  {SCHEDULE_TYPES.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label style={labelSt}>Рабочих дней</label>
                <input type="number" min={1} max={14} value={editing.workDays} onChange={e=>setEditing((f:any)=>({...f,workDays:Number(e.target.value)}))} style={inpSt}/>
              </div>
              <div>
                <label style={labelSt}>Выходных дней</label>
                <input type="number" min={1} max={14} value={editing.restDays} onChange={e=>setEditing((f:any)=>({...f,restDays:Number(e.target.value)}))} style={inpSt}/>
              </div>
              <div>
                <label style={labelSt}>Часов в смену</label>
                <input type="number" min={1} max={24} step={0.5} value={editing.hoursPerDay} onChange={e=>setEditing((f:any)=>({...f,hoursPerDay:Number(e.target.value)}))} style={inpSt}/>
              </div>
              <div>
                <label style={labelSt}>Начало смены</label>
                <input type="time" value={editing.startTime} onChange={e=>setEditing((f:any)=>({...f,startTime:e.target.value}))} style={inpSt}/>
              </div>
              <div>
                <label style={labelSt}>Конец смены</label>
                <input type="time" value={editing.endTime} onChange={e=>setEditing((f:any)=>({...f,endTime:e.target.value}))} style={inpSt}/>
              </div>
              {(editing.type==='2_2'||editing.type==='custom') && (
                <div style={{ gridColumn:'1/-1' }}>
                  <label style={labelSt}>Опорная дата цикла (для 2/2)</label>
                  <input type="date" value={editing.cycleStart||''} onChange={e=>setEditing((f:any)=>({...f,cycleStart:e.target.value}))} style={inpSt}/>
                  <div style={{ fontSize:11, color:'#64748b', marginTop:4 }}>С этой даты начинается первый рабочий день цикла</div>
                </div>
              )}
              <div style={{ gridColumn:'1/-1' }}>
                <label style={labelSt}>Примечание</label>
                <input value={editing.note||''} onChange={e=>setEditing((f:any)=>({...f,note:e.target.value}))} placeholder="Для охраны, водителей..." style={inpSt}/>
              </div>
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:20 }}>
              <button onClick={()=>{setEditing(null);setIsNew(false);}} style={btnSt('#334155')}>Отмена</button>
              <button onClick={handleSave} style={btnSt('#6366f1')}>Сохранить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const btnSt = (bg:string): React.CSSProperties => ({ display:'inline-flex', alignItems:'center', gap:6, padding:'8px 14px', background:bg, color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:500 });
const iconBtn: React.CSSProperties = { background:'none', border:'1px solid rgba(255,255,255,0.1)', borderRadius:6, cursor:'pointer', color:'#94a3b8', padding:'4px 6px', display:'inline-flex' };
const labelSt: React.CSSProperties = { display:'block', fontSize:12, color:'#94a3b8', marginBottom:5, fontWeight:500 };
const inpSt: React.CSSProperties = { width:'100%', padding:'9px 12px', borderRadius:8, border:'1px solid rgba(255,255,255,0.12)', background:'rgba(255,255,255,0.05)', color:'inherit', fontSize:13, boxSizing:'border-box' };
