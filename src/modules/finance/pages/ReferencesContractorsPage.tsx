import React, { useState, useMemo } from 'react';
import { useFinanceStore } from '../financeStore';
import { Download, Plus, Building2, User, Briefcase, Landmark, Edit2, Trash2, X, Filter, Phone, Mail, CreditCard, FileText, TrendingUp } from 'lucide-react';
import type { Contractor } from '../financeStore';
import { APP_CURRENCY_SYMBOL } from '../config/currency';
import { exportToCSV } from '../utils/exportData';

const LEGAL_FORMS = ['МЧЖ','АЖ','ЯТТ','ДК','ХК','ОК','УК','Филиал','Физлицо','Прочее'] as const;
const GROUPS = ['Все','Поставщики','Клиенты','Банки','Гос. органы','Сотрудники'] as const;

const LEGAL_FORM_DESC: Record<string,string> = {
  'МЧЖ':'Масъулияти чекланган жамият (ООО)','АЖ':'Акциядорлик жамияти (АО)',
  'ЯТТ':'Якка тартибли тадбиркор (ИП)','ДК':'Давлат корхонаси (Гос. пред-е)',
  'ХК':'Хусусий корхона (Частное)','ОК':'Оилавий корхона (Семейное)',
  'УК':'Унитар корхона','Филиал':'Филиал иностр. компании',
  'Физлицо':'Физическое лицо','Прочее':'Иное',
};

const FORM_ICON = (lf?: string) => {
  if (!lf || ['МЧЖ','АЖ','ДК','ХК','ОК','УК'].includes(lf)) return <Building2 size={14}/>;
  if (lf === 'Физлицо') return <User size={14}/>;
  if (lf === 'ЯТТ') return <Briefcase size={14}/>;
  return <Landmark size={14}/>;
};

const FORM_COLOR: Record<string,string> = {
  'МЧЖ':'rgba(59,130,246,0.15)','АЖ':'rgba(99,102,241,0.15)','ЯТТ':'rgba(16,185,129,0.15)',
  'ДК':'rgba(245,158,11,0.15)','ХК':'rgba(139,92,246,0.15)','ОК':'rgba(236,72,153,0.15)',
  'УК':'rgba(20,184,166,0.15)','Филиал':'rgba(251,191,36,0.15)',
  'Физлицо':'rgba(16,185,129,0.15)','Прочее':'rgba(107,114,128,0.15)',
};
const FORM_TEXT: Record<string,string> = {
  'МЧЖ':'#3b82f6','АЖ':'#6366f1','ЯТТ':'#10b981','ДК':'#f59e0b',
  'ХК':'#8b5cf6','ОК':'#ec4899','УК':'#14b8a6','Филиал':'#fbbf24',
  'Физлицо':'#10b981','Прочее':'#6b7280',
};

const fmt = (n: number) => new Intl.NumberFormat('ru-RU').format(n);
const EMPTY: Partial<Contractor> = {
  name:'',shortName:'',legalForm:'МЧЖ',group:'Поставщики',
  inn:'',nds:false,okved:'',bankName:'',bankMfo:'',bankAccount:'',
  legalAddress:'',actualAddress:'',phone:'',email:'',contactPerson:'',comment:'',
};

