import React from 'react';
import { useStore } from '../../../store';
import { LayoutDashboard, Wallet, Users, BookOpen, FileText, Settings, ArrowLeft } from 'lucide-react';

const ContadorSidebar: React.FC = () => {
  const { activePage, setActivePage, setActiveApp } = useStore();

  const NAV_ITEMS = [
    { id: 'dashboard', label: 'Дашборд', icon: <LayoutDashboard size={16} /> },
    { id: 'balance', label: 'Баланс', icon: <Wallet size={16} /> },
    { id: 'osv', label: 'ОСВ', icon: <FileText size={16} /> },
    { id: 'pnl', label: 'P&L Отчет', icon: <FileText size={16} /> },
    { id: 'counterparties', label: 'Контрагенты', icon: <Users size={16} /> },
    { id: 'journal', label: 'Журнал операций', icon: <BookOpen size={16} /> },
    { id: 'settings', label: 'Настройки', icon: <Settings size={16} /> },
  ];

  return (
    <div className="sidebar" style={{ width: 240, display: 'flex', flexDirection: 'column' }}>
      <div className="sidebar-header" style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
        <img src="/contador-logo.svg" alt="Contador Logo" style={{ height: 36, objectFit: 'contain' }} />
        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', paddingLeft: 4 }}>
          Finance Center
        </div>
      </div>

      <nav className="sidebar-nav" style={{ flex: 1, padding: '0 12px' }}>
        <div className="nav-section-title">ОТЧЕТЫ</div>
        {NAV_ITEMS.map(item => {
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setActivePage(item.id as any)}
            >
              <span className="nav-icon" style={{ color: isActive ? 'var(--color-primary)' : 'var(--text-muted)' }}>
                {item.icon}
              </span>
              <span className="nav-label">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border-subtle)' }}>
        <button className="nav-item" onClick={() => setActiveApp('desktop')}>
          <span className="nav-icon"><ArrowLeft size={16} /></span>
          <span className="nav-label">На рабочий стол</span>
        </button>
      </div>
    </div>
  );
};

export default ContadorSidebar;
