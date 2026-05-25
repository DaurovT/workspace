import React from 'react';
import ServiceSidebar from './components/ServiceSidebar';
import ServiceHeader from './components/ServiceHeader';
import MainDashboard from './pages/MainDashboard';
import TicketsBoard from './pages/TicketsBoard';
import TicketsArchive from './pages/TicketsArchive';
import { useServiceStore } from './serviceStore';

const ServiceApp: React.FC = () => {
  const { activeView, fetchInitialData } = useServiceStore();

  React.useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  let content = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 80, height: 80, borderRadius: 20, background: 'var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
        🚧
      </div>
      <div>
        <h2 style={{ margin: '0 0 8px 0', fontSize: 20, fontWeight: 700, textAlign: 'center' }}>В разработке</h2>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>Данный раздел находится в стадии проектирования.</p>
      </div>
    </div>
  );

  if (activeView === 'dashboard') content = <MainDashboard />;
  else if (activeView === 'tickets') content = <TicketsBoard />;
  else if (activeView === 'archive') content = <TicketsArchive />;

  return (
    <div className="app-shell" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-family)' }}>
      <ServiceSidebar />
      <div className="main-content">
        <ServiceHeader />
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
          <div className="page-body" style={{ padding: 0, flex: 1, overflowY: 'auto' }}>
            {content}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceApp;
