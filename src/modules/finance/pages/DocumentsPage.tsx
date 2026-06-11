import React, { useState, useMemo } from 'react';
import { FileText, Plus, Send, Download, CheckCircle2, Clock, XCircle, AlertCircle, Filter, Trash2 } from 'lucide-react';
import { useFinanceStore } from '../financeStore';
import { APP_CURRENCY_SYMBOL } from '../config/currency';
import { useTranslation } from 'react-i18next';

type DocStatus = 'draft' | 'issued' | 'partially_paid' | 'paid' | 'cancelled';
type DocType = 'invoice' | 'act' | 'upd' | 'reconciliation';

interface DocLineItem {
  id: string;
  name: string;
  unit: string;
  qty: number;
  price: number;
  vatRate: number;
}

interface Document {
  id: string;
  number: string;
  type: DocType;
  status: DocStatus;
  date: string;
  contractorId: string;
  dealId?: string;
  items: DocLineItem[];
  totalAmount: number;
  vatAmount: number;
  paidAmount: number;
}

const STATUS_META: Record<DocStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  draft:          { label: 'Черновик',       color: 'var(--text-secondary)', bg: 'rgba(148,163,184,0.1)', icon: <Clock size={12} /> },
  issued:         { label: 'Выставлен',      color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  icon: <Send size={12} /> },
  partially_paid: { label: "Частично оплачен", color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', icon: <AlertCircle size={12} /> },
  paid:           { label: 'Оплачено',        color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: <CheckCircle2 size={12} /> },
  cancelled:      { label: 'Аннулирован',    color: '#ef4444', bg: 'rgba(239,68,68,0.1)',  icon: <XCircle size={12} /> },
};

const TYPE_META: Record<DocType, { label: string; short: string }> = {
  invoice:        { label: 'Счёт на оплату',       short: "СЧ" },
  act:            { label: 'Акт выполненных работ', short: 'АКТ' },
  upd:            { label: 'УПД / ТОРГ-12',         short: 'УПД' },
  reconciliation: { label: 'Акт сверки',            short: 'АСВ' },
};

const genNumber = (type: DocType) => {
  const prefix = { invoice: 'INV', act: 'ACT', upd: 'УПД', reconciliation: 'REC' }[type];
  return `${prefix}-2026-${String(Math.floor(Math.random() * 900) + 100)}`;
};

