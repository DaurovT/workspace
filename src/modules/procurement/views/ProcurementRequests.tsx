import React, { useState } from 'react';
import { useProcurementStore, type ProcurementRequest } from '../procurementStore';
import { Plus, Upload, FileSpreadsheet, ChevronDown, X, List, Calendar, User, MessageSquare } from 'lucide-react';
import ExcelImportModal from '../components/ExcelImportModal';

// ─── Status config ─────────────────────────────────────────────────────────

const REQUEST_STATUSES = [
  { value: 'open',        label: 'Открыта',      color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  { value: 'in_progress', label: 'В работе',     color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
  { value: 'in_tender',   label: 'В тендере',    color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  { value: 'ordered',     label: 'Заказана',     color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  { value: 'closed',      label: 'Закрыта',      color: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
  { value: 'cancelled',   label: 'Отменена',     color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
];

const getReqStatus = (val: string) => REQUEST_STATUSES.find(s => s.value === val) || REQUEST_STATUSES[0];

// ─── Status Badge with dropdown ────────────────────────────────────────────

const RequestStatusBadge: React.FC<{ req: ProcurementRequest; onUpdate: (id: string, status: string) => void }> = ({ req, onUpdate }) => {
  const [open, setOpen] = useState(false);
  const s = getReqStatus(req.status);
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '3px 10px', background: s.bg, color: s.color,
          border: 'none', borderRadius: 'var(--radius-full)',
          fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap'
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
        {s.label}
        <ChevronDown size={10} style={{ opacity: 0.7 }} />
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />
          <div style={{
            position: 'absolute', top: '100%', left: 0, marginTop: 4,
            background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)', padding: 4, minWidth: 160,
            boxShadow: 'var(--shadow-md)', zIndex: 100, display: 'flex', flexDirection: 'column', gap: 1
          }}>
            {REQUEST_STATUSES.map(st => (
              <button
                key={st.value}
                onClick={() => { onUpdate(req.id, st.value); setOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
                  background: req.status === st.value ? 'var(--bg-active)' : 'transparent',
                  color: req.status === st.value ? 'var(--color-primary)' : 'var(--text-secondary)',
                  border: 'none', borderRadius: 6, cursor: 'pointer', textAlign: 'left',
                  fontSize: 12, fontWeight: req.status === st.value ? 600 : 400, transition: 'all 0.1s'
                }}
                onMouseEnter={e => { if (req.status !== st.value) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                onMouseLeave={e => { if (req.status !== st.value) e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: st.color, flexShrink: 0 }} />
                {st.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ─── Request Slide Panel ────────────────────────────────────────────────────

const RequestPanel: React.FC<{ req: ProcurementRequest; onClose: () => void; onStatusChange: (id: string, status: string) => void }> = ({ req, onClose, onStatusChange }) => {
  const items = useProcurementStore(state => state.items);
  const reqItems = items.filter(i => i.requestId === req.id);

  const totalTender = reqItems.reduce((a, i) => a + i.quantity * i.tenderPrice, 0);
  const totalNet = reqItems.reduce((a, i) => {
    const base = i.quantity * i.supplierPrice;
    const broker = i.brokerAmount > 0 ? i.brokerAmount : (base * (i.brokerPct / 100));
    const add = i.logisticsCost + i.certification + i.customs + i.otherExpenses;
    return a + base + broker + add;
  }, 0);
  const diff = totalTender - totalNet;

  return (
    <div className="slide-panel-mobile-full" style={{
      position: 'absolute', top: 0, right: 0, bottom: 0, width: 420,
      background: 'var(--bg-base)', borderLeft: '1px solid var(--border-default)',
      boxShadow: '-4px 0 24px rgba(0,0,0,0.1)', zIndex: 10, display: 'flex', flexDirection: 'column',
      transform: 'translateX(0)', transition: 'transform 0.3s ease'
    }}>
      <style>{`@keyframes slideInRight { from { transform: translateX(100%) } to { transform: translateX(0) } }`}</style>

      {/* Header */}
      <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
            {req.number || 'Без номера'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <RequestStatusBadge req={req} onUpdate={onStatusChange} />
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
          <X size={20} />
        </button>
      </div>

      {/* Meta */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-secondary)', fontSize: 13 }}>
          <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
          {req.dateStr || '—'}
        </div>
        {req.initiator && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-secondary)', fontSize: 13 }}>
            <User size={14} style={{ color: 'var(--text-muted)' }} />
            {req.initiator}
          </div>
        )}
        {req.department && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-secondary)', fontSize: 13 }}>
            <List size={14} style={{ color: 'var(--text-muted)' }} />
            {req.department}
          </div>
        )}
        {req.comment && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, color: 'var(--text-secondary)', fontSize: 13 }}>
            <MessageSquare size={14} style={{ color: 'var(--text-muted)', marginTop: 2 }} />
            {req.comment}
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <div style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '10px 12px' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Позиций</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{reqItems.length}</div>
        </div>
        <div style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '10px 12px' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Тенд. сумма</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{totalTender > 0 ? Math.round(totalTender).toLocaleString('ru') : '—'}</div>
        </div>
        <div style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '10px 12px' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Экономия</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: diff >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
            {totalTender > 0 ? (diff >= 0 ? '+' : '−') + Math.abs(Math.round(diff)).toLocaleString('ru') : '—'}
          </div>
        </div>
      </div>

      {/* Items list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>Позиции заявки</div>
        {reqItems.length === 0 ? (
          <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            Нет позиций в этой заявке
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {reqItems.map(item => {
              const base = item.quantity * item.supplierPrice;
              const broker = item.brokerAmount > 0 ? item.brokerAmount : base * (item.brokerPct / 100);
              const add = item.logisticsCost + item.certification + item.customs + item.otherExpenses;
              const net = item.quantity > 0 ? (base + broker + add) / item.quantity : 0;
              const d = item.tenderPrice - net;
              return (
                <div key={item.id} style={{
                  background: 'var(--bg-elevated)', borderRadius: 8,
                  border: '1px solid var(--border-subtle)', padding: '10px 14px',
                  display: 'flex', alignItems: 'center', gap: 12
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{item.productName}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{item.quantity} {item.unit}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {item.tenderPrice > 0 ? item.tenderPrice.toLocaleString('ru') : '—'}
                    </div>
                    {item.tenderPrice > 0 && net > 0 && (
                      <div style={{ fontSize: 11, fontWeight: 600, color: d >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                        {(d >= 0 ? '+' : '−') + Math.abs(Math.round(d)).toLocaleString('ru')}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main view ─────────────────────────────────────────────────────────────

const ProcurementRequests: React.FC = () => {
  const requests = useProcurementStore(state => state.requests);
  const createRequest = useProcurementStore(state => state.createRequest);
  const updateRequest = useProcurementStore(state => state.updateRequest);

  const [showModal, setShowModal] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [selectedReq, setSelectedReq] = useState<ProcurementRequest | null>(null);
  const [formData, setFormData] = useState({
    number: '', dateStr: new Date().toISOString().split('T')[0],
    initiator: '', department: '', comment: ''
  });

  const handleCreate = async () => {
    const created = await createRequest(formData);
    setShowModal(false);
    setFormData({ number: '', dateStr: new Date().toISOString().split('T')[0], initiator: '', department: '', comment: '' });
    setSelectedReq(created);
  };

  const handleStatusChange = (id: string, status: string) => {
    updateRequest(id, { status });
    if (selectedReq?.id === id) setSelectedReq(r => r ? { ...r, status } : r);
  };

  return (
    <div style={{ display: 'flex', gap: 0, position: 'relative' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: 12, gap: 6 }}>
          <button className="btn btn-secondary" style={{ fontSize: 12, padding: '4px 10px', height: 28, gap: 5 }} onClick={() => setShowImport(true)}>
            <Upload size={12} /> Импорт Excel
          </button>
          <button className="btn btn-primary" style={{ fontSize: 12, padding: '4px 10px', height: 28, gap: 5 }} onClick={() => setShowModal(true)}>
            <Plus size={12} /> Создать заявку
          </button>
        </div>

        {/* Table */}
        <div className="table-responsive" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8 }}>
          <table style={{ width: '100%', minWidth: 800, borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)' }}>
                {['Номер', 'Дата', 'Инициатор', 'Отдел', 'Позиций', 'Статус'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--text-muted)', fontSize: 'var(--text-xs)', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
                    <FileSpreadsheet size={32} style={{ opacity: 0.4, marginBottom: 12 }} />
                    <div>Нет созданных заявок</div>
                  </td>
                </tr>
              ) : (
                requests.map(req => {
                  const isSelected = selectedReq?.id === req.id;
                  return (
                    <tr
                      key={req.id}
                      onClick={() => setSelectedReq(isSelected ? null : req)}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer',
                        background: isSelected ? 'var(--bg-selected)' : 'transparent',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{req.number || '—'}</div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-secondary)' }}>{req.dateStr}</td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-secondary)' }}>{req.initiator || '—'}</td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-secondary)' }}>{req.department || '—'}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{req._count?.items ?? 0}</td>
                      <td style={{ padding: '12px 16px' }} onClick={e => e.stopPropagation()}>
                        <RequestStatusBadge req={req} onUpdate={handleStatusChange} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide panel */}
      {selectedReq && (
        <RequestPanel
          req={selectedReq}
          onClose={() => setSelectedReq(null)}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Create modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Новая заявка</h3>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', gap: 12 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Номер заявки</label>
                  <input type="text" className="form-control" value={formData.number} onChange={e => setFormData({ ...formData, number: e.target.value })} placeholder="ЗАК-001" />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Дата</label>
                  <input type="date" className="form-control" value={formData.dateStr} onChange={e => setFormData({ ...formData, dateStr: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Инициатор</label>
                  <input type="text" className="form-control" value={formData.initiator} onChange={e => setFormData({ ...formData, initiator: e.target.value })} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Отдел</label>
                  <input type="text" className="form-control" value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Комментарий</label>
                <textarea className="form-control" value={formData.comment} onChange={e => setFormData({ ...formData, comment: e.target.value })} rows={2} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Отмена</button>
              <button className="btn btn-primary" onClick={handleCreate}>Создать</button>
            </div>
          </div>
        </div>
      )}

      {showImport && <ExcelImportModal onClose={() => setShowImport(false)} />}
    </div>
  );
};

export default ProcurementRequests;
