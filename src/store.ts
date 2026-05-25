import { create } from 'zustand';
import { api, apiHeaders } from './services/api';

import type { DependencyType, GanttDep } from './modules/workspace/utils/ganttDeps';
import { wouldCreateCycle } from './modules/workspace/utils/ganttDeps';

export type Priority = 'urgent' | 'high' | 'medium' | 'low';
export type StatusId = 'todo' | 'in_progress' | 'review' | 'done' | 'blocked';

export const PRIORITY_LABELS: Record<Priority, string> = { urgent: 'Срочно', high: 'Высокий', medium: 'Средний', low: 'Низкий' };
export const STATUS_LABELS: Record<StatusId, string> = { todo: 'К выполнению', in_progress: 'В работе', review: 'На проверке', done: 'Готово', blocked: 'Заблокировано' };

export type UserRole = 'owner' | 'admin' | 'member' | 'viewer' | 'cfo' | 'accountant';
export type ProjectMemberRole = 'admin' | 'member' | 'viewer';

export interface ProjectMember {
  userId: string;
  role: ProjectMemberRole;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string; // initials
  color: string;
  role: UserRole;
  jobTitle?: string;
  isActive: boolean;
  joinedAt: string;
  allowedApps?: string[]; // e.g. ['arcana', 'bpmn', 'kidsplate', 'tms']
  password?: string;
  telegramBindCode?: string;
}

export interface Task {
  id: string;
  projectId: string;
  parentId?: string | null;
  title: string;
  description: string;
  priority: Priority;
  status: StatusId;
  assigneeId: string | null;
  reporterId: string;
  startDate: string; // ISO string
  dueDate: string;   // ISO string
  tags: string[];
  estimatedHours: number;
  loggedHours: number;
  createdAt: string;
  updatedAt: string;
  position: number; // for kanban ordering within column
  progress: number; // 0-100
  dependencies?: GanttDep[];
}

export interface Comment {
  id: string;
  taskId: string;
  authorId: string; // "system" if isSystem is true
  text: string;
  createdAt: string;
  isSystem?: boolean;
}

export interface Notification {
  id: string;
  type: 'mention' | 'assigned' | 'due_soon' | 'completed';
  title: string;
  body: string;
  taskId: string | null;
  read: boolean;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  icon: string;
  description: string;
  members: ProjectMember[];
  createdAt: string;
  status: 'active' | 'archived';
}

export interface KanbanColumn {
  id: StatusId;
  name: string;
  color: string;
  wipLimit: number | null;
}

// ─── KANBAN COLUMNS (structural config) ──────────────────────────────────────

const COLUMNS: KanbanColumn[] = [
  { id: 'todo', name: 'К выполнению', color: '#5a6278', wipLimit: null },
  { id: 'in_progress', name: 'В работе', color: '#6366f1', wipLimit: 4 },
  { id: 'review', name: 'На проверке', color: '#f59e0b', wipLimit: 3 },
  { id: 'done', name: 'Готово', color: '#22c55e', wipLimit: null },
  { id: 'blocked', name: 'Заблокировано', color: '#ef4444', wipLimit: null },
];

// ─── STORE ───────────────────────────────────────────────────────────────────

export interface SavedView {
  id: string;
  name: string;
  icon: string;
  layout: 'list' | 'kanban' | 'gantt';
  filterStatus: StatusId | null;
  filterPriority: Priority | null;
  filterAssignee: string | null;
  kanbanGroupBy: 'none' | 'assignee';
}

// ── API helper for background persistence ──────────────────────────────────────
// API moved to src/services/api.ts

export interface AppSettings {
  companyName: string;
  domain: string;
  timezone: string;
  language: string;
  workWeekStart: string;
  sessionTimeout: string;
  forceLogoutOnClose: boolean;
  passwordMinLength: string;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  twoFactor: boolean;
  ipWhitelist: boolean;
  ipWhitelistText: string;
  emailAssign: boolean;
  emailMention: boolean;
  emailDue: boolean;
  pushAll: boolean;
  digestFreq: string;
}

