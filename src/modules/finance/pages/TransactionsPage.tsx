import { confirmDialog } from '../../../lib/confirm';
import { toast } from '../../../lib/toast';
import React, { useState, useRef, useEffect } from 'react';
import { TransactionsTable } from '../components/TransactionsTable';
import { TransactionsFilter } from '../components/TransactionsFilter';
import { useFinanceStore, type Transaction } from '../financeStore';
import { Download, Trash2, Edit2, SplitSquareHorizontal, MoreHorizontal, HelpCircle, Filter, Plus, ArrowDownRight, ArrowUpRight, Sigma } from 'lucide-react';
import { TransactionFormModal } from '../components/TransactionFormModal';

// ─── CSV Export ───────────────────────────────────────────────────────────────
import { exportToCSV } from '../utils/exportData';
import { useTranslation } from 'react-i18next';

const buildRows = (txs: Transaction[], store: ReturnType<typeof useFinanceStore.getState>) =>
  txs.map(t => [
    t.date,
    t.type,
    store.accounts.find(a => a.id === t.accountId)?.name ?? '',
    store.contractors.find(c => c.id === t.contractorId)?.name ?? '',
    store.categories.find(c => c.id === t.categoryId)?.name ?? '',
    store.projects.find(p => p.id === t.projectId)?.name ?? '',
    store.deals.find(d => d.id === t.dealId)?.name ?? '',
    t.type === 'income' ? String((t.baseAmount ?? t.amount)) : String(-(t.baseAmount ?? t.amount)),
    t.isPaidConfirmed ? 'Подтверждена' : 'Не подтверждена',
  ]);

