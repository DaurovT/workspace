import { create } from 'zustand';
import { addDays, subDays } from 'date-fns';
import type { DependencyType, GanttDep } from './services/workspace/utils/ganttDeps';
import { wouldCreateCycle, cascadeRecalculate } from './services/workspace/utils/ganttDeps';

export type Priority = 'urgent' | 'high' | 'medium' | 'low';
export type StatusId = 'todo' | 'in_progress' | 'review' | 'done' | 'blocked';

export const PRIORITY_LABELS: Record<Priority, string> = { urgent: 'Срочно', high: 'Высокий', medium: 'Средний', low: 'Низкий' };
export const STATUS_LABELS: Record<StatusId, string> = { todo: 'К выполнению', in_progress: 'В работе', review: 'На проверке', done: 'Готово', blocked: 'Заблокировано' };

export type UserRole = 'owner' | 'admin' | 'member' | 'viewer';
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

// ─── MOCK DATA ───────────────────────────────────────────────────────────────

const USERS: User[] = [
  { id: 'u1', name: 'Тимур Дауров', email: 'timur@ws.pro', avatar: 'ТД', color: '#6366f1', role: 'owner', jobTitle: 'Product Manager', isActive: true, joinedAt: new Date(Date.now() - 86400000 * 90).toISOString() },
  { id: 'u2', name: 'Алина Смирнова', email: 'alina@ws.pro', avatar: 'АС', color: '#22c55e', role: 'admin', jobTitle: 'UI/UX Designer', isActive: true, joinedAt: new Date(Date.now() - 86400000 * 60).toISOString() },
  { id: 'u3', name: 'Даниил Парк', email: 'daniil@ws.pro', avatar: 'ДП', color: '#f59e0b', role: 'member', jobTitle: 'Frontend Developer', isActive: true, joinedAt: new Date(Date.now() - 86400000 * 45).toISOString() },
  { id: 'u4', name: 'Кира Иванова', email: 'kira@ws.pro', avatar: 'КИ', color: '#ef4444', role: 'member', jobTitle: 'Backend Developer', isActive: true, joinedAt: new Date(Date.now() - 86400000 * 30).toISOString() },
  { id: 'u5', name: 'Макс Орлов', email: 'max@ws.pro', avatar: 'МО', color: '#38bdf8', role: 'member', jobTitle: 'Full-Stack Developer', isActive: true, joinedAt: new Date(Date.now() - 86400000 * 20).toISOString() },
];

const PROJECTS: Project[] = [
  { id: 'p1', name: 'WorkSpace Pro', color: '#654ef1', icon: '🚀', description: 'Разработка основного продукта', members: [{userId:'u1',role:'admin'},{userId:'u2',role:'member'},{userId:'u3',role:'member'},{userId:'u4',role:'member'},{userId:'u5',role:'member'}], createdAt: new Date().toISOString(), status: 'active' },
  { id: 'p2', name: 'Сайт компании', color: '#22c55e', icon: '🌐', description: 'Лендинг и блог', members: [{userId:'u2',role:'admin'},{userId:'u3',role:'member'}], createdAt: new Date().toISOString(), status: 'active' },
  { id: 'p3', name: 'Мобильное приложение', color: '#f97316', icon: '📱', description: 'iOS и Android приложение', members: [{userId:'u1',role:'admin'},{userId:'u4',role:'member'},{userId:'u5',role:'member'}], createdAt: new Date().toISOString(), status: 'active' },
];

const now = new Date();

