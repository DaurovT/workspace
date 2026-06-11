import React, { useState } from 'react';
import { useFinanceStore, type DealStatus } from '../financeStore';
import { DealsTable } from '../components/DealsTable';
import { DealDetailsModal } from '../components/DealDetailsModal';
import { Plus, HelpCircle, X, Filter } from 'lucide-react';
import { APP_CURRENCY_SYMBOL } from '../config/currency';
import { useTranslation } from 'react-i18next';

// ─── Create Deal Form Modal ───────────────────────────────────────────────────
const CreateDealModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { t } = useTranslation();
    const { contractors, projects, addDeal } = useFinanceStore();
  const [name, setName] = useState('');
  const [contractorId, setContractorId] = useState(contractors[0]?.id ?? '');
  const [projectId, setProjectId] = useState('');
  const [amount, setAmount] = useState('');
  const [deadline, setDeadline] = useState('');

  const inp: React.CSSProperties = {
    width: '100%', padding: '8px 12px', background: 'var(--bg-base)',
    border: '1px solid var(--border-subtle)', borderRadius: 8,
    color: 'var(--text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box',
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount) return;
    addDeal({
      name,
      type: 'sale',
      status: 'new',
      contractorId,
      projectId: projectId || undefined,
      amount: Number(amount),
      paidAmount: 0,
      shippedAmount: 0,
      currency: APP_CURRENCY_SYMBOL,
      dateStart: new Date().toISOString(),
      dateDeadline: deadline
        ? new Date(deadline).toISOString()
        : new Date(Date.now() + 30 * 86400000).toISOString(),
    });
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999
    }}>
      <div style={{
        background: 'var(--bg-surface)', width: 480, borderRadius: 12, border: '1px solid var(--border-subtle)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden'
      }}>
        <div style={{
          padding: '18px 24px', borderBottom: '1px solid var(--border-subtle)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>{t("Новая сделка (продажа)", "Новая сделка (продажа)")}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}>
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6 }}>
                
                {t("Название сделки *", "Название сделки *")}
              </label>
              <input value={name} onChange={e => setName(e.target.value)} required placeholder={t("Договор №...", "Договор №...")} style={inp} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6 }}>{t("Клиент *", "Клиент *")}</label>
                <select value={contractorId} onChange={e => setContractorId(e.target.value)} required style={inp}>
                  <option value="" disabled>{t("Выберите клиента...", "Выберите клиента...")}</option>
                  {contractors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6 }}>{t("Проект", "Проект")}</label>
                <select value={projectId} onChange={e => setProjectId(e.target.value)} style={inp}>
                  <option value="">{t("Без проекта", "Без проекта")}</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6 }}>{t("Сумма сделки (сум) *", "Сумма сделки (сум) *")}</label>
                <input type="number" min="0" value={amount} onChange={e => setAmount(e.target.value)} required placeholder="0" style={inp} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6 }}>{t("Срок завершения", "Срок завершения")}</label>
                <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} style={inp} />
              </div>
            </div>
          </div>
          <div style={{
            padding: '14px 24px', borderTop: '1px solid var(--border-subtle)',
            display: 'flex', justifyContent: 'flex-end', gap: 12, background: 'var(--bg-base)'
          }}>
            <button type="button" onClick={onClose} style={{
              padding: '0 16px', height: 32, background: 'transparent',
              border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-primary)',
              cursor: 'pointer', fontSize: 12, fontWeight: 500
            }}>{t("Отозвать", "Отозвать")}</button>
            <button type="submit" style={{
              padding: '0 20px', height: 32, background: 'var(--color-primary)',
              border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 12,
              boxShadow: '0 4px 12px rgba(124,58,237,0.3)'
            }}>{t("Создать сделку", "Создать сделку")}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────
const DealsSalesPage: React.FC = () => {
  const { t } = useTranslation();
    const { deals } = useFinanceStore();
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<DealStatus | 'all'>('all');

  const [isCreateOpen, setCreateOpen] = useState(false);
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

  const saleDeals = deals.filter(d => d.type === 'sale');
  const filteredDeals = saleDeals
    .filter(d => statusFilter === 'all' || d.status === statusFilter);

  const totalSum = filteredDeals.reduce((s, d) => s + d.amount, 0);
  const totalPaid = filteredDeals.reduce((s, d) => s + d.paidAmount, 0);
  const totalDebt = totalSum - totalPaid;

  const inp: React.CSSProperties = {
    width: '100%', padding: '0 10px', height: 32, background: 'var(--bg-elevated)',
    border: '1px solid var(--border-subtle)', color: 'var(--text-primary)',
    borderRadius: 6, fontSize: 12, outline: 'none', cursor: 'pointer', boxSizing: 'border-box'
  };

  const fmt = (n: number) => new Intl.NumberFormat('ru-RU').format(Math.round(n));

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', background: 'var(--bg-base)' }}>
      {/* ── SIDEBAR ── */}
      {isSidebarOpen && (
        <div style={{ width: 240, flexShrink: 0, borderRight: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ height: 44, padding: '0 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <Filter size={13} color="var(--text-muted)" />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{t("Параметры и KPI", "Параметры и KPI")}</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
          </div>

          <div style={{ flex: 1, padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Filters */}

            <div>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 8 }}>{t("Статус сделки", "Статус сделки")}</div>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as DealStatus | 'all')} style={inp}>
                <option value="all">{t("Все статусы", "Все статусы")}</option>
                <option value="new">{t("Новая", "Новая")}</option>
                <option value="in_progress">{t("В работе", "В работе")}</option>
                <option value="completed">{t("Завершена", "Завершена")}</option>
                <option value="cancelled">{t("Отменена", "Отменена")}</option>
              </select>
            </div>

            {/* KPI Summary */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 2 }}>{t("Итого по выборке", "Итого по выборке")}</div>
              {[
                { label: 'Всего сделок', val: filteredDeals.length, type: 'count' },
                { label: 'Общая сумма', val: totalSum, color: 'var(--text-primary)' },
                { label: 'Оплачено', val: totalPaid, color: '#10b981' },
                { label: 'Дебиторская задолженность', val: totalDebt, color: totalDebt > 0 ? '#ef4444' : '#10b981' },
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
        <div style={{ height: 44, padding: '0 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <button onClick={() => setSidebarOpen(!isSidebarOpen)} style={{ background: isSidebarOpen ? 'var(--bg-card)' : 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <Filter size={13} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <span style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: -0.01 }}>{t("Сделки по продажам", "Сделки по продажам")}</span>
              <span title={t("Контролируйте учёт обязательств перед клиентами", "Контролируйте учёт обязательств перед клиентами")} style={{ cursor: 'pointer', display: 'flex', color: 'var(--text-muted)' }}>
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
              <Plus size={13} />  {t("Новая сделка", "Новая сделка")}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="finance-page-content" style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
          <DealsTable
            onRowClick={id => setSelectedDealId(id)}
            statusFilter={statusFilter}
            searchQuery=""
          />
        </div>
      </div>

      {/* Modals */}
      {isCreateOpen && <CreateDealModal onClose={() => setCreateOpen(false)} />}
      {selectedDealId && (
        <DealDetailsModal dealId={selectedDealId} isOpen={true} onClose={() => setSelectedDealId(null)} />
      )}
    </div>
  );
};

export default DealsSalesPage;