const DocumentsPage: React.FC = () => {
  const { t } = useTranslation();
    const { contractors } = useFinanceStore();
  const [docs, setDocs] = useState<Document[]>([
    {
      id: 'doc1', number: 'INV-2026-001', type: 'invoice', status: 'paid',
      date: '2026-04-09', contractorId: 'c1', dealId: 'd1',
      items: [
        { id: 'i1', name: 'Техническая поддержка (Месяц)', unit: 'мес', qty: 2, price: 45000, vatRate: 0 },
        { id: 'i2', name: 'Консалтинг по API', unit: 'час', qty: 10, price: 5000, vatRate: 0 },
      ],
      totalAmount: 140000, vatAmount: 0, paidAmount: 140000,
    },
    {
      id: 'doc2', number: 'ACT-2026-001', type: 'act', status: 'issued',
      date: '2026-04-17', contractorId: 'c1', dealId: 'd1',
      items: [{ id: 'i3', name: 'Техническая поддержка (Месяц)', unit: 'мес', qty: 2, price: 45000, vatRate: 0 }],
      totalAmount: 90000, vatAmount: 0, paidAmount: 0,
    },
    {
      id: 'doc3', number: 'INV-2026-002', type: 'invoice', status: 'draft',
      date: '2026-04-19', contractorId: 'c2', dealId: 'd3',
      items: [{ id: 'i4', name: 'Ноутбук Lenovo ThinkPad X1', unit: 'шт.', qty: 5, price: 150000, vatRate: 20 }],
      totalAmount: 750000, vatAmount: 150000, paidAmount: 0,
    },
    {
      id: 'doc4', number: 'INV-2026-003', type: 'invoice', status: 'partially_paid',
      date: '2026-04-14', contractorId: 'c5',
      items: [{ id: 'i5', name: 'Стол офисный угловой', unit: 'шт.', qty: 3, price: 18000, vatRate: 20 }],
      totalAmount: 54000, vatAmount: 10800, paidAmount: 27000,
    },
  ]);


  const [filterStatus, setFilterStatus] = useState<DocStatus | 'all'>('all');
  const [filterType, setFilterType] = useState<DocType | 'all'>('all');
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

  // New doc form
  const [newType, setNewType] = useState<DocType>('invoice');
  const [newContractor, setNewContractor] = useState(contractors[0]?.id || '');
  const [newItems, setNewItems] = useState<DocLineItem[]>([
    { id: '1', name: '', unit: 'шт.', qty: 1, price: 0, vatRate: 20 }
  ]);

  const filtered = useMemo(() => docs
    .filter(d => filterStatus === 'all' || d.status === filterStatus)
    .filter(d => filterType === 'all' || d.type === filterType), [docs, filterStatus, filterType]);

  const calcTotals = (items: DocLineItem[]) => {
    const sub = items.reduce((s, i) => s + i.qty * i.price, 0);
    const vat = items.reduce((s, i) => s + i.qty * i.price * (i.vatRate / 100), 0);
    return { sub, vat, total: sub + vat };
  };

  const addItem = () => setNewItems(prev => [...prev, { id: Date.now().toString(), name: '', unit: 'шт.', qty: 1, price: 0, vatRate: 20 }]);
  const updateItem = (idx: number, field: keyof DocLineItem, val: any) =>
    setNewItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: val } : it));
  const removeItem = (idx: number) => setNewItems(prev => prev.filter((_, i) => i !== idx));

  const handleCreate = () => {
    const { vat, total } = calcTotals(newItems);
    const doc: Document = {
      id: 'doc_' + Date.now(),
      number: genNumber(newType),
      type: newType,
      status: 'draft',
      date: new Date().toISOString().split('T')[0],
      contractorId: newContractor,
      items: newItems.filter(i => i.name),
      totalAmount: total,
      vatAmount: vat,
      paidAmount: 0,
    };
    setDocs(prev => [doc, ...prev]);
    setCreateOpen(false);
    setNewItems([{ id: '1', name: '', unit: 'шт.', qty: 1, price: 0, vatRate: 20 }]);
  };

  const advanceStatus = (docId: string) => {
    const flow: DocStatus[] = ['draft', 'issued', 'paid'];
    setDocs(prev => prev.map(d => {
      if (d.id !== docId) return d;
      const cur = flow.indexOf(d.status);
      const next = flow[cur + 1];
      if (!next) return d;
      return { ...d, status: next, paidAmount: next === 'paid' ? d.totalAmount : d.paidAmount };
    }));
  };

  const totalReceivable = docs.filter(d => d.type === 'invoice' && d.status !== 'cancelled').reduce((s, d) => s + (d.totalAmount - d.paidAmount), 0);
  const totalIssued = docs.filter(d => d.status === 'issued' || d.status === 'partially_paid').length;
  const totalPaid = docs.filter(d => d.status === 'paid').length;

  const inp: React.CSSProperties = { width: '100%', height: 30, padding: '0 8px', borderRadius: 6, background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontSize: 12, outline: 'none' };

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', background: 'var(--bg-base)' }}>
      {/* ── SIDEBAR ── */}
      {isSidebarOpen && (
      <div style={{ width: 240, flexShrink: 0, borderRight: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: 44, padding: '0 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <Filter size={12} color="var(--text-muted)" />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{t("Параметры и KPI", "Параметры и KPI")}</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
        </div>

        <div style={{ flex: 1, padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Filters */}
          
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 8 }}>{t("Статус документа", "Статус документа")}</div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} style={inp}>
              <option value="all">{t("Все статусы", "Все статусы")}</option>
              {(Object.keys(STATUS_META) as DocStatus[]).map(s => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
            </select>
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 8 }}>{t("Тип документа", "Тип документа")}</div>
            <select value={filterType} onChange={e => setFilterType(e.target.value as any)} style={inp}>
              <option value="all">{t("Все типы", "Все типы")}</option>
              {(Object.keys(TYPE_META) as DocType[]).map(t => <option key={t} value={t}>{TYPE_META[t].label}</option>)}
            </select>
          </div>

          {/* KPI Summary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 2 }}>{t("Сводка", "Сводка")}</div>
            {[
              { label: 'Всего документов', val: docs.length, type: 'count' },
              { label: 'Дебиторская задолженность', val: totalReceivable, color: '#f59e0b' },
              { label: 'Ожидают оплаты', val: totalIssued, type: 'count', color: '#3b82f6' },
              { label: 'Оплачено', val: totalPaid, type: 'count', color: '#10b981' },
            ].map((kpi, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'var(--bg-elevated)', borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{kpi.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: kpi.color || 'var(--text-primary)' }}>
                  {kpi.type === 'count' ? kpi.val : `${new Intl.NumberFormat('ru-RU', { notation: 'compact' }).format(kpi.val)} ${APP_CURRENCY_SYMBOL}`}
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
            <button onClick={() => setSidebarOpen(!isSidebarOpen)} style={{ background: isSidebarOpen ? 'var(--bg-card)' : 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <Filter size={12} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <span style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: -0.01 }}>{t("Документооборот (B2B Billing)", "Документооборот (B2B Billing)")}</span>
              <span title={t("Счета · Акты · УПД · Акты сверки", "Счета · Акты · УПД · Акты сверки")} style={{ cursor: 'pointer', display: 'flex', color: 'var(--text-muted)' }}>
                <FileText size={13} />
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <button onClick={() => setCreateOpen(true)} style={{
              background: 'var(--color-primary)', color: '#fff', border: 'none', padding: '0 14px', height: 28,
              borderRadius: 6, fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
              cursor: 'pointer', transition: 'transform 100ms'
            }} onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'} onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}>
              <Plus size={13} />  {t("Создать документ", "Создать документ")}
            </button>
          </div>
        </div>

      {/* Table Container */}
      <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1000 }}>
          <thead>
            <tr style={{ background: 'var(--bg-hover)' }}>
              {['Документ', 'Тип', 'Контрагент', 'Дата', 'Сумма', 'НДС', 'Оплачено', 'Статус', ''].map((h, i, arr) => (
                <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)', whiteSpace: 'nowrap',
                  borderTopLeftRadius: i === 0 ? 8 : 0, borderTopRightRadius: i === arr.length - 1 ? 8 : 0 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(doc => {
              const ctr = contractors.find(c => c.id === doc.contractorId);
              const st = STATUS_META[doc.status];
              const tp = TYPE_META[doc.type];
              const pct = doc.totalAmount > 0 ? doc.paidAmount / doc.totalAmount : 0;
              return (
                <tr key={doc.id} style={{ borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '8px 14px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 12 }}>{doc.number}</div>
                    {doc.dealId && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{t("сделка", "сделка")} {doc.dealId}</div>}
                  </td>
                  <td style={{ padding: '8px 14px' }}>
                    <span style={{ background: 'var(--bg-elevated)', color: 'var(--color-primary)', border: '1px solid var(--border-subtle)', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>{tp.short}</span>
                  </td>
                  <td style={{ padding: '8px 14px', fontSize: 12, color: 'var(--text-primary)', fontWeight: 600 }}>{ctr?.name || '—'}</td>
                  <td style={{ padding: '8px 14px', fontSize: 12, color: 'var(--text-secondary)' }}>{doc.date}</td>
                  <td style={{ padding: '8px 14px', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{new Intl.NumberFormat('ru-RU').format(doc.totalAmount)}</td>
                  <td style={{ padding: '8px 14px', fontSize: 12, color: doc.vatAmount > 0 ? '#f59e0b' : 'var(--text-muted)' }}>
                    {doc.vatAmount > 0 ? new Intl.NumberFormat('ru-RU').format(doc.vatAmount) : 'Без НДС'}
                  </td>
                  <td style={{ padding: '8px 14px' }}>
                    <div style={{ fontSize: 11, color: pct === 1 ? '#10b981' : pct > 0 ? '#3b82f6' : 'var(--text-muted)', marginBottom: 3 }}>
                      {new Intl.NumberFormat('ru-RU').format(doc.paidAmount)} / {new Intl.NumberFormat('ru-RU').format(doc.totalAmount)}
                    </div>
                    <div style={{ height: 3, background: 'var(--border-subtle)', borderRadius: 2, overflow: 'hidden', width: 80 }}>
                      <div style={{ width: `${pct * 100}%`, height: '100%', background: pct === 1 ? '#10b981' : '#3b82f6', borderRadius: 2 }} />
                    </div>
                  </td>
                  <td style={{ padding: '8px 14px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'transparent', color: st.color, padding: 0, borderRadius: 0, fontSize: 11, fontWeight: 500 }}>
                      {st.icon} {st.label}
                    </span>
                  </td>
                  <td style={{ padding: '8px 14px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      {doc.status === 'draft' && (
                        <button onClick={e => { e.stopPropagation(); advanceStatus(doc.id); }}
                          style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)', padding: '4px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Send size={11} />  {t("Выставить", "Выставить")}
                        </button>
                      )}
                      {doc.status === 'issued' && (
                        <button onClick={e => { e.stopPropagation(); advanceStatus(doc.id); }}
                          style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)', padding: '4px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <CheckCircle2 size={11} />  {t("Оплачено", "Оплачено")}
                        </button>
                      )}
                      <button onClick={e => { e.stopPropagation(); }}
                        style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)', padding: '4px 8px', borderRadius: 6, fontSize: 11, cursor: 'pointer' }}>
                        <Download size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
            <FileText size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
            <div style={{ fontSize: 14 }}>{t("Документы не найдены", "Документы не найдены")}</div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {isCreateOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 998 }}>
          <div style={{ background: 'var(--bg-surface)', width: 680, maxHeight: '90vh', borderRadius: 12, border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{t("Новый документ", "Новый документ")}</h2>
              <button onClick={() => setCreateOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 18 }}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label htmlFor="doc-type" style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 5 }}>{t("Тип документа", "Тип документа")}</label>
                  <select id="doc-type" name="docType" value={newType} onChange={e => setNewType(e.target.value as DocType)} style={inp}>
                    {(Object.keys(TYPE_META) as DocType[]).map(t => <option key={t} value={t}>{TYPE_META[t].label}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="doc-contractor" style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 5 }}>{t("Покупатель *", "Покупатель *")}</label>
                  <select id="doc-contractor" name="docContractor" value={newContractor} onChange={e => setNewContractor(e.target.value)} style={inp}>
                    {contractors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Line items */}
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>{t("Товарная матрица", "Товарная матрица")}</div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      {['Наименование', 'Ед.', 'Кол.', 'Цена', 'НДС%', 'Сумма', ''].map(h => (
                        <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontSize: 11, color: 'var(--text-muted)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {newItems.map((item, idx) => {
                      const rowTotal = item.qty * item.price * (1 + item.vatRate / 100);
                      return (
                        <tr key={item.id}>
                          <td style={{ padding: '4px 4px' }}><input id={`item-name-${idx}`} name={`itemName${idx}`} value={item.name} onChange={e => updateItem(idx, 'name', e.target.value)} placeholder={t("Наименование", "Наименование")} style={{ ...inp, width: '100%' }} /></td>
                          <td style={{ padding: '4px 4px', width: 50 }}><input id={`item-unit-${idx}`} name={`itemUnit${idx}`} value={item.unit} onChange={e => updateItem(idx, 'unit', e.target.value)} style={{ ...inp, width: 50 }} /></td>
                          <td style={{ padding: '4px 4px', width: 60 }}><input id={`item-qty-${idx}`} name={`itemQty${idx}`} type="number" value={item.qty} onChange={e => updateItem(idx, 'qty', Number(e.target.value))} min="1" style={{ ...inp, width: 60 }} /></td>
                          <td style={{ padding: '4px 4px', width: 90 }}><input id={`item-price-${idx}`} name={`itemPrice${idx}`} type="number" value={item.price} onChange={e => updateItem(idx, 'price', Number(e.target.value))} min="0" style={{ ...inp, width: 90 }} /></td>
                          <td style={{ padding: '4px 4px', width: 70 }}>
                            <select id={`item-vat-${idx}`} name={`itemVat${idx}`} value={item.vatRate} onChange={e => updateItem(idx, 'vatRate', Number(e.target.value))} style={{ ...inp, width: 70 }}>
                              <option value={0}>0%</option>
                              <option value={10}>10%</option>
                              <option value={20}>20%</option>
                            </select>
                          </td>
                          <td style={{ padding: '4px 8px', fontSize: 13, color: 'var(--text-primary)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                            {new Intl.NumberFormat('ru-RU').format(rowTotal)}
                          </td>
                          <td style={{ padding: '4px 4px' }}>
                            <button onClick={() => removeItem(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4 }}><Trash2 size={14} /></button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <button onClick={addItem} style={{ marginTop: 10, background: 'none', border: '1px dashed var(--border-strong)', color: 'var(--text-muted)', padding: '7px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Plus size={13} />  {t("Добавить позицию", "Добавить позицию")}
                </button>
              </div>

              {/* Totals */}
              {(() => { const { sub, vat, total } = calcTotals(newItems); return (
                <div style={{ background: 'var(--bg-surface)', borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{t("Итого без НДС:", "Итого без НДС:")} <strong style={{ color: 'var(--text-primary)' }}>{new Intl.NumberFormat('ru-RU').format(sub)}  {t("сум", "сум")}</strong></div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{t("НДС:", "НДС:")} <strong style={{ color: '#f59e0b' }}>{new Intl.NumberFormat('ru-RU').format(vat)}  {t("сум", "сум")}</strong></div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', borderTop: '1px solid var(--border-default)', paddingTop: 8, marginTop: 2 }}>{t("Всего к оплате:", "Всего к оплате:")} {new Intl.NumberFormat('ru-RU').format(total)}  {t("сум", "сум")}</div>
                </div>
              ); })()}
            </div>
            <div style={{ padding: '12px 20px', background: 'var(--bg-base)', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t("* обязательные поля", "* обязательные поля")}</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setCreateOpen(false)} style={{ padding: '0 14px', height: 30, borderRadius: 6, background: 'transparent', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 12 }}>{t("Отозвать", "Отозвать")}</button>
                <button onClick={handleCreate} style={{ padding: '0 16px', height: 30, borderRadius: 6, background: 'var(--color-primary)', border: 'none', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 12 }}>{t("Сохранить", "Сохранить")}</button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default DocumentsPage;