const TASKS: Task[] = [
  {
    id: 't1', projectId: 'p1', title: 'Дизайн UI-потока авторизации', description: 'Создать вайрфреймы и хай-фай макеты для экранов входа, регистрации и сброса пароля.', priority: 'high', status: 'done', assigneeId: 'u2', reporterId: 'u1',
    startDate: subDays(now, 14).toISOString(), dueDate: subDays(now, 7).toISOString(),
    tags: ['дизайн', 'авторизация'], estimatedHours: 16, loggedHours: 14, createdAt: subDays(now, 20).toISOString(), updatedAt: subDays(now, 7).toISOString(), position: 0, progress: 100,
    dependencies: [],  // t1 is predecessor to t2 (t2 carries the dep)
  },
  {
    id: 'st1', projectId: 'p1', parentId: 't1', title: 'Вайрфреймы', description: '', priority: 'high', status: 'done', assigneeId: 'u2', reporterId: 'u1',
    startDate: subDays(now, 14).toISOString(), dueDate: subDays(now, 10).toISOString(),
    tags: [], estimatedHours: 8, loggedHours: 8, createdAt: subDays(now, 20).toISOString(), updatedAt: subDays(now, 7).toISOString(), position: 0, progress: 100,
  },
  {
    id: 'st2', projectId: 'p1', parentId: 't1', title: 'Хай-фай макеты', description: '', priority: 'high', status: 'done', assigneeId: 'u2', reporterId: 'u1',
    startDate: subDays(now, 10).toISOString(), dueDate: subDays(now, 7).toISOString(),
    tags: [], estimatedHours: 8, loggedHours: 6, createdAt: subDays(now, 20).toISOString(), updatedAt: subDays(now, 7).toISOString(), position: 1, progress: 100,
  },
  {
    id: 't2', projectId: 'p1', title: 'Реализация drag-and-drop в Канбане', description: 'Построить Канбан-доску с полной поддержкой перетаскивания карточек.', priority: 'urgent', status: 'in_progress', assigneeId: 'u1', reporterId: 'u1',
    startDate: subDays(now, 5).toISOString(), dueDate: addDays(now, 3).toISOString(),
    tags: ['фронтенд', 'канбан'], estimatedHours: 24, loggedHours: 12, createdAt: subDays(now, 10).toISOString(), updatedAt: subDays(now, 1).toISOString(), position: 0, progress: 45,
    dependencies: [{ type: 'FS', taskId: 't1' }],  // t2 starts after t1 finishes
  },
  {
    id: 'st3', projectId: 'p1', parentId: 't2', title: 'DnD колонок', description: '', priority: 'urgent', status: 'done', assigneeId: 'u1', reporterId: 'u1',
    startDate: subDays(now, 5).toISOString(), dueDate: subDays(now, 2).toISOString(),
    tags: [], estimatedHours: 8, loggedHours: 8, createdAt: subDays(now, 10).toISOString(), updatedAt: subDays(now, 1).toISOString(), position: 0, progress: 100,
  },
  {
    id: 'st4', projectId: 'p1', parentId: 't2', title: 'DnD карточек', description: '', priority: 'urgent', status: 'in_progress', assigneeId: 'u1', reporterId: 'u1',
    startDate: subDays(now, 2).toISOString(), dueDate: addDays(now, 1).toISOString(),
    tags: [], estimatedHours: 10, loggedHours: 4, createdAt: subDays(now, 10).toISOString(), updatedAt: subDays(now, 1).toISOString(), position: 1, progress: 40,
  },
  {
    id: 't3', projectId: 'p1', title: 'Движок рендеринга диаграммы Ганта', description: 'Кастомная диаграмма Ганта с масштабами день/неделя/месяц и интерактивным изменением размеров.', priority: 'urgent', status: 'in_progress', assigneeId: 'u3', reporterId: 'u1',
    startDate: subDays(now, 3).toISOString(), dueDate: addDays(now, 7).toISOString(),
    tags: ['фронтенд', 'гант'], estimatedHours: 40, loggedHours: 10, createdAt: subDays(now, 8).toISOString(), updatedAt: now.toISOString(), position: 1, progress: 25,
    dependencies: [{ type: 'FS', taskId: 't2' }],  // t3 starts after t2 finishes
  },
  {
    id: 't4', projectId: 'p1', title: 'Проектирование схемы базы данных', description: 'Разработать нормализованную схему для задач, проектов, пользователей, комментариев и зависимостей.', priority: 'high', status: 'done', assigneeId: 'u5', reporterId: 'u1',
    startDate: subDays(now, 20).toISOString(), dueDate: subDays(now, 10).toISOString(),
    tags: ['бэкенд', 'база данных'], estimatedHours: 12, loggedHours: 10, createdAt: subDays(now, 25).toISOString(), updatedAt: subDays(now, 10).toISOString(), position: 0, progress: 100,
    dependencies: [],  // t4 is predecessor to t5
  },
  {
    id: 't5', projectId: 'p1', title: 'WebSocket синхронизация в реальном времени', description: 'Реализовать socket.io сервер для мгновенного обновления задач у всех подключённых клиентов.', priority: 'high', status: 'review', assigneeId: 'u5', reporterId: 'u1',
    startDate: subDays(now, 7).toISOString(), dueDate: addDays(now, 2).toISOString(),
    tags: ['бэкенд', 'реалтайм'], estimatedHours: 20, loggedHours: 18, createdAt: subDays(now, 12).toISOString(), updatedAt: subDays(now, 1).toISOString(), position: 0, progress: 80,
    dependencies: [{ type: 'FS', taskId: 't4' }],  // t5 starts after t4 finishes
  },
  {
    id: 't6', projectId: 'p1', title: 'Система уведомлений (email + внутренние)', description: 'Построить пайплайн уведомлений о назначении задач, упоминаниях и напоминаниях о сроках.', priority: 'medium', status: 'todo', assigneeId: 'u4', reporterId: 'u1',
    startDate: addDays(now, 3).toISOString(), dueDate: addDays(now, 14).toISOString(),
    tags: ['бэкенд', 'уведомления'], estimatedHours: 16, loggedHours: 0, createdAt: subDays(now, 5).toISOString(), updatedAt: subDays(now, 5).toISOString(), position: 0, progress: 0,
    dependencies: [{ type: 'FS', taskId: 't5' }],  // t6 starts after t5 finishes
  },
  {
    id: 't7', projectId: 'p1', title: 'Дизайн-система и библиотека компонентов', description: 'Создать переиспользуемые React-компоненты на основе токенов дизайн-системы.', priority: 'medium', status: 'in_progress', assigneeId: 'u2', reporterId: 'u1',
    startDate: subDays(now, 10).toISOString(), dueDate: addDays(now, 5).toISOString(),
    tags: ['фронтенд', 'дизайн'], estimatedHours: 30, loggedHours: 20, createdAt: subDays(now, 15).toISOString(), updatedAt: subDays(now, 2).toISOString(), position: 2, progress: 65,
  },
  {
    id: 'st7', projectId: 'p1', parentId: 't7', title: 'Кнопки', description: '', priority: 'medium', status: 'done', assigneeId: 'u2', reporterId: 'u1',
    startDate: subDays(now, 10).toISOString(), dueDate: subDays(now, 8).toISOString(),
    tags: [], estimatedHours: 5, loggedHours: 5, createdAt: subDays(now, 15).toISOString(), updatedAt: subDays(now, 2).toISOString(), position: 0, progress: 100,
  },
  {
    id: 't8', projectId: 'p1', title: 'Написание документации API', description: 'Задокументировать все REST-эндпоинты в формате OpenAPI/Swagger.', priority: 'low', status: 'todo', assigneeId: null, reporterId: 'u1',
    startDate: addDays(now, 10).toISOString(), dueDate: addDays(now, 20).toISOString(),
    tags: ['документация'], estimatedHours: 8, loggedHours: 0, createdAt: subDays(now, 3).toISOString(), updatedAt: subDays(now, 3).toISOString(), position: 1, progress: 0,
  },
  {
    id: 't9', projectId: 'p1', title: 'Настройка CI/CD пайплайна', description: 'GitHub Actions для автоматического тестирования, сборки и деплоя на staging и production.', priority: 'medium', status: 'todo', assigneeId: 'u1', reporterId: 'u1',
    startDate: addDays(now, 5).toISOString(), dueDate: addDays(now, 10).toISOString(),
    tags: ['devops'], estimatedHours: 12, loggedHours: 0, createdAt: subDays(now, 2).toISOString(), updatedAt: subDays(now, 2).toISOString(), position: 2, progress: 0,
    dependencies: [],  // t9 is predecessor to t10
  },
  {
    id: 't10', projectId: 'p1', title: 'Интеграционные тесты (E2E)', description: 'Написать комплексные E2E-тесты на Playwright для критичных пользовательских сценариев.', priority: 'low', status: 'blocked', assigneeId: 'u4', reporterId: 'u1',
    startDate: addDays(now, 15).toISOString(), dueDate: addDays(now, 25).toISOString(),
    tags: ['qa', 'тестирование'], estimatedHours: 24, loggedHours: 0, createdAt: subDays(now, 1).toISOString(), updatedAt: subDays(now, 1).toISOString(), position: 0, progress: 0,
    dependencies: [{ type: 'FS', taskId: 't9' }, { type: 'relates_to', taskId: 't8' }],
  },
  {
    id: 't11', projectId: 'p2', title: 'Главный экран (Hero) лендинга', description: 'Спроектировать и разработать hero-секцию с анимированным градиентом и кнопкой призыва к действию.', priority: 'high', status: 'in_progress', assigneeId: 'u2', reporterId: 'u2',
    startDate: subDays(now, 4).toISOString(), dueDate: addDays(now, 3).toISOString(),
    tags: ['фронтенд', 'дизайн'], estimatedHours: 12, loggedHours: 8, createdAt: subDays(now, 6).toISOString(), updatedAt: subDays(now, 1).toISOString(), position: 0, progress: 60,
  },
  {
    id: 't12', projectId: 'p2', title: 'SEO оптимизация и мета-теги', description: 'Реализовать структурированные данные, og-теги и карту сайта.', priority: 'medium', status: 'todo', assigneeId: 'u3', reporterId: 'u2',
    startDate: addDays(now, 4).toISOString(), dueDate: addDays(now, 8).toISOString(),
    tags: ['seo'], estimatedHours: 6, loggedHours: 0, createdAt: subDays(now, 3).toISOString(), updatedAt: subDays(now, 3).toISOString(), position: 0, progress: 0,
  },
];

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

