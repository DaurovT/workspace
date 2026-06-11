/* eslint-disable react-hooks/purity */
import React, { useState } from 'react';
import { Modal } from './Modal';
import { useFinanceStore } from '../financeStore';
import { DocumentViewerModal } from './DocumentViewerModal';
import { FileText, Plus, CheckCircle, Clock } from 'lucide-react';
import { APP_CURRENCY_SYMBOL } from '../config/currency';
import { useTranslation } from 'react-i18next';

interface Props {
  dealId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const DealDetailsModal: React.FC<Props> = ({ dealId, isOpen, onClose }) => {
  const { t } = useTranslation();
    const { deals, contractors, projects, documents, addDocument } = useFinanceStore();
  const [activeTab, setActiveTab] = useState<'info' | 'documents'>('info');
  const [viewingDocId, setViewingDocId] = useState<string | null>(null);

  const deal = deals.find(d => d.id === dealId);
  if (!deal) return null;

  const contractor = contractors.find(c => c.id === deal.contractorId);
  const project = projects.find(p => p.id === deal.projectId);
  const docs = documents.filter(d => d.dealId === dealId);

  const handleCreateDocument = (type: 'invoice' | 'act') => {
    addDocument({
      type,
      dealId,
      status: type === 'invoice' ? 'issued' : 'draft',
      number: `${type === 'invoice' ? 'INV' : 'ACT'}-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      date: new Date().toISOString(),
      items: [
        {
          id: `item_${Date.now()}`,
          productId: '', // no hardcoded product
          quantity: 1,
          price: deal.amount,
          vatRate: 0
        }
      ],
      totalAmount: deal.amount,
      vatAmount: 0,
    });
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={`Сделка: ${deal.name}`} width="800px">
        <div style={{ display: 'flex', marginBottom: 24, padding: 4, background: 'var(--bg-hover)', borderRadius: 8, width: 'fit-content' }}>
          <button 
            onClick={() => setActiveTab('info')}
            style={{ 
              background: activeTab === 'info' ? 'var(--bg-surface)' : 'transparent', 
              border: activeTab === 'info' ? '1px solid var(--border-subtle)' : '1px solid transparent', 
              color: activeTab === 'info' ? 'var(--text-primary)' : 'var(--text-secondary)', 
              fontWeight: 500, cursor: 'pointer', fontSize: 13, padding: '4px 16px', borderRadius: 6,
              boxShadow: activeTab === 'info' ? '0 1px 3px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s'
            }}
          >
            
            {t("Информация", "Информация")}
          </button>
          <button 
            onClick={() => setActiveTab('documents')}
            style={{ 
              background: activeTab === 'documents' ? 'var(--bg-surface)' : 'transparent', 
              border: activeTab === 'documents' ? '1px solid var(--border-subtle)' : '1px solid transparent', 
              color: activeTab === 'documents' ? 'var(--text-primary)' : 'var(--text-secondary)', 
              fontWeight: 500, cursor: 'pointer', fontSize: 13, padding: '4px 16px', borderRadius: 6,
              boxShadow: activeTab === 'documents' ? '0 1px 3px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s'
            }}
          >
            
            {t("Документы (", "Документы (")}{docs.length})
          </button>
        </div>

        {activeTab === 'info' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { label: 'Контрагент', value: contractor?.name ?? '—' },
              { label: 'Проект', value: project?.name ?? '—' },
              { label: 'Статус', value: {
                new: 'Новая', in_progress: 'В работе', completed: 'Завершена', cancelled: 'Отменена'
              }[deal.status] },
              { label: 'Валюта', value: deal.currency },
              { label: 'Начало', value: deal.dateStart ? new Date(deal.dateStart as string).toLocaleDateString('ru-RU') : '—' },
              { label: 'Дедлайн', value: deal.dateDeadline ? new Date(deal.dateDeadline as string).toLocaleDateString('ru-RU') : '—' },
            ].map(({ label, value }) => (
              <div key={label} style={{ padding: 14, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 10 }}>
                <div style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{value}</div>
              </div>
            ))}
            <div style={{ gridColumn: '1 / -1', padding: 14, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 10 }}>
              <div style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>{t("Финансы", "Финансы")}</div>
              <div style={{ display: 'flex', gap: 32 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{t("Сумма сделки", "Сумма сделки")}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'monospace' }}>{new Intl.NumberFormat('ru-RU').format(deal.amount)} {deal.currency}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{t("Оплачено", "Оплачено")}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#10b981', fontFamily: 'monospace' }}>{new Intl.NumberFormat('ru-RU').format(deal.paidAmount)} {deal.currency}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{t("Остаток", "Остаток")}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: deal.amount - deal.paidAmount > 0 ? '#ef4444' : '#10b981', fontFamily: 'monospace' }}>{new Intl.NumberFormat('ru-RU').format(deal.amount - deal.paidAmount)} {deal.currency}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{t("Отгружено", "Отгружено")}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'monospace' }}>{new Intl.NumberFormat('ru-RU').format(deal.shippedAmount)} {deal.currency}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: 14, fontWeight: 600 }}>{t("Закрывающие документы", "Закрывающие документы")}</h3>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => handleCreateDocument('act')} style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', height: 28, padding: '0 16px', borderRadius: 6, fontSize: 12, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  
                  {t("Создать Акт", "Создать Акт")}
                </button>
                <button onClick={() => handleCreateDocument('invoice')} style={{ background: 'var(--color-primary)', color: 'var(--text-primary)', border: 'none', height: 28, padding: '0 16px', borderRadius: 6, fontSize: 12, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', boxShadow: '0 2px 6px rgba(124, 58, 237, 0.2)' }}>
                  <Plus size={12} />  {t("Создать Счет", "Создать Счет")}
                </button>
              </div>
            </div>

            {docs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, background: 'var(--bg-card)', borderRadius: 12, border: '1px dashed var(--border-subtle)' }}>
                <FileText size={32} color="var(--border-subtle)" style={{ marginBottom: 16 }} />
                <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{t("Нет документов", "Нет документов")}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{t("Сгенерируйте счет на оплату или акт для этой сделки.", "Сгенерируйте счет на оплату или акт для этой сделки.")}</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {docs.map(doc => (
                  <div key={doc.id} onClick={() => setViewingDocId(doc.id)} style={{ padding: '12px 16px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-card)'}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: doc.type === 'invoice' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: doc.type === 'invoice' ? '#3b82f6' : '#10b981' }}>
                        <FileText size={16} />
                      </div>
                      <div>
                        <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 13, marginBottom: 2 }}>
                          {doc.type === 'invoice' ? 'Счет на оплату' : 'Акт выполненных работ'} № {doc.number}
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{t("От", "От")} {new Date(doc.date).toLocaleDateString()}</div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{new Intl.NumberFormat('ru-RU').format(doc.totalAmount)} {deal.currency === APP_CURRENCY_SYMBOL ? APP_CURRENCY_SYMBOL : deal.currency}</div>
                        
                        {doc.status === 'paid' && <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#10b981', fontSize: 11, justifyContent: 'flex-end', fontWeight: 500 }}><CheckCircle size={10}/>  {t("Оплачено", "Оплачено")}</div>}
                        {doc.status === 'issued' && <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#3b82f6', fontSize: 11, justifyContent: 'flex-end', fontWeight: 500 }}><Clock size={10}/>  {t("Ожидается", "Ожидается")}</div>}
                        {doc.status === 'draft' && <div style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 500 }}>{t("Черновик", "Черновик")}</div>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Embedded Viewer Modal */}
      {viewingDocId && (
        <DocumentViewerModal 
          docId={viewingDocId} 
          isOpen={true} 
          onClose={() => setViewingDocId(null)} 
        />
      )}
    </>
  );
};
