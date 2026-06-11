import { ErrorBoundary } from './components/ErrorBoundary';
import { initLocaleNames } from './lib/localeNames';
import { ToastHost } from './components/ToastHost';
import { ConfirmHost } from './components/ConfirmHost';
import { useEffect, lazy, Suspense } from 'react';
import './index.css';
import { useStore } from './store';

// Desktop (lazy — code-split, audit P1 #9)
const OSDesktop = lazy(() => import('./desktop/OSDesktop'));

// Public Pages
import LoginPage, { type AuthUser } from './modules/auth/LoginPage';
// Module apps — lazy-loaded so heavy deps (recharts, bpmn-js, leaflet) leave the initial bundle
const SettingsApp = lazy(() => import('./modules/settings/SettingsApp'));
const BpmnApp = lazy(() => import('./modules/bpmn/BpmnApp'));
const FinanceApp = lazy(() => import('./modules/finance/FinanceApp'));
const HRApp = lazy(() => import('./modules/hr/HRApp'));
const TMSApp = lazy(() => import('./modules/tms/TMSApp'));
const ProcurementApp = lazy(() => import('./modules/procurement/ProcurementApp'));
const ServiceApp = lazy(() => import('./modules/service/ServiceApp'));
const SchemeApp = lazy(() => import('./modules/scheme/SchemeApp'));
import { NotificationsModal } from './components/NotificationsModal';

// WorkSpace Pro — Tracker
import Sidebar from './modules/workspace/Sidebar';
import Header from './modules/workspace/Header';
import ViewsTabBar from './modules/workspace/ViewsTabBar';
import TaskList from './modules/workspace/TaskList';
import KanbanBoard from './modules/workspace/KanbanBoard';
import GanttChart from './modules/workspace/GanttChart';
import CalendarView from './modules/workspace/CalendarView';
import Dashboard from './modules/workspace/Dashboard';
import TaskModal from './modules/workspace/TaskModal';
import CommandPalette from './components/CommandPalette';
import InboxView from './modules/workspace/InboxView';
import ProjectModal from './modules/workspace/ProjectModal';
import { GlobalAICopilot } from './components/GlobalAICopilot';
import Analytics from './modules/workspace/Analytics';
import TeamPage from './modules/workspace/TeamPage';
import { BulkActionsBar } from './modules/workspace/BulkActionsBar';

const Loading = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-muted)', fontSize: 14 }}>Загрузка…</div>
);

