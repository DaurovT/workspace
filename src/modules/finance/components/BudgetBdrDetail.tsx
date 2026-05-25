import React, { useState, useMemo, useCallback } from 'react';
import { ArrowLeft, Download, ChevronDown as ChevDown } from 'lucide-react';
import { useFinanceStore, type BdrBudget } from '../financeStore';

const MONTHS_SHORT = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'];
const CURRENT_MONTH = new Date().getMonth();
const CURRENT_YEAR  = new Date().getFullYear();

const fmt    = (n: number) => n === 0 ? '—' : new Intl.NumberFormat('ru-RU').format(Math.round(n));
const fmtPct = (plan: number, fact: number) => plan > 0 ? Math.round((fact / plan) * 100) + '%' : '—';

interface Props { budget: BdrBudget; onBack: () => void; }

export const BudgetBdrDetail: React.FC<Props> = ({ budget, onBack }) => {
  const { categories, transactions, budgetLines, budgetScenarios, users } = useFinanceStore();

  const [showFact, setShowFact]   = useState(true);
  const [showPct,  setShowPct]    = useState(false);
  const [showDiff, setShowDiff]   = useState(false);
  const [hideZeros, setHideZeros] = useState(false);
  const [method,   setMethod]     = useState('Кассовый метод');
  const [period,   setPeriod]     = useState('По месяцам');
  const [metric,   setMetric]     = useState('Показатели прибыли');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [editCell, setEditCell]   = useState<{scenId:string;catId:string;m:number;y:number}|null>(null);
  const [editVal,  setEditVal]    = useState('');

  const scenario = useMemo(() =>
    (budget.scenarioId ? budgetScenarios.find(s => s.id === budget.scenarioId) : undefined)
    ?? budgetScenarios.find(s => s.isApproved)
    ?? budgetScenarios[0],
  [budgetScenarios, budget.scenarioId]);

  const showProfitRows = metric !== 'Без показателей';
  const showMarginRow  = metric === 'Показатели прибыли';

  const incCats = useMemo(() => categories.filter(c => c.type === 'income'), [categories]);
  const expCats = useMemo(() => categories.filter(c => c.type === 'expense' && !c.parentId), [categories]);

  // Map index for O(1) lookup — same pattern as BddsDetail
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
      .filter(t => t.isPaidConfirmed && t.type !== 'transfer')
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

  const groupPlan = (cats: typeof incCats, m: {m:number, y:number}) => cats.reduce((s, c) => s + getPlan(c.id, m.m, m.y), 0);
  const groupFact = (cats: typeof incCats, m: {m:number, y:number}) => cats.reduce((s, c) => s + getFact(c.id, m.m, m.y), 0);
  const yearPlan = (cats: typeof incCats) => allMonthsList.reduce((s,m) => s + groupPlan(cats, m), 0);
  const yearFact = (cats: typeof incCats) => allMonthsList.reduce((s,m) => s + groupFact(cats, m), 0);

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
    background:bg, minWidth:220, maxWidth:220, width:220,
    overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
    boxShadow:'2px 0 4px rgba(0,0,0,0.06)', borderRight:'1px solid var(--border-subtle)',
    ...extra,
  });
  const stickyThStyle = (extra?: React.CSSProperties): React.CSSProperties => ({
    ...thStyle, textAlign:'left', position:'sticky', left:0, zIndex:3,
    minWidth:220, maxWidth:220, width:220,
    boxShadow:'2px 0 4px rgba(0,0,0,0.06)', borderRight:'1px solid var(--border-subtle)',
    ...extra,
  });

  const chk = (checked: boolean, label: string, onChange: ()=>void) => (
    <label style={{display:'flex',alignItems:'center',gap:5,cursor:'pointer',fontSize:12,
      color:checked?'var(--text-primary)':'var(--text-secondary)',fontWeight:checked?500:400}}>
      <input type="checkbox" checked={checked} onChange={onChange}
        style={{accentColor:'var(--color-primary)',width:14,height:14}}/>
      {label}
    </label>
  );

  const selStyle: React.CSSProperties = {
    height:32, padding:'0 28px 0 10px', background:'var(--bg-surface)',
    border:'1px solid var(--border-subtle)', borderRadius:6,
    color:'var(--text-primary)', fontSize:12, outline:'none',
    appearance:'none', cursor:'pointer',
  };

  const renderCells = (
    planVal: number, factVal: number, isPast: boolean,
    isExpense: boolean, catId: string, m: {m:number, y:number}|null, editable: boolean,
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
        {showPct && <td style={{...tdStyle,color:isPast&&factVal>0?(diffGood?'#10b981':'#f59e0b'):'var(--text-muted)'}}>
          {isPast&&factVal>0?fmtPct(planVal,factVal):'—'}
        </td>}
        {showDiff && <td style={{...tdStyle,color:isPast&&factVal>0?(diffGood?'#10b981':'#ef4444'):'var(--text-muted)'}}>
          {isPast&&factVal>0?fmt(factVal-planVal):'—'}
        </td>}
      </React.Fragment>
    );
  };

  const renderGroupRow = (id: string, title: string, cats: typeof incCats) => {
    const isColl = collapsed.has(id);
    return (
      <tr style={{background: 'var(--bg-elevated)',borderBottom: '1px solid var(--border-subtle)'}}>
        <td onClick={()=>toggleCollapse(id)} style={stickyNameStyle('var(--bg-surface)',{cursor:'pointer',fontWeight:600,color:'var(--text-primary)'})}>
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            <ChevDown size={14} style={{transform:isColl?'rotate(-90deg)':'none',transition:'0.2s',color:'var(--text-muted)'}}/>
            {title}
          </div>
        </td>
        <td style={{...tdStyle,fontWeight:700,color:'var(--text-primary)'}}>{fmt(yearPlan(cats))}</td>
        {showFact&&<td style={{...tdStyle,fontWeight:700,color:'var(--text-primary)'}}>{fmt(yearFact(cats))}</td>}
        {showPct&&<td style={{...tdStyle,fontWeight:700,color:'var(--text-primary)'}}>{fmtPct(yearPlan(cats),yearFact(cats))}</td>}
        {showDiff&&<td style={{...tdStyle,fontWeight:700,color:'var(--text-primary)'}}>{fmt(yearFact(cats)-yearPlan(cats))}</td>}
        
        {columns.map(col => {
          const colPp = col.months.reduce((s,m) => s + groupPlan(cats, m), 0);
          const colPf = col.months.reduce((s,m) => s + groupFact(cats, m), 0);
          const isPast = col.months.some(m => m.y < CURRENT_YEAR || (m.y === CURRENT_YEAR && m.m <= CURRENT_MONTH));
          return <React.Fragment key={col.label}>
            <td style={{...tdStyle,fontWeight:700,color:'var(--text-muted)'}}>{fmt(colPp)}</td>
            {showFact&&<td style={{...tdStyle,fontWeight:700,color:'var(--text-muted)'}}>{isPast?fmt(colPf):'—'}</td>}
            {showPct&&<td style={{...tdStyle,fontWeight:700,color:'var(--text-muted)'}}>{isPast?fmtPct(colPp,colPf):'—'}</td>}
            {showDiff&&<td style={{...tdStyle,fontWeight:700,color:'var(--text-muted)'}}>{isPast?fmt(colPf-colPp):'—'}</td>}
          </React.Fragment>;
        })}
      </tr>
    );
  };

  const renderCatRow = (id: string, name: string, isExpense: boolean) => {
    const pYear = allMonthsList.reduce((s,m) => s + getPlan(id, m.m, m.y), 0);
    const fYear = allMonthsList.reduce((s,m) => s + getFact(id, m.m, m.y), 0);
    return (
      <tr key={id} style={{borderBottom:'1px solid var(--border-subtle)',background:'var(--bg-base)'}}
        onMouseEnter={e=>e.currentTarget.style.background='var(--bg-hover)'}
        onMouseLeave={e=>e.currentTarget.style.background='var(--bg-base)'}>
        <td style={stickyNameStyle('inherit',{paddingLeft:32,color:'var(--text-secondary)'})}>
          <span style={{color:'var(--text-muted)',marginRight:6}}>—</span> {name}
        </td>
        <td style={{...tdStyle,color:isExpense?'#ef4444':'#10b981'}}>{fmt(pYear)}</td>
        {showFact&&<td style={{...tdStyle,color:isExpense?'#fca5a5':'#6ee7b7'}}>{fmt(fYear)}</td>}
        {showPct&&<td style={{...tdStyle,color:isExpense?'#fcd34d':'#6ee7b7'}}>{fmtPct(pYear,fYear)}</td>}
        {showDiff&&<td style={{...tdStyle,color:isExpense?'#fca5a5':'#6ee7b7'}}>{fmt(fYear-pYear)}</td>}

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

  const renderTotalRow = (title: string, cats: typeof incCats, isExpense: boolean, colBase: string, colMuted: string) => {
    return (
      <tr style={{background:isExpense?'rgba(239,68,68,0.05)':'rgba(16,185,129,0.05)',borderBottom:'1px solid var(--border-subtle)'}}>
        <td style={stickyNameStyle('var(--bg-surface)',{fontWeight:600,color:colBase,paddingLeft:16})}>{title}</td>
        <td style={{...tdStyle,fontWeight:700,color:colBase}}>{fmt(yearPlan(cats))}</td>
        {showFact&&<td style={{...tdStyle,fontWeight:700,color:colBase}}>{fmt(yearFact(cats))}</td>}
        {showPct&&<td style={{...tdStyle,fontWeight:700,color:colBase}}>{fmtPct(yearPlan(cats),yearFact(cats))}</td>}
        {showDiff&&<td style={{...tdStyle,fontWeight:700,color:colBase}}>{fmt(yearFact(cats)-yearPlan(cats))}</td>}
        
        {columns.map(col => {
          const cp = col.months.reduce((s,m) => s + groupPlan(cats, m), 0);
          const cf = col.months.reduce((s,m) => s + groupFact(cats, m), 0);
          const isPast = col.months.some(m => m.y < CURRENT_YEAR || (m.y === CURRENT_YEAR && m.m <= CURRENT_MONTH));
          return <React.Fragment key={col.label}>
            <td style={{...tdStyle,fontWeight:700,color:colBase}}>{fmt(cp)}</td>
            {showFact&&<td style={{...tdStyle,fontWeight:700,color:colMuted}}>{isPast?fmt(cf):'—'}</td>}
            {showPct&&<td style={{...tdStyle,fontWeight:700,color:colMuted}}>{isPast?fmtPct(cp,cf):'—'}</td>}
            {showDiff&&<td style={{...tdStyle,fontWeight:700,color:colMuted}}>{isPast?fmt(cf-cp):'—'}</td>}
          </React.Fragment>;
        })}
      </tr>
    );
  };

  const renderProfitRows = (withMargin: boolean) => {
    const ypInc = yearPlan(incCats); const yfInc = yearFact(incCats);
    const ypExp = yearPlan(expCats); const yfExp = yearFact(expCats);
    const ypNet = ypInc - ypExp;     const yfNet = yfInc - yfExp;
    
    return (
      <>
        <tr style={{background: 'var(--bg-elevated)',borderBottom:'1px solid var(--border-subtle)'}}>
          <td style={stickyNameStyle('var(--bg-surface)',{fontWeight:600,color:'var(--text-primary)',paddingLeft:16})}>ЧИСТАЯ ПРИБЫЛЬ</td>
          <td style={{...tdStyle,fontWeight:700,color:'var(--text-primary)'}}>{fmt(ypNet)}</td>
          {showFact&&<td style={{...tdStyle,fontWeight:700,color:'var(--text-primary)'}}>{fmt(yfNet)}</td>}
          {showPct&&<td style={{...tdStyle,fontWeight:700,color:'var(--text-primary)'}}>{fmtPct(ypNet,yfNet)}</td>}
          {showDiff&&<td style={{...tdStyle,fontWeight:700,color:'var(--text-primary)'}}>{fmt(yfNet-ypNet)}</td>}
          
          {columns.map(col => {
            const cp = col.months.reduce((s,m) => s + groupPlan(incCats,m) - groupPlan(expCats,m), 0);
            const cf = col.months.reduce((s,m) => s + groupFact(incCats,m) - groupFact(expCats,m), 0);
            const isPast = col.months.some(m => m.y < CURRENT_YEAR || (m.y === CURRENT_YEAR && m.m <= CURRENT_MONTH));
            return <React.Fragment key={col.label}>
              <td style={{...tdStyle,fontWeight:700,color:'var(--text-primary)'}}>{fmt(cp)}</td>
              {showFact&&<td style={{...tdStyle,fontWeight:700,color:'var(--text-muted)'}}>{isPast?fmt(cf):'—'}</td>}
              {showPct&&<td style={{...tdStyle,fontWeight:700,color:'var(--text-muted)'}}>{isPast?fmtPct(cp,cf):'—'}</td>}
              {showDiff&&<td style={{...tdStyle,fontWeight:700,color:'var(--text-muted)'}}>{isPast?fmt(cf-cp):'—'}</td>}
            </React.Fragment>;
          })}
        </tr>
        {withMargin && (
          <tr style={{background:'var(--bg-hover)',borderBottom:'1px solid var(--border-subtle)'}}>
            <td style={stickyNameStyle('var(--bg-surface)',{fontWeight:600,color:'var(--text-secondary)',paddingLeft:16})}>Рентабельность %</td>
            <td style={{...tdStyle,fontWeight:700,color:'var(--text-secondary)'}}>{fmtPct(ypInc,ypNet)}</td>
            {showFact&&<td style={{...tdStyle,fontWeight:700,color:'var(--text-secondary)'}}>{fmtPct(yfInc,yfNet)}</td>}
            {showPct&&<td style={{...tdStyle,fontWeight:700,color:'var(--text-secondary)'}}>—</td>}
            {showDiff&&<td style={{...tdStyle,fontWeight:700,color:'var(--text-secondary)'}}>—</td>}
            
            {columns.map(col => {
              const cpI = col.months.reduce((s,m) => s + groupPlan(incCats,m), 0);
              const cpN = col.months.reduce((s,m) => s + groupPlan(incCats,m) - groupPlan(expCats,m), 0);
              const cfI = col.months.reduce((s,m) => s + groupFact(incCats,m), 0);
              const cfN = col.months.reduce((s,m) => s + groupFact(incCats,m) - groupFact(expCats,m), 0);
              const isPast = col.months.some(m => m.y < CURRENT_YEAR || (m.y === CURRENT_YEAR && m.m <= CURRENT_MONTH));
              return <React.Fragment key={col.label}>
                <td style={{...tdStyle,fontWeight:700,color:'var(--text-secondary)'}}>{fmtPct(cpI,cpN)}</td>
                {showFact&&<td style={{...tdStyle,fontWeight:700,color:'var(--text-muted)'}}>{isPast?fmtPct(cfI,cfN):'—'}</td>}
                {showPct&&<td style={{...tdStyle,fontWeight:700,color:'var(--text-muted)'}}>—</td>}
                {showDiff&&<td style={{...tdStyle,fontWeight:700,color:'var(--text-muted)'}}>—</td>}
              </React.Fragment>;
            })}
          </tr>
        )}
      </>
    );
  };

  const currentUser  = users.find(u => u.role === 'Владелец') ?? users[0];
  const authorName   = currentUser?.name ?? '—';
  let colsPerMonth = 1;
  if(showFact) colsPerMonth++; if(showPct) colsPerMonth++; if(showDiff) colsPerMonth++;

  const exportXls = useCallback(() => {
    const header = ['Название', 'Итого План', 'Итого Факт', ...allMonthsList.map(m => `${MONTHS_SHORT[m.m]} '${String(m.y).slice(2)} План`), ...allMonthsList.map(m => `${MONTHS_SHORT[m.m]} '${String(m.y).slice(2)} Факт`)];
    const rows: string[][] = [header];
    const addRow = (name: string, getPlanFn: (m:{m:number,y:number})=>number, getFactFn: (m:{m:number,y:number})=>number) => {
      rows.push([name,
        String(allMonthsList.reduce((s,m)=>s+getPlanFn(m),0)),
        String(allMonthsList.reduce((s,m)=>s+getFactFn(m),0)),
        ...allMonthsList.map(m=>String(getPlanFn(m))),
        ...allMonthsList.map(m=>String(getFactFn(m))),
      ]);
    };
    rows.push(['ДОХОДЫ','','', ...Array(allMonthsList.length*2).fill('')]);
    incCats.forEach(c => addRow(`  ${c.name}`, m=>getPlan(c.id,m.m,m.y), m=>getFact(c.id,m.m,m.y)));
    addRow('ИТОГО ДОХОДОВ', m=>groupPlan(incCats,m), m=>groupFact(incCats,m));
    rows.push(['РАСХОДЫ','','', ...Array(allMonthsList.length*2).fill('')]);
    expCats.forEach(c => addRow(`  ${c.name}`, m=>getPlan(c.id,m.m,m.y), m=>getFact(c.id,m.m,m.y)));
    addRow('ИТОГО РАСХОДОВ', m=>groupPlan(expCats,m), m=>groupFact(expCats,m));
    addRow('ЧИСТАЯ ПРИБЫЛЬ', m=>groupPlan(incCats,m)-groupPlan(expCats,m), m=>groupFact(incCats,m)-groupFact(expCats,m));

    const csv = rows.map(r => r.map(c => `"${c}"`).join(';')).join('\n');
    const blob = new Blob(['\uFEFF'+csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${budget.name.replace(/\s+/g,'_')}.xls`; a.click();
    URL.revokeObjectURL(url);
  }, [incCats, expCats, budget.name, allMonthsList]);

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden',background:'var(--bg-base)'}}>
      <div style={{padding:'12px 32px 0',fontSize:12}}>
        <button onClick={onBack}
          style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',fontSize:12,display:'flex',alignItems:'center',gap:5,padding:0}}
          onMouseEnter={e=>(e.currentTarget as HTMLElement).style.color='var(--color-primary)'}
          onMouseLeave={e=>(e.currentTarget as HTMLElement).style.color='var(--text-muted)'}>
          <ArrowLeft size={13}/> Список бюджетов
        </button>
      </div>

      <div style={{padding:'10px 32px 0',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <span style={{margin:0,fontSize: 15,fontWeight:700,color:'var(--text-primary)'}}>{budget.name}</span>
          {[budget.type, fmtPeriod(budget.periodStart, budget.periodEnd), budget.currency].map(tag=>(
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
        {[{v:period, s:setPeriod, opts:['По месяцам','По кварталам','По годам']},
          {v:method, s:setMethod, opts:['Кассовый метод','Метод начисления']},
          {v:metric, s:setMetric, opts:['Показатели прибыли','Прибыль до налогов','Валовая прибыль','Без показателей']},
        ].map(({v,s,opts})=>(
          <div key={v} style={{position:'relative'}}>
            <select value={v} onChange={e=>(s as (v:string)=>void)(e.target.value)} style={selStyle}>
              {opts.map(o=><option key={o}>{o}</option>)}
            </select>
            <ChevDown size={13} style={{position:'absolute',right:8,top:'50%',transform:'translateY(-50%)',pointerEvents:'none',color:'var(--text-muted)'}}/>
          </div>
        ))}
        <div style={{width:1,height:20,background:'var(--border-subtle)',margin:'0 4px'}}/>
        {chk(showFact,'Факт',()=>setShowFact(v=>!v))}
        {chk(showPct,'Вып. плана, %',()=>setShowPct(v=>!v))}
        {chk(showDiff,'Откл.',()=>setShowDiff(v=>!v))}
        <div style={{width:1,height:20,background:'var(--border-subtle)',margin:'0 4px'}}/>
        {chk(hideZeros,'Спрятать нулевые',()=>setHideZeros(v=>!v))}
        <span style={{marginLeft:'auto',fontSize:11,color:'var(--text-muted)'}}>
          Автор: {authorName} · Сценарий: {scenario?.name ?? '—'}
        </span>
      </div>

      <div style={{flex:1,overflowX:'auto',overflowY:'auto'}}>
        <table style={{borderCollapse:'collapse',minWidth:800,width:'max-content'}}>
          <colgroup>
            <col style={{width:220}}/>
            <col style={{width:100}}/>{showFact&&<col style={{width:90}}/>}{showPct&&<col style={{width:80}}/>}{showDiff&&<col style={{width:80}}/>}
            {columns.map(col=><React.Fragment key={col.label}>
              <col style={{width:90}}/>{showFact&&<col style={{width:80}}/>}{showPct&&<col style={{width:70}}/>}{showDiff&&<col style={{width:70}}/>}
            </React.Fragment>)}
          </colgroup>
          <thead>
            <tr style={{background:'var(--bg-surface)'}}>
              <th style={stickyThStyle()}>Все юрлица</th>
              <th colSpan={colsPerMonth} style={{...thStyle,borderLeft:'1px solid var(--border-subtle)'}}>Итого</th>
              {columns.map(col=>(
                <th key={col.label} colSpan={colsPerMonth} style={{...thStyle,borderLeft:'1px solid var(--border-subtle)',
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
                  {showPct&&<th style={{...thStyle,fontSize:10,color:'#fcd34d'}}>Вып.%</th>}
                  {showDiff&&<th style={{...thStyle,fontSize:10,color:'#ef4444'}}>Откл.</th>}
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {renderGroupRow('grp_inc','Доходы',incCats)}
            {!collapsed.has('grp_inc') && incCats.filter(c=>isCatVisible(c.id)).map(c=>renderCatRow(c.id,c.name,false))}
            {renderTotalRow('Итого доходов',incCats,false,'#10b981','#6ee7b7')}
            {renderGroupRow('grp_exp','Расходы',expCats)}
            {!collapsed.has('grp_exp') && expCats.filter(c=>isCatVisible(c.id)).map(c=>renderCatRow(c.id,c.name,true))}
            {renderTotalRow('Итого расходов',expCats,true,'#ef4444','#fca5a5')}
            {showProfitRows && renderProfitRows(showMarginRow)}
          </tbody>
        </table>
      </div>
    </div>
  );
};
