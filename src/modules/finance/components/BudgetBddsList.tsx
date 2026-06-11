import { confirmDialog } from '../../../lib/confirm';
import React, { useState } from 'react';
import { Search, ChevronDown, Plus, Trash2, X, Waves, Filter } from 'lucide-react';
import { useFinanceStore, type BddsBudget } from '../financeStore';
import { APP_CURRENCY } from '../config/currency';
import { useTranslation } from 'react-i18next';

export type { BddsBudget };

const fmtPeriod = (start: string, end: string) => {
  const months = ['янв','Фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];
  const [sy, sm] = start.split('-');
  const [ey, em] = end.split('-');
  return `${months[+sm-1]} '${sy.slice(2)} — ${months[+em-1]} '${ey.slice(2)}`;
};

interface Props { onSelect: (b: BddsBudget) => void; }

// --- Новый бюджет БДДС: модалка ---
const NewBddsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { t } = useTranslation();
    const { addBddsBudget, projects, budgetScenarios } = useFinanceStore();
  const [form, setForm] = useState({
    name: '', currency: APP_CURRENCY, projectId: '', entityId: '',
    periodStart: `${new Date().getFullYear()}-01`,
    periodEnd:   `${new Date().getFullYear()}-12`,
    scenarioId: budgetScenarios[0]?.id ?? '',
  });
  const upd = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const inp: React.CSSProperties = {
    height: 36, padding: '0 10px', background: 'var(--bg-base)',
    border: '1px solid var(--border-subtle)', borderRadius: 6,
    color: 'var(--text-primary)', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box',
  };
  const label: React.CSSProperties = { fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 4, display: 'block' };
  const row: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 4 };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    addBddsBudget(form);
    onClose();
  };

  return (
    <div style={{position:'fixed',inset:0,zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.4)',backdropFilter:'blur(4px)'}}>
      <div style={{background:'var(--bg-surface)',borderRadius:12,width:480,boxShadow:'0 20px 60px rgba(0,0,0,0.3)',border:'1px solid var(--border-subtle)'}}>
        <div style={{padding:'20px 24px 16px',borderBottom:'1px solid var(--border-subtle)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <h2 style={{margin:0,fontSize:16,fontWeight:700,color:'var(--text-primary)'}}>{t("Новый бюджет БДДС", "Новый бюджет БДДС")}</h2>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',padding:4,display:'flex',borderRadius:4}}
            onMouseEnter={e=>(e.currentTarget.style.background='var(--bg-hover)') as any}
            onMouseLeave={e=>(e.currentTarget.style.background='transparent') as any}>
            <X size={16}/>
          </button>
        </div>
        <form onSubmit={handleSubmit} style={{padding:'20px 24px',display:'flex',flexDirection:'column',gap:14}}>
          <div style={row}>
            <span style={label}>{t("Наименование *", "Наименование *")}</span>
            <input style={inp} placeholder={t("Например: БДДС 2026 Основной", "Например: БДДС 2026 Основной")} value={form.name} onChange={e=>upd('name',e.target.value)} required/>
          </div>
          <div style={row}>
            <span style={label}>{t("Валюта", "Валюта")}</span>
            <select style={{...inp,appearance:'none'}} value={form.currency} onChange={e=>upd('currency',e.target.value)}>
              <option value={APP_CURRENCY}>{t("UZS сум", "UZS сум")}</option>
              <option value="USD">USD $</option>
              <option value="EUR">EUR €</option>
              <option value="CNY">CNY ¥</option>
            </select>
          </div>
          <div style={row}>
            <span style={label}>{t("Сценарий", "Сценарий")}</span>
            <select style={{...inp,appearance:'none'}} value={form.scenarioId} onChange={e=>upd('scenarioId',e.target.value)}>
              <option value="">{t("— Без сценария", "— Без сценария")}</option>
              {budgetScenarios.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div style={row}>
            <span style={label}>{t("Проект", "Проект")}</span>
            <select style={{...inp,appearance:'none'}} value={form.projectId} onChange={e=>upd('projectId',e.target.value)}>
              <option value="">{t("— Без проекта", "— Без проекта")}</option>
              {projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div style={row}>
              <span style={label}>{t("Период с", "Период с")}</span>
              <input type="month" style={inp} value={form.periodStart} onChange={e=>upd('periodStart',e.target.value)}/>
            </div>
            <div style={row}>
              <span style={label}>{t("Период по", "Период по")}</span>
              <input type="month" style={inp} value={form.periodEnd} onChange={e=>upd('periodEnd',e.target.value)}/>
            </div>
          </div>
          <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:4,paddingTop:12,borderTop:'1px solid var(--border-subtle)'}}>
            <button type="button" onClick={onClose}
              style={{height:36,padding:'0 16px',background:'var(--bg-hover)',border:'1px solid var(--border-subtle)',borderRadius:6,fontSize:13,color:'var(--text-secondary)',cursor:'pointer'}}>
              
              {t("Отозвать", "Отозвать")}
            </button>
            <button type="submit"
              style={{height:36,padding:'0 16px',background:'var(--color-primary)',color: 'var(--text-primary)',border:'none',borderRadius:6,fontSize:13,fontWeight:500,cursor:'pointer'}}>
              
              {t("Создать бюджет", "Создать бюджет")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const BudgetBddsList: React.FC<Props> = ({ onSelect }) => {
  const { t } = useTranslation();
    const { projects, bddsBudgets, deleteBddsBudget } = useFinanceStore();
  const [search, setSearch]           = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [showModal, setShowModal]     = useState(false);
  const [hoverDelete, setHoverDelete] = useState<string|null>(null);
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'f' && !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        setSidebarOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filtered = bddsBudgets.filter(b => {
    if (search && !b.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterProject && b.projectId !== filterProject) return false;
    return true;
  });

  const inp: React.CSSProperties = {
    height: 32, padding: '0 10px', background: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)', borderRadius: 6,
    color: 'var(--text-primary)', fontSize: 13, outline: 'none',
  };

  return (
    <div style={{ display: 'flex', height: '100%', background: 'var(--bg-base)' }}>
      {showModal && <NewBddsModal onClose={() => setShowModal(false)} />}

      {/* ── SIDEBAR ── */}
      {isSidebarOpen && (
      <div style={{ width: 240, flexShrink: 0, borderRight: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: 44, padding: '0 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Filter size={13} color="var(--text-muted)" />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{t("Параметры", "Параметры")}</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
        </div>

        <div style={{ flex: 1, padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 8 }}>{t("Юрлицо", "Юрлицо")}</div>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <select style={{ ...inp, paddingRight: 28, appearance: 'none', width: '100%' }} defaultValue="">
                <option value="">{t("Все юрлица", "Все юрлица")}</option>
              </select>
              <ChevronDown size={13} style={{ position: 'absolute', right: 8, pointerEvents: 'none', color: 'var(--text-muted)' }} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 8 }}>{t("Проект", "Проект")}</div>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <select value={filterProject} onChange={e => setFilterProject(e.target.value)} style={{ ...inp, paddingRight: 28, appearance: 'none', width: '100%' }}>
                <option value="">{t("Все проекты", "Все проекты")}</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <ChevronDown size={13} style={{ position: 'absolute', right: 8, pointerEvents: 'none', color: 'var(--text-muted)' }} />
            </div>
          </div>
        </div>
      </div>
      )}

      {/* ── MAIN ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Header */}
        <div className="finance-page-header" style={{ height: 44, padding: '0 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => setSidebarOpen(!isSidebarOpen)} style={{ background: isSidebarOpen ? 'var(--bg-card)' : 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <Filter size={13} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: -0.01 }}>{t("БДДС", "БДДС")}</span>
              <span title={t("Бюджет движения денежных средств", "Бюджет движения денежных средств")} style={{ cursor: 'pointer', display: 'flex', color: 'var(--text-muted)' }}>
                <Waves size={13} />
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ position: 'relative', width: 200 }}>
              <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t("Поиск по названию...", "Поиск по названию...")}
                style={{ width: '100%', padding: '0 10px 0 32px', height: 28, borderRadius: 6, background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: 12 }} />
            </div>
            <button onClick={() => setShowModal(true)} style={{ background: 'var(--color-primary)', color: 'var(--text-primary)', border: 'none', padding: '0 14px', height: 28, borderRadius: 6, fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)' }}>
              <Plus size={13} />  {t("Новый бюджет", "Новый бюджет")}
            </button>
          </div>
        </div>

        <div className="finance-page-content finance-mobile-table" style={{ flex: 1, padding: '24px 32px', overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-subtle)' }}>
              {['Название ▼', 'Тип', 'Валюта', 'Юрлицо', 'Проект', 'Период', 'Дата изменения', "Кто изменил", ''].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(b => {
              const proj = projects.find(p => p.id === b.projectId);
              return (
                <tr key={b.id} onClick={() => onSelect(b)}
                  style={{ borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer', transition: 'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '12px 14px', fontSize: 12, color: 'var(--color-primary)', fontWeight: 500 }}>{b.name}</td>
                  <td style={{ padding: '12px 14px', fontSize: 12 }}>
                    <span style={{padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:500,background:'rgba(16,185,129,0.1)',color:'#10b981'}}>
                      
                      {t("БДДС", "БДДС")}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: 12, color: 'var(--text-secondary)' }}>{b.currency}</td>
                  <td style={{ padding: '12px 14px', fontSize: 12, color: 'var(--text-secondary)' }}>—</td>
                  <td style={{ padding: '12px 14px', fontSize: 12, color: 'var(--text-secondary)' }}>{proj?.name ?? '—'}</td>
                  <td style={{ padding: '12px 14px', fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{fmtPeriod(b.periodStart, b.periodEnd)}</td>
                  <td style={{ padding: '12px 14px', fontSize: 12, color: 'var(--text-secondary)' }}>{new Date(b.updatedAt).toLocaleDateString('ru-RU')}</td>
                  <td style={{ padding: '12px 14px', fontSize: 12, color: 'var(--text-muted)' }}>{b.updatedBy}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <button
                      onClick={e => { e.stopPropagation(); confirmDialog({ message: `Удалить бюджет «${b.name}»?`, danger: true }).then(ok => ok && deleteBddsBudget(b.id)); }}
                      onMouseEnter={() => setHoverDelete(b.id)}
                      onMouseLeave={() => setHoverDelete(null)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: hoverDelete === b.id ? '#ef4444' : 'var(--text-muted)', padding: 4, borderRadius: 4, display: 'flex', transition: 'color 0.15s' }}>
                      <Trash2 size={14}/>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
            {bddsBudgets.length === 0 ? 'Бюджеты ещё не созданы — нажмите «+ Новый бюджет»' : 'Бюджеты не найдены'}
          </div>
        )}
      </div>
      </div>
    </div>
  );
};