interface AppStore {
  // Data
  users: User[];
  projects: Project[];
  tasks: Task[];
  columns: KanbanColumn[];
  comments: Comment[];
  notifications: Notification[];
  savedViews: SavedView[];
  // UI State
  activeApp: 'desktop' | 'workspace' | 'contador';
  activeProjectId: string;
  activePage: 'desktop' | 'dashboard' | 'inbox' | 'calendar' | 'my_tasks' | 'analytics' | 'project' | 'team' | 'balance' | 'osv' | 'pnl' | 'journal' | 'counterparties' | 'settings';
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
  isProjectModalOpen: boolean;
  projectModalMode: 'create' | 'edit';
  // Modal & Selection
  isTaskModalOpen: boolean;
  editingTaskId: string | null;
  selectedTaskIds: string[];
  // Actions
  setActiveApp: (app: 'desktop' | 'workspace' | 'contador') => void;
  setActiveProject: (id: string) => void;
  setActivePage: (p: 'desktop' | 'dashboard' | 'inbox' | 'calendar' | 'my_tasks' | 'analytics' | 'project' | 'team' | 'balance' | 'osv' | 'pnl' | 'journal' | 'counterparties' | 'settings') => void;
  setProjectTab: (t: 'list' | 'kanban' | 'gantt') => void;
  setActiveSavedViewId: (id: string | 'default') => void;
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
  logTime: (taskId: string, hours: number) => void;
  // Team actions
  createUser: (u: Partial<User>) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  addProjectMember: (projectId: string, userId: string, role: ProjectMemberRole) => void;
  removeProjectMember: (projectId: string, userId: string) => void;
  updateProjectMemberRole: (projectId: string, userId: string, role: ProjectMemberRole) => void;
}

