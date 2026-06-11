import { apiFetch } from '../../../lib/api';
import { confirmDialog } from '../../../lib/confirm';
import { useState, useEffect } from 'react';
import { Plus, Trash2, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';


const TYPE_LABEL: Record<string, string> = { holiday: 'Праздник', extra_off: 'Доп. выходной', extra_work: 'Доп. рабочий' };
const TYPE_COLOR: Record<string, string> = { holiday: '#ef4444', extra_off: '#f59e0b', extra_work: '#22c55e' };

const MONTHS_RU = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const DOW = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];

export default function WorkCalendarPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ date: '', type: 'extra_off', name: '', scope: 'all' });
  const [activeMonth, setActiveMonth] = useState(new Date().getMonth());

  const load = async () => {
    setLoading(true);
    try {
      const r = await apiFetch(`/api/work-calendar?year=${year}`);
      if (r.ok) setData(await r.json());
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [year]);

  const offDaySet = new Set<string>([
    ...(data?.builtin?.map((d: any) => d.date) ?? []),
    ...(data?.recurring?.filter((d: any) => d.type !== 'extra_work').map((d: any) => d.date) ?? []),
    ...(data?.specific?.filter((d: any) => d.type !== 'extra_work').map((d: any) => d.date) ?? []),
  ]);

  const getEventForDate = (dateStr: string) => {
    const builtin = data?.builtin?.find((d: any) => d.date === dateStr);
    if (builtin) return { ...builtin, isBuiltin: true };
    const rec = data?.recurring?.find((d: any) => d.date === dateStr);
    if (rec) return rec;
    return data?.specific?.find((d: any) => d.date === dateStr);
  };

  const handleAdd = async () => {
    if (!form.date || !form.name) return;
    await apiFetch('/api/work-calendar', { method: 'POST', body: JSON.stringify(form) });
    setShowAdd(false);
    setForm({ date: '', type: 'extra_off', name: '', scope: 'all' });
    load();
  };

  const handleDelete = async (id: string) => {
    if (!(await confirmDialog({ message: 'Удалить этот день?', danger: true }))) return;
    await apiFetch(`/api/work-calendar/${id}`, { method: 'DELETE' });
    load();
  };

  // Build calendar grid for active month
  const buildMonthGrid = (m: number) => {
    const first = new Date(year, m, 1);
    const last  = new Date(year, m + 1, 0);
    const startDow = (first.getDay() + 6) % 7; // Mon=0
    const days: (number | null)[] = Array(startDow).fill(null);
    for (let d = 1; d <= last.getDate(); d++) days.push(d);
    while (days.length % 7 !== 0) days.push(null);
    return days;
  };

  const s: React.CSSProperties = {
    padding: '24px 28px', flex: 1, overflowY: 'auto',
    fontFamily: 'var(--font-family, Inter, sans-serif)',
  };

  return (
    <div style={s}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <h2 style={{ margin:0, fontSize:20, fontWeight:700 }}>Производственный календарь</h2>
          <p style={{ margin:'4px 0 0', fontSize:13, color:'var(--text-muted,#94a3b8)' }}>
            Государственные праздники и дополнительные нерабочие дни
          </p>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <button onClick={() => setYear(y => y-1)} style={btnStyle('#334155')}>
            <ChevronLeft size={16}/>
          </button>
          <span style={{ fontSize:18, fontWeight:700, minWidth:56, textAlign:'center' }}>{year}</span>
          <button onClick={() => setYear(y => y+1)} style={btnStyle('#334155')}>
            <ChevronRight size={16}/>
          </button>
          <button onClick={load} style={btnStyle('#334155')} title="Обновить">
            <RefreshCw size={15} style={loading ? { animation:'spin 1s linear infinite' } : {}}/>
          </button>
          <button onClick={() => setShowAdd(true)} style={btnStyle('#6366f1')}>
            <Plus size={15}/> Добавить день
          </button>
        </div>
      </div>

      {/* Stats */}
      {data && (
        <div style={{ display:'flex', gap:12, marginBottom:24, flexWrap:'wrap' }}>
          {[
            { label:'Праздников', count: (data.builtin?.length ?? 0) + (data.recurring?.filter((d:any)=>d.type==='holiday').length ?? 0), color:'#ef4444' },
            { label:'Доп. выходных', count: data.specific?.filter((d:any)=>d.type==='extra_off').length ?? 0, color:'#f59e0b' },
            { label:'Нерабочих дней', count: offDaySet.size, color:'#6366f1' },
          ].map(s => (
            <div key={s.label} style={{ background:'var(--bg-panel,#1e293b)', border:`1px solid rgba(255,255,255,0.07)`, borderRadius:10, padding:'12px 20px', minWidth:140 }}>
              <div style={{ fontSize:24, fontWeight:700, color:s.color }}>{s.count}</div>
              <div style={{ fontSize:12, color:'var(--text-muted,#94a3b8)', marginTop:2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Month selector + Calendar grid */}
      <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
        {MONTHS_RU.map((m, i) => (
          <button key={i} onClick={() => setActiveMonth(i)}
            style={{ padding:'6px 14px', borderRadius:8, border:'none', cursor:'pointer', fontSize:13, fontWeight:500,
              background: i===activeMonth ? '#6366f1' : 'var(--bg-panel,#1e293b)',
              color: i===activeMonth ? '#fff' : 'var(--text-secondary,#94a3b8)' }}>
            {m}
          </button>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:28 }}>
        {/* Calendar */}
        <div style={{ background:'var(--bg-panel,#1e293b)', borderRadius:12, padding:16, border:'1px solid rgba(255,255,255,0.07)' }}>
          <h3 style={{ margin:'0 0 12px', fontSize:14, fontWeight:600 }}>{MONTHS_RU[activeMonth]} {year}</h3>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2, marginBottom:4 }}>
            {DOW.map(d => <div key={d} style={{ textAlign:'center', fontSize:11, color:'#64748b', padding:'4px 0', fontWeight:600 }}>{d}</div>)}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2 }}>
            {buildMonthGrid(activeMonth).map((day, i) => {
              if (!day) return <div key={i}/>;
              const ds = `${year}-${String(activeMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
              const evt = getEventForDate(ds);
              const isOff = offDaySet.has(ds);
              const dow = (i % 7);
              const isWeekend = dow === 5 || dow === 6;
              return (
                <div key={i} title={evt?.name ?? ''} style={{
                  textAlign:'center', padding:'6px 2px', borderRadius:6, fontSize:12, fontWeight:500,
                  background: evt ? (evt.type==='extra_work'?'rgba(34,197,94,0.2)':'rgba(239,68,68,0.18)') : isWeekend ? 'rgba(255,255,255,0.04)' : 'transparent',
                  color: isOff || isWeekend ? '#ef4444' : 'var(--text-primary,#e2e8f0)',
                  border: evt ? `1px solid ${TYPE_COLOR[evt.type]||'#ef4444'}40` : '1px solid transparent',
                  cursor: evt ? 'pointer' : 'default',
                }}>
                  {day}
                </div>
              );
            })}
          </div>
        </div>

        {/* Events list for month */}
        <div style={{ background:'var(--bg-panel,#1e293b)', borderRadius:12, padding:16, border:'1px solid rgba(255,255,255,0.07)', overflowY:'auto', maxHeight:320 }}>
          <h3 style={{ margin:'0 0 12px', fontSize:14, fontWeight:600 }}>Нерабочие дни — {MONTHS_RU[activeMonth]}</h3>
          {data && (() => {
            const monthStr = `${year}-${String(activeMonth+1).padStart(2,'0')}`;
            const monthEvents = [
              ...(data.builtin?.filter((d:any) => d.date.startsWith(monthStr)) ?? []),
              ...(data.recurring?.filter((d:any) => d.date.startsWith(monthStr) && !data.builtin?.some((b:any)=>b.monthDay===d.monthDay)) ?? []),
              ...(data.specific?.filter((d:any) => d.date.startsWith(monthStr)) ?? []),
            ].sort((a,b) => a.date.localeCompare(b.date));
            if (!monthEvents.length) return <p style={{ color:'#64748b', fontSize:13 }}>Нерабочих дней нет</p>;
            return monthEvents.map((evt: any, i: number) => (
              <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background:TYPE_COLOR[evt.type]||'#ef4444', flexShrink:0 }}/>
                  <div>
                    <div style={{ fontSize:13, fontWeight:500 }}>{evt.name}</div>
                    <div style={{ fontSize:11, color:'#64748b' }}>{evt.date} · {TYPE_LABEL[evt.type]||evt.type}</div>
                  </div>
                </div>
                {!evt.isBuiltin && evt.id && (
                  <button onClick={() => handleDelete(evt.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'#64748b', padding:4 }}>
                    <Trash2 size={14}/>
                  </button>
                )}
              </div>
            ));
          })()}
        </div>
      </div>

      {/* Full list */}
      <div style={{ background:'var(--bg-panel,#1e293b)', borderRadius:12, border:'1px solid rgba(255,255,255,0.07)', overflow:'hidden' }}>
        <div style={{ padding:'14px 16px', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
          <h3 style={{ margin:0, fontSize:14, fontWeight:600 }}>Все нерабочие дни {year}</h3>
        </div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ background:'rgba(255,255,255,0.03)' }}>
                {['Дата','Название','Тип','Ежегодный','Охват',''].map(h => (
                  <th key={h} style={{ padding:'10px 16px', textAlign:'left', color:'#64748b', fontWeight:500, whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data && [
                ...(data.builtin ?? []).map((d: any) => ({ ...d, _src:'builtin' })),
                ...(data.recurring ?? []).filter((d:any) => !data.builtin?.some((b:any)=>b.monthDay===d.monthDay)).map((d:any) => ({...d,_src:'recurring'})),
                ...(data.specific ?? []).map((d:any) => ({...d,_src:'specific'})),
              ].sort((a,b) => a.date.localeCompare(b.date)).map((evt: any, i: number) => (
                <tr key={i} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding:'10px 16px', fontWeight:500 }}>{evt.date}</td>
                  <td style={{ padding:'10px 16px' }}>{evt.name}</td>
                  <td style={{ padding:'10px 16px' }}>
                    <span style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'2px 10px', borderRadius:20, fontSize:11, fontWeight:600, background:`${TYPE_COLOR[evt.type]||'#6366f1'}22`, color:TYPE_COLOR[evt.type]||'#6366f1' }}>
                      {TYPE_LABEL[evt.type]||evt.type}
                    </span>
                  </td>
                  <td style={{ padding:'10px 16px', color:'#64748b' }}>{evt.isRecurring ? '✓' : '—'}</td>
                  <td style={{ padding:'10px 16px', color:'#64748b' }}>{evt.scope === 'all' ? 'Все' : evt.scope}</td>
                  <td style={{ padding:'10px 16px' }}>
                    {!evt.isBuiltin && evt.id && (
                      <button onClick={() => handleDelete(evt.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'#64748b', padding:4 }}>
                        <Trash2 size={14}/>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add modal */}
      {showAdd && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'var(--bg-panel,#1e293b)', borderRadius:14, padding:28, minWidth:380, border:'1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ margin:'0 0 20px', fontSize:16, fontWeight:600 }}>Добавить нерабочий день</h3>
            {[
              { label:'Дата', el: <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} style={inputStyle}/> },
              { label:'Название', el: <input placeholder="Хайит 2026, Корпоратив..." value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} style={inputStyle}/> },
              { label:'Тип', el: (
                <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))} style={inputStyle}>
                  <option value="extra_off">Доп. выходной</option>
                  <option value="holiday">Праздник</option>
                  <option value="extra_work">Доп. рабочий день</option>
                </select>
              )},
              { label:'Охват', el: (
                <select value={form.scope} onChange={e=>setForm(f=>({...f,scope:e.target.value}))} style={inputStyle}>
                  <option value="all">Вся компания</option>
                  <option value="production">Производство</option>
                  <option value="office">Офис</option>
                </select>
              )},
            ].map(({label,el}) => (
              <div key={label} style={{ marginBottom:14 }}>
                <label style={{ display:'block', fontSize:12, color:'#94a3b8', marginBottom:5, fontWeight:500 }}>{label}</label>
                {el}
              </div>
            ))}
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:20 }}>
              <button onClick={() => setShowAdd(false)} style={btnStyle('#334155')}>Отмена</button>
              <button onClick={handleAdd} style={btnStyle('#6366f1')}>Сохранить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const btnStyle = (bg: string): React.CSSProperties => ({
  display:'inline-flex', alignItems:'center', gap:6, padding:'8px 14px',
  background:bg, color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:500,
});
const inputStyle: React.CSSProperties = {
  width:'100%', padding:'9px 12px', borderRadius:8, border:'1px solid rgba(255,255,255,0.12)',
  background:'rgba(255,255,255,0.05)', color:'inherit', fontSize:13, boxSizing:'border-box',
};