interface AppStore {
  // Data
  users: User[];
  projects: Project[];
  tasks: Task[];
  columns: KanbanColumn[];
  comments: Comment[];
  notifications: Notification[];
  savedViews: SavedView[];
  _arcanaLoaded: boolean;
  settings: AppSettings;
  // UI State
  activeApp: 'desktop' | 'workspace' | 'login' | 'settings' | 'bpmn' | 'finance' | 'hr' | 'tms' | 'procurement' | 'service' | 'knowledge';
  activeProjectId: string;
  activePage: 'desktop' | 'dashboard' | 'inbox' | 'calendar' | 'my_tasks' | 'analytics' | 'project' | 'team';
  projectTab: 'list' | 'kanban' | 'gantt';
  activeSavedViewId: string | 'default';
  currentUserId: string;
  searchQuery: string;
  filterStatus: StatusId | null;
  filterPriority: Priority | null;
  filterAssignee: string | null;
  ganttScale: 'day' | 'week' | 'month';
  kanbanGroupBy: 'none' | 'assignee';
  theme: 'dark' | 'light';
  isNotifPanelOpen: boolean;
  isCommandPaletteOpen: boolean;
  isSidebarMobileOpen: boolean;
  isProjectModalOpen: boolean;
  isGlobalNotificationsOpen: boolean;
  isGlobalAIOpen: boolean;
  projectModalMode: 'create' | 'edit';
  // Modal & Selection
  isTaskModalOpen: boolean;
  editingTaskId: string | null;
  selectedTaskIds: string[];
  // Actions
  loadSettings: () => Promise<void>;
  updateSettings: (updates: Partial<AppSettings>) => void;
  loadArcanaData: () => Promise<void>;
  loadTasksForProject: (projectId: string) => Promise<void>;
  loadCommentsForTask: (taskId: string) => Promise<void>;
  setCurrentUser: (userId: string, name: string, email: string, role: string, avatar?: string) => void;
  setActiveApp: (app: 'desktop' | 'workspace' | 'login' | 'settings' | 'bpmn' | 'finance' | 'hr' | 'tms' | 'procurement' | 'service' | 'knowledge') => void;
  setActiveProject: (id: string) => void;
  setActivePage: (p: 'desktop' | 'dashboard' | 'inbox' | 'calendar' | 'my_tasks' | 'analytics' | 'project' | 'team') => void;
  setProjectTab: (t: 'list' | 'kanban' | 'gantt') => void;
  setActiveSavedViewId: (id: string | 'default') => void;
  logout: () => void;
  saveView: (view: Omit<SavedView, 'id'>) => void;
  updateSavedView: (id: string, updates: Partial<Omit<SavedView, 'id'>>) => void;
  deleteSavedView: (id: string) => void;
  setSearchQuery: (q: string) => void;
  setFilterStatus: (s: StatusId | null) => void;
  setFilterPriority: (p: Priority | null) => void;
  setFilterAssignee: (a: string | null) => void;
  setGanttScale: (s: 'day' | 'week' | 'month') => void;
  setKanbanGroupBy: (g: 'none' | 'assignee') => void;
  toggleTheme: () => void;
  toggleNotifPanel: () => void;
  toggleCommandPalette: () => void;
  toggleSidebarMobile: () => void;
  setSidebarMobileOpen: (open: boolean) => void;
  setGlobalNotificationsOpen: (open: boolean) => void;
  setGlobalAIOpen: (open: boolean) => void;
  openProjectModal: (mode: 'create' | 'edit') => void;
  closeProjectModal: () => void;
  markAllRead: () => void;
  markRead: (notifId: string) => void;
  openNewTask: () => void;
  openEditTask: (id: string) => void;
  closeModal: () => void;
  createTask: (t: Partial<Task>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  addDependency: (succId: string, predId: string, type: DependencyType, lag?: number) => { ok: boolean; error?: string };
  removeDependency: (taskId: string, depPredId: string) => void;
  cascadeUpdate: (movedTaskId: string, deltaDays: number) => void;
  moveTask: (taskId: string, newStatus: StatusId, newPosition: number) => void;
  addComment: (taskId: string, text: string, isSystem?: boolean, authorId?: string) => void;
  createProject: (p: Partial<Project>) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  toggleTaskSelection: (id: string, selectAll?: boolean, taskIds?: string[]) => void;
  clearTaskSelection: () => void;
  bulkUpdateTasks: (updates: Partial<Task>) => void;
  logTime: (taskId: string, hours: number, date?: string, notes?: string) => void;
  // Team actions
  createUser: (u: Partial<User>) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  generateTelegramBindCode: (id: string) => Promise<string | null>;
  addProjectMember: (projectId: string, userId: string, role: ProjectMemberRole) => void;
  removeProjectMember: (projectId: string, userId: string) => void;
  updateProjectMemberRole: (projectId: string, userId: string, role: ProjectMemberRole) => void;
}

// Initial state loading mechanism
const STATE_VERSION = 3; // bump to clear stale localStorage
const savedStateStr = localStorage.getItem('workspace_pro_state');
let loadedState: Partial<AppStore> = {};
if (savedStateStr) {
  try {
    const parsed = JSON.parse(savedStateStr);
    if (parsed.__version !== STATE_VERSION) {
      localStorage.removeItem('workspace_pro_state');
    } else {
      loadedState = parsed;
    }
  } catch (e) {
    console.error('Failed to parse saved state', e);
  }
}

export const useStore = create<AppStore>()((set, get) => ({
  users: [],
  projects: [],
  settings: loadedState.settings || {
    companyName: 'WorkSpace Pro',
    domain: 'workspace.local',
    timezone: 'Asia/Tashkent',
    language: 'ru',
    workWeekStart: 'Понедельник',
    sessionTimeout: '480',
    forceLogoutOnClose: false,
    passwordMinLength: '8',
    requireNumbers: true,
    requireSpecialChars: false,
    twoFactor: false,
    ipWhitelist: false,
    ipWhitelistText: '',
    emailAssign: true,
    emailMention: true,
    emailDue: true,
    pushAll: true,
    digestFreq: 'daily'
  },
  tasks: [],
  columns: COLUMNS,
  comments: [],
  notifications: [],
  savedViews: loadedState.savedViews || [],
  _arcanaLoaded: false,
  activeProjectId: loadedState.activeProjectId || 'p1',
  activeApp: (loadedState.activeApp && localStorage.getItem('has_session')) ? loadedState.activeApp : 'login',
  activePage: loadedState.activePage || 'dashboard',
  projectTab: loadedState.projectTab || 'list',
  activeSavedViewId: loadedState.activeSavedViewId || 'default',
  currentUserId: 'u1',
  searchQuery: '',
  filterStatus: null,
  filterPriority: null,
  filterAssignee: null,
  ganttScale: 'week',
  kanbanGroupBy: loadedState.kanbanGroupBy || 'none',
  theme: loadedState.theme || ('dark' as const),
  isNotifPanelOpen: false,
  isCommandPaletteOpen: false,
  isSidebarMobileOpen: false,
  isProjectModalOpen: false,
  isGlobalNotificationsOpen: false,
  isGlobalAIOpen: false,
  projectModalMode: 'create',
  isTaskModalOpen: false,
  editingTaskId: null,
  selectedTaskIds: [],

  loadArcanaData: async () => {
    if (get()._arcanaLoaded) return;
    try {
      const [projects, usersList] = await Promise.all([
        api.fetchProjects(),
        fetch('/api/users', { headers: apiHeaders(), credentials: 'include' }).then(r => r.ok ? r.json() : []).catch(() => [])
      ]);
      
      set({
        projects,
        users: usersList,
        _arcanaLoaded: true,
      });
      
      // Load tasks for active project if one exists
      const activeProjectId = get().activeProjectId;
      if (activeProjectId) {
        get().loadTasksForProject(activeProjectId);
      }
    } catch (e) {
      console.error('Failed to load Arcana data from API:', e);
      set({ _arcanaLoaded: true });
    }
  },

  loadTasksForProject: async (projectId: string) => {
    try {
      const r = await fetch(`/api/arcana/tasks?projectId=${projectId}`, { headers: apiHeaders(), credentials: 'include' });
      if (r.ok) {
        const tasks = await r.json();
        
        set(st => {
           // Keep tasks of other projects, merge new ones
           const otherTasks = st.tasks.filter(t => t.projectId !== projectId);
           return { tasks: [...otherTasks, ...tasks] };
        });
      }
    } catch (e) {
      console.error('Failed to load tasks for project', e);
    }
  },

  loadCommentsForTask: async (taskId: string) => {
    try {
      const r = await fetch(`/api/arcana/comments?taskId=${taskId}`, { headers: apiHeaders(), credentials: 'include' });
      if (r.ok) {
        const taskComments = await r.json();
        set(st => {
           // Remove existing comments for this task, then add fresh ones
           const otherComments = st.comments.filter(c => c.taskId !== taskId);
           return { comments: [...otherComments, ...taskComments] };
        });
      }
    } catch (e) {
      console.error('Failed to load comments for task', e);
    }
  },

  updateSettings: (updates) => {
    set(st => ({ settings: { ...st.settings, ...updates } }));
    api.put('/api/settings', updates);
  },

  loadSettings: async () => {
    const s = await api.fetchSettings();
    if (Object.keys(s).length > 0) {
      set(st => ({ settings: { ...st.settings, ...s } }));
    }
  },

  setCurrentUser: (userId, name, email, role, avatar) => set(st => {
    // Update currentUserId so all Arcana actions are done on behalf of the real user
    const existingUser = st.users.find(u => u.id === userId);
    const updatedUsers = existingUser
      ? st.users.map(u => u.id === userId ? { ...u, name, email, role: role as any, avatar: avatar || u.avatar } : u)
      : [...st.users, {
          id: userId, name, email, avatar: avatar || name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2),
          color: '#6366f1', role: role as any, isActive: true, joinedAt: new Date().toISOString()
        }];
    return { currentUserId: userId, users: updatedUsers };
  }),

  setActiveApp: (app) => set((st) => {
    if (app !== 'login' && !localStorage.getItem('has_session')) {
      return { activeApp: 'login' };
    }
    if (app !== 'login' && app !== 'desktop') {
      const currentUser = st.users.find(u => u.id === st.currentUserId);
      if (currentUser && currentUser.allowedApps && currentUser.allowedApps.length > 0) {
        if (!currentUser.allowedApps.includes(app)) {
          alert('У вас нет доступа к этому приложению.');
          return { activeApp: 'desktop' };
        }
      }
    }
    return { activeApp: app };
  }),
  setActiveProject: (id) => {
    set({ activeProjectId: id });
    get().loadTasksForProject(id);
  },
  setActivePage: (p) => set({ activePage: p }),
  setProjectTab: (t) => set({ projectTab: t }),
  
  setActiveSavedViewId: (id) => set((st) => {
    if (id === 'default') {
      return { activeSavedViewId: id };
    }
    const view = st.savedViews.find(v => v.id === id);
    if (view) {
      return {
        activeSavedViewId: id,
        activePage: 'project',
        projectTab: view.layout,
        filterAssignee: view.filterAssignee,
        filterPriority: view.filterPriority,
        filterStatus: view.filterStatus,
        kanbanGroupBy: view.kanbanGroupBy
      };
    }
    return { activeSavedViewId: id };
  }),

  logout: () => {
    localStorage.removeItem('has_session');
    localStorage.removeItem('auth_user');
    set({
      activeApp: 'login',
      currentUserId: '',
      _arcanaLoaded: false,
    });
  },

  saveView: (viewData) => set((st) => {
    const newView: SavedView = { ...viewData, id: `view_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` };
    return {
      savedViews: [...st.savedViews, newView],
      activeSavedViewId: newView.id
    };
  }),
  updateSavedView: (id, updates) => set((st) => ({
    savedViews: st.savedViews.map(v => v.id === id ? { ...v, ...updates } : v)
  })),
  deleteSavedView: (id) => set((st) => ({
    savedViews: st.savedViews.filter(v => v.id !== id),
    activeSavedViewId: st.activeSavedViewId === id ? 'default' : st.activeSavedViewId
  })),

  setSearchQuery: (q) => set({ searchQuery: q }),
  setFilterStatus: (s) => set({ filterStatus: s }),
  setFilterPriority: (p) => set({ filterPriority: p }),
  setFilterAssignee: (a) => set({ filterAssignee: a }),
  setGanttScale: (s) => set({ ganttScale: s }),
  setKanbanGroupBy: (g) => set({ kanbanGroupBy: g }),
  toggleTheme: () => set((st) => {
    const next = st.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    return { theme: next };
  }),
  toggleNotifPanel: () => set(st => ({ isNotifPanelOpen: !st.isNotifPanelOpen })),
  toggleCommandPalette: () => set(st => ({ isCommandPaletteOpen: !st.isCommandPaletteOpen })),
  toggleSidebarMobile: () => set(st => ({ isSidebarMobileOpen: !st.isSidebarMobileOpen })),
  setSidebarMobileOpen: (open: boolean) => set({ isSidebarMobileOpen: open }),
  setGlobalNotificationsOpen: (open) => set({ isGlobalNotificationsOpen: open }),
  setGlobalAIOpen: (open) => set({ isGlobalAIOpen: open }),
  openProjectModal: (mode) => set({ isProjectModalOpen: true, projectModalMode: mode }),
  closeProjectModal: () => set({ isProjectModalOpen: false }),
  markAllRead: () => set(st => ({ notifications: st.notifications.map(n => ({ ...n, read: true })) })),
  markRead: (id) => set(st => ({ notifications: st.notifications.map(n => n.id === id ? { ...n, read: true } : n) })),
  openNewTask: () => set({ isTaskModalOpen: true, editingTaskId: null }),
  openEditTask: (id) => set({ isTaskModalOpen: true, editingTaskId: id }),
  closeModal: () => set({ isTaskModalOpen: false, editingTaskId: null }),

  createTask: async (t) => {
    const st = get();
    // Create on backend first to get a stable server-assigned ID,
    // avoiding race conditions with WebSocket db_mutation events.
    try {
      const payload = {
        ...t,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        position: st.tasks.filter(x => x.status === t.status).length,
        progress: 0,
        tags: t.tags || [],
        dependencies: t.dependencies || [],
      };
      const response = await fetch('/api/arcana/tasks', {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        const realTask = await response.json();
        set(s => ({
          tasks: [...s.tasks.filter(x => x.id !== realTask.id), realTask],
          notifications: [
            ...s.notifications,
            { id: `notif_${Date.now()}`, type: 'assigned' as const, title: 'Новая задача', body: `Создана задача: ${t.title}`, taskId: realTask.id, read: false, createdAt: new Date().toISOString() }
          ]
        }));
      }
    } catch (e) {
      console.error('Failed to create task', e);
    }
  },

  updateTask: (id, updates) => {
    const st = get();
    const oldTask = st.tasks.find(t => t.id === id);
    if (!oldTask) return;

    const newComments: Comment[] = [];
    const addSysLog = (text: string) => {
      newComments.push({
        id: `c${Date.now()}_${Math.floor(Math.random() * 10000)}`,
        taskId: id,
        authorId: 'system',
        text,
        createdAt: new Date().toISOString(),
        isSystem: true,
      });
    };

    if (updates.status && updates.status !== oldTask.status) {
      addSysLog(`Статус изменён: "${STATUS_LABELS[oldTask.status]}" ➔ "${STATUS_LABELS[updates.status]}"`);
    }
    if (updates.priority && updates.priority !== oldTask.priority) {
      addSysLog(`Приоритет изменён: "${PRIORITY_LABELS[oldTask.priority]}" ➔ "${PRIORITY_LABELS[updates.priority]}"`);
    }
    if (updates.assigneeId !== undefined && updates.assigneeId !== oldTask.assigneeId) {
      const uName = updates.assigneeId ? st.users.find(u => u.id === updates.assigneeId)?.name : 'Не назначен';
      addSysLog(`Исполнитель изменён ➔ "${uName}"`);
    }

    const newNotifs: Notification[] = [];
    if (updates.description && updates.description !== oldTask.description) {
      const mentions = updates.description.match(/@\[(.*?)\]/g);
      if (mentions) {
        mentions.forEach(m => {
          const mentionedName = m.replace('@', '').replace('[', '').replace(']', '');
          const mentionedUser = st.users.find(u => u.name === mentionedName);
          if (mentionedUser) {
            newNotifs.push({
               id: `notif_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
               type: 'mention',
               title: 'Вас упомянули',
               body: `Упоминание в описании: "${updates.title || oldTask.title}"`,
               taskId: id,
               read: false,
               createdAt: new Date().toISOString()
            });
          }
        });
      }
    }

    const isDone = updates.status === 'done';
    const progressUpdate = isDone ? { progress: 100 } : {};

    let merged = { ...oldTask, ...updates, ...progressUpdate, updatedAt: new Date().toISOString() };

    if (merged.parentId) {
      const parent = st.tasks.find(t => t.id === merged.parentId);
      if (parent && parent.startDate && parent.dueDate) {
        const pStart = new Date(parent.startDate).getTime();
        const pEnd   = new Date(parent.dueDate).getTime();
        let tStart = new Date(merged.startDate).getTime();
        let tEnd   = new Date(merged.dueDate).getTime();
        if (tStart < pStart) tStart = pStart;
        if (tEnd   > pEnd)   tEnd   = pEnd;
        if (tStart > pEnd)   tStart = pEnd;
        if (tEnd   < tStart) tEnd   = tStart;
        merged = { ...merged, startDate: new Date(tStart).toISOString(), dueDate: new Date(tEnd).toISOString() };
      }
    }

    // Apply optimistically
    set(currentSt => ({
      tasks: currentSt.tasks.map(t => t.id === id ? merged : t),
      comments: [...currentSt.comments, ...newComments],
      notifications: [...currentSt.notifications, ...newNotifs]
    }));

    // Persist system comments
    newComments.forEach(c => api.post('/api/arcana/comments', c).catch(console.error));

    // Persist task with rollback (pass expectedVersion for OCC)
    const payload = { ...merged, expectedVersion: oldTask.updatedAt };
    api.put(`/api/arcana/tasks/${id}`, payload)
      .then(r => { if (!r || !r.ok) throw new Error(r?.status === 409 ? 'Conflict' : 'API Error'); })
      .catch(err => {
        console.error('Task update failed, rolling back:', err);
        if (err.message === 'Conflict') {
           alert('Конфликт: задача была изменена другим пользователем. Пожалуйста, обновите страницу.');
        }
        // Rollback state to oldTask
        set(currentSt => ({
          tasks: currentSt.tasks.map(t => t.id === id ? oldTask : t)
        }));
      });
  },

  deleteTask: (id) => {
    set(st => ({
      tasks: st.tasks.filter(t => t.id !== id && t.parentId !== id),
      selectedTaskIds: st.selectedTaskIds.filter(tid => tid !== id)
    }));
    api.del(`/api/arcana/tasks/${id}`);
  },

  addDependency: (succId, predId, type, lag) => {
    const st = get();

    // Self-dependency guard
    if (succId === predId) return { ok: false, error: 'Задача не может зависеть от себя' };

    // Cycle detection
    if (wouldCreateCycle(succId, predId, st.tasks)) {
      return { ok: false, error: 'Зависимость создаёт цикл' };
    }

    set(s => ({
      tasks: s.tasks.map(t => {
        if (t.id === succId) {
          const deps = t.dependencies || [];
          const filtered = deps.filter(d => d.taskId !== predId);
          return { ...t, dependencies: [...filtered, { taskId: predId, type, lag }] };
        }
        return t;
      })
    }));
    // Persist updated deps
    const updated = get().tasks.find(t => t.id === succId);
    if (updated) api.put(`/api/arcana/tasks/${succId}`, { dependencies: updated.dependencies });
    return { ok: true };
  },

  removeDependency: (taskId, predId) => {
    set(st => ({
      tasks: st.tasks.map(t => {
        if (t.id !== taskId) return t;
        return { ...t, dependencies: (t.dependencies || []).filter(d => d.taskId !== predId) };
      })
    }));
    const updated = get().tasks.find(t => t.id === taskId);
    if (updated) api.put(`/api/arcana/tasks/${taskId}`, { dependencies: updated.dependencies });
  },

  cascadeUpdate: async (movedTaskId, deltaDays) => {
    if (deltaDays <= 0) return;
    try {
      const r = await fetch(`/api/arcana/tasks/${movedTaskId}/cascade`, {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify({ deltaDays })
      });
      if (r.ok) {
        const { updated } = await r.json();
        if (updated && updated.length > 0) {
          // Update the local tasks with the new dates from the server
          set(st => ({
            tasks: st.tasks.map(t => {
              const u = updated.find((upd: any) => upd.id === t.id);
              if (u) return { ...t, startDate: u.startDate, dueDate: u.dueDate };
              return t;
            })
          }));
        }
      }
    } catch (e) {
      console.error('Failed to cascade update on backend', e);
    }
  },

  moveTask: (taskId, newStatus, newPosition) => {
    const oldTask = get().tasks.find(t => t.id === taskId);
    if (oldTask && oldTask.status !== newStatus) {
      get().addComment(taskId, `Статус изменён: "${STATUS_LABELS[oldTask.status]}" ➔ "${STATUS_LABELS[newStatus]}" (перенос)`, true, 'system');
    }
    set((s) => ({
      tasks: s.tasks.map(t => t.id !== taskId ? t : { ...t, status: newStatus, position: newPosition, updatedAt: new Date().toISOString() }),
    }));
    api.put(`/api/arcana/tasks/${taskId}`, { status: newStatus, position: newPosition });
  },

  addComment: (taskId, text, isSystem = false, authorId) => {
    const aid = authorId || get().currentUserId;
    const authorName = get().users.find(u => u.id === aid)?.name || 'Система';
    const comment: Comment = {
      id: `c${Date.now()}_${Math.floor(Math.random()*1000)}`,
      taskId,
      authorId: aid,
      text,
      createdAt: new Date().toISOString(),
      isSystem,
    };

    const newNotifs: Notification[] = [];
    if (!isSystem) {
      const mentions = text.match(/@\[(.*?)\]/g);
      if (mentions) {
        mentions.forEach(m => {
          const mentionedName = m.replace('@', '').replace('[', '').replace(']', '');
          const mentionedUser = get().users.find(u => u.name === mentionedName);
          if (mentionedUser) {
            newNotifs.push({
               id: `notif_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
               type: 'mention',
               title: 'Вас упомянули',
               body: `${authorName} упомянул вас в комментарии`,
               taskId,
               read: false,
               createdAt: new Date().toISOString()
            });
          }
        });
      }
    }

    set((s) => ({ comments: [...s.comments, comment], notifications: [...s.notifications, ...newNotifs] }));
    api.post('/api/arcana/comments', comment);
  },

  logTime: (taskId, hours, date, notes) => {
    if (hours <= 0) return;
    const task = get().tasks.find(t => t.id === taskId);
    if (!task) return;

    // Считаем округленные часы для отображения формата
    const h = Number(hours.toFixed(1));

    get().addComment(taskId, `Списано время: +${h} ч (${date})`, true, 'system');
    set((st) => ({
      tasks: st.tasks.map(t => t.id === taskId ? { ...t, loggedHours: (t.loggedHours || 0) + h, updatedAt: new Date().toISOString() } : t)
    }));
    // Use the new endpoint to ensure TimeLog is created for HR Pulse
    api.post(`/api/arcana/tasks/${taskId}/time`, { hours: h, date, notes });
  },

  createProject: async (partial) => {
    // 1. Optimistic UI is fine for opening the modal, but let's actually create it on the backend and use the real ID
    try {
      const response = await fetch('/api/arcana/projects', {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify({
          name: partial.name || 'Новый проект',
          color: partial.color || '#654ef1',
          icon: partial.icon || '📁',
          description: partial.description || '',
          status: partial.status || 'active',
          members: [{ userId: get().currentUserId, role: 'admin' }]
        })
      });
      if (response.ok) {
        const project = await response.json();
        set((s) => ({ 
          projects: [...s.projects, project], 
          activeProjectId: project.id, 
          isProjectModalOpen: false 
        }));
      }
    } catch (e) {
      console.error('Failed to create project', e);
    }
  },

  updateProject: (id, updates) => {
    set((s) => ({
      projects: s.projects.map(p => p.id === id ? { ...p, ...updates } : p)
    }));
    api.put(`/api/arcana/projects/${id}`, updates);
  },

  createUser: (partial) => {
    const newUser: User = {
      id: `u${Date.now()}`,
      name: 'Новый участник',
      email: '',
      avatar: 'НУ',
      color: '#6366f1',
      role: 'member',
      jobTitle: '',
      isActive: true,
      joinedAt: new Date().toISOString(),
      ...partial,
    };
    set((s) => ({ users: [...s.users, newUser] }));
    // Persist to backend (passwords set separately)
    api.post('/api/users', { ...newUser });
  },

  updateUser: (id, updates) => {
    set((s) => ({
      users: s.users.map(u => u.id === id ? { ...u, ...updates } : u)
    }));
    // Persist to backend — includes allowedApps changes from Settings
    api.put(`/api/users/${id}`, updates);
  },

  generateTelegramBindCode: async (id) => {
    try {
      const response = await fetch(`/api/users/${id}/bind-code`, {
        method: 'POST',
        headers: apiHeaders()
      });
      if (response.ok) {
        const res = await response.json();
        if (res && res.code) {
          set((s) => ({
            users: s.users.map(u => u.id === id ? { ...u, telegramBindCode: res.code } : u)
          }));
          return res.code as string;
        }
      }
      return null;
    } catch (e) {
      console.error('Failed to generate bind code', e);
      return null;
    }
  },

  deleteUser: (id) => {
    set((s) => ({
      users: s.users.filter(u => u.id !== id),
      projects: s.projects.map(p => ({
        ...p,
        members: p.members.filter(m => m.userId !== id)
      }))
    }));
    api.del(`/api/users/${id}`);
  },

  addProjectMember: (projectId, userId, role) => {
    set((s) => ({
      projects: s.projects.map(p => {
        if (p.id !== projectId) return p;
        if (p.members.some(m => m.userId === userId)) return p;
        return { ...p, members: [...p.members, { userId, role }] };
      })
    }));
    api.post(`/api/arcana/projects/${projectId}/members`, { userId, role });
  },

  removeProjectMember: (projectId, userId) => {
    set((s) => ({
      projects: s.projects.map(p => {
        if (p.id !== projectId) return p;
        return { ...p, members: p.members.filter(m => m.userId !== userId) };
      })
    }));
    api.del(`/api/arcana/projects/${projectId}/members/${userId}`);
  },

  updateProjectMemberRole: (projectId, userId, role) => {
    set((s) => ({
      projects: s.projects.map(p => {
        if (p.id !== projectId) return p;
        return { ...p, members: p.members.map(m => m.userId === userId ? { ...m, role } : m) };
      })
    }));
    api.put(`/api/arcana/projects/${projectId}/members/${userId}`, { role });
  },

  toggleTaskSelection: (id, selectAll = false, taskIds = []) => set((s) => {
    if (selectAll) return { selectedTaskIds: taskIds };
    if (s.selectedTaskIds.includes(id)) return { selectedTaskIds: s.selectedTaskIds.filter(x => x !== id) };
    return { selectedTaskIds: [...s.selectedTaskIds, id] };
  }),

  clearTaskSelection: () => set({ selectedTaskIds: [] }),

  bulkUpdateTasks: (updates) => {
    const ids = get().selectedTaskIds;
    if (!ids.length) return;

    const newComments: Comment[] = [];
    ids.forEach(taskId => {
      const oldTask = get().tasks.find(t => t.id === taskId);
      if (!oldTask) return;

      const addSysLog = (text: string) => {
        newComments.push({
          id: `c${Date.now()}_${Math.floor(Math.random() * 100000)}`,
          taskId,
          authorId: 'system',
          text,
          createdAt: new Date().toISOString(),
          isSystem: true,
        });
      };

      if (updates.status && updates.status !== oldTask.status) {
        addSysLog(`Статус изменён: "${STATUS_LABELS[oldTask.status]}" ➔ "${STATUS_LABELS[updates.status]}" (массово)`);
      }
      if (updates.priority && updates.priority !== oldTask.priority) {
        addSysLog(`Приоритет изменён: "${PRIORITY_LABELS[oldTask.priority]}" ➔ "${PRIORITY_LABELS[updates.priority]}" (массово)`);
      }
    });

    const isDone = updates.status === 'done';
    const progressUpdate = isDone ? { progress: 100 } : {};

    set((s) => ({
      tasks: s.tasks.map(t => ids.includes(t.id) ? { ...t, ...updates, ...progressUpdate, updatedAt: new Date().toISOString() } : t),
      comments: [...s.comments, ...newComments],
      selectedTaskIds: [],
    }));
    // Persist bulk update & system comments
    ids.forEach(id => api.put(`/api/arcana/tasks/${id}`, { ...updates, ...progressUpdate }));
    newComments.forEach(c => api.post('/api/arcana/comments', c));
  },
}));

// Auto-save UI-only state to localStorage (data lives in DB now)
useStore.subscribe((state) => {
  const stateToSave = {
    notifications: state.notifications,
    activeProjectId: state.activeProjectId,
    theme: state.theme,
    kanbanGroupBy: state.kanbanGroupBy,
    savedViews: state.savedViews,
    activeSavedViewId: state.activeSavedViewId,
    activeApp: state.activeApp,
    activePage: state.activePage,
    projectTab: state.projectTab,
    settings: state.settings,
    __version: STATE_VERSION
  };
  localStorage.setItem('workspace_pro_state', JSON.stringify(stateToSave));
});
