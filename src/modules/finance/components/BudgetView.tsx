import React from 'react';
import { useFinanceStore } from '../financeStore';
import { useTranslation } from 'react-i18next';
import BudgetPlanningPage from '../pages/BudgetPlanningPage';
import BudgetBdrPage from '../pages/BudgetBdrPage';
import BudgetBddsPage from '../pages/BudgetBddsPage';

// Unified "Бюджет" section with a view switcher (audit P1 #12).
// Reuses the three existing pages; replaces 3 separate sidebar entries.
const BudgetView: React.FC = () => {
  const { t } = useTranslation();
  const { activeSubView, setActiveView } = useFinanceStore();
  const sub = activeSubView || 'calendar';

  const tabs = [
    { id: 'calendar', label: t('Платежный календарь') },
    { id: 'bdr', label: t('Бюджет доходов и расходов') },
    { id: 'bdds', label: t('Бюджет движения денег') },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div style={{ display: 'flex', gap: 2, padding: '0 16px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0, background: 'var(--bg-surface)' }}>
        {tabs.map(tab => {
          const active = sub === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveView('plan', tab.id)}
              style={{
                padding: '11px 14px', fontSize: 13, fontWeight: active ? 600 : 500,
                border: 'none', background: 'transparent', cursor: 'pointer',
                color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                borderBottom: active ? '2px solid var(--color-primary)' : '2px solid transparent',
                marginBottom: -1,
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {sub === 'bdr' ? <BudgetBdrPage /> : sub === 'bdds' ? <BudgetBddsPage /> : <BudgetPlanningPage />}
      </div>
    </div>
  );
};

export default BudgetView;