// Initial state loading mechanism
const savedStateStr = localStorage.getItem('workspace_pro_state');
let loadedState: Partial<AppStore> = {};
if (savedStateStr) {
  try {
    loadedState = JSON.parse(savedStateStr);
  } catch (e) {
    console.error('Failed to parse saved state', e);
  }
}

export const useStore = create<AppStore>()((set, get) => ({
  users: loadedState.users || USERS,
  projects: (() => {
    const saved = loadedState.projects;
    if (!saved) return PROJECTS;
    // Migrate old memberIds format to new members format
    return saved.map((p: Project & { memberIds?: string[] }) => {
      if (p.memberIds && !p.members) {
        return { ...p, members: p.memberIds.map((uid: string) => ({ userId: uid, role: 'member' as ProjectMemberRole })), memberIds: undefined };
      }
      return p;
    });
  })(),
  tasks: (() => {
    const raw: Task[] = loadedState.tasks
      ? loadedState.tasks.map((t: Task) => {
          const initTask = TASKS.find(it => it.id === t.id);
          if (initTask && initTask.dependencies && (!t.dependencies || t.dependencies.length === 0)) {
            return { ...t, dependencies: initTask.dependencies };
          }
          return t;
        })
      : TASKS;

    // Migrate old blocks/blocked_by to new FS model
    // Old: predecessor had {type:'blocks', taskId: successorId}
    //      successor had {type:'blocked_by', taskId: predecessorId}
    // New: only successor has {type:'FS', taskId: predecessorId}
    return raw.map(t => {
      if (!t.dependencies || t.dependencies.length === 0) return t;
      const migratedDeps = t.dependencies
        // Remove 'blocks' (predecessor-side pointer — no longer used)
        .filter((d: GanttDep & { type: string }) => d.type !== 'blocks')
        // Convert 'blocked_by' → 'FS'
        .map((d: GanttDep & { type: string }) =>
          d.type === 'blocked_by' ? { ...d, type: 'FS' as const } : d
        );
      if (migratedDeps.length === t.dependencies.length &&
          migratedDeps.every((d, i) => d.type === t.dependencies![i].type)) return t;
      return { ...t, dependencies: migratedDeps };
    });
  })(),
  columns: COLUMNS,
  comments: loadedState.comments || [
    { id: 'c1', taskId: 't2', authorId: 'u1', text: 'Начали работу над колонками, drag внутри колонки готов.', createdAt: new Date(Date.now() - 3600000 * 5).toISOString() },
    { id: 'c2', taskId: 't2', authorId: 'u2', text: 'Проверила — анимация работает хорошо, можно переходить к карточкам.', createdAt: new Date(Date.now() - 3600000 * 2).toISOString() },
    { id: 'c3', taskId: 't3', authorId: 'u3', text: 'Базовая шкала готова, работаю над масштабированием недели.', createdAt: new Date(Date.now() - 3600000 * 1).toISOString() },
  ],
  notifications: loadedState.notifications || [
    { id: 'n1', type: 'assigned', title: 'Вам назначена задача', body: 'Настройка CI/CD пайплайна', taskId: 't9', read: false, createdAt: new Date(Date.now() - 1800000).toISOString() },
    { id: 'n2', type: 'due_soon', title: 'Срок истекает завтра', body: 'WebSocket синхронизация', taskId: 't5', read: false, createdAt: new Date(Date.now() - 3600000).toISOString() },
    { id: 'n3', type: 'mention', title: 'Алина упомянула вас', body: 'В задаче «Дизайн-система»', taskId: 't7', read: true, createdAt: new Date(Date.now() - 7200000).toISOString() },
    { id: 'n4', type: 'completed', title: 'Задача выполнена', body: 'Проектирование схемы БД завершено', taskId: 't4', read: true, createdAt: new Date(Date.now() - 86400000).toISOString() },
  ],
  savedViews: loadedState.savedViews || [],
  activeProjectId: loadedState.activeProjectId || 'p1',
  activeApp: loadedState.activeApp || 'desktop',
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
  isProjectModalOpen: false,
  projectModalMode: 'create',
  isTaskModalOpen: false,
  editingTaskId: null,
  selectedTaskIds: [],

  setActiveApp: (app) => set({ activeApp: app }),
  setActiveProject: (id) => set({ activeProjectId: id }),
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
  toggleNotifPanel: () => set((s) => ({ isNotifPanelOpen: !s.isNotifPanelOpen, isCommandPaletteOpen: false })),
  toggleCommandPalette: () => set((s) => ({ isCommandPaletteOpen: !s.isCommandPaletteOpen, isNotifPanelOpen: false })),
  openProjectModal: (mode) => set({ isProjectModalOpen: true, projectModalMode: mode }),
  closeProjectModal: () => set({ isProjectModalOpen: false }),
  markAllRead: () => set(st => ({ notifications: st.notifications.map(n => ({ ...n, read: true })) })),
  markRead: (id) => set(st => ({ notifications: st.notifications.map(n => n.id === id ? { ...n, read: true } : n) })),
  openNewTask: () => set({ isTaskModalOpen: true, editingTaskId: null }),
  openEditTask: (id) => set({ isTaskModalOpen: true, editingTaskId: id }),
  closeModal: () => set({ isTaskModalOpen: false, editingTaskId: null }),

  createTask: (t) => set(st => {
    const newTask = {
      ...t,
      id: `task_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      position: st.tasks.filter(x => x.status === t.status).length,
      progress: 0,
      tags: t.tags || [],
      dependencies: t.dependencies || [],
    } as Task;
    
    return {
      tasks: [...st.tasks, newTask],
      notifications: [
        ...st.notifications,
        { id: `notif_${Date.now()}`, type: 'assigned', title: 'Новая задача', body: `Создана задача: ${t.title}`, taskId: newTask.id, read: false, createdAt: new Date().toISOString() }
      ]
    };
  }),

  updateTask: (id, updates) => set(st => {
    const oldTask = st.tasks.find(t => t.id === id);
    if (!oldTask) return {};

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

    let newNotifs: Notification[] = [];
    if (updates.description && updates.description !== oldTask.description) {
      const mentions = updates.description.match(/@\[(.*?)\]/g);
      if (mentions) {
        mentions.forEach(m => {
          const mentionedName = m.replace('@', '').replace('[', '').replace(']', '');
          const mentionedUser = st.users.find(u => u.name === mentionedName);
          // Simple verification
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

    // Merge full updated task
    let merged = { ...oldTask, ...updates, ...progressUpdate, updatedAt: new Date().toISOString() };

    // If subtask — clamp dates to parent bounds
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

    return {
      tasks: st.tasks.map(t => t.id === id ? merged : t),
      comments: [...st.comments, ...newComments],
      notifications: [...st.notifications, ...newNotifs]
    };
  }),

  deleteTask: (id) => set(st => ({
    tasks: st.tasks.filter(t => t.id !== id && t.parentId !== id),
    selectedTaskIds: st.selectedTaskIds.filter(tid => tid !== id)
  })),

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
          // Replace if same predecessor already linked
          const filtered = deps.filter(d => d.taskId !== predId);
          return { ...t, dependencies: [...filtered, { taskId: predId, type, lag }] };
        }
        return t;
      })
    }));
    return { ok: true };
  },

  removeDependency: (taskId, predId) => set(st => ({
    tasks: st.tasks.map(t => {
      if (t.id !== taskId) return t;
      return { ...t, dependencies: (t.dependencies || []).filter(d => d.taskId !== predId) };
    })
  })),

  cascadeUpdate: (movedTaskId, deltaDays) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updated = cascadeRecalculate(movedTaskId, deltaDays, get().tasks as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    set({ tasks: updated as any });
  },

  moveTask: (taskId, newStatus, newPosition) => {
    const oldTask = get().tasks.find(t => t.id === taskId);
    if (oldTask && oldTask.status !== newStatus) {
      get().addComment(taskId, `Статус изменён: "${STATUS_LABELS[oldTask.status]}" ➔ "${STATUS_LABELS[newStatus]}" (перенос)`, true, 'system');
    }
    set((s) => ({
      tasks: s.tasks.map(t => t.id !== taskId ? t : { ...t, status: newStatus, position: newPosition, updatedAt: new Date().toISOString() }),
    }));
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

    let newNotifs: Notification[] = [];
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
  },

  logTime: (taskId, hours) => {
    if (hours <= 0) return;
    const task = get().tasks.find(t => t.id === taskId);
    if (!task) return;

    // Считаем округленные часы для отображения формата
    const h = Number(hours.toFixed(1));

    get().addComment(taskId, `Списано время: +${h} ч`, true, 'system');
    set((st) => ({
      tasks: st.tasks.map(t => t.id === taskId ? { ...t, loggedHours: (t.loggedHours || 0) + h, updatedAt: new Date().toISOString() } : t)
    }));
  },

  createProject: (partial) => {
    const project: Project = {
      id: `p${Date.now()}`,
      name: 'Новый проект',
      color: '#654ef1',
      icon: '📁',
      description: '',
      members: [{ userId: get().currentUserId, role: 'admin' }],
      createdAt: new Date().toISOString(),
      status: 'active',
      ...partial,
    };
    set((s) => ({ projects: [...s.projects, project], activeProjectId: project.id, isProjectModalOpen: false }));
  },

  updateProject: (id, updates) => set((s) => ({
    projects: s.projects.map(p => p.id === id ? { ...p, ...updates } : p)
  })),

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
  },

  updateUser: (id, updates) => set((s) => ({
    users: s.users.map(u => u.id === id ? { ...u, ...updates } : u)
  })),

  addProjectMember: (projectId, userId, role) => set((s) => ({
    projects: s.projects.map(p => {
      if (p.id !== projectId) return p;
      if (p.members.some(m => m.userId === userId)) return p;
      return { ...p, members: [...p.members, { userId, role }] };
    })
  })),

  removeProjectMember: (projectId, userId) => set((s) => ({
    projects: s.projects.map(p => {
      if (p.id !== projectId) return p;
      return { ...p, members: p.members.filter(m => m.userId !== userId) };
    })
  })),

  updateProjectMemberRole: (projectId, userId, role) => set((s) => ({
    projects: s.projects.map(p => {
      if (p.id !== projectId) return p;
      return { ...p, members: p.members.map(m => m.userId === userId ? { ...m, role } : m) };
    })
  })),

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
  },
}));

// Auto-save important state to localStorage
useStore.subscribe((state) => {
  const stateToSave = {
    tasks: state.tasks,
    projects: state.projects,
    users: state.users,
    comments: state.comments,
    notifications: state.notifications,
    activeProjectId: state.activeProjectId,
    theme: state.theme,
    kanbanGroupBy: state.kanbanGroupBy,
    savedViews: state.savedViews,
    activeSavedViewId: state.activeSavedViewId,
    activeApp: state.activeApp,
    activePage: state.activePage,
    projectTab: state.projectTab
  };
  localStorage.setItem('workspace_pro_state', JSON.stringify(stateToSave));
});
