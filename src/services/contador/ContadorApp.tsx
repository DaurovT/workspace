import React from 'react';
import { useStore } from '../../store';
import ContadorSidebar from './components/ContadorSidebar';
import FinancialDashboard from './components/FinancialDashboard';
import BalancePage from './components/BalancePage';
import PnlPage from './components/PnlPage';
import OsvPage from './components/OsvPage';
import { JournalPage } from './components/JournalPage';
import { CounterpartiesPage } from './components/CounterpartiesPage';
import SettingsPage from './components/SettingsPage';

const ContadorApp: React.FC = () => {
  const { activePage } = useStore(); 

  return (
    <div className="app-shell" style={{ display: 'flex', height: '100vh', width: '100vw', background: 'var(--bg-canvas)', color: 'var(--text-primary)' }}>
      <ContadorSidebar />
      <div className="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{
          height: 56,
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          background: 'var(--bg-surface)'
        }}>
           <h1 style={{ fontSize: 16, fontWeight: 600 }}>Contador - Финансовый центр</h1>
        </div>
        <div className="page-body" style={{ padding: '24px', overflow: 'auto', flex: 1 }}>
          {activePage === 'dashboard' && <FinancialDashboard />}
          {activePage === 'balance' && <BalancePage />}
          {activePage === 'pnl' && <PnlPage />}
          {activePage === 'osv' && <OsvPage />}
          {activePage === 'journal' && <JournalPage />}
          {activePage === 'counterparties' && <CounterpartiesPage />}
          {activePage === 'settings' && <SettingsPage />}
          {(!['dashboard', 'balance', 'pnl', 'osv', 'journal', 'counterparties', 'settings'].includes(activePage)) && (
            <div style={{ color: 'var(--text-secondary)' }}>Раздел в разработке...</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContadorApp;
