import React, { useState } from 'react';
import { useFinanceStore } from '../financeStore';
import { Send, Download, CheckCircle2, Clock, AlertCircle, XCircle, Plus, HelpCircle, Filter } from 'lucide-react';
import { APP_CURRENCY_SYMBOL } from '../config/currency';

import type { InvStatus, IssuedInvoice } from '../financeStore';



const STATUS_META: Record<InvStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  draft:          { label: 'Черновик',         color: 'var(--text-secondary)', bg: 'rgba(148,163,184,0.1)', icon: <Clock size={12} /> },
  sent:           { label: 'Отправлен',        color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',  icon: <Send size={12} /> },
  partially_paid: { label: 'Частично',         color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  icon: <AlertCircle size={12} /> },
  paid:           { label: 'Оплачен',          color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: <CheckCircle2 size={12} /> },
  overdue:        { label: 'Просрочен',        color: '#ef4444', bg: 'rgba(239,68,68,0.1)',  icon: <XCircle size={12} /> },
  cancelled:      { label: 'Аннулирован',      color: '#64748b', bg: 'rgba(100,116,139,0.1)', icon: <XCircle size={12} /> },
};

const DealsInvoicesPage: React.FC = () => {
  const { contractors, invoices, addInvoice, updateInvoice } = useFinanceStore();
  const [statusFilter, setStatusFilter] = useState<InvStatus | 'all'>('all');

  const [isCreateOpen, setCreateOpen] = useState(false);
  const [selectedInvId, setSelectedInvId] = useState<string | null>(null);

  const [newContractor, setNewContractor] = useState(contractors[0]?.id || '');
  const [newAmount, setNewAmount] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDue, setNewDue] = useState('');
  const [newVat, setNewVat] = useState('0');
  
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

  // Auto-compute overdue: sent/partially_paid past dueDate → overdue
  const enriched = invoices.map(inv => {
    if ((inv.status === 'sent' || inv.status === 'partially_paid') && new Date(inv.dueDate) < new Date()) {
      return { ...inv, status: 'overdue' as InvStatus };
    }
    return inv;
  });

  const filtered = enriched
    .filter(inv => statusFilter === 'all' || inv.status === statusFilter);

  const totalDebtor = filtered.filter(i => i.status !== 'cancelled').reduce((s, i) => s + (i.amount - i.paidAmount), 0);
  const overdueCount = enriched.filter(i => i.status === 'overdue').length;



  const advanceStatus = (id: string) => {
    const inv = invoices.find(i => i.id === id);
    if (!inv) return;
    const flow: InvStatus[] = ['draft', 'sent', 'partially_paid', 'paid'];
    const cur = flow.indexOf(inv.status);
    if (cur < 0 || cur >= flow.length - 1) return;
    const next = flow[cur + 1];
    const paidAmount = next === 'paid' ? inv.amount : next === 'partially_paid' ? Math.round(inv.amount / 2) : inv.paidAmount;
    updateInvoice(id, { status: next, paidAmount });
  };

  const fmt = new Intl.NumberFormat('ru-RU');
  const compactFmt = new Intl.NumberFormat('ru-RU', { notation: 'compact', maximumFractionDigits: 1 });

  const downloadInvoiceCSV = (inv: IssuedInvoice) => {
    const ctr = contractors.find(c => c.id === inv.contractorId)?.name ?? '';
    const lines = [
      '\u2116 Счёта;Клиент;Назначение;Дата;Срок;Сумма;НДС;Оплачено;Статус',
      `${inv.number};${ctr};${inv.description};${inv.issuedDate};${inv.dueDate};${inv.amount};${inv.vatAmount};${inv.paidAmount};${STATUS_META[inv.status].label}`,
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = `${inv.number}.csv`;
    link.click(); URL.revokeObjectURL(url);
  };

  const handleCreate = () => {
    if (!newAmount || !newDesc) return;
    const vatAmt = Number(newAmount) * Number(newVat) / 100;
    const newInv: IssuedInvoice = {
      id: 'inv_' + Date.now(),
      number: `INV-2026-${String(Math.floor(100 + Math.random() * 900))}`,
      contractorId: newContractor,
      amount: Number(newAmount) + vatAmt,
      paidAmount: 0,
      status: 'draft',
      issuedDate: new Date().toISOString().split('T')[0],
      dueDate: newDue || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      description: newDesc,
      vatAmount: vatAmt,
    };
    addInvoice(newInv);
    setCreateOpen(false);
    setNewAmount(''); setNewDesc(''); setNewDue('');
  };

  const inp = { width: '100%', padding: '0 10px', height: 32, background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 12, outline: 'none' };

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', background: 'var(--bg-base)' }}>
      {/* ── SIDEBAR ── */}
      {isSidebarOpen && (
      <div style={{ width: 240, flexShrink: 0, borderRight: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: 44, padding: '0 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <Filter size={13} color="var(--text-muted)" />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>Параметры и KPI</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
        </div>

        <div style={{ flex: 1, padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Filters */}
          
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 8 }}>Статус счёта</div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} style={inp}>
              <option value="all">Все статусы</option>
              {(Object.keys(STATUS_META) as InvStatus[]).map(s => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
            </select>
          </div>

          {/* KPI Summary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 2 }}>Итого по выборке</div>
            {[
              { label: 'Всего счетов', val: filtered.length, type: 'count' },
              { label: 'На сумму', val: filtered.filter(i => i.status !== 'cancelled').reduce((s, i) => s + i.amount, 0),  color: 'var(--text-primary)' },
              { label: 'Просрочено', val: overdueCount, type: 'count', color: overdueCount > 0 ? '#ef4444' : 'var(--text-primary)' },
              { label: 'Долги клиентов', val: totalDebtor, color: totalDebtor > 0 ? '#ef4444' : '#10b981' },
            ].map((kpi, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'var(--bg-elevated)', borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{kpi.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: kpi.color || 'var(--text-primary)' }}>
                  {kpi.type === 'count' ? kpi.val : `${new Intl.NumberFormat('ru-RU').format(kpi.val)} ${APP_CURRENCY_SYMBOL}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      )}

      {/* ── MAIN ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Header */}
        <div className="finance-page-header" style={{ height: 44, padding: '0 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <button onClick={() => setSidebarOpen(!isSidebarOpen)} style={{ background: isSidebarOpen ? 'var(--bg-card)' : 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <Filter size={13} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <span style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: -0.01 }}>Выставленные счета</span>
              <span title="Выставляйте счета клиентам и контролируйте дебиторскую задолженность" style={{ cursor: 'pointer', display: 'flex', color: 'var(--text-muted)' }}>
                <HelpCircle size={13} />
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <button onClick={() => setCreateOpen(true)} style={{
              background: 'var(--color-primary)', color: '#fff', border: 'none', padding: '0 14px', height: 28,
              borderRadius: 6, fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
              cursor: 'pointer', transition: 'transform 100ms'
            }} onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'} onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}>
              <Plus size={13} /> Выставить счёт
            </button>
          </div>
        </div>

      {/* Table Container */}
      <div className="finance-page-content finance-mobile-table" style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: 1000 }}>
          <thead>
            <tr style={{ background: 'var(--bg-hover)' }}>
              {['№ Счёта', 'Клиент', 'Назначение', 'Выставлен', 'Срок', 'Сумма', 'НДС', 'Оплачено', 'Статус', ''].map((h, i, arr) => (
                <th key={h} style={{ 
                  padding: '8px 14px', textAlign: 'left', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)', whiteSpace: 'nowrap',
                  borderTopLeftRadius: i === 0 ? 8 : 0, borderTopRightRadius: i === arr.length - 1 ? 8 : 0
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(inv => {
              const ctr = contractors.find(c => c.id === inv.contractorId);
              const st = STATUS_META[inv.status];
              const pct = inv.amount > 0 ? inv.paidAmount / inv.amount : 0;
              const isOverdue = inv.status === 'overdue';
              return (
                <tr key={inv.id}
                  onClick={() => setSelectedInvId(inv.id)}
                  style={{ background: isOverdue ? 'rgba(239,68,68,0.02)' : 'transparent', cursor: 'pointer', transition: 'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = isOverdue ? 'rgba(239,68,68,0.04)' : 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = isOverdue ? 'rgba(239,68,68,0.02)' : 'transparent'}>
                  <td style={{ padding: '8px 14px', fontSize: 12, borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>{inv.number}</td>
                  <td style={{ padding: '8px 14px', fontSize: 12, borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontWeight: 600 }}>{ctr?.name || '—'}</td>
                  <td style={{ padding: '8px 14px', fontSize: 12, borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', maxWidth: 200 }}>
                    <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{inv.description}</div>
                  </td>
                  <td style={{ padding: '8px 14px', fontSize: 12, borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>{inv.issuedDate}</td>
                  <td style={{ padding: '8px 14px', fontSize: 12, borderBottom: '1px solid var(--border-subtle)', color: isOverdue ? '#ef4444' : 'var(--text-muted)', fontWeight: isOverdue ? 700 : 400 }}>{inv.dueDate}</td>
                  <td style={{ padding: '8px 14px', fontSize: 12, borderBottom: '1px solid var(--border-subtle)', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{fmt.format(inv.amount)}</td>
                  <td style={{ padding: '8px 14px', fontSize: 12, borderBottom: '1px solid var(--border-subtle)', color: inv.vatAmount > 0 ? '#f59e0b' : 'var(--text-muted)' }}>
                    {inv.vatAmount > 0 ? fmt.format(inv.vatAmount) : '—'}
                  </td>
                  <td style={{ padding: '8px 14px', borderBottom: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: 11, color: pct === 1 ? '#10b981' : pct > 0 ? '#f59e0b' : 'var(--text-muted)', marginBottom: 4 }}>
                      {fmt.format(inv.paidAmount)}
                    </div>
                    <div style={{ height: 4, background: 'var(--border-subtle)', borderRadius: 2, overflow: 'hidden', width: 60 }}>
                      <div style={{ width: `${pct * 100}%`, height: '100%', background: pct === 1 ? '#10b981' : '#f59e0b', borderRadius: 2 }} />
                    </div>
                  </td>
                  <td style={{ padding: '8px 14px', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: st.color, fontSize: 11, fontWeight: 500 }}>
                      {st.icon} {st.label}
                    </span>
                  </td>
                  <td style={{ padding: '8px 14px', borderBottom: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {inv.status === 'draft' && (
                        <button onClick={e => { e.stopPropagation(); advanceStatus(inv.id); }} style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)', padding: '3px 8px', borderRadius: 6, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Send size={10} /> Отправить
                        </button>
                      )}
                      {inv.status === 'sent' && (
                        <button onClick={e => { e.stopPropagation(); advanceStatus(inv.id); }} style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)', padding: '3px 8px', borderRadius: 6, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <AlertCircle size={10} /> Частично
                        </button>
                      )}
                      {inv.status === 'partially_paid' && (
                        <button onClick={e => { e.stopPropagation(); advanceStatus(inv.id); }} style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)', padding: '3px 8px', borderRadius: 6, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <CheckCircle2 size={10} /> Оплачен
                        </button>
                      )}
                      <button onClick={e => { e.stopPropagation(); downloadInvoiceCSV(inv); }} style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', padding: '3px 7px', borderRadius: 6, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Скачать CSV">
                        <Download size={11} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* Flush Footer attached to bottom of screen */}
      {/* Flush Footer attached to bottom of screen */}
      <div className="finance-footer" style={{ 
        background: 'var(--bg-surface)',
        borderTop: '1px solid var(--border-subtle)',
        padding: '12px 16px', paddingBottom: 'max(12px, env(safe-area-inset-bottom, 12px))',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
        flexShrink: 0, overflowX: 'auto', WebkitOverflowScrolling: 'touch'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 'max-content' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{invoices.filter(i => i.status !== 'cancelled').length}</span> счетов
          </div>
          <div style={{ width: 1, height: 12, background: 'var(--border-subtle)' }} />
          <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
            На сумму: <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{compactFmt.format(invoices.filter(i => i.status !== 'cancelled').reduce((s, i) => s + i.amount, 0))}</span>
          </div>
          <div style={{ width: 1, height: 12, background: 'var(--border-subtle)' }} />
          <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
            Проср.: <span style={{ color: overdueCount > 0 ? '#ef4444' : 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{overdueCount}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 'max-content', marginLeft: 16 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Долг:</span>
          <span style={{ color: totalDebtor > 0 ? '#ef4444' : '#10b981', fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: 13 }}>
            {compactFmt.format(totalDebtor)}
          </span>
        </div>
      </div>

      {isCreateOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ background: 'var(--bg-surface)', width: 440, borderRadius: 12, border: '1px solid var(--border-subtle)', overflow: 'hidden', boxShadow: 'var(--shadow-xl)' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: 16, fontWeight: 600 }}>Новый счёт на оплату</h2>
              <button onClick={() => setCreateOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex' }}><XCircle size={18} /></button>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Клиент *</label>
                <select value={newContractor} onChange={e => setNewContractor(e.target.value)} style={inp}>
                  {contractors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Назначение *</label>
                <input value={newDesc} onChange={e => setNewDesc(e.target.value)} type="text" placeholder="За что счёт?" style={inp} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Сумма без НДС *</label>
                  <input type="number" value={newAmount} onChange={e => setNewAmount(e.target.value)} min="0" style={inp} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>НДС (%)</label>
                  <select value={newVat} onChange={e => setNewVat(e.target.value)} style={inp}>
                    <option value="0">0%</option>
                    <option value="10">10%</option>
                    <option value="20">20%</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Срок оплаты</label>
                  <input type="date" value={newDue} onChange={e => setNewDue(e.target.value)} style={inp} />
                </div>
              </div>
              {newAmount && (
                <div style={{ background: 'var(--bg-hover)', borderRadius: 8, padding: 12, fontSize: 13, color: 'var(--text-primary)', display: 'flex', justifyContent: 'space-between', border: '1px solid var(--border-subtle)', marginTop: 8 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Итого с НДС:</span>
                  <strong style={{ fontFamily: 'monospace', fontSize: 14 }}>{new Intl.NumberFormat('ru-RU').format(Number(newAmount) * (1 + Number(newVat) / 100))} сум</strong>
                </div>
              )}
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: 12, background: 'var(--bg-card)' }}>
              <button onClick={() => setCreateOpen(false)} style={{ padding: '0 16px', height: 32, background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>Отмена</button>
              <button onClick={handleCreate} style={{ padding: '0 16px', height: 32, background: 'var(--color-primary)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>Сохранить счёт</button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Detail Modal */}
      {selectedInvId && (() => {
        const inv = enriched.find(i => i.id === selectedInvId);
        if (!inv) return null;
        const ctr = contractors.find(c => c.id === inv.contractorId);
        const st = STATUS_META[inv.status];
        const pct = inv.amount > 0 ? Math.round((inv.paidAmount / inv.amount) * 100) : 0;
        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
            onClick={() => setSelectedInvId(null)}>
            <div style={{ background: 'var(--bg-surface)', width: 520, borderRadius: 12, border: '1px solid var(--border-subtle)', boxShadow: '0 24px 64px rgba(0,0,0,0.25)', overflow: 'hidden' }}
              onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Счёт на оплату</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'monospace' }}>{inv.number}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 600, color: st.color, background: st.bg, border: `1px solid ${st.color}30` }}>
                    {st.icon} {st.label}
                  </span>
                  <button onClick={() => setSelectedInvId(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}>
                    <XCircle size={18} />
                  </button>
                </div>
              </div>
              {/* Body */}
              <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Info grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    { label: 'Клиент', value: ctr?.name ?? '—' },
                    { label: 'Назначение', value: inv.description },
                    { label: 'Дата выставления', value: new Date(inv.issuedDate).toLocaleDateString('ru-RU') },
                    { label: 'Срок оплаты', value: new Date(inv.dueDate).toLocaleDateString('ru-RU') },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ padding: '10px 14px', background: 'var(--bg-hover)', borderRadius: 8 }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{value}</div>
                    </div>
                  ))}
                </div>
                {/* Financials */}
                <div style={{ padding: 16, background: 'var(--bg-hover)', borderRadius: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div><div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Сумма без НДС</div><div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'monospace' }}>{fmt.format(inv.amount - inv.vatAmount)} сум</div></div>
                    <div><div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>НДС</div><div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'monospace', color: '#f59e0b' }}>{fmt.format(inv.vatAmount)} сум</div></div>
                    <div><div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Итого</div><div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'monospace', color: 'var(--color-primary)' }}>{fmt.format(inv.amount)} сум</div></div>
                  </div>
                  <div style={{ height: 6, background: 'var(--border-subtle)', borderRadius: 4, overflow: 'hidden', marginBottom: 6 }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: pct === 100 ? '#10b981' : '#f59e0b', borderRadius: 4 }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
                    <span>Оплачено: {new Intl.NumberFormat('ru-RU').format(inv.paidAmount)} сум ({pct}%)</span>
                    <span>Остаток: {new Intl.NumberFormat('ru-RU').format(inv.amount - inv.paidAmount)} сум</span>
                  </div>
                </div>
                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  {inv.status === 'draft' && (
                    <button onClick={() => { advanceStatus(inv.id); setSelectedInvId(null); }} style={{ padding: '0 16px', height: 32, background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Send size={12} /> Отправить клиенту
                    </button>
                  )}
                  {inv.status === 'sent' && (
                    <button onClick={() => { advanceStatus(inv.id); setSelectedInvId(null); }} style={{ padding: '0 16px', height: 32, background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <AlertCircle size={12} /> Отметить частично
                    </button>
                  )}
                  {inv.status === 'partially_paid' && (
                    <button onClick={() => { advanceStatus(inv.id); setSelectedInvId(null); }} style={{ padding: '0 16px', height: 32, background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CheckCircle2 size={12} /> Отметить оплаченным
                    </button>
                  )}
                  <button onClick={() => downloadInvoiceCSV(inv)} style={{ padding: '0 14px', height: 32, background: 'var(--bg-hover)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 8, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Download size={12} /> Скачать CSV
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
      </div>
    </div>
  );
};

export default DealsInvoicesPage;
