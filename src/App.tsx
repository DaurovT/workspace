import { useEffect } from 'react';
import './index.css';
import { useStore } from './store';

// Desktop
import OSDesktop from './desktop/OSDesktop';

// WorkSpace Pro — Tracker
import Sidebar from './services/workspace/components/Sidebar';
import Header from './services/workspace/components/Header';
import ViewsTabBar from './services/workspace/components/ViewsTabBar';
import TaskList from './services/workspace/components/TaskList';
import KanbanBoard from './services/workspace/components/KanbanBoard';
import GanttChart from './services/workspace/components/GanttChart';
import CalendarView from './services/workspace/components/CalendarView';
import Dashboard from './services/workspace/components/Dashboard';
import TaskModal from './services/workspace/components/TaskModal';
import CommandPalette from './services/workspace/components/CommandPalette';
import InboxView from './services/workspace/components/InboxView';
import ProjectModal from './services/workspace/components/ProjectModal';
import Analytics from './services/workspace/components/Analytics';
import TeamPage from './services/workspace/components/TeamPage';
import { BulkActionsBar } from './services/workspace/components/BulkActionsBar';

function App() {
  const { activeApp, activePage, projectTab, theme, setActivePage, setActiveApp } = useStore();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Global Shortcut for Command+M to open OS Desktop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command (Mac) or Ctrl (Windows) + M
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        setActiveApp('desktop');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActiveApp]);

  if (activeApp === 'desktop') {
    return <OSDesktop />;
  }


  // Fallback / Default: WorkSpace Pro
  const isKanban   = activePage === 'project' && projectTab === 'kanban';
  const isCalendar = activePage === 'calendar';
  const isTeam     = activePage === 'team';

  return (
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
      <TaskModal />
      <CommandPalette />
      <ProjectModal />
      <BulkActionsBar />
    </div>
  );
}

export default App;
