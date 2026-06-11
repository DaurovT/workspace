import React, { useState } from 'react';
import { Plus, FileText, Package, ArrowLeft, CheckCircle2, Clock, XCircle } from 'lucide-react';
import type { PurchaseDeal, PurchaseStatus } from '../financeStore';
import { useFinanceStore } from '../financeStore';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { APP_CURRENCY_SYMBOL } from '../config/currency';
import { useTranslation } from 'react-i18next';

interface Props {
  deal: PurchaseDeal;
  onBack: () => void;
}

const STATUS_META: Record<PurchaseStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  new:       { label: 'Новая',     color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', icon: <Clock size={11} /> },
  in_work:   { label: 'В работе', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  icon: <Package size={11} /> },
  delivered: { label: 'Получено', color: '#10b981', bg: 'rgba(16,185,129,0.12)', icon: <CheckCircle2 size={11} /> },
  cancelled: { label: 'Отменена', color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  icon: <XCircle size={11} /> },
};

const DELIVERY_META = {
  pending:  { label: 'Ожидается',  color: '#64748b', pct: 0 },
  partial:  { label: 'Частично',   color: '#f59e0b', pct: 50 },
  done:     { label: 'Получено',   color: '#10b981', pct: 100 },
};

export const PurchaseDealDetailsView: React.FC<Props> = ({ deal, onBack }) => {
  const { t } = useTranslation();
    const { contractors, transactions } = useFinanceStore();
  const [activeTab, setActiveTab] = useState<'products' | 'payments' | 'deliveries'>('products');

  const contractor = contractors.find(c => c.id === deal.contractorId);
  const fmt = new Intl.NumberFormat('ru-RU');
  const totalAmountStr = fmt.format(deal.amount) + " " + APP_CURRENCY_SYMBOL;
  const paidPct = deal.amount > 0 ? Math.min(100, (deal.paidAmount / deal.amount) * 100) : 0;

  // Delivery — computed from deliveryStatus (no magic number)
  const delivery = DELIVERY_META[deal.deliveryStatus];
  const delivAmt = Math.round((deal.amount * delivery.pct) / 100);

  // Real transactions linked to this contractor (for payments tab)
  const linkedPayments = transactions.filter(
    t => t.contractorId === deal.contractorId && t.type === 'expense'
  ).slice(0, 5); // show recent 5

  const statusMeta = STATUS_META[deal.status];

  const Tab = ({ id, label, count }: { id: typeof activeTab; label: string; count: number }) => (
    <button
      onClick={() => setActiveTab(id)}
      style={{ padding: '16px 0', border: 'none', background: 'transparent',
        color: activeTab === id ? 'var(--text-primary)' : 'var(--text-secondary)',
        fontWeight: activeTab === id ? 600 : 500, fontSize: 12, cursor: 'pointer',
        borderBottom: activeTab === id ? '2px solid var(--color-primary)' : '2px solid transparent',
        display: 'flex', gap: 6, alignItems: 'center', marginRight: 24, transition: 'all 0.2s' }}>
      {label}
      <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>{count}</span>
    </button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', background: 'var(--bg-base)' }}>

      {/* Breadcrumb + Title */}
      <div style={{ padding: '24px 32px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, padding: 0, width: 'fit-content' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--color-primary)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'}>
          <ArrowLeft size={14} />  {t("Сделки по закупкам", "Сделки по закупкам")}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            {deal.name}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px',
            borderRadius: 12, fontSize: 11, fontWeight: 600, color: statusMeta.color, background: statusMeta.bg,
            border: `1px solid ${statusMeta.color}33` }}>
            {statusMeta.icon} {statusMeta.label}
          </span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {deal.number} · {contractor?.name ?? '—'}  {t("· Срок:", "· Срок:")} {format(parseISO(deal.dueDate), 'd MMM yyyy', { locale: ru })}
        </div>
      </div>

      <div style={{ padding: '0 32px 32px', display: 'flex', gap: 20 }}>
        {/* Main Content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* 3 KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>

            {/* Card 1: Info */}
            <div style={{ background: 'var(--bg-surface)', borderRadius: 12, padding: 20,
              border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                
                {t("Общая информация", "Общая информация")}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                {totalAmountStr}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{t("Поставщик", "Поставщик")}</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{contractor?.name ?? '—'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{t("Категория", "Категория")}</span>
                  <span style={{ color: 'var(--text-primary)' }}>{deal.category}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{t("Создана", "Создана")}</span>
                  <span style={{ color: 'var(--text-primary)' }}>{format(parseISO(deal.startDate), 'd MMM yyyy', { locale: ru })}</span>
                </div>
              </div>
            </div>

            {/* Card 2: Payments */}
            <div style={{ background: 'var(--bg-surface)', borderRadius: 12, padding: 20,
              border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                
                {t("Выплаты поставщику", "Выплаты поставщику")}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#10b981', fontFamily: 'monospace' }}>
                {fmt.format(deal.paidAmount)}  {t("сум", "сум")}
              </div>
              <div>
                <div style={{ height: 6, background: 'var(--bg-hover)', borderRadius: 4, overflow: 'hidden', marginBottom: 6 }}>
                  <div style={{ height: '100%', width: `${paidPct}%`, background: paidPct === 100 ? '#10b981' : 'var(--color-primary)', borderRadius: 4, transition: 'width 0.4s' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
                  <span>{t("Оплачено", "Оплачено")} {Math.round(paidPct)}%</span>
                  <span>{t("Долг:", "Долг:")} {fmt.format(deal.amount - deal.paidAmount)}  {t("сум", "сум")}</span>
                </div>
              </div>
            </div>

            {/* Card 3: Delivery */}
            <div style={{ background: 'var(--bg-surface)', borderRadius: 12, padding: 20,
              border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                
                {t("Поставки", "Поставки")}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: delivery.color, fontFamily: 'monospace' }}>
                {fmt.format(delivAmt)}  {t("сум", "сум")}
              </div>
              <div>
                <div style={{ height: 6, background: 'var(--bg-hover)', borderRadius: 4, overflow: 'hidden', marginBottom: 6 }}>
                  <div style={{ height: '100%', width: `${delivery.pct}%`, background: delivery.color, borderRadius: 4, transition: 'width 0.4s' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
                  <span>{t("Отгружено", "Отгружено")} {delivery.pct}%</span>
                  <span style={{ color: delivery.color, fontWeight: 600 }}>{delivery.label}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ background: 'var(--bg-surface)', borderRadius: 12, border: '1px solid var(--border-subtle)', flex: 1, minHeight: 300 }}>
            <div style={{ display: 'flex', padding: '0 24px', borderBottom: '1px solid var(--border-subtle)' }}>
              <Tab id="products" label={t("ТОВАРЫ И УСЛУГИ", "ТОВАРЫ И УСЛУГИ")} count={1} />
              <Tab id="payments" label={t("ВЫПЛАТЫ", "ВЫПЛАТЫ")} count={linkedPayments.length} />
              <Tab id="deliveries" label={t("ПОСТАВКИ", "ПОСТАВКИ")} count={deal.deliveryStatus === 'done' ? 1 : deal.deliveryStatus === 'partial' ? 1 : 0} />
            </div>

            <div style={{ padding: 20 }}>
              {activeTab === 'products' && (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-hover)' }}>
                      {['Наименование', 'Кол-во', 'Ед.', 'Цена за ед.', 'Скидка', 'Сумма'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
                          textAlign: h === 'Наименование' ? 'left' : 'right', borderBottom: '1px solid var(--border-subtle)' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '12px 14px', fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{deal.name}</td>
                      <td style={{ textAlign: 'right', padding: '12px 14px', fontSize: 13, color: 'var(--text-primary)' }}>1</td>
                      <td style={{ textAlign: 'right', padding: '12px 14px', fontSize: 13, color: 'var(--text-muted)' }}>{t("шт.", "шт.")}</td>
                      <td style={{ textAlign: 'right', padding: '12px 14px', fontSize: 13, fontFamily: 'monospace' }}>{fmt.format(deal.amount)}  {t("сум", "сум")}</td>
                      <td style={{ textAlign: 'right', padding: '12px 14px', fontSize: 13, color: 'var(--text-muted)' }}>0%</td>
                      <td style={{ textAlign: 'right', padding: '12px 14px', fontSize: 13, fontWeight: 700, fontFamily: 'monospace' }}>{totalAmountStr}</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={5} style={{ padding: '12px 14px', textAlign: 'right', fontSize: 12, color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)' }}>
                        
                        {t("Всего:", "Всего:")}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, fontSize: 14, fontFamily: 'monospace', borderTop: '1px solid var(--border-subtle)' }}>
                        {totalAmountStr}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}

              {activeTab === 'payments' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {linkedPayments.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <div style={{ fontSize: 28, marginBottom: 8 }}>💳</div>
                      <div style={{ fontSize: 13 }}>{t("Выплаты поставщику не найдены в операциях", "Выплаты поставщику не найдены в операциях")}</div>
                    </div>
                  ) : linkedPayments.map(tx => (
                    <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 14px', background: 'var(--bg-hover)', borderRadius: 8, fontSize: 13 }}>
                      <div>
                        <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{tx.description ?? "Выплата"}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>{tx.date}</div>
                      </div>
                      <div style={{ color: '#ef4444', fontWeight: 700, fontFamily: 'monospace' }}>
                        −{fmt.format(tx.amount)}  {t("сум", "сум")}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'deliveries' && (
                <div style={{ padding: '20px', textAlign: 'center' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '16px 24px',
                    background: `${delivery.color}15`, border: `1px solid ${delivery.color}40`,
                    borderRadius: 12, fontSize: 14, color: delivery.color, fontWeight: 600 }}>
                    
                    {t("Статус поставки:", "Статус поставки:")} {delivery.label} ({delivery.pct}%)
                  </div>
                  <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                    
                    {t("Поставлено на сумму", "Поставлено на сумму")} {fmt.format(delivAmt)}  {t("сум из", "сум из")} {totalAmountStr}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar — Files */}
        <div style={{ width: 280, background: 'var(--bg-surface)', borderRadius: 12, border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px 20px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--border-subtle)' }}>
            
            {t("Файлы и комментарии", "Файлы и комментарии")}
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: 32, gap: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: 12, background: 'var(--bg-hover)',
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={22} color="var(--text-muted)" strokeWidth={1.5} />
            </div>
            <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              
              {t("Прикрепляйте файлы", "Прикрепляйте файлы")}<br />{t("и оставляйте комментарии", "и оставляйте комментарии")}<br />{t("для себя и коллег", "для себя и коллег")}
            </div>
            <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px',
              background: 'var(--color-primary)', color: 'var(--text-primary)', border: 'none', borderRadius: 8,
              fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              <Plus size={13} />  {t("Прикрепить файл", "Прикрепить файл")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
