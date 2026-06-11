import React from 'react';
import HRSidebar from './components/HRSidebar';
import HRHeader from './components/HRHeader';
import HRDashboard from './pages/HRDashboard';
import EmployeesPage from './pages/EmployeesPage';
import AbsencesPage from './pages/AbsencesPage';
import PayrollPage from './pages/PayrollPage';
import OrgChartPage from './pages/OrgChartPage';
import MyHRDashboard from './pages/MyHRDashboard';
import ShiftSchedulesPage from './pages/ShiftSchedulesPage';
import WorkCalendarPage from './pages/WorkCalendarPage';
import { useHRStore } from './hrStore';
import { useStore } from '../../store';

const HRApp: React.FC = () => {
  const { activeView, fetchInitialData, fetchMyProfile, fetchShiftSchedules } = useHRStore();
  const { currentUserId, users } = useStore();
  const user = users.find(u => u.id === currentUserId);
  const isHRAdmin = user?.role === 'admin' || user?.role === 'cfo' || (user?.role as string) === 'hr';

  React.useEffect(() => {
    if (isHRAdmin) {
      fetchInitialData();
      fetchShiftSchedules();
    } else {
      fetchMyProfile();
    }
  }, [isHRAdmin, fetchInitialData, fetchMyProfile]);

  let content: React.ReactNode;

  if (!isHRAdmin) {
    // Member only has access to my-dashboard
    content = <MyHRDashboard />;
  } else {
    switch (activeView) {
      case 'dashboard': content = <HRDashboard />; break;
      case 'employees': content = <EmployeesPage />; break;
      case 'absences': content = <AbsencesPage />; break;
      case 'payroll': content = <PayrollPage />; break;
      case 'org': content = <OrgChartPage />; break;
      case 'schedules': content = <ShiftSchedulesPage />; break;
      case 'calendar': content = <WorkCalendarPage />; break;
      default: content = <HRDashboard />;
    }
  }

  return (
    <div className="app-shell" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-family)' }}>
      <HRSidebar />
      <div className="main-content">
        <HRHeader />
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
          <div className="page-body" style={{ padding: 0, flex: 1, overflowY: 'auto' }}>
            {content}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRApp;
