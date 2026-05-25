import React, { useState, useEffect } from 'react';
import { useStore } from '../../store';
import { ShoppingCart, LayoutDashboard, FileText, List, Building2, ChevronLeft, Trophy } from 'lucide-react';
import ProcurementDashboard from './views/ProcurementDashboard';
import ProcurementRequests from './views/ProcurementRequests';
import ProcurementItemsTable from './views/ProcurementItemsTable';
import ProcurementTenders from './views/ProcurementTenders';
import { useProcurementStore } from './procurementStore';

type Tab = 'dashboard' | 'requests' | 'items' | 'tenders' | 'companies';

const ProcurementApp: React.FC = () => {
  const setActiveApp = useStore(state => state.setActiveApp);
  const [activeTab, setActiveTab] = useState<Tab>('items');

  const loadRequests = useProcurementStore(state => state.loadRequests);
  const loadItems = useProcurementStore(state => state.loadItems);

  useEffect(() => {
    loadRequests();
    loadItems();
  }, [loadRequests, loadItems]);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Дашборд',           icon: <LayoutDashboard size={14} /> },
    { id: 'requests',  label: 'Заявки',             icon: <FileText size={14} /> },
    { id: 'items',     label: 'Позиции',            icon: <List size={14} /> },
    { id: 'tenders',   label: 'Тендеры',            icon: <Trophy size={14} /> },
    { id: 'companies', label: 'Компании',           icon: <Building2 size={14} /> },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-base)', color: 'var(--text-primary)', fontFamily: 'var(--font-family)', fontSize: 13 }}>

      {/* ── Sidebar — exact Finance FinanceSidebar proportions ── */}
      <div className="desktop-sidebar" style={{ width: 'var(--sidebar-width)', background: 'var(--bg-surface)', borderRight: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>

        {/* Logo row */}
        <div style={{ height: 'var(--header-height)', padding: '0 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
          <div style={{ width: 24, height: 24, background: 'var(--color-primary)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ShoppingCart size={13} color="#fff" />
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Закупки</span>
        </div>

        {/* Nav */}
        <div style={{ padding: '8px 8px', flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
                  background: isActive ? 'var(--bg-active)' : 'transparent',
                  color: isActive ? 'var(--color-primary)' : 'var(--text-secondary)',
                  border: 'none', borderRadius: 6, cursor: 'pointer', textAlign: 'left', width: '100%',
                  fontSize: 12, fontWeight: isActive ? 600 : 400, transition: 'all var(--transition-fast)'
                }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; } }}
              >
                <span style={{ opacity: isActive ? 1 : 0.6 }}>{tab.icon}</span>
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Back button */}
        <div style={{ padding: '8px 8px', borderTop: '1px solid var(--border-subtle)' }}>
          <button
            onClick={() => setActiveApp('desktop')}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, width: '100%',
              padding: '6px 10px', background: 'transparent',
              border: 'none', borderRadius: 6, color: 'var(--text-muted)', cursor: 'pointer',
              fontSize: 12, transition: 'all var(--transition-fast)'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <ChevronLeft size={14} />
            <span>На рабочий стол</span>
          </button>
        </div>
      </div>

      {/* ── Main content ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        {/* Page header bar — same 44px as Finance */}
        <div style={{ height: 'var(--header-height)', padding: '0 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, background: 'var(--bg-surface)' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: -0.01 }}>
            {tabs.find(t => t.id === activeTab)?.label}
          </span>
          <button className="hide-on-desktop" onClick={() => setActiveApp('desktop')} style={{ background: 'none', border: 'none', color: 'var(--text-primary)' }}>
            <ChevronLeft size={20} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="page-body" style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px) + 60px)' }}>
          {activeTab === 'dashboard'  && <ProcurementDashboard />}
          {activeTab === 'requests'   && <ProcurementRequests />}
          {activeTab === 'items'      && <ProcurementItemsTable />}
          {activeTab === 'tenders'    && <ProcurementTenders />}
          {activeTab === 'companies'  && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--text-muted)', fontSize: 13 }}>
              Справочник компаний — в разработке
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile Bottom Navigation ── */}
      <div className="mobile-bottom-nav">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '10px 0', gap: 4, background: 'transparent', border: 'none',
                color: isActive ? 'var(--color-primary)' : 'var(--text-muted)',
                transition: 'color var(--transition-fast)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: isActive ? 1 : 0.8, transform: 'scale(1.3)' }}>{tab.icon}</div>
              <span style={{ fontSize: 10, fontWeight: isActive ? 600 : 500 }}>{tab.label}</span>
            </button>
          );
        })}
      </div>

    </div>
  );
};

export default ProcurementApp;