const ReferencesContractorsPage: React.FC = () => {
  const { contractors, addContractor, updateContractor, deleteContractor, transactions, deals } = useFinanceStore();

  const [activeGroup, setActiveGroup] = useState('Все');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalTab, setModalTab] = useState(0);
  const [form, setForm] = useState<Partial<Contractor>>(EMPTY);
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  React.useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'f' && !['INPUT','TEXTAREA','SELECT'].includes((e.target as HTMLElement).tagName))
        setSidebarOpen(p => !p);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const turnoverMap = useMemo(() => {
    const m = new Map<string,{income:number;expense:number}>();
    transactions.filter(t => t.isPaidConfirmed && t.contractorId).forEach(t => {
      const cur = m.get(t.contractorId!) || {income:0,expense:0};
      if (t.type === 'income') cur.income += (t.baseAmount ?? t.amount);
      if (t.type === 'expense') cur.expense += (t.baseAmount ?? t.amount);
      m.set(t.contractorId!, cur);
    });
    return m;
  }, [transactions]);

  const debtMap = useMemo(() => {
    const m = new Map<string, number>();
    deals.filter(d => d.contractorId).forEach(d => {
      let debt = m.get(d.contractorId) || 0;
      if (d.type === 'sale') {
         debt += (d.shippedAmount || 0) - (d.paidAmount || 0);
      } else if (d.type === 'purchase') {
         debt += (d.paidAmount || 0) - (d.shippedAmount || 0);
      }
      m.set(d.contractorId, debt);
    });
    return m;
  }, [deals]);

  const filtered = useMemo(() => contractors.filter(c => {
    return activeGroup === 'Все' || c.group === activeGroup;
  }), [contractors, activeGroup]);

  const selected = selectedId ? contractors.find(c => c.id === selectedId) ?? null : null;
  const selT = selected ? (turnoverMap.get(selected.id) || {income:0,expense:0}) : null;

  const openAdd = () => { setForm(EMPTY); setEditingId(null); setModalTab(0); setIsModalOpen(true); };
  const openEdit = (c: Contractor) => { setForm({...c}); setEditingId(c.id); setModalTab(0); setIsModalOpen(true); };
  const closeModal = () => { setIsModalOpen(false); setEditingId(null); };
  const handleSave = () => {
    if (!form.name) return;
    if (editingId) updateContractor(editingId, form); else addContractor(form);
    closeModal();
  };
  const handleDelete = (id: string, name: string) => {
    if (!window.confirm(`Удалить контрагента "${name}"? Это действие необратимо.`)) return;
    deleteContractor(id); if (selectedId === id) setSelectedId(null);
  };
  const exportCSV = () => {
    const headers = ['Наименование','ОПФ','Группа','ИНН','Телефон','Email','Доход','Расход','Баланс'];
    const rows = filtered.map(c => { 
      const t = turnoverMap.get(c.id)||{income:0,expense:0};
      return [c.name,c.legalForm||'',c.group||'',c.inn||'',c.phone||'',c.email||'',String(t.income),String(t.expense),String(t.income-t.expense)]; 
    });
    exportToCSV('contractors', headers, rows);
  };

  const setF = (k: keyof Contractor, v: any) => setForm(p => ({...p,[k]:v}));
  const sInp: React.CSSProperties = {width:'100%',height:30,padding:'0 8px',borderRadius:6,background:'var(--bg-elevated)',border:'1px solid var(--border-default)',color:'var(--text-primary)',fontSize:12,outline:'none'};
  const sLbl: React.CSSProperties = {display:'block' as const,fontSize:10,fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase' as const,letterSpacing:'0.06em',marginBottom:4};

  return (
    <div style={{display:'flex',height:'100%',overflow:'hidden',background:'var(--bg-base)'}}>

      {/* GROUP SIDEBAR */}
      {isSidebarOpen && (
        <div style={{width:180,flexShrink:0,borderRight:'1px solid var(--border-subtle)',background:'var(--bg-surface)',display:'flex',flexDirection:'column'}}>
          <div style={{height:44,padding:'0 16px',borderBottom:'1px solid var(--border-subtle)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div style={{display:'flex',alignItems:'center',gap:6}}>
              <Filter size={12} color="var(--text-muted)"/>
              <span style={{fontSize:12,fontWeight:600,color:'var(--text-primary)'}}>Группы</span>
            </div>
            <button onClick={()=>setSidebarOpen(false)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)'}}>✕</button>
          </div>
          <div style={{flex:1,padding:'8px',overflowY:'auto'}}>
            {GROUPS.map(g => {
              const cnt = contractors.filter(c => g==='Все'||c.group===g).length;
              const active = activeGroup===g;
              return (
                <div key={g} onClick={()=>setActiveGroup(g)} style={{
                  padding:'6px 10px',borderRadius:6,cursor:'pointer',marginBottom:2,
                  background:active?'var(--bg-hover)':'transparent',
                  color:active?'var(--color-primary)':'var(--text-secondary)',
                  fontWeight:active?600:400,fontSize:13,display:'flex',alignItems:'center',
                  transition:'all 160ms',
                }}
                  onMouseEnter={e=>{if(!active)e.currentTarget.style.background='var(--bg-hover)';}}
                  onMouseLeave={e=>{if(!active)e.currentTarget.style.background='transparent';}}>
                  {g}
                  <span style={{marginLeft:'auto',fontSize:11,color:'var(--text-muted)'}}>{cnt}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MAIN AREA */}
      <div style={{flex:1,display:'flex',flexDirection:'column',minWidth:0}}>

        {/* HEADER 44px */}
        <div style={{height:44,padding:'0 16px',borderBottom:'1px solid var(--border-subtle)',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0,background:'var(--bg-surface)'}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <button onClick={()=>setSidebarOpen(!isSidebarOpen)} style={{background:isSidebarOpen?'var(--bg-card)':'transparent',border:'1px solid var(--border-subtle)',borderRadius:6,width:26,height:26,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'var(--text-secondary)'}}>
              <Filter size={12}/>
            </button>
            <span style={{margin:0,fontSize:14,fontWeight:600,color:'var(--text-primary)', whiteSpace: 'nowrap' }}>Контрагенты</span>
            <span style={{fontSize:11,color:'var(--text-muted)',background:'var(--bg-elevated)',border:'1px solid var(--border-subtle)',padding:'1px 6px',borderRadius:4}}>{filtered.length}</span>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button onClick={exportCSV} style={{display:'flex',alignItems:'center',gap:4,padding:'0 10px',height:28,background:'var(--bg-elevated)',border:'1px solid var(--border-default)',borderRadius:6,fontSize:12,color:'var(--text-secondary)',cursor:'pointer'}}>
              <Download size={12}/> CSV
            </button>
            <button onClick={openAdd} style={{display:'flex',alignItems:'center',gap:4,padding:'0 12px',height:28,background:'var(--color-primary)',border:'none',borderRadius:6,fontSize:12,fontWeight:600,color:'#fff',cursor:'pointer'}}>
              <Plus size={11}/> Добавить
            </button>
          </div>
        </div>

        {/* SPLIT CONTENT */}
        <div style={{flex:1,display:'flex',overflow:'hidden'}}>

          {/* CONTRACTOR LIST */}
          <div style={{width:310,flexShrink:0,borderRight:'1px solid var(--border-subtle)',overflowY:'auto',background:'var(--bg-surface)'}}>
            {filtered.length === 0 ? (
              <div style={{padding:32,textAlign:'center',color:'var(--text-muted)',fontSize:13}}>Нет контрагентов</div>
            ) : filtered.map(c => {
              const debt = debtMap.get(c.id) || 0;
              const active = selectedId === c.id;
              return (
                <div key={c.id} onClick={()=>setSelectedId(c.id)} style={{
                  padding:'10px 14px',cursor:'pointer',
                  borderBottom:'1px solid var(--border-subtle)',
                  background:active?'var(--bg-hover)':'transparent',
                  borderLeft:`2px solid ${active?'var(--color-primary)':'transparent'}`,
                  transition:'all 160ms',
                }}
                  onMouseEnter={e=>{if(!active)e.currentTarget.style.background='var(--bg-hover)';}}
                  onMouseLeave={e=>{if(!active)e.currentTarget.style.background='transparent';}}>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <div style={{width:30,height:30,borderRadius: 8,flexShrink:0,
                      background:FORM_COLOR[c.legalForm||'']||'rgba(107,114,128,0.15)',
                      color:FORM_TEXT[c.legalForm||'']||'#6b7280',
                      display:'flex',alignItems:'center',justifyContent:'center'}}>
                      {FORM_ICON(c.legalForm)}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:600,color:'var(--text-primary)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                        {c.shortName || c.name}
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:6,marginTop:2}}>
                        {c.legalForm && <span style={{fontSize:10,fontWeight:700,color:FORM_TEXT[c.legalForm]||'#6b7280',background:FORM_COLOR[c.legalForm]||'rgba(107,114,128,0.15)',padding:'1px 5px',borderRadius: 4}}>{c.legalForm}</span>}
                        {c.inn && <span style={{fontSize:10,color:'var(--text-muted)'}}>ИНН {c.inn}</span>}
                        {c.nds && <span style={{fontSize:10,color:'#10b981',fontWeight:600}}>НДС</span>}
                      </div>
                    </div>
                    <div style={{textAlign:'right',flexShrink:0}}>
                      <div style={{fontSize:12,fontWeight:600,color:debt>0?'#10b981':debt<0?'#ef4444':'var(--text-muted)'}} title={debt>0?'Нам должны (Дебиторка)':debt<0?'Мы должны (Кредиторка)':'Нет долгов'}>
                        {debt!==0 ? `${debt>0?'+':''}${fmt(debt)} ${APP_CURRENCY_SYMBOL}` : '—'}
                      </div>
                      <div style={{fontSize:10,color:'var(--text-muted)'}}>{c.group || 'Долг'}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* DETAIL PANEL */}
          {selected ? (
            <div style={{flex:1,overflowY:'auto',padding:24}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20}}>
                <div>
                  <div style={{fontSize:11,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:4}}>Карточка контрагента</div>
                  <h2 style={{margin:0,fontSize:18,fontWeight:700,color:'var(--text-primary)'}}>{selected.shortName||selected.name}</h2>
                  {selected.shortName && <div style={{fontSize:13,color:'var(--text-secondary)',marginTop:2}}>{selected.name}</div>}
                  <div style={{display:'flex',gap:8,marginTop:8,flexWrap:'wrap'}}>
                    {selected.legalForm && <span style={{fontSize:11,fontWeight:700,color:FORM_TEXT[selected.legalForm],background:FORM_COLOR[selected.legalForm],padding:'2px 8px',borderRadius:4}}>{selected.legalForm} — {LEGAL_FORM_DESC[selected.legalForm]}</span>}
                    {selected.group && <span style={{fontSize:11,color:'var(--text-secondary)',background:'var(--bg-elevated)',border:'1px solid var(--border-subtle)',padding:'2px 8px',borderRadius:4}}>{selected.group}</span>}
                    {selected.nds && <span style={{fontSize:11,fontWeight:600,color:'#10b981',background:'rgba(16,185,129,0.1)',border:'1px solid rgba(16,185,129,0.2)',padding:'2px 8px',borderRadius:4}}>✓ Плательщик НДС</span>}
                  </div>
                </div>
                <div style={{display:'flex',gap:6}}>
                  <button onClick={()=>openEdit(selected)} style={{display:'flex',alignItems:'center',gap:5,padding:'0 12px',height:30,background:'var(--bg-elevated)',border:'1px solid var(--border-default)',borderRadius:6,fontSize:12,color:'var(--text-secondary)',cursor:'pointer'}}>
                    <Edit2 size={12}/> Изменить
                  </button>
                  <button onClick={()=>handleDelete(selected.id, selected.name)} style={{display:'flex',alignItems:'center',gap:5,padding:'0 12px',height:30,background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:6,fontSize:12,color:'#ef4444',cursor:'pointer'}}>
                    <Trash2 size={12}/> Удалить
                  </button>
                </div>
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                {/* Реквизиты */}
                <div style={{background: 'var(--bg-elevated)',border:'1px solid var(--border-subtle)',borderRadius:10,padding:16}}>
                  <div style={{fontSize:11,fontWeight:700,color:'var(--text-secondary)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:12,display:'flex',alignItems:'center',gap:6}}>
                    <FileText size={13}/> Регистрация
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:10}}>
                    {[{l:'ИНН / ПИНФЛ',v:selected.inn},{l:'ОКЭД',v:selected.okved}].map(({l,v}) => (
                      <React.Fragment key={l}>
                        {v ? (<div>
                          <div style={{fontSize:10,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.05em'}}>{l}</div>
                          <div style={{fontSize:13,color:'var(--text-primary)',marginTop:2,fontFamily:'monospace'}}>{v}</div>
                        </div>) : null}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* Банк */}
                <div style={{background: 'var(--bg-elevated)',border:'1px solid var(--border-subtle)',borderRadius:10,padding:16}}>
                  <div style={{fontSize:11,fontWeight:700,color:'var(--text-secondary)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:12,display:'flex',alignItems:'center',gap:6}}>
                    <CreditCard size={13}/> Банковские реквизиты
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:10}}>
                    {[{l:'Банк',v:selected.bankName},{l:'МФО',v:selected.bankMfo},{l:'Расчётный счёт',v:selected.bankAccount}].map(({l,v}) => (
                      <React.Fragment key={l}>
                        {v ? (<div>
                          <div style={{fontSize:10,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.05em'}}>{l}</div>
                          <div style={{fontSize:13,color:'var(--text-primary)',marginTop:2,fontFamily:l!=='Банк'?'monospace':'inherit'}}>{v}</div>
                        </div>) : null}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* Контакты */}
                <div style={{background: 'var(--bg-elevated)',border:'1px solid var(--border-subtle)',borderRadius:10,padding:16}}>
                  <div style={{fontSize:11,fontWeight:700,color:'var(--text-secondary)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:12,display:'flex',alignItems:'center',gap:6}}>
                    <Phone size={13}/> Контакты
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:10}}>
                    {selected.contactPerson && <div>
                      <div style={{fontSize:10,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.05em'}}>Контактное лицо</div>
                      <div style={{fontSize:13,color:'var(--text-primary)',marginTop:2}}>{selected.contactPerson}</div>
                    </div>}
                    {selected.phone && <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <Phone size={12} color="var(--text-muted)"/>
                      <span style={{fontSize:13,color:'var(--text-primary)'}}>{selected.phone}</span>
                    </div>}
                    {selected.email && <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <Mail size={12} color="var(--text-muted)"/>
                      <span style={{fontSize:13,color:'var(--text-primary)'}}>{selected.email}</span>
                    </div>}
                    {selected.legalAddress && <div>
                      <div style={{fontSize:10,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.05em'}}>Юридический адрес</div>
                      <div style={{fontSize:12,color:'var(--text-secondary)',marginTop:2}}>{selected.legalAddress}</div>
                    </div>}
                  </div>
                </div>

                {/* Взаиморасчеты */}
                <div style={{background: 'var(--bg-elevated)',border:'1px solid var(--border-subtle)',borderRadius:10,padding:16}}>
                  <div style={{fontSize:11,fontWeight:700,color:'var(--text-secondary)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:12,display:'flex',alignItems:'center',gap:6}}>
                    <Briefcase size={13}/> Взаиморасчеты (Сальдо)
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:10}}>
                    {(() => {
                      const debt = debtMap.get(selected.id) || 0;
                      if (debt === 0) return <div style={{fontSize:13,color:'var(--text-muted)'}}>Нет активных задолженностей по сделкам.</div>;
                      return (
                        <div style={{paddingTop:4}}>
                          <div style={{fontSize:10,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.05em'}}>Текущий долг</div>
                          <div style={{fontSize:18,fontWeight:700,color:debt>0?'#10b981':'#ef4444',marginTop:4}}>
                            {fmt(Math.abs(debt))} {APP_CURRENCY_SYMBOL}
                          </div>
                          <div style={{fontSize:12,color:debt>0?'#10b981':'#ef4444',marginTop:2}}>
                            {debt>0 ? 'Контрагент должен нам (Дебиторка)' : 'Мы должны контрагенту (Кредиторка)'}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Оборот */}
                <div style={{background: 'var(--bg-elevated)',border:'1px solid var(--border-subtle)',borderRadius:10,padding:16}}>
                  <div style={{fontSize:11,fontWeight:700,color:'var(--text-secondary)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:12,display:'flex',alignItems:'center',gap:6}}>
                    <TrendingUp size={13}/> Оборот ДДС (все время)
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:10}}>
                    <div>
                      <div style={{fontSize:10,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.05em'}}>Поступления (Нам)</div>
                      <div style={{fontSize:16,fontWeight:700,color:'#10b981'}}>{fmt(selT?.income||0)} {APP_CURRENCY_SYMBOL}</div>
                    </div>
                    <div>
                      <div style={{fontSize:10,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.05em'}}>Оплаты (От нас)</div>
                      <div style={{fontSize:16,fontWeight:700,color:'#ef4444'}}>{fmt(selT?.expense||0)} {APP_CURRENCY_SYMBOL}</div>
                    </div>
                  </div>
                </div>
              </div>

              {selected.comment && (
                <div style={{marginTop:16,background: 'var(--bg-elevated)',border:'1px solid var(--border-subtle)',borderRadius:10,padding:14}}>
                  <div style={{fontSize:10,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:6}}>Примечание</div>
                  <div style={{fontSize:13,color:'var(--text-secondary)'}}>{selected.comment}</div>
                </div>
              )}
            </div>
          ) : (
            <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:8}}>
              <div style={{fontSize:14,color:'var(--text-muted)'}}>Выберите контрагента из списка</div>
              <div style={{fontSize:12,color:'var(--text-muted)',opacity:0.6}}>Или создайте нового</div>
            </div>
          )}
        </div>
      </div>

      {/* ADD/EDIT MODAL */}
      {isModalOpen && (
        <div style={{position:'fixed',inset:0,zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.5)',backdropFilter:'blur(4px)'}} onClick={closeModal}/>
          <div style={{position:'relative',width:520,maxHeight:'88vh',background:'var(--bg-surface)',borderRadius:12,boxShadow:'var(--shadow-lg)',border:'1px solid var(--border-subtle)',display:'flex',flexDirection:'column',overflow:'hidden'}}>
            <div style={{padding:'14px 20px',borderBottom:'1px solid var(--border-subtle)',display:'flex',justifyContent:'space-between',alignItems:'center',flexShrink:0}}>
              <h2 style={{margin:0,fontSize:14,fontWeight:600,color:'var(--text-primary)'}}>{editingId?'Редактировать контрагента':'Новый контрагент'}</h2>
              <button onClick={closeModal} style={{background:'transparent',border:'none',color:'var(--text-muted)',cursor:'pointer',display:'flex'}}><X size={18}/></button>
            </div>

            {/* TABS */}
            <div style={{display:'flex',borderBottom:'1px solid var(--border-subtle)',background:'var(--bg-base)',flexShrink:0}}>
              {['Основное','Реквизиты','Контакты'].map((tab,i)=>(
                <button key={tab} onClick={()=>setModalTab(i)} style={{
                  padding:'8px 16px',fontSize:12,fontWeight:modalTab===i?600:400,
                  color:modalTab===i?'var(--color-primary)':'var(--text-secondary)',
                  background:'transparent',border:'none',cursor:'pointer',
                  borderBottom:modalTab===i?'2px solid var(--color-primary)':'2px solid transparent',
                  transition:'all 160ms',
                }}>{tab}</button>
              ))}
            </div>

            <div style={{flex:1,overflowY:'auto',padding:20}}>
              {modalTab === 0 && (
                <div style={{display:'flex',flexDirection:'column',gap:14}}>
                  <div>
                    <label style={sLbl}>Полное наименование *</label>
                    <input value={form.name||''} onChange={e=>setF('name',e.target.value)} placeholder="Название организации или ФИО" style={sInp} onFocus={e=>e.target.style.borderColor='var(--color-primary)'} onBlur={e=>e.target.style.borderColor='var(--border-default)'}/>
                  </div>
                  <div>
                    <label style={sLbl}>Краткое наименование</label>
                    <input value={form.shortName||''} onChange={e=>setF('shortName',e.target.value)} placeholder='ООО "Компания" → МЧЖ "Компания"' style={sInp} onFocus={e=>e.target.style.borderColor='var(--color-primary)'} onBlur={e=>e.target.style.borderColor='var(--border-default)'}/>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                    <div>
                      <label style={sLbl}>Форма собственности (ОПФ)</label>
                      <select value={form.legalForm||'МЧЖ'} onChange={e=>setF('legalForm',e.target.value)} style={{...sInp,height:30}}>
                        {LEGAL_FORMS.map(f=><option key={f} value={f}>{f} — {LEGAL_FORM_DESC[f]}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={sLbl}>Группа</label>
                      <select value={form.group||'Поставщики'} onChange={e=>setF('group',e.target.value as any)} style={{...sInp,height:30}}>
                        {GROUPS.filter(g=>g!=='Все').map(g=><option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                  </div>
                  <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:13,color:'var(--text-primary)'}}>
                    <input type="checkbox" checked={!!form.nds} onChange={e=>setF('nds',e.target.checked)} style={{accentColor:'#10b981',width:14,height:14}}/>
                    Плательщик НДС
                  </label>
                </div>
              )}

              {modalTab === 1 && (
                <div style={{display:'flex',flexDirection:'column',gap:14}}>
                  <div>
                    <label style={sLbl}>ИНН (9 цифр) / ПИНФЛ (14 цифр)</label>
                    <input value={form.inn||''} onChange={e=>setF('inn',e.target.value)} placeholder="123456789" style={{...sInp,fontFamily:'monospace'}} onFocus={e=>e.target.style.borderColor='var(--color-primary)'} onBlur={e=>e.target.style.borderColor='var(--border-default)'}/>
                    <div style={{fontSize:10,color:'var(--text-muted)',marginTop:3}}>Юрлица и ИП — 9 цифр · Физические лица — 14 цифр (ПИНФЛ)</div>
                  </div>
                  <div>
                    <label style={sLbl}>ОКЭД (вид деятельности)</label>
                    <input value={form.okved||''} onChange={e=>setF('okved',e.target.value)} placeholder="62010 — Разработка программного обеспечения" style={sInp} onFocus={e=>e.target.style.borderColor='var(--color-primary)'} onBlur={e=>e.target.style.borderColor='var(--border-default)'}/>
                  </div>
                  <div style={{paddingTop:8,borderTop:'1px solid var(--border-subtle)'}}>
                    <div style={{fontSize:11,fontWeight:700,color:'var(--text-secondary)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:12}}>Банковские реквизиты</div>
                    <div style={{display:'flex',flexDirection:'column',gap:12}}>
                      <div>
                        <label style={sLbl}>Банк</label>
                        <input value={form.bankName||''} onChange={e=>setF('bankName',e.target.value)} placeholder='АКИБ "Ипотека-банк"' style={sInp} onFocus={e=>e.target.style.borderColor='var(--color-primary)'} onBlur={e=>e.target.style.borderColor='var(--border-default)'}/>
                      </div>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 2fr',gap:10}}>
                        <div>
                          <label style={sLbl}>МФО (5 цифр)</label>
                          <input value={form.bankMfo||''} onChange={e=>setF('bankMfo',e.target.value)} placeholder="00000" maxLength={5} style={{...sInp,fontFamily:'monospace'}} onFocus={e=>e.target.style.borderColor='var(--color-primary)'} onBlur={e=>e.target.style.borderColor='var(--border-default)'}/>
                        </div>
                        <div>
                          <label style={sLbl}>Расчётный счёт (20 цифр)</label>
                          <input value={form.bankAccount||''} onChange={e=>setF('bankAccount',e.target.value)} placeholder="20208000000000000000" maxLength={20} style={{...sInp,fontFamily:'monospace'}} onFocus={e=>e.target.style.borderColor='var(--color-primary)'} onBlur={e=>e.target.style.borderColor='var(--border-default)'}/>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {modalTab === 2 && (
                <div style={{display:'flex',flexDirection:'column',gap:14}}>
                  <div>
                    <label style={sLbl}>Контактное лицо (ФИО директора / менеджера)</label>
                    <input value={form.contactPerson||''} onChange={e=>setF('contactPerson',e.target.value)} placeholder="Иванов Иван Иванович" style={sInp} onFocus={e=>e.target.style.borderColor='var(--color-primary)'} onBlur={e=>e.target.style.borderColor='var(--border-default)'}/>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                    <div>
                      <label style={sLbl}>Телефон</label>
                      <input value={form.phone||''} onChange={e=>setF('phone',e.target.value)} placeholder="+998 90 000 00 00" style={sInp} onFocus={e=>e.target.style.borderColor='var(--color-primary)'} onBlur={e=>e.target.style.borderColor='var(--border-default)'}/>
                    </div>
                    <div>
                      <label style={sLbl}>Email</label>
                      <input type="email" value={form.email||''} onChange={e=>setF('email',e.target.value)} placeholder="info@company.uz" style={sInp} onFocus={e=>e.target.style.borderColor='var(--color-primary)'} onBlur={e=>e.target.style.borderColor='var(--border-default)'}/>
                    </div>
                  </div>
                  <div>
                    <label style={sLbl}>Юридический адрес</label>
                    <input value={form.legalAddress||''} onChange={e=>setF('legalAddress',e.target.value)} placeholder="г. Ташкент, ул. Амир Темур, д. 1" style={sInp} onFocus={e=>e.target.style.borderColor='var(--color-primary)'} onBlur={e=>e.target.style.borderColor='var(--border-default)'}/>
                  </div>
                  <div>
                    <label style={sLbl}>Фактический адрес</label>
                    <input value={form.actualAddress||''} onChange={e=>setF('actualAddress',e.target.value)} placeholder="Если отличается от юридического" style={sInp} onFocus={e=>e.target.style.borderColor='var(--color-primary)'} onBlur={e=>e.target.style.borderColor='var(--border-default)'}/>
                  </div>
                  <div>
                    <label style={sLbl}>Примечание</label>
                    <textarea value={form.comment||''} onChange={e=>setF('comment',e.target.value)} placeholder="Дополнительная информация..." rows={3}
                      style={{width:'100%',padding:'8px',borderRadius:6,background:'var(--bg-elevated)',border:'1px solid var(--border-default)',color:'var(--text-primary)',fontSize:12,outline:'none',resize:'vertical',fontFamily:'inherit',boxSizing:'border-box'}}
                      onFocus={e=>e.target.style.borderColor='var(--color-primary)'} onBlur={e=>e.target.style.borderColor='var(--border-default)'}/>
                  </div>
                </div>
              )}
            </div>

            <div style={{padding:'12px 20px',background:'var(--bg-base)',borderTop:'1px solid var(--border-subtle)',display:'flex',justifyContent:'space-between',alignItems:'center',flexShrink:0}}>
              <span style={{fontSize:11,color:'var(--text-muted)'}}>* обязательные поля</span>
              <div style={{display:'flex',gap:8}}>
                <button onClick={closeModal} style={{padding:'0 14px',height:30,borderRadius:6,background:'transparent',border:'1px solid var(--border-default)',color:'var(--text-secondary)',cursor:'pointer',fontSize:12}}>Отмена</button>
                <button onClick={handleSave} style={{padding:'0 16px',height:30,borderRadius:6,background:'var(--color-primary)',border:'none',color:'#fff',fontWeight:600,cursor:'pointer',fontSize:12}}>Сохранить</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ReferencesContractorsPage;
