import React, { useState } from 'react';
import { useFinanceStore, type Transaction } from '../financeStore';
import { ChevronRight, ArrowLeft, ArrowRight, ArrowRightLeft, Target, MoreVertical, ExternalLink } from 'lucide-react';
import { format, isToday, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { APP_CURRENCY } from '../config/currency';
import { useTranslation } from 'react-i18next';

const Th: React.FC<{ children?: React.ReactNode; width?: string }> = ({ children, width }) => (
  <th style={{
    padding: '10px 14px', textAlign: 'left', fontWeight: 500, fontSize: 11,
    color: 'var(--text-muted)', whiteSpace: 'nowrap', width,
    borderBottom: '2px solid var(--border-subtle)', position: 'sticky', top: 0,
    background: 'var(--bg-surface)', zIndex: 2,
  }}>
    {children}
  </th>
);

const Td: React.FC<{ children?: React.ReactNode; colSpan?: number }> = ({ children, colSpan }) => (
  <td colSpan={colSpan} style={{
    padding: '10px 14px', fontSize: 12,
    borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)',
    verticalAlign: 'middle',
  }}>
    {children}
  </td>
);

const GroupHeader: React.FC<{ title: string; count: number }> = ({ title, count }) => (
  <tr>
    <td colSpan={10} style={{
      padding: '14px 14px 6px', fontSize: 10, fontWeight: 700,
      color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em',
    }}>
      {title}
      <span style={{ marginLeft: 8, background: 'var(--bg-hover)', padding: '1px 6px', borderRadius: 10, fontWeight: 500, fontSize: 10 }}>
        {count}
      </span>
    </td>
  </tr>
);

interface TransactionsTableProps {
  columns?: {
    contractor: boolean;
    category: boolean;
    project: boolean;
    deal: boolean;
  };
}