function App() {
  const activeApp = useStore(state => state.activeApp);
      const activePage = useStore(state => state.activePage);
      const projectTab = useStore(state => state.projectTab);
      const theme = useStore(state => state.theme);
      const setActiveApp = useStore(state => state.setActiveApp);
      const loadArcanaData = useStore(state => state.loadArcanaData);
      const loadSettings = useStore(state => state.loadSettings);
      const setCurrentUser = useStore(state => state.setCurrentUser);

  // Load Arcana data from backend when workspace is activated
  useEffect(() => {
    if (activeApp === 'workspace' || activeApp === 'settings' || activeApp === 'finance' || activeApp === 'hr' || activeApp === 'tms') {
      loadArcanaData();
    }
  }, [activeApp, loadArcanaData]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Reference-name UZ substitution (display-only, safe exact-match)
  useEffect(() => { initLocaleNames(); }, []);

  // Check saved JWT token on startup
  useEffect(() => {
    const hasSession = localStorage.getItem('has_session');
    if (hasSession === '1') {
      // Validate session with server via http-only cookie
      fetch('/api/auth/me', { credentials: 'include' })
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(user => {
          setCurrentUser(user.id, user.name, user.email, user.role, user.avatar);
          loadSettings();
          
          // Deep link support
          const params = new URLSearchParams(window.location.search);
          const urlApp = params.get('app');
          const urlPage = params.get('page');
          
          if (urlApp && ['desktop', 'workspace', 'settings', 'bpmn', 'finance', 'hr', 'tms', 'procurement', 'service', 'scheme'].includes(urlApp)) {
            setActiveApp(urlApp as any);
            if (urlPage && urlApp === 'workspace') {
               useStore.getState().setActivePage(urlPage as any);
            }
          } else {
            setActiveApp('desktop');
          }
        })
        .catch(() => {
          localStorage.removeItem('has_session');
          localStorage.removeItem('auth_user');
          if (activeApp !== 'login') {
            window.location.href = '/'; // Redirect to clear URL parameters
          }
        });
    } else if (activeApp !== 'login') {
      setActiveApp('login');
      window.history.replaceState({}, '', '/');
    }
  }, []);

  // URL Sync
  useEffect(() => {
    if (activeApp === 'login') return;
    const url = new URL(window.location.href);
    url.searchParams.set('app', activeApp);
    if (activeApp === 'workspace' && activePage) {
      url.searchParams.set('page', activePage);
    } else {
      url.searchParams.delete('page');
    }
    window.history.replaceState({}, '', url);
  }, [activeApp, activePage]);

  // Global shortcuts: Cmd/Ctrl+M -> OS Desktop; Alt+1..9 -> jump straight to an app
  // (power-user path past the desktop metaphor — audit P3 #22). e.code keeps it
  // keyboard-layout independent.
  useEffect(() => {
    const APP_KEYS = ['workspace', 'bpmn', 'hr', 'finance', 'service', 'tms', 'procurement', 'settings', 'scheme'] as const;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        setActiveApp('desktop');
        return;
      }
      if (e.altKey && !e.metaKey && !e.ctrlKey && e.code.startsWith('Digit')) {
        const n = Number(e.code.slice(5));
        if (n >= 1 && n <= APP_KEYS.length) {
          e.preventDefault();
          setActiveApp(APP_KEYS[n - 1]);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActiveApp]);

  const handleLoginSuccess = (user: AuthUser, _token: string) => {
    setCurrentUser(user.id, user.name, user.email, user.role, user.avatar);
    loadSettings();
    setActiveApp('desktop');
  };

  let content = null;

  if (activeApp === 'desktop') {
    return <Suspense fallback={<Loading />}><OSDesktop /></Suspense>;
  }

  if (activeApp === 'login') {
    return <LoginPage onSuccess={handleLoginSuccess} />;
  }

  if (activeApp === 'settings') {
    content = <SettingsApp />;
  } else if (activeApp === 'bpmn') {
    content = <BpmnApp />;
  } else if (activeApp === 'finance') {
    content = <FinanceApp />;
  } else if (activeApp === 'hr') {
    content = <HRApp />;
  } else if (activeApp === 'tms') {
    content = <TMSApp />;
  } else if (activeApp === 'procurement') {
    content = <ProcurementApp />;
  } else if (activeApp === 'service') {
    content = <ServiceApp />;
  } else if (activeApp === 'scheme') {
    content = <SchemeApp />;
  } else {
    // Fallback / Default: WorkSpace Pro
    const isKanban   = activePage === 'project' && projectTab === 'kanban';
    const isCalendar = activePage === 'calendar';
    const isTeam     = activePage === 'team';

    content = (
      <div className="app-shell">
        <Sidebar />
        <div className="main-content">
          <Header />
          {activePage === 'project' && <ViewsTabBar />}
          <div
            className="page-body"
            style={{
              padding: (isKanban || isTeam) ? '0' : '16px',
              overflow: (isKanban || isCalendar || isTeam) ? 'hidden' : 'auto',
            }}
          >
            {activePage === 'dashboard' && <Dashboard />}
            {activePage === 'project'   && projectTab === 'list'   && <TaskList />}
            {activePage === 'project'   && projectTab === 'kanban' && <KanbanBoard />}
            {activePage === 'project'   && projectTab === 'gantt'  && <GanttChart />}
            {activePage === 'calendar'  && <CalendarView />}
            {activePage === 'analytics' && <Analytics />}
            {activePage === 'inbox' && <InboxView />}
            {activePage === 'my_tasks' && <TaskList />}
            {activePage === 'team' && <TeamPage />}
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<Loading />}>{content}</Suspense>
      <TaskModal />
      <CommandPalette />
      <ProjectModal />
      <BulkActionsBar />
      <NotificationsModal />
      <GlobalAICopilot />
      <ToastHost />
      <ConfirmHost />
    </ErrorBoundary>
  );
}

export default App;
