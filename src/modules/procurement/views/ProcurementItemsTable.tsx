import { toast } from '../../../lib/toast';
import React, { useState, useMemo } from 'react';
import { useProcurementStore, type ProcurementItem } from '../procurementStore';
import { Plus, Calculator, Settings2, Upload, Search, X, ChevronDown } from 'lucide-react';
import ProcurementCalculator from '../components/ProcurementCalculator';
import ExcelImportModal from '../components/ExcelImportModal';

// ─── Status config ──────────────────────────────────────────────────────────

const STATUSES = [
  { value: 'new',        label: 'Новая',       color: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
  { value: 'calculated', label: 'Рассчитана',  color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  { value: 'in_tender',  label: 'В тендере',   color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
  { value: 'ordered',    label: 'Заказана',    color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  { value: 'delivered',  label: 'Доставлена',  color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  { value: 'problem',    label: 'Проблема',    color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
];

const getStatus = (val: string) => STATUSES.find(s => s.value === val) || STATUSES[0];

// ─── StatusBadge with inline dropdown ───────────────────────────────────────

const StatusBadge: React.FC<{ item: ProcurementItem; onUpdate: (id: string, status: string) => void }> = ({ item, onUpdate }) => {
  const [open, setOpen] = useState(false);
  const s = getStatus(item.status);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '3px 8px 3px 8px',
          background: s.bg, color: s.color,
          border: 'none', borderRadius: 'var(--radius-full)',
          fontSize: 11, fontWeight: 600, cursor: 'pointer',
          transition: 'opacity 0.15s',
          whiteSpace: 'nowrap'
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
            borderRadius: 'var(--radius-md)', padding: 4, minWidth: 150,
            boxShadow: 'var(--shadow-md)', zIndex: 100, display: 'flex', flexDirection: 'column', gap: 1
          }}>
            {STATUSES.map(st => (
              <button
                key={st.value}
                onClick={() => { onUpdate(item.id, st.value); setOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
                  background: item.status === st.value ? 'var(--bg-active)' : 'transparent',
                  color: item.status === st.value ? 'var(--color-primary)' : 'var(--text-secondary)',
                  border: 'none', borderRadius: 6, cursor: 'pointer', textAlign: 'left',
                  fontSize: 12, fontWeight: item.status === st.value ? 600 : 400,
                  transition: 'all 0.1s'
                }}
                onMouseEnter={e => { if (item.status !== st.value) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                onMouseLeave={e => { if (item.status !== st.value) e.currentTarget.style.background = 'transparent'; }}
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

// ─── Main Component ──────────────────────────────────────────────────────────

const ProcurementItemsTable: React.FC = () => {
  const items = useProcurementStore(state => state.items);
  const requests = useProcurementStore(state => state.requests);
  const createItem = useProcurementStore(state => state.createItem);
  const updateItem = useProcurementStore(state => state.updateItem);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [activeItemForCalc, setActiveItemForCalc] = useState<ProcurementItem | null>(null);

  // ─── Filters ───────────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterRequest, setFilterRequest] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // ─── Add form ──────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    requestId: '', productName: '', unit: 'кг', quantity: 1, tenderPrice: 0, supplierPrice: 0
  });

  const handleCreate = async () => {
    if (!formData.requestId || !formData.productName) { toast.error('Заполните заявку и название продукта'); return; }
    await createItem(formData);
    setShowAddModal(false);
  };

  const handleStatusChange = (id: string, status: string) => {
    updateItem(id, { status });
  };

  // ─── Filtered data ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return items.filter(item => {
      if (filterStatus && item.status !== filterStatus) return false;
      if (filterRequest && item.requestId !== filterRequest) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!item.productName.toLowerCase().includes(q) &&
            !(item.category?.toLowerCase().includes(q)) &&
            !(item.request?.number?.toLowerCase().includes(q))) return false;
      }
      return true;
    });
  }, [items, filterStatus, filterRequest, search]);

  const hasFilters = search || filterStatus || filterRequest;

  return (
    <div>
      {/* ─── Toolbar ─── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
          {filtered.length !== items.length ? `${filtered.length} из ${items.length} позиций` : `${items.length} позиций`}
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-secondary" style={{ fontSize: 12, padding: '4px 10px', height: 28, gap: 5 }} onClick={() => setShowImport(true)}>
            <Upload size={12} /> Импорт Excel
          </button>
          <button
            className="btn btn-secondary"
            style={{ fontSize: 12, padding: '4px 10px', height: 28, gap: 5, color: hasFilters ? 'var(--color-primary)' : undefined }}
            onClick={() => setShowFilters(f => !f)}
          >
            <Settings2 size={12} /> Фильтры {hasFilters && '•'}
          </button>
          <button className="btn btn-primary" style={{ fontSize: 12, padding: '4px 10px', height: 28, gap: 5 }} onClick={() => setShowAddModal(true)}>
            <Plus size={12} /> Добавить
          </button>
        </div>
      </div>

      {/* ─── Search + Filter Bar ─── */}
      {showFilters && (
        <div style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)', padding: '16px 20px', marginBottom: 16,
          display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap'
        }}>
          {/* Search */}
          <div style={{ flex: 2, minWidth: 200 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Поиск</div>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-control"
                placeholder="Название товара, категория..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft: 32 }}
              />
            </div>
          </div>

          {/* Status filter */}
          <div style={{ flex: 1, minWidth: 160 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Статус</div>
            <select className="form-control select-control" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">Все статусы</option>
              {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          {/* Request filter */}
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Заявка</div>
            <select className="form-control select-control" value={filterRequest} onChange={e => setFilterRequest(e.target.value)}>
              <option value="">Все заявки</option>
              {requests.map(r => <option key={r.id} value={r.id}>{r.number || 'Заявка от ' + r.dateStr}</option>)}
            </select>
          </div>

          {/* Clear */}
          {hasFilters && (
            <button
              className="btn btn-ghost"
              onClick={() => { setSearch(''); setFilterStatus(''); setFilterRequest(''); }}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <X size={14} /> Сбросить
            </button>
          )}
        </div>
      )}

      {/* ─── Table ─── */}
      <div className="table-responsive" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
        <table style={{ width: '100%', minWidth: 1100, borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)' }}>
              {[
                ['Товар / Заявка', 'left'],
                ['Статус', 'center'],
                ['Кол-во', 'right'],
                ['Тенд. цена', 'right'],
                ['Цена пост-ка', 'right'],
                ['Приводная', 'right'],
                ['Разница / ед.', 'right'],
                ['Дата', 'center'],
                ['', 'center'],
              ].map(([h, align]) => (
                <th key={h} style={{ padding: '6px 12px', fontWeight: 600, color: 'var(--text-muted)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: align as any, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
                  {hasFilters ? 'Нет позиций по выбранным фильтрам' : 'Нет закупочных позиций'}
                </td>
              </tr>
            ) : (
              filtered.map(item => {
                const baseSum = item.quantity * item.supplierPrice;
                const broker = item.brokerAmount > 0 ? item.brokerAmount : (baseSum * (item.brokerPct / 100));
                const additional = item.logisticsCost + item.certification + item.customs + item.otherExpenses;
                const netPrice = item.quantity > 0 ? ((baseSum + broker + additional) / item.quantity) : 0;
                const diff = item.tenderPrice - netPrice;
                const isNegative = diff < 0;
                const isOverdue = item.plannedDate && !item.actualDate && new Date(item.plannedDate) < new Date();

                return (
                  <tr
                    key={item.id}
                    style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '6px 12px' }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{item.productName}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        {item.category && <span style={{ marginRight: 8 }}>{item.category}</span>}
                        {item.request?.number || 'Заявка #' + item.requestId.slice(-4)}
                      </div>
                    </td>

                    <td style={{ padding: '6px 12px', textAlign: 'center' }}>
                      <StatusBadge item={item} onUpdate={handleStatusChange} />
                    </td>

                    <td style={{ padding: '6px 12px', fontSize: 13, textAlign: 'right', color: 'var(--text-primary)' }}>
                      {item.quantity} <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{item.unit}</span>
                    </td>

                    <td style={{ padding: '6px 12px', fontSize: 13, textAlign: 'right', color: 'var(--text-secondary)' }}>
                      {item.tenderPrice > 0 ? item.tenderPrice.toLocaleString('ru') : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>

                    <td style={{ padding: '6px 12px', fontSize: 13, textAlign: 'right', color: 'var(--text-secondary)' }}>
                      {item.supplierPrice > 0 ? item.supplierPrice.toLocaleString('ru') : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>

                    <td style={{ padding: '6px 12px', fontSize: 13, textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {netPrice > 0 ? Math.round(netPrice).toLocaleString('ru') : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>

                    <td style={{ padding: '6px 12px', fontSize: 13, textAlign: 'right', fontWeight: 600, color: isNegative ? 'var(--color-danger)' : 'var(--color-success)' }}>
                      {item.tenderPrice > 0 && netPrice > 0
                        ? (isNegative ? '−' : '+') + Math.abs(Math.round(diff)).toLocaleString('ru')
                        : <span style={{ color: 'var(--text-muted)' }}>—</span>
                      }
                    </td>

                    <td style={{ padding: '6px 12px', fontSize: 12, textAlign: 'center', color: isOverdue ? 'var(--color-danger)' : 'var(--text-secondary)', fontWeight: isOverdue ? 600 : 400 }}>
                      {item.actualDate
                        ? <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>✓ {item.actualDate}</span>
                        : item.plannedDate
                          ? item.plannedDate + (isOverdue ? ' ⚠' : '')
                          : <span style={{ color: 'var(--text-muted)' }}>Не задан</span>
                      }
                    </td>

                    <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                      <button
                        onClick={() => setActiveItemForCalc(item)}
                        title="Калькулятор стоимости"
                        style={{
                          background: 'transparent', border: '1px solid transparent', borderRadius: 6,
                          color: 'var(--color-warning)', cursor: 'pointer', padding: 5,
                          display: 'inline-flex', alignItems: 'center', transition: 'all 0.15s'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
                      >
                        <Calculator size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ─── Modals ─── */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Новая позиция</h3>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Заявка</label>
                <select className="form-control select-control" value={formData.requestId} onChange={e => setFormData({ ...formData, requestId: e.target.value })}>
                  <option value="">Выберите заявку...</option>
                  {requests.map(r => <option key={r.id} value={r.id}>{r.number || 'Заявка от ' + r.dateStr}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Название товара</label>
                <input type="text" className="form-control" value={formData.productName} onChange={e => setFormData({ ...formData, productName: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Кол-во</label>
                  <input type="number" className="form-control" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: parseFloat(e.target.value) })} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Ед. изм.</label>
                  <input type="text" className="form-control" value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Тендерная цена</label>
                  <input type="number" className="form-control" value={formData.tenderPrice} onChange={e => setFormData({ ...formData, tenderPrice: parseFloat(e.target.value) })} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Цена поставщика</label>
                  <input type="number" className="form-control" value={formData.supplierPrice} onChange={e => setFormData({ ...formData, supplierPrice: parseFloat(e.target.value) })} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Отмена</button>
              <button className="btn btn-primary" onClick={handleCreate}>Добавить</button>
            </div>
          </div>
        </div>
      )}

      {activeItemForCalc && (
        <ProcurementCalculator item={activeItemForCalc} onClose={() => setActiveItemForCalc(null)} />
      )}

      {showImport && <ExcelImportModal onClose={() => setShowImport(false)} />}
    </div>
  );
};

export default ProcurementItemsTable;