export const TransactionsTable: React.FC<TransactionsTableProps> = ({
  columns = { contractor: true, category: true, project: true, deal: true }
}) => {
  const { t } = useTranslation();
    const {
    transactions, accounts, contractors, categories, projects, deals,
    selectedTxIds, typeFilter, searchQuery, toggleTxSelection,
    filterStatusPaid, filterStatusUnpaid,
    filterAccounts, filterContractors,
    filterCategories, filterProjects,
    filterDateFrom, filterDateTo,
    filterAmountFrom, filterAmountTo,
  } = useFinanceStore();

  const [expandedRows, setExpandedRows] = useState<string[]>([]);

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedRows(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
  };

  // ─── Filter pipeline ──────────────────────────────────────────────────────
  const mainTx = transactions.filter(t => {
    if (t.parentId) return false;
    if (!typeFilter.includes(t.type)) return false;
    if (t.isPaidConfirmed && !filterStatusPaid) return false;
    if (!t.isPaidConfirmed && !filterStatusUnpaid) return false;
    if (filterAccounts.length > 0 && !filterAccounts.includes(t.accountId ?? '')) return false;
    if (filterContractors.length > 0 && !filterContractors.includes(t.contractorId ?? '')) return false;
    if (filterCategories.length > 0 && !filterCategories.includes(t.categoryId ?? '')) return false;
    if (filterProjects.length > 0 && !filterProjects.includes(t.projectId ?? '')) return false;

    // Date range
    if (filterDateFrom && t.date && t.date < filterDateFrom) return false;
    if (filterDateTo && t.date && t.date > filterDateTo) return false;

    // Amount range
    if (filterAmountFrom && (t.baseAmount ?? t.amount) < Number(filterAmountFrom)) return false;
    if (filterAmountTo && (t.baseAmount ?? t.amount) > Number(filterAmountTo)) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const contractorName = contractors.find(c => c.id === t.contractorId)?.name.toLowerCase() ?? '';
      const categoryName = categories.find(c => c.id === t.categoryId)?.name.toLowerCase() ?? '';
      if (!(
        t.description?.toLowerCase().includes(q) ||
        (t.baseAmount ?? t.amount).toString().includes(q) ||
        contractorName.includes(q) ||
        categoryName.includes(q)
      )) return false;
    }
    return true;
  });

  const todayTxs = mainTx.filter(t => t.date && isToday(parseISO(t.date)));
  const pastTxs = mainTx.filter(t => !t.date || !isToday(parseISO(t.date)));

  const getTypeIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'income': return <ArrowLeft size={14} color="#10b981" />;
      case 'expense': return <ArrowRight size={14} color="#ef4444" />;
      case 'transfer': return <ArrowRightLeft size={14} color="#3b82f6" />;
      case 'accrual': return <Target size={14} color="#f59e0b" />;
      default: return <ArrowRight size={14} />;
    }
  };

  const fmt = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: APP_CURRENCY, maximumFractionDigits: 0 });

  const formatAmount = (tx: Transaction) => {
    const formatted = fmt.format(tx.amount);
    if (tx.type === 'income') {
      return <span style={{ fontWeight: 500, fontSize: 12, color: '#10b981', fontFamily: 'var(--font-mono)' }}>+{formatted}</span>;
    }
    if (tx.type === 'expense') {
      return <span style={{ fontWeight: 500, fontSize: 12, color: '#ef4444', fontFamily: 'var(--font-mono)' }}>−{formatted}</span>;
    }
    return <span style={{ fontWeight: 500, fontSize: 12, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{formatted}</span>;
  };

  const renderTxRow = (tx: Transaction) => {
    const isSelected = selectedTxIds.includes(tx.id);
    const isExpanded = expandedRows.includes(tx.id);
    const children = transactions.filter(t => t.parentId === tx.id);
    const hasChildren = children.length > 0;
    const catName = categories.find(c => c.id === tx.categoryId)?.name ?? '—';
    const accName = accounts.find(a => a.id === tx.accountId)?.name ?? '—';
    const projectName = projects.find(p => p.id === tx.projectId)?.name ?? '—';
    const dealName = deals.find(d => d.id === tx.dealId)?.name ?? '—';

    return (
      <React.Fragment key={tx.id}>
        <tr
          onClick={() => toggleTxSelection(tx.id)}
          style={{
            background: isSelected ? 'rgba(99,102,241,0.06)' : 'transparent',
            cursor: 'pointer', transition: 'background 0.1s',
          }}
          onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = isSelected ? 'rgba(99,102,241,0.06)' : 'transparent'; }}
        >
          <Td>
            <input
              id={`checkbox-${tx.id}`} type="checkbox"
              checked={isSelected} readOnly
              style={{ accentColor: 'var(--color-primary)', width: 14, height: 14 }}
              onClick={e => e.stopPropagation()}
            />
          </Td>
          <Td>
            <div style={{ color: 'var(--text-primary)', fontWeight: 500, whiteSpace: 'nowrap' }}>
              {tx.date ? format(parseISO(tx.date), 'dd MMM yyyy', { locale: ru }) : '—'}
            </div>
            {!tx.isPaidConfirmed && (
              <div style={{ fontSize: 10, color: '#f59e0b', fontWeight: 600, marginTop: 2 }}>{t("ПЛАН", "ПЛАН")}</div>
            )}
          </Td>
          <Td>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden',
              textOverflow: 'ellipsis', display: 'block', maxWidth: 140 }} title={accName}>
              {accName}
            </span>
          </Td>
          <Td>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {getTypeIcon(tx.type)}
            </div>
          </Td>
          {columns.contractor && (
            <Td>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {hasChildren && (
                  <div
                    onClick={e => toggleExpand(tx.id, e)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: 18, height: 18, background: 'var(--bg-elevated)', borderRadius: 4,
                      cursor: 'pointer', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(90deg)' : 'none',
                      border: '1px solid var(--border-subtle)', flexShrink: 0 }}>
                    <ChevronRight size={12} color="var(--text-secondary)" />
                  </div>
                )}
                <div style={{ color: 'var(--text-primary)', fontWeight: 400, fontSize: 12, whiteSpace: 'nowrap',
                  overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {contractors.find(c => c.id === tx.contractorId)?.name ?? (
                    <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>{t("Kontragentsiz", "Kontragentsiz")}</span>
                  )}
                </div>
              </div>
            </Td>
          )}
          {columns.category && (
            <Td>
              <span style={{ fontSize: 12, color: hasChildren ? 'var(--color-primary)' : 'var(--text-secondary)',
                fontStyle: hasChildren ? 'italic' : 'normal' }}>
                {hasChildren ? `${children.length} статьи (разбито)` : catName}
              </span>
            </Td>
          )}
          {columns.project && (
            <Td>
              <span style={{ color: projectName !== '—' ? 'var(--text-primary)' : 'var(--text-muted)', fontSize: 12 }}>
                {projectName}
              </span>
            </Td>
          )}
          {columns.deal && (
            <Td>
              {dealName !== '—' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 12, color: 'var(--color-primary)', fontWeight: 500 }}>{dealName}</span>
                  <ExternalLink size={10} color="var(--color-primary)" style={{ flexShrink: 0 }} />
                </div>
              ) : (
                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>
              )}
            </Td>
          )}
          <Td>{formatAmount(tx)}</Td>
          <Td>
            <MoreVertical size={15} color="var(--text-muted)" style={{ cursor: 'pointer' }} />
          </Td>
        </tr>

        {/* Child rows (split transactions) */}
        {hasChildren && isExpanded && children.map(sub => {
          const subCat = categories.find(c => c.id === sub.categoryId)?.name ?? '—';
          const subProject = projects.find(p => p.id === sub.projectId)?.name ?? '—';
          return (
            <tr key={sub.id} style={{ background: 'var(--bg-elevated)' }}>
              <Td colSpan={4} />
              {columns.contractor && (
                <Td>
                  <div style={{ paddingLeft: 26, borderLeft: '2px solid var(--color-primary)', marginLeft: 8, display: 'flex', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                      {contractors.find(c => c.id === sub.contractorId)?.name ?? 'Kontragentsiz'}
                    </span>
                  </div>
                </Td>
              )}
              {columns.category && <Td><span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{subCat}</span></Td>}
              {columns.project && <Td><span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{subProject}</span></Td>}
              {columns.deal && <Td><span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span></Td>}
              <Td>
                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  {fmt.format(sub.amount)}
                </span>
              </Td>
              <Td />
            </tr>
          );
        })}
      </React.Fragment>
    );
  };

  // ─── Select all handler ───────────────────────────────────────────────────
  const { toggleTxSelection: toggle, clearTxSelection, selectedTxIds: selIds } = useFinanceStore();
  const allSelected = mainTx.length > 0 && mainTx.every(t => selIds.includes(t.id));
  const handleSelectAll = () => {
    if (allSelected) {
      clearTxSelection();
    } else {
      mainTx.forEach(t => { if (!selIds.includes(t.id)) toggle(t.id); });
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="finance-mobile-table" style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 780 }}>
        <thead>
          <tr style={{ background: 'var(--bg-surface)' }}>
            <Th width="40px">
              <input type="checkbox" onChange={handleSelectAll} checked={allSelected}
                style={{ accentColor: 'var(--color-primary)', width: 14, height: 14 }} />
            </Th>
            <Th width="110px">{t("Дата", "Дата")}</Th>
            <Th width="140px">{t("Счёт", "Счёт")}</Th>
            <Th width="36px">{t("Тип", "Тип")}</Th>
            {columns.contractor && <Th>{t("Контрагент", "Контрагент")}</Th>}
            {columns.category && <Th>{t("Статья", "Статья")}</Th>}
            {columns.project && <Th width="140px">{t("Проект", "Проект")}</Th>}
            {columns.deal && <Th width="140px">{t("Сделка", "Сделка")}</Th>}
            <Th width="130px">{t("Сумма", "Сумма")}</Th>
            <Th width="36px" />
          </tr>
        </thead>
        <tbody>
          {mainTx.length === 0 ? (
            <tr>
              <td colSpan={10} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
                
                {t("Операции не найдены", "Операции не найдены")}
                <div style={{ fontSize: 11, marginTop: 6, color: 'var(--text-muted)' }}>{t("Попробуйте изменить фильтры", "Попробуйте изменить фильтры")}</div>
              </td>
            </tr>
          ) : (
            <>
              {todayTxs.length > 0 && (
                <>
                  <GroupHeader title={t("Сегодня", "Сегодня")} count={todayTxs.length} />
                  {todayTxs.map(renderTxRow)}
                </>
              )}
              {pastTxs.length > 0 && (
                <>
                  <GroupHeader title={t("Ранее", "Ранее")} count={pastTxs.length} />
                  {pastTxs.map(renderTxRow)}
                </>
              )}
            </>
          )}
        </tbody>
      </table>
    </div>
  );
};
