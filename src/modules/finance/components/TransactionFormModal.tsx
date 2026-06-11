import React, { useState, } from 'react';
import { Modal } from './Modal';
import { useFinanceStore } from '../financeStore';
import type { TransactionType } from '../financeStore';
import { X, Info, CheckCircle, Paperclip, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  editTxId?: string;
}

const FieldRow: React.FC<{ label: string, required?: boolean, children: React.ReactNode, tooltip?: string }> = ({ label, required, children, tooltip }) => (
  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
    <div style={{ width: 140, flexShrink: 0, fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
      {label} {required && <span style={{ color: '#f43f5e' }}>*</span>} 
      {tooltip && <span title={tooltip} style={{ cursor: 'help', display: 'flex' }}><Info size={14} color="var(--text-muted)" /></span>}
    </div>
    <div style={{ flex: 1, position: 'relative' }}>
      {children}
    </div>
  </div>
);

export const TransactionFormModal: React.FC<Props> = ({ isOpen, onClose, editTxId }) => {
  const { t } = useTranslation();
    const { categories, accounts, contractors, projects, addTransaction, updateTransaction, transactions } = useFinanceStore();

  const [type, setType] = useState<TransactionType>('income');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [categoryId, setCategoryId] = useState('');
  const [contractorId, setContractorId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [description, setDescription] = useState('');
  const [isPaidConfirmed, setIsPaidConfirmed] = useState(true);
  const [attachments, setAttachments] = useState<string[]>([]);
  
  // Specific for transfer logic
  const [toAccountId, setToAccountId]     = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [toDate, setToDate]               = useState(new Date().toISOString().split('T')[0]);

  // Fix #3: dynamic currency label based on selected account
  const selectedAccount = accounts.find(a => a.id === accountId);
  const currencyLabel = selectedAccount
    ? `${selectedAccount.currency} (${selectedAccount.name})`
    : 'UZS (Узбекский сум)';

  const resetForm = () => {
    setType('income'); setAmount(''); setDate(new Date().toISOString().split('T')[0]);
    setAccountId(accounts[0]?.id || ''); setCategoryId(''); setContractorId('');
    setProjectId(''); setDescription(''); setIsPaidConfirmed(true); setAttachments([]);
    setToAccountId(''); setTransferAmount(''); setToDate(new Date().toISOString().split('T')[0]);
  };

  React.useEffect(() => {
    if (isOpen && editTxId) {
      const tx = transactions.find(t => t.id === editTxId);
      if (tx) {
        setType(tx.type);
        setAmount(tx.amount.toString());
        setDate(tx.date || new Date().toISOString().split('T')[0]);
        setAccountId(tx.accountId || accounts[0]?.id || '');
        setCategoryId(tx.categoryId || '');
        setContractorId(tx.contractorId || '');
        setProjectId(tx.projectId || '');
        setDescription(tx.description || '');
        setIsPaidConfirmed(tx.isPaidConfirmed);
        setAttachments(tx.attachments || []);
        
        if (tx.type === 'transfer') {
          const child = transactions.find(t => t.parentId === tx.id);
          if (child) {
            setToAccountId(child.accountId || '');
            setTransferAmount(child.amount.toString());
            setToDate(child.date || new Date().toISOString().split('T')[0]);
          }
        }
      }
    } else if (isOpen) {
      resetForm();
    }
  }, [isOpen, editTxId]);

  const filteredCategories = categories.filter(c => {
    if (type === 'transfer') return c.type === 'transfer';
    if (type === 'income') return c.type === 'income' || c.type === 'liability';
    if (type === 'expense') return c.type === 'expense' || c.type === 'asset';
    return true;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;

    if (type === 'transfer') {
      if (!toAccountId) return;
      if (toAccountId === accountId) return;

      if (editTxId) {
        updateTransaction(editTxId, {
          date, amount: Number(amount), type: 'transfer',
          accountId, categoryId: categories.find(c => c.type === 'transfer')?.id,
          projectId: projectId || undefined,
          description: description || undefined,
          isPaidConfirmed: true,
          attachments
        });
        const child = transactions.find(t => t.parentId === editTxId);
        if (child) {
          updateTransaction(child.id, {
            date: toDate, amount: Number(transferAmount || amount), type: 'transfer',
            accountId: toAccountId, parentId: editTxId,
            projectId: projectId || undefined,
            description: description || undefined,
            isPaidConfirmed: true,
            attachments
          });
        }
      } else {
        const parentId = `trns_${Date.now()}`;
        addTransaction({
          id: parentId,
          date, amount: Number(amount), type: 'transfer',
          accountId, categoryId: categories.find(c => c.type === 'transfer')?.id,
          projectId: projectId || undefined,
          description: description || undefined,
          isPaidConfirmed: true,
          attachments
        });
        addTransaction({
          date: toDate, amount: Number(transferAmount || amount), type: 'transfer',
          accountId: toAccountId, parentId,
          projectId: projectId || undefined,
          description: description || undefined,
          isPaidConfirmed: true,
          attachments
        });
      }
    } else {
      if (editTxId) {
        updateTransaction(editTxId, {
          date, amount: Number(amount), type, accountId,
          categoryId: categoryId || undefined, contractorId: contractorId || undefined,
          projectId: projectId || undefined, description: description || undefined,
          isPaidConfirmed, attachments
        });
      } else {
        addTransaction({
          date, amount: Number(amount), type, accountId,
          categoryId: categoryId || undefined, contractorId: contractorId || undefined,
          projectId: projectId || undefined, description: description || undefined,
          isPaidConfirmed, attachments
        });
      }
    }
    resetForm();
    onClose();
  };

  const inputStyle = { 
    width: '100%', padding: '0 10px', background: 'transparent', height: 28, boxSizing: 'border-box' as const,
    border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-primary)', 
    fontSize: 12, outline: 'none', transition: 'all 0.2s'
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`/api/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        setAttachments(prev => [...prev, data.url]);
      }
    } catch (err) {
      console.error('File upload failed', err);
    }
  };  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t("Новая операция", "Новая операция")} width="980px" hideHeader noPadding>
      <form onSubmit={handleSubmit} style={{ display: 'flex', height: '620px' }}>
        
        {/* LEFT COLUMN - FORM */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-surface)' }}>
          
          {/* Header Row */}
          <div style={{ padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
                {editTxId ? 'Редактировать операцию' : 'Новая операция'}
              </h2>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {format(new Date(), "d MMM yy 'час' HH:mm", { locale: ru })}
              </span>
            </div>
            <button type="button" onClick={() => { resetForm(); onClose(); }} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>

          {/* Tabs */}
          <div style={{ padding: '0 32px', marginBottom: 32 }}>
            <div style={{ display: 'inline-flex', padding: 4, background: 'var(--bg-hover)', borderRadius: 10, gap: 4 }}>
              {(['income', 'expense', 'transfer'] as TransactionType[]).map(t => {
                const isActive = type === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    style={{
                      padding: '0 16px', border: 'none', borderRadius: 8, cursor: 'pointer', height: 24,
                      fontWeight: isActive ? 600 : 500, fontSize: 12,
                      background: isActive ? 'var(--bg-card)' : 'transparent', 
                      color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                      transition: 'all 0.2s', 
                      boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                    }}
                  >
                    {t === 'income' ? 'Поступление' : t === 'expense' ? "Выплата" : 'Перемещение'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scrollable Form Body */}
          <div style={{ flex: 1, padding: '0 32px', overflowY: 'auto' }}>
            
            {type !== 'transfer' && (
              <>
                <FieldRow label={t("Дата оплаты", "Дата оплаты")}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} required style={{ ...inputStyle, width: 140 }} />
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                      {/* Bug #1 fix: hidden checkbox + visible CheckCircle icon only */}
                      <input type="checkbox" checked={isPaidConfirmed} onChange={e => setIsPaidConfirmed(e.target.checked)}
                        style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} />
                      <CheckCircle size={16} color={isPaidConfirmed ? 'var(--color-primary)' : 'var(--text-muted)'}
                        style={{ cursor: 'pointer' }} onClick={() => setIsPaidConfirmed(v => !v)} />
                      
                      {t("Подтвердить оплату", "Подтвердить оплату")}
                    </label>
                  </div>
                </FieldRow>

                <FieldRow label={t("Счет и юрлицо", "Счет и юрлицо")}>
                  <select value={accountId} onChange={e => setAccountId(e.target.value)} required style={inputStyle}>
                    <option value="" disabled>{t("Выберите счет...", "Выберите счет...")}</option>
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name} [{a.currency}]</option>)}
                  </select>
                </FieldRow>

                <FieldRow label={t("Сумма", "Сумма")}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)} required min="0" step="0.01" style={{ ...inputStyle, width: 200, fontSize: 16 }} />
                    {/* Fix #3: dynamic currency from selected account */}
                    <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{currencyLabel}</div>
                  </div>
                  {/* Fix #5: removed stub "Разбить сумму" / "Добавить начисление" buttons */}
                </FieldRow>

                <FieldRow label={t("Контрагент", "Контрагент")}>
                  <select value={contractorId} onChange={e => setContractorId(e.target.value)} style={inputStyle}>
                    <option value="">{t("Не выбран", "Не выбран")}</option>
                    {contractors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </FieldRow>

                <FieldRow label={t("Статья", "Статья")}>
                  <select value={categoryId} onChange={e => setCategoryId(e.target.value)} style={inputStyle}>
                    <option value="">{t("Не выбрана", "Не выбрана")}</option>
                    {filteredCategories.map(c => <option key={c.id} value={c.id}>{c.parentId ? '— ' : ''}{c.name}</option>)}
                  </select>
                </FieldRow>

                <FieldRow label={t("Проект", "Проект")} tooltip={t("Группа для похожих операций, из которых формируются отчеты", "Группа для похожих операций, из которых формируются отчеты")}>
                  <select value={projectId} onChange={e => setProjectId(e.target.value)} style={inputStyle}>
                    <option value="">{t("Не выбран", "Не выбран")}</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </FieldRow>

                {type === 'expense' && (
                  <FieldRow label={t("Сделка закупки", "Сделка закупки")}>
                    <select disabled style={{ ...inputStyle, background: 'var(--bg-hover)', color: 'var(--text-muted)' }}>
                      <option>{t("Не выбран", "Не выбран")}</option>
                    </select>
                  </FieldRow>
                )}

                <FieldRow label={t("Назначение платежа", "Назначение платежа")}>
                  {/* Bug #2 fix: remove height from inputStyle spread so textarea respects minHeight */}
                  <textarea
                    value={description} onChange={e => setDescription(e.target.value)}
                    placeholder={t("Назначение платежа", "Назначение платежа")}
                    style={{ ...inputStyle, height: 'auto', resize: 'vertical', minHeight: 60, paddingTop: 6, paddingBottom: 6 }}
                  />
                </FieldRow>
              </>
            )}

            {type === 'transfer' && (
               <>
                 <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                   <div style={{ width: 140 }}></div>
                   <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>{t("ОТКУДА", "ОТКУДА")}</div>
                      <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
                   </div>
                 </div>

                 <FieldRow label={t("Дата оплаты", "Дата оплаты")}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} required style={{ ...inputStyle, width: 140 }} />
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                      {/* Bug #1 fix: same pattern — hidden checkbox + icon */}
                      <input type="checkbox" checked={isPaidConfirmed} onChange={e => setIsPaidConfirmed(e.target.checked)}
                        style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} />
                      <CheckCircle size={16} color={isPaidConfirmed ? 'var(--color-primary)' : 'var(--text-muted)'}
                        style={{ cursor: 'pointer' }} onClick={() => setIsPaidConfirmed(v => !v)} />
                      
                      {t("Подтвердить оплату", "Подтвердить оплату")}
                    </label>
                  </div>
                </FieldRow>

                <FieldRow label={t("Счет и юрлицо", "Счет и юрлицо")}>
                  <select value={accountId} onChange={e => setAccountId(e.target.value)} required style={inputStyle}>
                    <option value="" disabled>{t("Выберите счет...", "Выберите счет...")}</option>
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name} [{a.currency}]</option>)}
                  </select>
                </FieldRow>

                <FieldRow label={t("Сумма списания", "Сумма списания")}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)} required min="0" step="0.01" style={{ ...inputStyle, width: 200, fontSize: 16 }} />
                    <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{currencyLabel}</div>
                  </div>
                </FieldRow>
                
                <FieldRow label={t("Проект", "Проект")}>
                  <select value={projectId} onChange={e => setProjectId(e.target.value)} style={inputStyle}>
                    <option value="">{t("Не выбран", "Не выбран")}</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </FieldRow>

                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16, marginTop: 8 }}>
                   <div style={{ width: 140 }}></div>
                   <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>{t("КУДА", "КУДА")}</div>
                      <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
                   </div>
                 </div>

                 <FieldRow label={t("Дата", "Дата")}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} required style={{ ...inputStyle, width: 140 }} />
                  </div>
                </FieldRow>

                <FieldRow label={t("Счет и юрлицо", "Счет и юрлицо")}>
                  {/* Bug #3: filter out both the source account AND prevent same-account selection */}
                  <select value={toAccountId} onChange={e => setToAccountId(e.target.value)} required style={{
                    ...inputStyle,
                    borderColor: toAccountId && toAccountId === accountId ? '#ef4444' : undefined,
                  }}>
                    <option value="" disabled>{t("Выберите счет-получатель...", "Выберите счет-получатель...")}</option>
                    {accounts.filter(a => a.id !== accountId).map(a => <option key={a.id} value={a.id}>{a.name} [{a.currency}]</option>)}
                  </select>
                </FieldRow>

                <FieldRow label={t("Сумма зачисления", "Сумма зачисления")}>
                  <input type="number" value={transferAmount} onChange={e => setTransferAmount(e.target.value)} placeholder={amount || "0"} min="0" step="0.01" style={{ ...inputStyle, width: 200, fontSize: 16 }} />
                </FieldRow>

                <FieldRow label={t("Назначение платежа", "Назначение платежа")}>
                  {/* Bug #2 fix: height: auto so textarea is resizable */}
                  <textarea
                    value={description} onChange={e => setDescription(e.target.value)}
                    placeholder={t("Назначение платежа", "Назначение платежа")}
                    style={{ ...inputStyle, height: 'auto', resize: 'vertical', minHeight: 60, paddingTop: 6, paddingBottom: 6 }}
                  />
                </FieldRow>

               </>
            )}

          </div>

          {/* Footer Actions */}
          <div style={{ padding: '24px 32px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 16 }}>
            <button type="button" onClick={() => { resetForm(); onClose(); }} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              
              {t("Отозвать", "Отозвать")}
            </button>
            <button type="submit" style={{ 
              background: 'var(--color-primary)', 
              color: 'var(--text-primary)', border: 'none', borderRadius: 8, padding: '0 20px', height: 36, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)'
            }}>
              
              {t("Сохранить", "Сохранить")}
            </button>
          </div>

        </div>

        {/* RIGHT COLUMN - SIDEBAR */}
        <div style={{ width: 320, background: 'var(--bg-base)', borderLeft: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column' }}>
          
          {/* Sidebar Header */}
          <div style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ background: 'var(--bg-hover)', padding: '6px 12px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
               <MessageSquare size={14} color="var(--text-primary)" />
               <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{t("Файлы и комментарии", "Файлы и комментарии")}</span>
            </div>
          </div>

          {/* Sidebar Upload Box */}
          <div style={{ flex: 1, padding: '32px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', textAlign: 'center' }}>
            
            <div style={{ width: '100%', marginBottom: 24 }}>
              {attachments.map((url, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 8, marginBottom: 8, border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                    <Paperclip size={14} color="var(--text-muted)" />
                    <span style={{ fontSize: 12, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {url.split('/').pop()}
                    </span>
                  </div>
                  <button type="button" onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>

            <label style={{ background: 'var(--bg-hover)', width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', marginBottom: 16, cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'} onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-hover)'}>
              <Paperclip size={22} color="var(--color-primary)" />
              <input type="file" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>
            
            <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600, lineHeight: 1.5, marginBottom: 24 }}>
              
              {t("Прикрепляйте к операциям файлы,", "Прикрепляйте к операциям файлы,")}<br/>{t("например, акты или счета,", "например, акты или счета,")}<br/>{t("добавляйте комментарии", "добавляйте комментарии")}
            </div>
            
            <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              
              {t("Не более 10 файлов к операции", "Не более 10 файлов к операции")}<br/><br/>
              
              {t("Максимальный размер файла — 5 МБ", "Максимальный размер файла — 5 МБ")}<br/><br/>
              <span style={{ color: 'var(--color-primary)', opacity: 0.8 }}>{t("Поддерживаемые форматы:", "Поддерживаемые форматы:")}<br/>
              pdf, doc, docx, xls, xlsx, jpeg,<br/>
              png, zip, rar, txt, csv, xml</span>
            </div>
          </div>
        </div>

      </form>
    </Modal>
  );
};
