import React, { useState } from 'react';
import { useFinanceStore } from '../financeStore';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const PaymentApprovalsPage: React.FC = () => {
  const { t } = useTranslation();
    const { paymentRequests, updatePaymentRequestStatus, payPaymentRequest, accounts, contractors, categories, users } = useFinanceStore();
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'paid'>('pending');
  const [selectedPR, setSelectedPR] = useState<string | null>(null);
  const [payAccountId, setPayAccountId] = useState<string>('');

  const pending = paymentRequests.filter(p => p.status === 'pending_manager' || p.status === 'pending_ceo');
  const approved = paymentRequests.filter(p => p.status === 'approved');
  const paid = paymentRequests.filter(p => p.status === 'paid' || p.status === 'rejected');

  const getActiveList = () => {
    if (activeTab === 'pending') return pending;
    if (activeTab === 'approved') return approved;
    return paid;
  };

  const selectedReq = paymentRequests.find(p => p.id === selectedPR);
  const reqContractor = selectedReq ? contractors.find(c => c.id === selectedReq.contractorId) : null;
  const reqCategory = selectedReq ? categories.find(c => c.id === selectedReq.categoryId) : null;

  // Linear status colors
  const getStatusColor = (status: string) => {
    if (status === 'approved') return '#10b981';
    if (status === 'rejected') return '#ef4444';
    if (status === 'paid') return 'var(--color-primary)';
    return '#f59e0b';
  };

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', background: 'var(--bg-base)', fontFamily: 'Inter, sans-serif' }}>
      
      {/* LEFT: Master List */}
      <div style={{ width: 340, background: 'var(--bg-surface)', borderRight: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column' }}>
        
        {/* Header & Actions */}
        <div style={{ padding: '20px 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: 0, letterSpacing: -0.2 }}>{t("Заявки", "Заявки")}</span>
          <button style={{ background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)', width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s' }}>
            <Plus size={14} />
          </button>
        </div>

        {/* Tabs - Linear Style */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', padding: '0 20px', gap: 16 }}>
          {[
            { id: 'pending', label: "На проверке", count: pending.length },
            { id: 'approved', label: 'Готово', count: approved.length },
            { id: 'paid', label: 'Архив', count: paid.length }
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <div 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{ 
                  color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                  padding: '12px 0', fontSize: 13, fontWeight: isActive ? 600 : 500, cursor: 'pointer', position: 'relative',
                  display: 'flex', alignItems: 'center', gap: 6, transition: 'color 0.15s'
                }}
              >
                {tab.label}
                <span style={{ fontSize: 11, fontWeight: 500 }}>{tab.count}</span>
                {isActive && (
                  <div style={{ position: 'absolute', bottom: -1, left: 0, right: 0, height: 2, background: 'var(--text-primary)' }} />
                )}
              </div>
            );
          })}
        </div>

        {/* List Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: 4 }} className="hide-scrollbar">
          {getActiveList().map(prq => (
            <div 
              key={prq.id}
              onClick={() => setSelectedPR(prq.id)}
              style={{ 
                padding: '10px 14px', 
                background: selectedPR === prq.id ? 'var(--bg-hover)' : 'transparent', 
                borderRadius: 8, cursor: 'pointer', transition: 'background 0.1s' 
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, fontFamily: 'monospace' }}>{prq.number}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 4, height: 4, borderRadius: '50%', background: getStatusColor(prq.status) }} />
                  {prq.status === 'pending_manager' && <span style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase' }}>{t("РУК-ЛЬ", "РУК-ЛЬ")}</span>}
                  {prq.status === 'pending_ceo' && <span style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase' }}>CEO</span>}
                </div>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {prq.purpose}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                {new Intl.NumberFormat('ru-RU').format(prq.amount)}  {t("сум", "сум")}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT: Detail View */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-base)' }}>
        {!selectedReq ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: 14 }}>{t("Выберите заявку из списка слева", "Выберите заявку из списка слева")}</span>
          </div>
        ) : (
          <>
            {/* Header Toolbar */}
            <div style={{ padding: '24px 32px 0', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                <div style={{ padding: '4px 8px', background: 'var(--bg-hover)', borderRadius: 6, fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: getStatusColor(selectedReq.status) }} />
                  {selectedReq.status.replace('_', ' ')}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{selectedReq.number}</div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                {(selectedReq.status === 'pending_ceo' || selectedReq.status === 'pending_manager') && (
                  <>
                    <button onClick={() => updatePaymentRequestStatus(selectedReq.id, 'rejected')} style={{ background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', padding: '0 16px', height: 28, borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 0.1s' }}>{t("Отклонить", "Отклонить")}</button>
                    <button onClick={() => updatePaymentRequestStatus(selectedReq.id, 'approved')} style={{ background: 'var(--color-primary)', color: '#ffffff', border: 'none', padding: '0 16px', height: 28, borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'opacity 0.1s', boxShadow: '0 2px 6px rgba(124, 58, 237, 0.2)' }} onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'} onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}>
                      
                      {t("Одобрить", "Одобрить")}
                    </button>
                  </>
                )}
                {selectedReq.status === 'approved' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <select
                      value={payAccountId || accounts[0]?.id || ''}
                      onChange={e => setPayAccountId(e.target.value)}
                      style={{ height: 28, padding: '0 8px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 12, outline: 'none', cursor: 'pointer' }}>
                      {accounts.map(a => (
                        <option key={a.id} value={a.id}>{a.name} ({new Intl.NumberFormat('ru-RU').format(a.balance)}  {t("сум)", "сум)")}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => payPaymentRequest(selectedReq.id, payAccountId || accounts[0]?.id || '')}
                      style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', padding: '0 16px', height: 28, borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                      
                      {t("Провести оплату", "Провести оплату")}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Scrollable Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '40px 32px' }}>
              <div style={{ maxWidth: 640 }}>
                
                <span style={{ fontSize: 24, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 8px', letterSpacing: -0.5 }}>{selectedReq.purpose}</span>
                <div style={{ fontSize: 32, fontWeight: 500, color: 'var(--text-primary)', margin: '0 0 32px', letterSpacing: -0.5 }}>{new Intl.NumberFormat('ru-RU').format(selectedReq.amount)}  {t("сум", "сум")}</div>

                {/* Properties Table */}
                <div style={{ borderRadius: 8, overflow: 'hidden', marginBottom: 40, background: 'rgba(0,0,0,0.02)' }}>
                  
                  <div style={{ display: 'flex', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                    <div style={{ width: 140, padding: '16px 20px', color: 'var(--text-muted)', fontSize: 13, fontWeight: 400 }}>{t("Получатель", "Получатель")}</div>
                    <div style={{ flex: 1, padding: '16px 20px', color: 'var(--text-primary)', fontSize: 13 }}>{reqContractor?.name || '—'}</div>
                  </div>
                  
                  <div style={{ display: 'flex', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                    <div style={{ width: 140, padding: '16px 20px', color: 'var(--text-muted)', fontSize: 13, fontWeight: 400 }}>{t("Статья расходов", "Статья расходов")}</div>
                    <div style={{ flex: 1, padding: '16px 20px', color: 'var(--text-primary)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-primary)' }} />
                      {reqCategory?.name || '—'}
                    </div>
                  </div>

                  <div style={{ display: 'flex' }}>
                    <div style={{ width: 140, padding: '16px 20px', color: 'var(--text-muted)', fontSize: 13, fontWeight: 400 }}>{t("Желаемая дата", "Желаемая дата")}</div>
                    <div style={{ flex: 1, padding: '16px 20px', color: 'var(--text-primary)', fontSize: 13 }}>{new Date(selectedReq.dateStr).toLocaleDateString('ru-RU')}</div>
                  </div>

                </div>

                {/* Activity Feed (Timeline) */}
                <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 20px' }}>{t("Активность", "Активность")}</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20, position: 'relative' }}>
                  <div style={{ position: 'absolute', top: 8, bottom: 8, left: 7, width: 1, background: 'var(--border-subtle)' }} />

                  {/* Step 1 */}
                  <div style={{ display: 'flex', gap: 16, zIndex: 1 }}>
                    <div style={{ width: 15, height: 15, borderRadius: '50%', background: 'var(--bg-base)', border: '2px solid var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
                       <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--text-muted)' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>{t("Заявка создана", "Заявка создана")}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {users[0]?.name ?? 'Главный бухгалтер'}
                      </div>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div style={{ display: 'flex', gap: 16, zIndex: 1 }}>
                    <div style={{ width: 15, height: 15, borderRadius: '50%', background: 'var(--bg-base)', border: `2px solid ${['approved', 'paid'].includes(selectedReq.status) ? '#10b981' : (selectedReq.status === 'rejected' ? '#ef4444' : 'var(--text-muted)')}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
                      {['approved', 'paid', 'rejected'].includes(selectedReq.status) && <div style={{ width: 7, height: 7, borderRadius: '50%', background: selectedReq.status === 'rejected' ? '#ef4444' : '#10b981' }} />}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>{t("Согласование руководством", "Согласование руководством")}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {['approved', 'paid'].includes(selectedReq.status) ? 'Утверждено CEO' : (selectedReq.status === 'rejected' ? 'Отклонено' : 'Ожидает решения CEO')}
                      </div>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div style={{ display: 'flex', gap: 16, zIndex: 1, opacity: selectedReq.status === 'paid' ? 1 : 0.4 }}>
                    <div style={{ width: 15, height: 15, borderRadius: '50%', background: 'var(--bg-base)', border: `2px solid ${selectedReq.status === 'paid' ? 'var(--color-primary)' : 'var(--text-muted)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
                      {selectedReq.status === 'paid' && <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--color-primary)' }} />}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>{t("Исполнение платежа", "Исполнение платежа")}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {selectedReq.status === 'paid' ? 'Проведено в кассе' : 'Ожидает исполнения'}
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            </div>
          </>
        )}
      </div>
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default PaymentApprovalsPage;
