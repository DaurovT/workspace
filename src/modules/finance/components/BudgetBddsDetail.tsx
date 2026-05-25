import React, { useState, useMemo, useCallback } from 'react';
import { ArrowLeft, Download, ChevronDown as ChevDown, Waves, ArrowDown, ArrowUp } from 'lucide-react';
import { useFinanceStore, type BddsBudget } from '../financeStore';

const MONTHS_SHORT = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'];
const CURRENT_MONTH = new Date().getMonth();
const CURRENT_YEAR  = new Date().getFullYear();

const fmt = (n: number) => n === 0 ? '—' : new Intl.NumberFormat('ru-RU').format(Math.round(n));

interface Props { budget: BddsBudget; onBack: () => void; }

export const BudgetBddsDetail: React.FC<Props> = ({ budget, onBack }) => {
  const { categories, transactions, budgetLines, budgetScenarios, users, accounts } = useFinanceStore();

  const [showFact, setShowFact]   = useState(true);
  const [period,   setPeriod]     = useState('По месяцам');
  const [hideZeros, setHideZeros] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [editCell, setEditCell]   = useState<{scenId:string;catId:string;m:number;y:number}|null>(null);
  const [editVal,  setEditVal]    = useState('');

  const scenario = useMemo(() =>
    (budget.scenarioId ? budgetScenarios.find(s => s.id === budget.scenarioId) : undefined)
    ?? budgetScenarios.find(s => s.isApproved)
    ?? budgetScenarios[0],
  [budgetScenarios, budget.scenarioId]);

  // Fix #6: only leaf categories (no children) to avoid double-counting parent+child
  const leafCatIds = useMemo(() => {
    const parentIds = new Set(categories.filter(c => c.parentId).map(c => c.parentId!));
    return new Set(categories.filter(c => !parentIds.has(c.id)).map(c => c.id));
  }, [categories]);

  const opInc  = useMemo(() => categories.filter(c => c.type === 'income'  && c.activity === 'operating'  && leafCatIds.has(c.id)), [categories, leafCatIds]);
  const opExp  = useMemo(() => categories.filter(c => c.type === 'expense' && c.activity === 'operating'  && leafCatIds.has(c.id)), [categories, leafCatIds]);
  const invInc = useMemo(() => categories.filter(c => c.type === 'income'  && c.activity === 'investing'  && leafCatIds.has(c.id)), [categories, leafCatIds]);
  const invExp = useMemo(() => categories.filter(c => c.type === 'expense' && c.activity === 'investing'  && leafCatIds.has(c.id)), [categories, leafCatIds]);
  const finInc = useMemo(() => categories.filter(c => c.type === 'income'  && c.activity === 'financing'  && leafCatIds.has(c.id)), [categories, leafCatIds]);
  const finExp = useMemo(() => categories.filter(c => c.type === 'expense' && c.activity === 'financing'  && leafCatIds.has(c.id)), [categories, leafCatIds]);

  // Fix #11: Map index for O(1) lookup instead of O(n) find on every render
  const planIndex = useMemo(() => {
    const map = new Map<string, number>();
    if (!scenario) return map;
    budgetLines
      .filter(l => l.scenarioId === scenario.id)
      .forEach(l => map.set(`${l.categoryId}|${l.month}|${l.year}`, l.amount));
    return map;
  }, [budgetLines, scenario]);

  const factIndex = useMemo(() => {
    const map = new Map<string, number>();
    transactions
      .filter(t => t.isPaidConfirmed && t.type !== 'transfer') // Fix #8: exclude transfers
      .forEach(t => {
        if (!t.categoryId) return;
        const d = new Date(t.date);
        const key = `${t.categoryId}|${d.getMonth()}|${d.getFullYear()}`;
        map.set(key, (map.get(key) ?? 0) + (t.baseAmount ?? t.amount));
      });
    return map;
  }, [transactions]);

  const getPlan = (catId: string, month: number, year: number): number =>
    planIndex.get(`${catId}|${month}|${year}`) ?? 0;

  const getFact = (catId: string, month: number, year: number): number =>
    factIndex.get(`${catId}|${month}|${year}`) ?? 0;

  const { updateBudgetLine } = useFinanceStore();
  const commitEdit = () => {
    if (!editCell) return;
    // Fix #4: allow negative values
    const parsed = Number(editVal.replace(/[^\d.-]/g, ''));
    updateBudgetLine(editCell.scenId, editCell.catId, editCell.m, editCell.y, isNaN(parsed) ? 0 : parsed);
    setEditCell(null);
  };

  const columns = useMemo(() => {
    const startD = new Date(budget.periodStart + '-01');
    const endD = new Date(budget.periodEnd + '-01');
    if (isNaN(startD.getTime()) || isNaN(endD.getTime())) return [];
    
    const sy = startD.getFullYear();
    const sm = startD.getMonth();
    const ey = endD.getFullYear();
    const em = endD.getMonth();

    const allM: {m:number, y:number}[] = [];
    for (let y = sy; y <= ey; y++) {
      const startM = y === sy ? sm : 0;
      const endM = y === ey ? em : 11;
      for (let m = startM; m <= endM; m++) {
        allM.push({m, y});
      }
    }

    if (period === 'По годам') {
      const byYear = allM.reduce((acc, curr) => {
        if (!acc[curr.y]) acc[curr.y] = [];
        acc[curr.y].push(curr);
        return acc;
      }, {} as Record<number, {m:number, y:number}[]>);
      return Object.entries(byYear).map(([y, months]) => ({ label: y, months }));
    }

    if (period === 'По кварталам') {
      const byQ: Record<string, {m:number, y:number}[]> = {};
      allM.forEach(curr => {
        const q = Math.floor(curr.m / 3) + 1;
        const key = `Q${q} '${String(curr.y).slice(2)}`;
        if (!byQ[key]) byQ[key] = [];
        byQ[key].push(curr);
      });
      return Object.entries(byQ).map(([label, months]) => ({ label, months }));
    }

    return allM.map(curr => ({
      label: `${MONTHS_SHORT[curr.m]} '${String(curr.y).slice(2)}`,
      months: [curr],
    }));
  }, [period, budget.periodStart, budget.periodEnd]);

  const allMonthsList = useMemo(() => columns.flatMap(c => c.months), [columns]);

  const groupPlan = (cats: typeof categories, m: {m:number, y:number}) => cats.reduce((s, c) => s + getPlan(c.id, m.m, m.y), 0);
  const groupFact = (cats: typeof categories, m: {m:number, y:number}) => cats.reduce((s, c) => s + getFact(c.id, m.m, m.y), 0);

  const netPlan = (m: {m:number, y:number}) => 
    (groupPlan(opInc, m) + groupPlan(invInc, m) + groupPlan(finInc, m)) - 
    (groupPlan(opExp, m) + groupPlan(invExp, m) + groupPlan(finExp, m));
  const netFact = (m: {m:number, y:number}) => 
    (groupFact(opInc, m) + groupFact(invInc, m) + groupFact(finInc, m)) - 
    (groupFact(opExp, m) + groupFact(invExp, m) + groupFact(finExp, m));

  const initialBalance = useMemo(() => accounts.reduce((sum, a) => sum + a.balance, 0) || 2500000, [accounts]);

  // Fix #7: add all category arrays to deps so balances react to category changes
  const balancesPlan = useMemo(() => {
    const res = [initialBalance];
    for (let i = 0; i < allMonthsList.length; i++) {
      res.push(res[i] + netPlan(allMonthsList[i]));
    }
    return res;
    // res[0] = initial, res[i+1] = balance after month i → length = allMonthsList.length + 1
  }, [initialBalance, planIndex, allMonthsList, opInc, opExp, invInc, invExp, finInc, finExp]);

  const balancesFact = useMemo(() => {
    const res = [initialBalance];
    for (let i = 0; i < allMonthsList.length; i++) {
      res.push(res[i] + netFact(allMonthsList[i]));
    }
    return res;
  }, [initialBalance, factIndex, allMonthsList, opInc, opExp, invInc, invExp, finInc, finExp]);

  const toggleCollapse = (id: string) => setCollapsed(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n;
  });

  const isCatVisible = (catId: string) => {
    if (!hideZeros) return true;
    const totalPlan = allMonthsList.reduce((s,m)=>s+getPlan(catId,m.m,m.y),0);
    const totalFact = allMonthsList.reduce((s,m)=>s+getFact(catId,m.m,m.y),0);
    return totalPlan > 0 || totalFact > 0;
  };

  const fmtPeriod = (s: string, e: string) => {
    const mo=['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];
    const [sy,sm]=s.split('-'); const [ey,em]=e.split('-');
    return `${mo[+sm-1]} '${sy.slice(2)} — ${mo[+em-1]} '${ey.slice(2)}`;
  };

  const thStyle: React.CSSProperties = {
    padding:'8px 10px', fontSize:11, fontWeight:600, color:'var(--text-muted)',
    textAlign:'right', whiteSpace:'nowrap', borderBottom:'1px solid var(--border-subtle)',
    background:'var(--bg-surface)', position:'sticky', top:0, zIndex:2,
  };
  const tdStyle: React.CSSProperties = {
    padding:'8px 10px', fontSize:13, fontFamily:'var(--font-mono)', textAlign:'right',
    borderBottom:'1px solid var(--border-subtle)', whiteSpace:'nowrap',
  };
  const stickyNameStyle = (bg: string, extra?: React.CSSProperties): React.CSSProperties => ({
    ...tdStyle, fontFamily:'var(--font-sans)', fontSize:12, fontWeight:500,
    textAlign:'left', position:'sticky', left:0, zIndex:1,
    background:bg, minWidth:250, maxWidth:250, width:250,
    overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
    boxShadow:'2px 0 4px rgba(0,0,0,0.06)', borderRight:'1px solid var(--border-subtle)',
    ...extra,
  });
  const stickyThStyle = (extra?: React.CSSProperties): React.CSSProperties => ({
    ...thStyle, textAlign:'left', position:'sticky', left:0, zIndex:3,
    minWidth:250, maxWidth:250, width:250,
    boxShadow:'2px 0 4px rgba(0,0,0,0.06)', borderRight:'1px solid var(--border-subtle)',
    ...extra,
  });

  const renderCells = (
    planVal: number, factVal: number, isPast: boolean,
    isExpense: boolean, catId: string, m: {m:number,y:number}|null, editable: boolean,
  ) => {
    const isEditing = editCell?.catId === catId && editCell?.m === m?.m && editCell?.y === m?.y;
    const diffGood  = isExpense ? factVal <= planVal : factVal >= planVal;
    return (
      <React.Fragment key={m ? `${m.m}-${m.y}` : 'grouped'}>
        <td style={tdStyle}>
          {editable && isEditing ? (
            <input autoFocus value={editVal}
              onChange={e => setEditVal(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={e=>{if(e.key==='Enter')commitEdit();if(e.key==='Escape')setEditCell(null);}}
              style={{width:80,padding:'3px 6px',background:'var(--bg-hover)',
                border:'1px solid var(--color-primary)',borderRadius:4,
                color:'var(--text-primary)',fontSize:13,fontFamily:'var(--font-mono)',textAlign:'right',outline:'none'}}/>
          ) : (
            <span
              onClick={editable&&scenario&&m ? ()=>{setEditCell({scenId:scenario.id,catId,m:m.m,y:m.y});setEditVal(String(planVal));} : undefined}
              style={{color:planVal>0?'var(--color-primary)':'var(--text-muted)',
                cursor:editable?'pointer':'default',padding:'2px 4px',borderRadius: 4,display:'inline-block'}}
              onMouseEnter={editable?e=>(e.currentTarget.style.background='var(--bg-hover)'):undefined}
              onMouseLeave={editable?e=>(e.currentTarget.style.background='transparent'):undefined}>
              {fmt(planVal)}
            </span>
          )}
        </td>
        {showFact && <td style={{...tdStyle,color:isPast&&factVal>0?(diffGood?'#10b981':'#ef4444'):'var(--text-muted)'}}>
          {isPast&&factVal>0?fmt(factVal):'—'}
        </td>}
      </React.Fragment>
    );
  };

  const renderGroupRow = (id: string, title: string, inc: typeof categories, exp: typeof categories) => {
    const isColl = collapsed.has(id);
    const pTotal = allMonthsList.reduce((s,m) => s + groupPlan(inc,m) - groupPlan(exp,m), 0);
    const fTotal = allMonthsList.reduce((s,m) => s + groupFact(inc,m) - groupFact(exp,m), 0);
    return (
      <tr style={{background: 'var(--bg-elevated)',borderBottom: '1px solid var(--border-subtle)'}}>
        <td onClick={()=>toggleCollapse(id)} style={stickyNameStyle('var(--bg-surface)',{cursor:'pointer',fontWeight:600,color:'var(--text-primary)',textTransform:'uppercase',fontSize:11,letterSpacing:0.5})}>
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            <ChevDown size={14} style={{transform:isColl?'rotate(-90deg)':'none',transition:'0.2s',color:'var(--text-muted)'}}/>
            {title}
          </div>
        </td>
        <td style={{...tdStyle,fontWeight:700,color:'var(--text-primary)'}}>{fmt(pTotal)}</td>
        {showFact && <td style={{...tdStyle,fontWeight:700,color:'var(--text-primary)'}}>{fmt(fTotal)}</td>}
        {columns.map(col => {
          const colPp = col.months.reduce((s,m) => s + groupPlan(inc,m) - groupPlan(exp,m), 0);
          const colPf = col.months.reduce((s,m) => s + groupFact(inc,m) - groupFact(exp,m), 0);
          const isPast = col.months.some(m => m.y < CURRENT_YEAR || (m.y === CURRENT_YEAR && m.m <= CURRENT_MONTH));
          return <React.Fragment key={col.label}>
            <td style={{...tdStyle,fontWeight:700,color:'var(--text-muted)'}}>{fmt(colPp)}</td>
            {showFact && <td style={{...tdStyle,fontWeight:700,color:'var(--text-muted)'}}>{isPast?fmt(colPf):'—'}</td>}
          </React.Fragment>;
        })}
      </tr>
    );
  };

  const renderCatRow = (id: string, name: string, isExpense: boolean) => {
    const pTotal = allMonthsList.reduce((s,m) => s + getPlan(id, m.m, m.y), 0);
    const fTotal = allMonthsList.reduce((s,m) => s + getFact(id, m.m, m.y), 0);
    return (
      <tr key={id} style={{borderBottom:'1px solid var(--border-subtle)',background:'var(--bg-base)'}}
        onMouseEnter={e=>e.currentTarget.style.background='var(--bg-hover)'}
        onMouseLeave={e=>e.currentTarget.style.background='var(--bg-base)'}>
        <td style={stickyNameStyle('inherit',{paddingLeft:32})}>
          {isExpense ? <ArrowUp size={11} style={{marginRight:6,color:'#ef4444',verticalAlign:'middle'}}/>
                     : <ArrowDown size={11} style={{marginRight:6,color:'#10b981',verticalAlign:'middle'}}/>}
          {name}
        </td>
        <td style={{...tdStyle,color:isExpense?'#ef4444':'#10b981'}}>{fmt(pTotal)}</td>
        {showFact && <td style={{...tdStyle,color:isExpense?'#fca5a5':'#6ee7b7'}}>{fmt(fTotal)}</td>}
        {columns.map(col => {
          if (col.months.length > 1) {
             const cp = col.months.reduce((s,m) => s + getPlan(id, m.m, m.y), 0);
             const cf = col.months.reduce((s,m) => s + getFact(id, m.m, m.y), 0);
             const isPast = col.months.some(m => m.y < CURRENT_YEAR || (m.y === CURRENT_YEAR && m.m <= CURRENT_MONTH));
             return renderCells(cp,cf,isPast,isExpense,id,null,false);
          }
          const m = col.months[0];
          const isPast = m.y < CURRENT_YEAR || (m.y === CURRENT_YEAR && m.m <= CURRENT_MONTH);
          return renderCells(getPlan(id, m.m, m.y), getFact(id, m.m, m.y), isPast, isExpense, id, m, true);
        })}
      </tr>
    );
  };

  // Fix #1 & #2: renderBalanceRow now receives direct total values + per-column callbacks
  // balancesPlan/Fact have n+1 elements: [initial, after_m0, ..., after_mN]
  // column idx i → balance AFTER that month = array[i+1]
  const renderBalanceRow = (
    title: string,
    totalPlanVal: number,
    totalFactVal: number | null, // null = don't show
    getColPlan: (colIdx: number) => number,
    getColFact: (colIdx: number) => number | null,
  ) => (
    <tr style={{background:'rgba(99,102,241,0.06)',borderBottom: '1px solid var(--border-subtle)'}}>
      <td style={stickyNameStyle('var(--bg-surface)',{paddingLeft:16,fontWeight:600,color:'#818cf8'})}>{title}</td>
      <td style={{...tdStyle,fontWeight:700,color:'#818cf8'}}>{fmt(totalPlanVal)}</td>
      {showFact && <td style={{...tdStyle,fontWeight:700,color:'#a5b4fc'}}>{totalFactVal !== null ? fmt(totalFactVal) : '—'}</td>}
      {columns.map((col, ci) => {
        const isPast = col.months.some(m => m.y < CURRENT_YEAR || (m.y === CURRENT_YEAR && m.m <= CURRENT_MONTH));
        const cf = getColFact(ci);
        return <React.Fragment key={col.label}>
          <td style={{...tdStyle,fontWeight:700,color:'#818cf8'}}>{fmt(getColPlan(ci))}</td>
          {showFact && <td style={{...tdStyle,fontWeight:700,color:'#a5b4fc'}}>{isPast && cf !== null ? fmt(cf) : '—'}</td>}
        </React.Fragment>;
      })}
    </tr>
  );

  const currentUser  = users.find(u => u.role === 'Владелец') ?? users[0];
  const authorName   = currentUser?.name ?? '—';

  const exportXls = useCallback(() => {
    const header = ['Название', 'Итого План', 'Итого Факт', ...allMonthsList.map(m => `${MONTHS_SHORT[m.m]} '${String(m.y).slice(2)} План`), ...allMonthsList.map(m => `${MONTHS_SHORT[m.m]} '${String(m.y).slice(2)} Факт`)];
    const rows: string[][] = [header];
    const addRow = (name: string, pFn: (m:{m:number,y:number})=>number, fFn: (m:{m:number,y:number})=>number) => {
      rows.push([name,
        String(allMonthsList.reduce((s,m)=>s+pFn(m),0)),
        String(allMonthsList.reduce((s,m)=>s+fFn(m),0)),
        ...allMonthsList.map(m=>String(pFn(m))),
        ...allMonthsList.map(m=>String(fFn(m))),
      ]);
    };
    rows.push(['ОСТАТОК НА НАЧАЛО','','', ...allMonthsList.map((_,i)=>String(balancesPlan[i])), ...allMonthsList.map((_,i)=>String(balancesFact[i]))]);
    
    rows.push(['ОПЕРАЦИОННАЯ ДЕЯТЕЛЬНОСТЬ','','', ...Array(allMonthsList.length*2).fill('')]);
    opInc.forEach(c => addRow(`  Поступления: ${c.name}`, m=>getPlan(c.id,m.m,m.y), m=>getFact(c.id,m.m,m.y)));
    opExp.forEach(c => addRow(`  Выплаты: ${c.name}`, m=>getPlan(c.id,m.m,m.y), m=>getFact(c.id,m.m,m.y)));
    
    rows.push(['ИНВЕСТИЦИОННАЯ ДЕЯТЕЛЬНОСТЬ','','', ...Array(allMonthsList.length*2).fill('')]);
    invInc.forEach(c => addRow(`  Поступления: ${c.name}`, m=>getPlan(c.id,m.m,m.y), m=>getFact(c.id,m.m,m.y)));
    invExp.forEach(c => addRow(`  Выплаты: ${c.name}`, m=>getPlan(c.id,m.m,m.y), m=>getFact(c.id,m.m,m.y)));

    rows.push(['ФИНАНСОВАЯ ДЕЯТЕЛЬНОСТЬ','','', ...Array(allMonthsList.length*2).fill('')]);
    finInc.forEach(c => addRow(`  Поступления: ${c.name}`, m=>getPlan(c.id,m.m,m.y), m=>getFact(c.id,m.m,m.y)));
    finExp.forEach(c => addRow(`  Выплаты: ${c.name}`, m=>getPlan(c.id,m.m,m.y), m=>getFact(c.id,m.m,m.y)));

    rows.push(['ОСТАТОК НА КОНЕЦ','','',
      ...allMonthsList.map((_,i) => String(balancesPlan[i + 1])), // Fix: balancesPlan already contains cumulative sums
      ...allMonthsList.map((_,i) => String(balancesFact[i + 1])),
    ]);


    const csv = rows.map(r => r.map(c => `"${c}"`).join(';')).join('\n');
    const blob = new Blob(['\uFEFF'+csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${budget.name.replace(/\s+/g,'_')}.xls`; a.click();
    URL.revokeObjectURL(url);
  }, [opInc, opExp, invInc, invExp, finInc, finExp, budget.name, balancesPlan, balancesFact, allMonthsList]);

  const chk = (checked: boolean, label: string, onChange: ()=>void) => (
    <label style={{display:'flex',alignItems:'center',gap:5,cursor:'pointer',fontSize:12,
      color:checked?'var(--text-primary)':'var(--text-secondary)',fontWeight:checked?500:400}}>
      <input type="checkbox" checked={checked} onChange={onChange}
        style={{accentColor:'var(--color-primary)',width:14,height:14}}/>
      {label}
    </label>
  );

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden',background:'var(--bg-base)'}}>
      <div style={{padding:'12px 32px 0',fontSize:12}}>
        <button onClick={onBack}
          style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',fontSize:12,display:'flex',alignItems:'center',gap:5,padding:0}}
          onMouseEnter={e=>(e.currentTarget as HTMLElement).style.color='var(--color-primary)'}
          onMouseLeave={e=>(e.currentTarget as HTMLElement).style.color='var(--text-muted)'}>
          <ArrowLeft size={13}/> Список БДДС
        </button>
      </div>

      <div style={{padding:'10px 32px 0',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{ background: 'rgba(16,185,129,0.1)', padding: 5, borderRadius: 6 }}><Waves size={16} color="#10b981" /></div>
          <span style={{margin:0,fontSize: 15,fontWeight:700,color:'var(--text-primary)'}}>{budget.name}</span>
          {['БДДС', fmtPeriod(budget.periodStart, budget.periodEnd), budget.currency].map(tag=>(
            <span key={tag} style={{padding:'2px 8px',background:'var(--bg-hover)',border:'1px solid var(--border-subtle)',borderRadius:4,fontSize:12,color:'var(--text-secondary)',fontWeight:500}}>{tag}</span>
          ))}
          {scenario && (
            <span style={{padding:'2px 8px',background:'rgba(16,185,129,0.1)',border:'1px solid rgba(16,185,129,0.3)',borderRadius:4,fontSize:11,color:'#10b981',fontWeight:600}}>
              {scenario.name}
            </span>
          )}
        </div>
        <button onClick={exportXls}
          style={{display:'flex',alignItems:'center',gap:6,padding:'6px 14px',background:'var(--bg-surface)',border:'1px solid var(--border-subtle)',borderRadius:6,fontSize:12,color:'var(--text-secondary)',cursor:'pointer'}}
          onMouseEnter={e=>(e.currentTarget.style.background='var(--bg-hover)')}
          onMouseLeave={e=>(e.currentTarget.style.background='var(--bg-surface)')}>
          <Download size={13}/> .xls
        </button>
      </div>

      <div style={{padding:'12px 32px',display:'flex',alignItems:'center',gap:12,borderBottom:'1px solid var(--border-subtle)',flexWrap:'wrap'}}>
        {[{v:period, s:setPeriod, opts:['По месяцам','По кварталам','По годам']}].map(({v,s,opts})=>(
          <div key={v} style={{position:'relative'}}>
            <select value={v} onChange={e=>(s as (v:string)=>void)(e.target.value)} style={{
              height:32, padding:'0 28px 0 10px', background:'var(--bg-surface)',
              border:'1px solid var(--border-subtle)', borderRadius:6,
              color:'var(--text-primary)', fontSize:12, outline:'none',
              appearance:'none', cursor:'pointer',
            }}>
              {opts.map(o=><option key={o}>{o}</option>)}
            </select>
            <ChevDown size={13} style={{position:'absolute',right:8,top:'50%',transform:'translateY(-50%)',pointerEvents:'none',color:'var(--text-muted)'}}/>
          </div>
        ))}
        <div style={{width:1,height:20,background:'var(--border-subtle)',margin:'0 4px'}}/>
        {chk(showFact,'Факт',()=>setShowFact(v=>!v))}
        <div style={{width:1,height:20,background:'var(--border-subtle)',margin:'0 4px'}}/>
        {chk(hideZeros,'Спрятать нулевые',()=>setHideZeros(v=>!v))}
        <span style={{marginLeft:'auto',fontSize:11,color:'var(--text-muted)'}}>
          Автор: {authorName} · Сценарий: {scenario?.name ?? '—'}
        </span>
      </div>

      <div style={{flex:1,overflowX:'auto',overflowY:'auto'}}>
        <table style={{borderCollapse:'collapse',minWidth:800,width:'max-content'}}>
          <colgroup>
            <col style={{width:250}}/>
            <col style={{width:100}}/>{showFact&&<col style={{width:90}}/>}
            {columns.map(col=><React.Fragment key={col.label}>
              <col style={{width:90}}/>{showFact&&<col style={{width:80}}/>}
            </React.Fragment>)}
          </colgroup>
          <thead>
            <tr style={{background:'var(--bg-surface)'}}>
              <th style={stickyThStyle()}>Статья движения средств</th>
              <th colSpan={showFact?2:1} style={{...thStyle,borderLeft:'1px solid var(--border-subtle)'}}>Итого</th>
              {columns.map(col=>(
                <th key={col.label} colSpan={showFact?2:1} style={{...thStyle,borderLeft:'1px solid var(--border-subtle)',
                  color:col.months.some(m=>m.y<CURRENT_YEAR||(m.y===CURRENT_YEAR&&m.m<=CURRENT_MONTH))?'var(--text-primary)':'var(--text-muted)'}}>
                  {col.label}
                </th>
              ))}
            </tr>
            <tr style={{background:'var(--bg-surface)'}}>
              <th style={stickyThStyle({fontSize:10,color:'var(--text-muted)',fontWeight:400})}>
                {currentUser?.name ? `— ${currentUser.name}` : '—'}
              </th>
              {[...Array(1+columns.length)].map((_,i)=>(
                <React.Fragment key={i}>
                  <th style={{...thStyle,fontSize:10,borderLeft:i===0?'1px solid var(--border-subtle)':'none'}}>План</th>
                  {showFact&&<th style={{...thStyle,fontSize:10,color:'#10b981'}}>Факт</th>}
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Fix #1/#2: use balancesPlan[0] for initial, balancesPlan[n] for final */}
            {(() => {
              // Helper: cumulative column end-index in balancesPlan (offset+1 because res[0]=initial)
              // columns[ci] covers months from some start. We need the absolute index of the last month of that col.
              const colEndIdx = (ci: number) => {
                let count = 0;
                for (let j = 0; j <= ci; j++) count += columns[j].months.length;
                return count; // = index in balancesPlan after last month of col ci
              };
              // Last confirmed month index within allMonthsList
              const lastPastIdx = (() => {
                let last = -1;
                allMonthsList.forEach((m, i) => {
                  if (m.y < CURRENT_YEAR || (m.y === CURRENT_YEAR && m.m <= CURRENT_MONTH)) last = i;
                });
                return last;
              })();
              return (
                <>
                  {renderBalanceRow(
                    'Остаток на начало периода',
                    balancesPlan[0],
                    balancesFact[0],
                    (ci) => balancesPlan[colEndIdx(ci) - columns[ci].months.length],
                    (ci) => {
                      const startIdx = colEndIdx(ci) - columns[ci].months.length;
                      return startIdx <= lastPastIdx + 1 ? balancesFact[startIdx] : null;
                    },
                  )}

                  {renderGroupRow('grp_op','Операционная деятельность', opInc, opExp)}
                  {!collapsed.has('grp_op') && opInc.filter(c=>isCatVisible(c.id)).map(c=>renderCatRow(c.id,c.name,false))}
                  {!collapsed.has('grp_op') && opExp.filter(c=>isCatVisible(c.id)).map(c=>renderCatRow(c.id,c.name,true))}

                  {renderGroupRow('grp_inv','Инвестиционная деятельность', invInc, invExp)}
                  {!collapsed.has('grp_inv') && invInc.filter(c=>isCatVisible(c.id)).map(c=>renderCatRow(c.id,c.name,false))}
                  {!collapsed.has('grp_inv') && invExp.filter(c=>isCatVisible(c.id)).map(c=>renderCatRow(c.id,c.name,true))}

                  {renderGroupRow('grp_fin','Финансовая деятельность', finInc, finExp)}
                  {!collapsed.has('grp_fin') && finInc.filter(c=>isCatVisible(c.id)).map(c=>renderCatRow(c.id,c.name,false))}
                  {!collapsed.has('grp_fin') && finExp.filter(c=>isCatVisible(c.id)).map(c=>renderCatRow(c.id,c.name,true))}

                  {renderBalanceRow(
                    'Остаток на конец периода',
                    balancesPlan[allMonthsList.length], // Fix #1: use final element
                    lastPastIdx >= 0 ? balancesFact[lastPastIdx + 1] : null,
                    (ci) => balancesPlan[colEndIdx(ci)],
                    (ci) => {
                      const endIdx = colEndIdx(ci);
                      return endIdx <= lastPastIdx + 1 ? balancesFact[endIdx] : null;
                    },
                  )}
                </>
              );
            })()}
          </tbody>
        </table>
      </div>
    </div>
  );
};