// ─── Page ─────────────────────────────────────────────────────────────────────
const TransactionsPage: React.FC = () => {
  const { t } = useTranslation();
    const store = useFinanceStore();
  const {
    transactions,
    searchQuery, selectedTxIds,
    typeFilter, filterStatusPaid, filterStatusUnpaid,
    deleteTransaction, clearTxSelection,
  } = store;

  const [isTxModalOpen, setTxModalOpen] = useState(false);
  const [editTxId, setEditTxId] = useState<string | undefined>(undefined);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'f' && !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        setIsFilterOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  const [columns, setColumns] = useState({ contractor: true, category: true, project: true, deal: true });
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (actionsRef.current && !actionsRef.current.contains(e.target as Node)) {
        setIsActionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ─── Filtered list (for footer summary) ──────────────────────────────────
  const mainTx = transactions.filter(t => {
    if (t.parentId) return false;
    if (!typeFilter.includes(t.type)) return false;
    if (t.isPaidConfirmed && !filterStatusPaid) return false;
    if (!t.isPaidConfirmed && !filterStatusUnpaid) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!(t.description?.toLowerCase().includes(q) || (t.baseAmount ?? t.amount).toString().includes(q))) return false;
    }
    return true;
  });

  let sumIn = 0, sumOut = 0;
  mainTx.forEach(t => {
    if (t.type === 'income') sumIn += (t.baseAmount ?? t.amount);
    if (t.type === 'expense') sumOut += (t.baseAmount ?? t.amount);
  });

  // ─── Actions ──────────────────────────────────────────────────────────────
  const isLocked = (dateStr: string) => store.settings.lockDate ? dateStr <= store.settings.lockDate : false;
  
  const hasLockedSelected = selectedTxIds.some(id => {
    const tx = store.transactions.find(t => t.id === id);
    return tx ? isLocked(tx.date) : false;
  });

  const handleMassDelete = async () => {
    if (hasLockedSelected) {
      toast.error('Невозможно удалить операции из закрытого периода.');
      return;
    }
    if (!(await confirmDialog({ message: `Удалить ${selectedTxIds.length} операций? Это действие нельзя отменить.`, danger: true }))) return;
    selectedTxIds.forEach(id => deleteTransaction(id));
    clearTxSelection();
  };

  const handleExport = () => {
    const headers = ['Дата', 'Тип', 'Счёт', 'Контрагент', 'Статья', 'Проект', 'Сделка', 'Сумма', 'Статус'];
    exportToCSV('operations', headers, buildRows(mainTx, store));
  };

  const compactFmt = new Intl.NumberFormat('ru-RU', { notation: 'compact', maximumFractionDigits: 1 });

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', background: 'var(--bg-base)' }}>
      {/* ── SIDEBAR ── */}
      {isFilterOpen && <TransactionsFilter onClose={() => setIsFilterOpen(false)} />}

      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
        {/* ── HEADER ── */}
        <div className="finance-page-header" style={{ height: 44, padding: '0 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <button onClick={() => setIsFilterOpen(!isFilterOpen)} style={{ background: isFilterOpen ? 'var(--bg-card)' : 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <Filter size={12} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <span style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: -0.01 }}>{t("Операционная деятельность", "Операционная деятельность")}</span>
              <span title={t("Список всех финансовых операций", "Список всех финансовых операций")} style={{ cursor: 'pointer', display: 'flex', color: 'var(--text-muted)' }}>
                <HelpCircle size={13} />
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>


            <div className="hide-on-mobile" style={{ position: 'relative' }} ref={actionsRef}>
              <button onClick={() => setIsActionsOpen(!isActionsOpen)} style={{ height: 28, width: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 6, color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 160ms' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                <MoreHorizontal size={14} />
              </button>

              {isActionsOpen && (
                <div style={{ position: 'absolute', top: 38, right: 0, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', width: 220, zIndex: 50, padding: '8px 0' }}>
                  <div style={{ padding: '4px 16px 6px', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t("Действия", "Действия")}</div>
                  <button onClick={() => { handleExport(); setIsActionsOpen(false); }} style={{ width: '100%', padding: '8px 16px', background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-primary)', cursor: 'pointer', textAlign: 'left' }}>
                    <Download size={14} />  {t("Скачать в CSV", "Скачать в CSV")}
                  </button>

                  <div style={{ margin: '6px 0', height: 1, background: 'var(--border-subtle)' }} />
                  <div style={{ padding: '4px 16px 6px', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t("Настройка колонок", "Настройка колонок")}</div>
                  {(Object.entries({ contractor: 'Контрагент', category: 'Статья', project: 'Проект', deal: 'Сделка' }) as [keyof typeof columns, string][]).map(([key, label]) => (
                    <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 16px', cursor: 'pointer', fontSize: 13, color: 'var(--text-primary)' }}>
                      <input type="checkbox" checked={columns[key]} onChange={() => setColumns(prev => ({ ...prev, [key]: !prev[key] }))} style={{ accentColor: 'var(--color-primary)', width: 14, height: 14 }} />
                      {label}
                    </label>
                  ))}
                </div>
              )}
            </div>

            <button onClick={() => { setEditTxId(undefined); setTxModalOpen(true); }} style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', padding: '0 14px', height: 28, borderRadius: 6, fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', transition: 'transform 100ms' }} onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'} onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}>
              <Plus size={13} /> <span className="hide-on-mobile">{t("Новая операция", "Новая операция")}</span>
            </button>
          </div>
        </div>

        {/* Mass Actions Bar */}
        {selectedTxIds.length > 0 && (
          <div className="finance-mass-actions">
            <div className="finance-mass-actions-inner" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
              borderRadius: 8, padding: '8px 14px', display: 'flex', flexWrap: 'wrap', alignItems: 'center',
              justifyContent: 'space-between', gap: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-primary)' }}>
                  
                  {t("Выбрано:", "Выбрано:")} {selectedTxIds.length}
                </span>
                <span className="hide-on-mobile" style={{ color: 'var(--border-subtle)' }}>|</span>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  
                  {t("Сумма:", "Сумма:")} <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontWeight: 500 }}>
                    {compactFmt.format(
                      selectedTxIds.reduce((sum, id) => { const tx = transactions.find(t => t.id === id); return sum + ((tx?.baseAmount ?? tx?.amount) ?? 0); }, 0)
                    )}
                  </span>
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                {hasLockedSelected && (
                  <span style={{ fontSize: 11, color: '#f59e0b', marginRight: 8, fontWeight: 600 }}>{t("Период закрыт", "Период закрыт")}</span>
                )}
                <button
                  onClick={() => { if (selectedTxIds.length === 1 && !hasLockedSelected) { setEditTxId(selectedTxIds[0]); setTxModalOpen(true); } }}
                  disabled={selectedTxIds.length !== 1 || hasLockedSelected}
                  style={{ background: 'transparent', border: '1px solid var(--border-subtle)', color: selectedTxIds.length === 1 && !hasLockedSelected ? 'var(--text-primary)' : 'var(--text-muted)',
                    padding: '3px 10px', borderRadius: 6, fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, cursor: selectedTxIds.length === 1 && !hasLockedSelected ? 'pointer' : 'not-allowed' }}>
                  <Edit2 size={11} />  {t("Изменить", "Изменить")}
                </button>
                <button
                  style={{ background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)',
                    padding: '3px 10px', borderRadius: 6, fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                  <SplitSquareHorizontal size={11} />  {t("Разъединить", "Разъединить")}
                </button>
                <button
                  onClick={handleExport}
                  style={{ background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)',
                    padding: '3px 10px', borderRadius: 6, fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                  <Download size={11} />  {t("Экспорт CSV", "Экспорт CSV")}
                </button>
                <div style={{ width: 1, height: 14, background: 'var(--border-subtle)', margin: '0 2px' }} />
                <button
                  onClick={handleMassDelete}
                  disabled={hasLockedSelected}
                  style={{ background: 'transparent', border: '1px solid #ef4444', color: hasLockedSelected ? 'var(--text-muted)' : '#ef4444', opacity: hasLockedSelected ? 0.5 : 1,
                    padding: '3px 10px', borderRadius: 6, fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, cursor: hasLockedSelected ? 'not-allowed' : 'pointer' }}>
                  <Trash2 size={11} />  {t("Удалить", "Удалить")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="finance-page-content" style={{ flex: 1, padding: '0 24px', overflowY: 'auto' }}>
          <TransactionsTable columns={columns} />
        </div>

        {/* Footer */}
        <div className="finance-footer" style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border-subtle)',
          padding: '12px 16px', paddingBottom: 'max(12px, env(safe-area-inset-bottom, 12px))', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexShrink: 0, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 'max-content' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{mainTx.length}</span>  {t("оп.", "оп.")}
            </div>
            <div style={{ width: 1, height: 12, background: 'var(--border-subtle)' }} />
            
            <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <ArrowDownRight size={14} color="#10b981" />
              <span style={{ color: '#10b981', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                {compactFmt.format(sumIn)}
              </span>
            </div>
            
            <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <ArrowUpRight size={14} color="#ef4444" />
              <span style={{ color: '#ef4444', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                {compactFmt.format(Math.abs(sumOut))}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 'max-content', marginLeft: 16 }}>
            <Sigma size={13} color="var(--text-muted)" />
            <span style={{ color: (sumIn - sumOut) >= 0 ? '#10b981' : '#ef4444', fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: 13 }}>
              {compactFmt.format(sumIn - sumOut)}
            </span>
          </div>
        </div>

        <TransactionFormModal isOpen={isTxModalOpen} onClose={() => { setTxModalOpen(false); setEditTxId(undefined); }} editTxId={editTxId} />
      </div>
    </div>
  );
};

export default TransactionsPage;
