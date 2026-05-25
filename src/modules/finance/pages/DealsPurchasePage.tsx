import React, { useState } from 'react';
import { useFinanceStore } from '../financeStore';
import { PurchaseDealDetailsView } from '../components/PurchaseDealDetailsView';
import { Plus, Filter, Package, CheckCircle2, Clock, XCircle, HelpCircle } from 'lucide-react';
import { APP_CURRENCY_SYMBOL } from '../config/currency';

import type { PurchaseStatus, PurchaseDeal } from '../financeStore';

const STATUS_META: Record<PurchaseStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  new: { label: 'Новая', color: 'var(--text-secondary)', bg: 'rgba(148,163,184,0.1)', icon: <Clock size={12} /> },
  in_work: { label: 'В работе', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', icon: <Package size={12} /> },
  delivered: { label: 'Получено', color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: <CheckCircle2 size={12} /> },
  cancelled: { label: 'Отменена', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: <XCircle size={12} /> },
};

const DealsPurchasePage: React.FC = () => {
  const { contractors, purchases, addPurchase } = useFinanceStore();
  const [statusFilter, setStatusFilter] = useState<PurchaseStatus | 'all'>('all');
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);

  // Form
  const [newName, setNewName] = useState('');
  const [newContractor, setNewContractor] = useState(contractors[0]?.id || '');
  const [newAmount, setNewAmount] = useState('');
  const [newCategory, setNewCategory] = useState('Оборудование');
  const [newDue, setNewDue] = useState('');

  const filtered = purchases
    .filter(d => statusFilter === 'all' || d.status === statusFilter);

  const totalAmount = filtered.reduce((s, d) => s + d.amount, 0);
  const totalPaid = filtered.reduce((s, d) => s + d.paidAmount, 0);
  const totalDebt = totalAmount - totalPaid;

  const handleCreate = () => {
    if (!newName || !newAmount) return;
    const nd: PurchaseDeal = {
      id: 'pu_' + Date.now(),
      number: `PUR-${Math.floor(100 + Math.random() * 900)}`,
      name: newName,
      contractorId: newContractor,
      amount: Number(newAmount),
      paidAmount: 0,
      status: 'new',
      category: newCategory,
      startDate: new Date().toISOString().split('T')[0],
      dueDate: newDue || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      deliveryStatus: 'pending',
    };
    addPurchase(nd);
    setCreateOpen(false);
    setNewName(''); setNewAmount(''); setNewDue('');
  };

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
  const fmt = (n: number) => new Intl.NumberFormat('ru-RU').format(Math.round(n));
  const inp = { width: '100%', padding: '0 10px', height: 32, background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 12, outline: 'none' };

  if (selectedDealId) {
    const sDeal = purchases.find(d => d.id === selectedDealId);
    if (!sDeal) {
      setSelectedDealId(null);
      return null;
    }
    return <PurchaseDealDetailsView deal={sDeal} onBack={() => setSelectedDealId(null)} />;
  }

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
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 8 }}>Статус закупки</div>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} style={inp}>
                <option value="all">Все статусы</option>
                {(Object.keys(STATUS_META) as PurchaseStatus[]).map(s => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
              </select>
            </div>

            {/* KPI Summary */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 2 }}>Итого по выборке</div>
              {[
                { label: 'Всего закупок', val: filtered.length, type: 'count' },
                { label: 'Сумма закупок', val: totalAmount, color: 'var(--text-primary)' },
                { label: 'Оплачено', val: totalPaid, color: '#10b981' },
                { label: 'Долги поставщикам', val: totalDebt, color: totalDebt > 0 ? '#ef4444' : '#10b981' },
              ].map((kpi, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'var(--bg-elevated)', borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{kpi.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: kpi.color || 'var(--text-primary)' }}>
                    {kpi.type === 'count' ? kpi.val : `${fmt(kpi.val)} ${APP_CURRENCY_SYMBOL}`}
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
              <span style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: -0.01 }}>Сделки по закупкам</span>
              <span title="Контролируйте обязательства перед поставщиками, поставки и авансы" style={{ cursor: 'pointer', display: 'flex', color: 'var(--text-muted)' }}>
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
              <Plus size={13} /> Новая закупка
            </button>
          </div>
        </div>

        {/* Table Container */}
        <div className="finance-page-content finance-mobile-table" style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: 1000 }}>
            <thead>
              <tr style={{ background: 'var(--bg-hover)' }}>
                {['№ Закупки', 'Наименование', 'Поставщик', 'Категория', 'Сумма', 'Оплачено', 'Поставка', 'Срок', 'Статус'].map((h, i, arr) => (
                  <th key={h} style={{
                    padding: '8px 14px', textAlign: 'left', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)', whiteSpace: 'nowrap',
                    borderTopLeftRadius: i === 0 ? 8 : 0, borderTopRightRadius: i === arr.length - 1 ? 8 : 0
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(deal => {
                const ctr = contractors.find(c => c.id === deal.contractorId);
                const st = STATUS_META[deal.status as PurchaseStatus] || STATUS_META['new'];
                const pct = deal.amount > 0 ? deal.paidAmount / deal.amount : 0;
                const deliveryColor = deal.deliveryStatus === 'done' ? '#10b981' : deal.deliveryStatus === 'partial' ? '#f59e0b' : '#64748b';
                const deliveryLabel = deal.deliveryStatus === 'done' ? '✓ Получено' : deal.deliveryStatus === 'partial' ? '~ Частично' : '○ Ожидается';
                return (
                  <tr key={deal.id} style={{ cursor: 'pointer', transition: 'background 0.1s' }}
                    onClick={() => setSelectedDealId(deal.id)}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '8px 14px', fontSize: 12, borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>{deal.number}</td>
                    <td style={{ padding: '8px 14px', fontSize: 12, borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontWeight: 600 }}>{deal.name}</td>
                    <td style={{ padding: '8px 14px', fontSize: 12, borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>{ctr?.name || '—'}</td>
                    <td style={{ padding: '8px 14px', fontSize: 12, borderBottom: '1px solid var(--border-subtle)' }}>
                      <span style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', padding: '2px 8px', borderRadius: 4, fontSize: 11 }}>{deal.category}</span>
                    </td>
                    <td style={{ padding: '8px 14px', fontSize: 12, borderBottom: '1px solid var(--border-subtle)', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{new Intl.NumberFormat('ru-RU').format(deal.amount)}</td>
                    <td style={{ padding: '8px 14px', fontSize: 12, borderBottom: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: 11, marginBottom: 4, color: pct === 1 ? '#10b981' : 'var(--text-muted)' }}>{new Intl.NumberFormat('ru-RU').format(deal.paidAmount)}</div>
                      <div style={{ height: 4, background: 'var(--border-subtle)', borderRadius: 2, overflow: 'hidden', width: 70 }}>
                        <div style={{ width: `${pct * 100}%`, height: '100%', background: pct === 1 ? '#10b981' : 'var(--color-primary)', borderRadius: 2 }} />
                      </div>
                    </td>
                    <td style={{ padding: '8px 14px', fontSize: 11, borderBottom: '1px solid var(--border-subtle)', fontWeight: 500, color: deliveryColor }}>{deliveryLabel}</td>
                    <td style={{ padding: '8px 14px', fontSize: 11, borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>{deal.dueDate}</td>
                    <td style={{ padding: '8px 14px', fontSize: 12, borderBottom: '1px solid var(--border-subtle)' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: st.color, fontSize: 11, fontWeight: 500 }}>
                        {st.icon} {st.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
            <Package size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
            <div style={{ fontSize: 14 }}>Закупки не найдены</div>
          </div>
        )}
      </div>
      </div>
      {/* Create Modal */}
      {isCreateOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ background: 'var(--bg-surface)', width: 480, borderRadius: 12, border: '1px solid var(--border-subtle)', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: 16, fontWeight: 600 }}>Новая закупка</h2>
              <button onClick={() => setCreateOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 18 }}>✕</button>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label htmlFor="pur-name" style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Наименование закупки *</label>
                <input id="pur-name" name="purName" value={newName} onChange={e => setNewName(e.target.value)} type="text" placeholder="Что закупаем?" style={inp} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label htmlFor="pur-contractor" style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Поставщик</label>
                  <select id="pur-contractor" name="purContractor" value={newContractor} onChange={e => setNewContractor(e.target.value)} style={inp}>
                    {contractors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="pur-category" style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Категория</label>
                  <input id="pur-category" name="purCategory" value={newCategory} onChange={e => setNewCategory(e.target.value)} type="text" style={inp} />
                </div>
                <div>
                  <label htmlFor="pur-amount" style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Сумма (сум) *</label>
                  <input id="pur-amount" name="purAmount" type="number" min="0" value={newAmount} onChange={e => setNewAmount(e.target.value)} placeholder="0" style={inp} />
                </div>
                <div>
                  <label htmlFor="pur-due" style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Срок поставки</label>
                  <input id="pur-due" name="purDue" type="date" value={newDue} onChange={e => setNewDue(e.target.value)} style={inp} />
                </div>
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: 12, background: 'var(--bg-card)' }}>
              <button onClick={() => setCreateOpen(false)} style={{ padding: '0 16px', height: 28, background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-primary)', cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>Отмена</button>
              <button onClick={handleCreate} style={{ padding: '0 16px', height: 28, background: 'var(--color-primary)', border: 'none', borderRadius: 6, color: '#fff', fontWeight: 500, cursor: 'pointer', fontSize: 12 }}>Создать</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DealsPurchasePage;
