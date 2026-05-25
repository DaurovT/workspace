import React, { useState, useEffect } from 'react';
import { useProcurementStore, type Tender } from '../procurementStore';
import { Plus, X, ChevronRight, Package, Trophy, Trash2 } from 'lucide-react';

// ─── Status config ─────────────────────────────────────────────────────────

const TENDER_STATUSES = [
  { value: 'draft',      label: 'Черновик',    color: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
  { value: 'active',     label: 'Активный',    color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  { value: 'closed',     label: 'Закрыт',      color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  { value: 'cancelled',  label: 'Отменён',     color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
];

const getTenderStatus = (val: string) => TENDER_STATUSES.find(s => s.value === val) || TENDER_STATUSES[0];

// ─── Tender Card ───────────────────────────────────────────────────────────

const TenderCard: React.FC<{ tender: Tender; onSelect: (t: Tender) => void }> = ({ tender, onSelect }) => {
  const s = getTenderStatus(tender.status);
  const tenderSum = tender.items.reduce((acc, item) => acc + item.quantity * item.tenderPrice, 0);
  const netSum = tender.items.reduce((acc, item) => {
    const base = item.quantity * item.supplierPrice;
    const broker = item.brokerAmount > 0 ? item.brokerAmount : (base * (item.brokerPct / 100));
    const add = item.logisticsCost + item.certification + item.customs + item.otherExpenses;
    return acc + base + broker + add;
  }, 0);
  const diff = tenderSum - netSum;

  return (
    <div
      onClick={() => onSelect(tender)}
      style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)', padding: '16px 20px', cursor: 'pointer',
        transition: 'all 0.2s', display: 'flex', flexDirection: 'column', gap: 12
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.boxShadow = 'var(--shadow-glow)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
            {tender.number || 'Тендер #' + tender.id.slice(-6)}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {tender.startDate && `${tender.startDate}`}
            {tender.endDate && ` — ${tender.endDate}`}
          </div>
        </div>
        <span style={{
          padding: '3px 10px', borderRadius: 'var(--radius-full)',
          fontSize: 11, fontWeight: 600, background: s.bg, color: s.color
        }}>
          {s.label}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <div style={{ background: 'var(--bg-elevated)', borderRadius: 6, padding: '8px 12px' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Позиций</div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{tender.items.length}</div>
        </div>
        <div style={{ background: 'var(--bg-elevated)', borderRadius: 6, padding: '8px 12px' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Тенд. сумма</div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 12 }}>{tenderSum > 0 ? Math.round(tenderSum).toLocaleString('ru') : '—'}</div>
        </div>
        <div style={{ background: 'var(--bg-elevated)', borderRadius: 6, padding: '8px 12px' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Разница</div>
          <div style={{ fontWeight: 700, fontSize: 12, color: diff < 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
            {tenderSum > 0 ? (diff < 0 ? '−' : '+') + Math.abs(Math.round(diff)).toLocaleString('ru') : '—'}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-primary)', fontSize: 13, fontWeight: 500 }}>
        Открыть тендер <ChevronRight size={16} />
      </div>
    </div>
  );
};

// ─── Tender Detail ─────────────────────────────────────────────────────────

const TenderDetail: React.FC<{ tender: Tender; onClose: () => void }> = ({ tender, onClose }) => {
  const items = useProcurementStore(state => state.items);
  const updateTender = useProcurementStore(state => state.updateTender);
  const attachItemsToTender = useProcurementStore(state => state.attachItemsToTender);
  const removeItemFromTender = useProcurementStore(state => state.removeItemFromTender);

  const [showAttach, setShowAttach] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [savingStatus, setSavingStatus] = useState(false);

  // items not yet in this tender (or in any tender)
  const availableItems = items.filter(i => !i.tenderId && i.status !== 'delivered');

  const handleStatusChange = async (status: string) => {
    setSavingStatus(true);
    await updateTender(tender.id, { status });
    setSavingStatus(false);
  };

  const handleAttach = async () => {
    if (selectedIds.size === 0) return;
    await attachItemsToTender(tender.id, Array.from(selectedIds));
    setSelectedIds(new Set());
    setShowAttach(false);
  };

  const toggleId = (id: string) => {
    setSelectedIds(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const s = getTenderStatus(tender.status);
  const tenderSum = tender.items.reduce((acc, item) => acc + item.quantity * item.tenderPrice, 0);

  return (
    <div className="modal-overlay" style={{ alignItems: 'flex-start', paddingTop: 48 }}>
      <div className="modal" style={{ maxWidth: 700, maxHeight: '85vh' }}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">{tender.number || 'Тендер #' + tender.id.slice(-6)}</h3>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              {tender.startDate} {tender.endDate && `→ ${tender.endDate}`}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Status changer */}
            <select
              className="form-control select-control"
              value={tender.status}
              onChange={e => handleStatusChange(e.target.value)}
              disabled={savingStatus}
              style={{ height: 28, fontSize: 12, color: s.color }}
            >
              {TENDER_STATUSES.map(ts => <option key={ts.value} value={ts.value}>{ts.label}</option>)}
            </select>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {/* Stats */}
          <div className="mobile-1-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 4 }}>
            <div style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '12px 16px' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Позиций</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{tender.items.length}</div>
            </div>
            <div style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '12px 16px' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Тендерная сумма</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{Math.round(tenderSum).toLocaleString('ru')}</div>
            </div>
            <div style={{ background: 'var(--color-primary-light)', borderRadius: 8, padding: '12px 16px', border: '1px solid var(--color-primary-glow)' }}>
              <div style={{ fontSize: 10, color: 'var(--color-primary)', textTransform: 'uppercase', marginBottom: 6 }}>Статус</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: s.color }}>{s.label}</div>
            </div>
          </div>

          {/* Items in this tender */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Позиции в тендере</h4>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowAttach(true)}>
                <Plus size={14} /> Добавить позиции
              </button>
            </div>

            {tender.items.length === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                <Package size={24} style={{ opacity: 0.4, marginBottom: 8 }} />
                <div>Нет позиций. Добавьте позиции из закупочных заявок.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {tender.items.map(item => {
                  const base = item.quantity * item.supplierPrice;
                  const broker = item.brokerAmount > 0 ? item.brokerAmount : (base * (item.brokerPct / 100));
                  const add = item.logisticsCost + item.certification + item.customs + item.otherExpenses;
                  const netPrice = item.quantity > 0 ? (base + broker + add) / item.quantity : 0;
                  const diff = item.tenderPrice - netPrice;

                  return (
                    <div
                      key={item.id}
                      style={{
                        display: 'grid', gridTemplateColumns: '1fr auto auto auto',
                        alignItems: 'center', gap: 16,
                        padding: '10px 14px', borderRadius: 8,
                        background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 13, color: 'var(--text-primary)' }}>{item.productName}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.quantity} {item.unit}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Тенд.</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{item.tenderPrice > 0 ? item.tenderPrice.toLocaleString('ru') : '—'}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Разница</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: diff < 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                          {item.tenderPrice > 0 && netPrice > 0 ? (diff < 0 ? '−' : '+') + Math.abs(Math.round(diff)).toLocaleString('ru') : '—'}
                        </div>
                      </div>
                      <button
                        onClick={() => removeItemFromTender(tender.id, item.id)}
                        title="Убрать из тендера"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, display: 'flex', borderRadius: 6, transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = 'var(--color-danger)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Winner block */}
          {tender.status === 'closed' && (
            <div style={{ marginTop: 8, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 8, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Trophy size={20} color="var(--color-success)" />
              <div>
                <div style={{ fontWeight: 600, color: 'var(--color-success)', fontSize: 14 }}>Тендер закрыт</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                  {tender.winnerId ? `Победитель ID: ${tender.winnerId}` : 'Победитель не указан'}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Закрыть</button>
          {tender.status === 'active' && (
            <button className="btn btn-primary" onClick={() => handleStatusChange('closed')} style={{ background: 'var(--color-success)', borderColor: 'var(--color-success)' }}>
              <Trophy size={16} /> Закрыть тендер
            </button>
          )}
        </div>
      </div>

      {/* Attach items sub-modal */}
      {showAttach && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal" style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h3 className="modal-title">Добавить позиции в тендер</h3>
              <button onClick={() => { setShowAttach(false); setSelectedIds(new Set()); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ maxHeight: 350, overflowY: 'auto', padding: '0 24px' }}>
              {availableItems.length === 0 ? (
                <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Все рассчитанные позиции уже в тендерах
                </div>
              ) : (
                availableItems.map(item => (
                  <label
                    key={item.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
                      borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(item.id)}
                      onChange={() => toggleId(item.id)}
                      style={{ width: 16, height: 16, accentColor: 'var(--color-primary)', cursor: 'pointer' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{item.productName}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.quantity} {item.unit} · {item.request?.number || 'Заявка #' + item.requestId.slice(-4)}</div>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'right' }}>
                      {item.tenderPrice > 0 ? item.tenderPrice.toLocaleString('ru') : '—'}
                    </div>
                  </label>
                ))
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => { setShowAttach(false); setSelectedIds(new Set()); }}>Отмена</button>
              <button className="btn btn-primary" onClick={handleAttach} disabled={selectedIds.size === 0}>
                Добавить {selectedIds.size > 0 && `(${selectedIds.size})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main View ─────────────────────────────────────────────────────────────

const ProcurementTenders: React.FC = () => {
  const tenders = useProcurementStore(state => state.tenders);
  const loadTenders = useProcurementStore(state => state.loadTenders);
  const loadItems = useProcurementStore(state => state.loadItems);
  const createTender = useProcurementStore(state => state.createTender);

  const [selectedTender, setSelectedTender] = useState<Tender | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ number: '', startDate: '', endDate: '', comment: '' });

  useEffect(() => {
    loadTenders();
    loadItems();
  }, [loadTenders, loadItems]);

  // Keep selectedTender in sync with store updates
  useEffect(() => {
    if (selectedTender) {
      const updated = tenders.find(t => t.id === selectedTender.id);
      if (updated) setSelectedTender(updated);
    }
  }, [tenders]);

  const handleCreate = async () => {
    const tender = await createTender(form);
    setShowCreate(false);
    setForm({ number: '', startDate: '', endDate: '', comment: '' });
    setSelectedTender(tender);
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button className="btn btn-primary" style={{ fontSize: 12, padding: '4px 10px', height: 28, gap: 5 }} onClick={() => setShowCreate(true)}>
          <Plus size={12} /> Создать тендер
        </button>
      </div>

      {tenders.length === 0 ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Trophy size={40} style={{ opacity: 0.3, marginBottom: 16 }} />
          <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>Нет тендеров</div>
          <div style={{ fontSize: 13 }}>Создайте тендер и привяжите к нему закупочные позиции</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {tenders.map(t => (
            <TenderCard key={t.id} tender={t} onSelect={setSelectedTender} />
          ))}
        </div>
      )}

      {/* Create tender modal */}
      {showCreate && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Новый тендер</h3>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Номер тендера</label>
                <input type="text" className="form-control" value={form.number} onChange={e => setForm({ ...form, number: e.target.value })} placeholder="Т-2024-001" />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Дата начала</label>
                  <input type="date" className="form-control" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Дата окончания</label>
                  <input type="date" className="form-control" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Комментарий</label>
                <textarea className="form-control" value={form.comment} onChange={e => setForm({ ...form, comment: e.target.value })} rows={2} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Отмена</button>
              <button className="btn btn-primary" onClick={handleCreate}>Создать</button>
            </div>
          </div>
        </div>
      )}

      {/* Tender detail */}
      {selectedTender && (
        <TenderDetail
          tender={selectedTender}
          onClose={() => setSelectedTender(null)}
        />
      )}
    </div>
  );
};

export default ProcurementTenders;
