import { apiFetch } from '../../lib/api';
import { create } from 'zustand';
// --- Types ---
export type TransactionType = 'income' | 'expense' | 'transfer' | 'accrual' | 'shipment' | 'delivery';
export type ActivityFlow = 'operating' | 'investing' | 'financing';

export interface Category { id: string; name: string; type: 'income' | 'expense' | 'transfer' | 'accrual' | 'asset' | 'liability' | 'equity'; activity?: ActivityFlow; parentId?: string; }
export interface Account { 
  id: string; 
  name: string; 
  balance: number; 
  currency: string;
  type?: 'Наличный' | 'Безналичный' | 'Карта' | 'Крипто';
  bankName?: string;
  blockchainNetwork?: 'TRC20' | 'ERC20' | 'BEP20';
  publicAddress?: string;
}

export interface FundReservation {
  id: string;
  name: string;
  targetAmount: number;
  currentBalance: number;
  currency: string;
  type?: 'reserve' | 'savings';
  accountId?: string | null;
}
export interface ExchangeRate {
  id: string;
  currency: string;
  rate: number;
  updatedAt: string;
}


export interface Contractor {
  id: string;
  name: string;        // Полное наименование
  shortName?: string;  // Краткое наименование
  // Узбекские ОПФ
  legalForm?: 'МЧЖ' | 'АЖ' | 'ЯТТ' | 'ДК' | 'ХК' | 'ОК' | 'УК' | 'Филиал' | 'Физлицо' | 'Прочее';
  group?: 'Банки' | 'Гос. органы' | 'Клиенты' | 'Поставщики' | 'Сотрудники';
  // Реквизиты
  inn?: string;          // ИНН (9 цифр) или ПИНФЛ (14 цифр)
  nds?: boolean;         // Плательщик НДС
  okved?: string;        // ОКЭД
  // Банковские реквизиты
  bankName?: string;
  bankMfo?: string;      // МФО банка (5 цифр)
  bankAccount?: string;  // Расчётный счёт (20 цифр)
  // Адреса
  legalAddress?: string;
  actualAddress?: string;
  // Контакты
  phone?: string;
  email?: string;
  contactPerson?: string;
  // Мета
  comment?: string;
  // Legacy
  type?: 'Юрлицо' | 'ИП' | 'Физлицо';
}

export interface LegalEntity {
  id: string; name: string; shortName: string; inn: string; kpp?: string; ogrn?: string; pinfl?: string;
  type: string;
  isMain: boolean; legalAddress?: string; actualAddress?: string; phone?: string; email?: string;
  bankName?: string; bankMfo?: string; bankAccount?: string;
  vatMode?: string; currency: string;
}

export interface WorkspaceUser {
  id: string;
  email: string;
  name: string;
  role: 'Владелец' | 'Администратор' | 'Менеджер' | 'Гость';
  status: 'Подтверждена' | 'Ожидает входа';
}
export interface Project { 
  id: string; 
  name: string; 
  status?: 'Плановый' | 'В работе' | 'Завершен';
  group?: string;
  dateStart?: string;
  dateEnd?: string;
  budget?: number;       // planned budget (income target)
  description?: string;
}

export interface Transaction {
  id: string;
  parentId?: string;
  date: string;
  amount: number;
  exchangeRate?: number;   // Rate to base currency at time of transaction
  baseAmount?: number;     // amount * exchangeRate (in base currency)
  type: TransactionType;
  categoryId?: string;
  accountId?: string;
  projectId?: string;
  dealId?: string;
  contractorId?: string;
  loanId?: string;
  isPaidConfirmed: boolean;
  paymentRequestId?: string;
  attachments?: string[];
  description?: string;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
}

export interface PlannedOperation {
  id: string;
  date: string; // Future date
  amount: number;
  type: 'income' | 'expense';
  categoryId?: string;
  accountId?: string;
}

export interface Asset {
  id: string;
  name: string;
  category: 'Основное средство' | 'НМА' | 'Запас';
  type: 'Транспорт' | 'Оборудование' | "Недвижимость" | 'ПО' | 'Прочее';
  acquisitionDate: string;
  initialCost: number;
  usefulLifeMonths: number;
  salvageValue: number;
  status: 'В эксплуатации' | 'На складе' | 'Списан' | 'Продан';
}

export interface Loan {
  id: string;
  bankName: string;
  name: string;
  principalAmount: number;
  interestRate: number; // годовая ставка в процентах, например 22
  termMonths: number;
  startDate: string;
  type: 'Кредит' | 'Лизинг' | 'Займ' | 'Овердрафт';
}

export interface Product {
  id: string;
  type: 'Товар' | 'Услуга';
  name: string;
  sku: string;
  category: string;
  unit: string;
  price: number;
  vatRate: number;
  costPrice: number;
  stockBalance: number; // For goods only
  status: 'Активные' | 'В архиве';
}

export type DealStatus = 'new' | 'in_progress' | 'completed' | 'cancelled';

export interface Deal {
  id: string;
  name: string;
  type: 'sale' | 'purchase';
  status: DealStatus;
  contractorId: string;
  projectId?: string;
  amount: number;
  paidAmount: number;
  shippedAmount: number;
  currency: string;
  dateStart: string;
  dateDeadline?: string;
  attachments?: string[];
}

export type InvStatus = 'draft' | 'sent' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled';

export interface IssuedInvoice {
  id: string;
  number: string;
  dealId?: string;
  contractorId: string;
  amount: number;
  paidAmount: number;
  status: InvStatus;
  issuedDate: string;
  dueDate: string;
  description: string;
  vatAmount: number;
}

export type PurchaseStatus = 'new' | 'in_work' | 'delivered' | 'cancelled';

export interface PurchaseDeal {
  id: string;
  number: string;
  name: string;
  contractorId: string;
  amount: number;
  paidAmount: number;
  status: PurchaseStatus;
  category: string;
  startDate: string;
  dueDate: string;
  deliveryStatus: 'pending' | 'partial' | 'done';
}

export interface DocumentLineItem {
  id: string;
  productId: string; // Ref to Product
  quantity: number;
  price: number; // Snapshot of price at document creation
  vatRate: number;
}

export interface FinanceDocument {
  id: string;
  dealId: string;
  type: 'invoice' | 'act' | 'upd';
  status: 'draft' | 'issued' | 'paid' | 'cancelled';
  number: string;
  date: string;
  items: DocumentLineItem[];
  totalAmount: number;
  vatAmount: number;
}

export interface PaymentRequest {
  id: string;
  number: string;
  dateStr: string; // the date requested for payment
  amount: number;
  purpose: string;
  contractorId?: string;
  categoryId?: string;
  projectId?: string;
  status: 'pending_manager' | 'pending_ceo' | 'approved' | 'rejected' | 'paid';
  authorId: string;
  linkedTransactionId?: string;
}

export interface ImportRule {
  id: string;
  name: string;
  conditionField: 'description' | 'contractorId';
  conditionOperator: 'contains' | 'equals';
  conditionValue: string;
  actionType: 'set_category' | 'set_contractor';
  actionValue: string; // The ID of the resulting entity
  isActive: boolean;
}



export interface BudgetScenario {
  id: string;
  name: string;
  year: number;
  isApproved: boolean; // Approved scenarios are read-only
  parentId?: string; // If cloned from another scenario
  createdAt: string;
}

export interface BudgetLine {
  id: string;
  scenarioId: string;
  categoryId: string;
  month: number; // 0 for Jan, 11 for Dec
  year: number;
  amount: number;
}

export interface BdrBudget {
  id: string;
  name: string;
  type: 'БДР' | 'БДДС';
  currency: string;
  entityId: string;
  projectId: string;
  periodStart: string;
  periodEnd: string;
  updatedAt: string;
  updatedBy: string;
  scenarioId?: string;
}

export interface BddsBudget {
  id: string;
  name: string;
  currency: string;
  entityId: string;
  projectId: string;
  periodStart: string;
  periodEnd: string;
  updatedAt: string;
  updatedBy: string;
  scenarioId?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Владелец' | 'Администратор' | 'Менеджер' | 'Гость';
  status: 'Подтверждена' | 'Ожидает входа';
  permissions: string[];
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  entity: string;
  details?: string;
}

export interface Notification {
  id: string;
  timestamp: string;
  type: 'danger' | 'warning' | 'info';
  title: string;
  body: string;
  isRead: boolean;
  userId?: string;
}

export interface AppSettings {
  companyName: string;
  baseCurrency: string;
  pnlMode: 'direct_indirect' | 'fixed_variable';
  lockDate?: string;
}

export interface CopilotMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  widget?: 'balance' | 'clients' | 'cashflow' | 'warning' | 'bar' | 'funds' | 'action' | null;
  widgetData?: any;
}

export interface CopilotConversation {
  id: string;
  title: string;
  updatedAt: string;
  messages: CopilotMessage[];
}

// --- State ---
export type ViewState = 
  | 'main'
  | 'transactions'
  | 'deals'
  | 'plan'
  | 'projects'
  | 'reports'
  | 'references'
  | 'settings'
  | 'assets'
  | 'liabilities'
  | 'treasury'
  | 'baas'
  | 'notifications'
  | 'cfo'
  | 'documents';

interface FinanceState {
  fetchInitialData: () => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  activeView: ViewState;
  activeSubView: string;
  isSidebarCollapsed: boolean;
  isSidebarMobileOpen: boolean;
  setActiveView: (view: FinanceState['activeView'], subView?: string) => void;
  toggleSidebar: () => void;
  setSidebarMobileOpen: (open: boolean) => void;
  expandedMenus: string[];
  toggleMenu: (menuId: string) => void;

  // Data Collections
  transactions: Transaction[];
  accounts: Account[];
  exchangeRates: ExchangeRate[];
  entities: LegalEntity[];
  paginatedTransactions: Transaction[];
  totalTransactions: number;
  updateExchangeRate: (currency: string, rate: number) => Promise<void>;
  contractors: Contractor[];
  projects: Project[];
  products: Product[];
  deals: Deal[];
  invoices: IssuedInvoice[];
  purchases: PurchaseDeal[];
  documents: FinanceDocument[];
  plannedOperations: PlannedOperation[];
  assets: Asset[];
  loans: Loan[];
  paymentRequests: PaymentRequest[];
  budgetScenarios: BudgetScenario[];
  budgetLines: BudgetLine[];
  bdrBudgets: BdrBudget[];
  bddsBudgets: BddsBudget[];
  categories: Category[];
  importRules: ImportRule[];
  users: User[];
  auditLogs: AuditLogEntry[];
  notifications: Notification[];
  funds: FundReservation[];

  // UI State for Transactions
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedTxIds: string[];
  toggleTxSelection: (id: string) => void;
  clearTxSelection: () => void;
  typeFilter: string[];
  setTypeFilter: (types: string[]) => void;
  
  // Additional filters for TransactionsFilter
  filterStatusPaid: boolean;
  setFilterStatusPaid: (v: boolean) => void;
  filterStatusUnpaid: boolean;
  setFilterStatusUnpaid: (v: boolean) => void;
  filterAccounts: string[];
  setFilterAccounts: (v: string[]) => void;
  filterContractors: string[];
  setFilterContractors: (v: string[]) => void;
  filterCategories: string[];
  setFilterCategories: (v: string[]) => void;
  filterProjects: string[];
  setFilterProjects: (v: string[]) => void;
  filterDateFrom: string;
  setFilterDateFrom: (v: string) => void;
  filterDateTo: string;
  setFilterDateTo: (v: string) => void;
  filterAmountFrom: string;
  setFilterAmountFrom: (v: string) => void;
  filterAmountTo: string;
  setFilterAmountTo: (v: string) => void;

  // Actions
  addAccount: (acc: Partial<Account>) => void;
  updateAccount: (id: string, updates: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  addProduct: (product: Partial<Product>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addFund: (fund: Partial<FundReservation>) => void;
  deleteFund: (id: string) => void;
  transferToFund: (fundId: string, amount: number) => void;
  addTransaction: (tx: Partial<Transaction>) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  addDeal: (deal: Partial<Deal>) => void;
  updateDeal: (id: string, updates: Partial<Deal>) => void;
  deleteDeal: (id: string) => void;
  addInvoice: (inv: Partial<IssuedInvoice>) => void;
  updateInvoice: (id: string, updates: Partial<IssuedInvoice>) => void;
  deleteInvoice: (id: string) => void;
  addPurchase: (p: Partial<PurchaseDeal>) => void;
  updatePurchase: (id: string, updates: Partial<PurchaseDeal>) => void;
  deletePurchase: (id: string) => void;
  addLoan: (loan: Partial<Loan>) => void;
  updateLoan: (id: string, updates: Partial<Loan>) => void;
  deleteLoan: (id: string) => void;
  addAsset: (asset: Partial<Asset>) => void;
  updateAsset: (id: string, updates: Partial<Asset>) => void;
  deleteAsset: (id: string) => void;
  addPlannedOperation: (op: Partial<PlannedOperation>) => void;
  updatePlannedOperation: (id: string, updates: Partial<PlannedOperation>) => void;
  deletePlannedOperation: (id: string) => void;
  addDocument: (doc: Partial<FinanceDocument>) => void;
  addPaymentRequest: (req: Partial<PaymentRequest>) => void;
  updatePaymentRequestStatus: (id: string, status: PaymentRequest['status']) => void;
  payPaymentRequest: (id: string, accountId: string) => void;
  addBudgetScenario: (scen: Partial<BudgetScenario>) => void;
  updateBudgetScenario: (id: string, updates: Partial<BudgetScenario>) => void;
  cloneBudgetScenario: (id: string, newName: string) => void;
  updateBudgetLine: (scenarioId: string, categoryId: string, month: number, year: number, amount: number) => void;
  addBdrBudget: (b: Omit<BdrBudget, 'id' | 'updatedAt' | 'updatedBy'>) => void;
  updateBdrBudget: (id: string, updates: Partial<BdrBudget>) => void;
  deleteBdrBudget: (id: string) => void;
  addBddsBudget: (b: Omit<BddsBudget, 'id' | 'updatedAt' | 'updatedBy'>) => void;
  updateBddsBudget: (id: string, updates: Partial<BddsBudget>) => void;
  deleteBddsBudget: (id: string) => void;
  addImportRule: (rule: Partial<ImportRule>) => void;
  toggleImportRule: (id: string) => void;
  deleteImportRule: (id: string) => void;
  addUser: (user: Partial<User>) => void;
  updateUserPermissions: (id: string, permissions: string[]) => void;
  deleteUser: (id: string) => void;
  // Paginated Transactions
  fetchTransactionsPage: (params: Record<string, any>) => Promise<void>;
  
  // Account CRUD
  addProject: (p: Omit<Project, 'id'>) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  // LegalEntity CRUD
  addEntity: (e: Omit<LegalEntity, 'id'>) => void;
  updateEntity: (id: string, updates: Partial<LegalEntity>) => void;
  deleteEntity: (id: string) => void;
  setMainEntity: (id: string) => void;
  // Contractor CRUD
  addContractor: (c: Partial<Contractor>) => void;
  updateContractor: (id: string, updates: Partial<Contractor>) => void;
  deleteContractor: (id: string) => void;
  // Category CRUD
  addCategory: (c: Omit<Category, 'id'>) => Promise<void>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  // Settings
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;

  // AI Copilot
  isCopilotOpen: boolean;
  setCopilotOpen: (v: boolean) => void;
  copilotConversations: CopilotConversation[];
  activeCopilotConversationId: string | null;
  setCopilotConversations: (c: CopilotConversation[]) => void;
  setActiveCopilotConversationId: (id: string | null) => void;
  updateCopilotConversation: (id: string, updates: Partial<CopilotConversation>) => void;
  createCopilotConversation: (conv: CopilotConversation) => void;
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
  isCopilotOpen: false,
  setCopilotOpen: (v) => set({ isCopilotOpen: v }),
  copilotConversations: [],
  activeCopilotConversationId: null,
  setCopilotConversations: (c) => set({ copilotConversations: c }),
  setActiveCopilotConversationId: (id) => set({ activeCopilotConversationId: id }),
  updateCopilotConversation: (id, updates) => set(state => ({
    copilotConversations: state.copilotConversations.map(c => c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c)
  })),
  createCopilotConversation: (conv) => set(state => ({
    copilotConversations: [conv, ...state.copilotConversations]
  })),

  addContractor: async (c) => {
    try {
      const res = await apiFetch(`/api/contractors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(c)
      });
      const newC = await res.json();
      set(state => ({ contractors: [newC, ...state.contractors] }));
    } catch (e) {
      console.error(e);
    }
  },
  updateContractor: async (id, updates) => {
    try {
      const res = await apiFetch(`/api/contractors/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const updatedC = await res.json();
      set(state => ({ contractors: state.contractors.map(c => c.id === id ? updatedC : c) }));
    } catch (e) {
      console.error(e);
    }
  },
  deleteContractor: async (id) => {
    try {
      await apiFetch(`/api/contractors/${id}`, { method: 'DELETE' });
      set(state => ({ contractors: state.contractors.filter(c => c.id !== id) }));
    } catch (e) {
      console.error(e);
    }
  },

  addCategory: async (c) => {
    try {
      const res = await apiFetch(`/api/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(c)
      });
      if (!res.ok) { console.error('addCategory failed:', await res.text()); return; }
      const newCat = await res.json();
      set(state => ({ categories: [...state.categories, newCat] }));
    } catch (e) { console.error(e); }
  },

  updateCategory: async (id, updates) => {
    try {
      const res = await apiFetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!res.ok) { console.error('updateCategory failed:', await res.text()); return; }
      const updated = await res.json();
      set(state => ({ categories: state.categories.map(c => c.id === id ? updated : c) }));
    } catch (e) { console.error(e); }
  },

  deleteCategory: async (id) => {
    try {
      const res = await apiFetch(`/api/categories/${id}`, { method: 'DELETE' });
      if (!res.ok) { console.error('deleteCategory failed:', await res.text()); return; }
      // SetNull behavior: children survive with parentId = null (become root items)
      // Remove only the deleted node; update direct children to parentId = undefined
      set(state => ({
        categories: state.categories
          .filter(c => c.id !== id)
          .map(c => c.parentId === id ? { ...c, parentId: undefined } : c)
      }));
    } catch (e) { console.error(e); }
  },

  fetchInitialData: async () => {
    try {
      const responses = await Promise.all([
        apiFetch(`/api/transactions?dateFrom=${new Date().getFullYear()}-01-01`),
        apiFetch(`/api/accounts`),
        apiFetch(`/api/categories`),
        apiFetch(`/api/contractors`),
        apiFetch(`/api/projects`),
        apiFetch(`/api/deals`),
        apiFetch(`/api/users`),
        apiFetch(`/api/products`),
        apiFetch(`/api/loans`),
        apiFetch(`/api/assets`),
        apiFetch(`/api/payment-requests`),
        apiFetch(`/api/funds`),
        apiFetch(`/api/planned-operations`),
        apiFetch(`/api/import-rules`),
        apiFetch(`/api/budget-scenarios`),
        apiFetch(`/api/bdr-budgets`),
        apiFetch(`/api/bdds-budgets`),
        apiFetch(`/api/audit-logs`),
        apiFetch(`/api/notifications`),
        apiFetch(`/api/exchange-rates`),
        apiFetch(`/api/legal-entities`),
        apiFetch(`/api/invoices`),
        apiFetch(`/api/purchases`),
        apiFetch(`/api/finance-documents`),
        apiFetch(`/api/settings`),
        apiFetch(`/api/copilot-conversations`)
      ]);
      const data = await Promise.all(responses.map(r => r.ok ? r.json() : []));
      const [
        transactions, accounts, categories, contractors, projects, deals, users,
        products, loans, assets, paymentRequests, funds, plannedOperations,
        importRules, budgetScenarios, bdrBudgets, bddsBudgets, auditLogs,
        notifications, exchangeRates, entities, invoices, purchases, documents,
        settings, copilotConversations
      ] = data;

      set({
        transactions: transactions.map((t: any) => ({ ...t, isPaidConfirmed: true })), accounts, categories, contractors, projects, deals, users,
        products, loans, assets, paymentRequests, funds, plannedOperations,
        importRules, budgetScenarios, bdrBudgets, bddsBudgets, auditLogs, notifications, exchangeRates,
        entities, invoices, purchases, documents, settings, copilotConversations,
        budgetLines: budgetScenarios.flatMap((s: any) => s.budgetLines || [])
      });

      // Simple auto-refresh for notifications every 30s
      setInterval(async () => {
        try {
          const res = await apiFetch(`/api/notifications`);
          const latest = await res.json();
          set({ notifications: latest });
        } catch (e) {
          console.error('Failed to auto-refresh notifications:', e);
        }
      }, 30000);
    } catch (e) {
      console.error('Failed to fetch initial data:', e);
    }
  },

  markAllNotificationsRead: async () => {
    try {
      await apiFetch(`/api/notifications/read-all`, { method: 'POST' });
      set(state => ({
        notifications: state.notifications.map(n => ({ ...n, isRead: true }))
      }));
    } catch (e) { console.error(e); }
  },

  markNotificationRead: async (id: string) => {
    try {
      await apiFetch(`/api/notifications/${id}/read`, { method: 'POST' });
      set(state => ({
        notifications: state.notifications.map(n => n.id === id ? { ...n, isRead: true } : n)
      }));
    } catch (e) { console.error(e); }
  },

  activeView: 'main',
  activeSubView: '',
  isSidebarCollapsed: false,
  isSidebarMobileOpen: false,
  setActiveView: (view, subView = '') => set({ activeView: view, activeSubView: subView }),
  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  setSidebarMobileOpen: (open) => set({ isSidebarMobileOpen: open }),
  expandedMenus: ['deals', 'plan', 'reports', 'references'],
  toggleMenu: (menu) => set((state) => ({
    expandedMenus: state.expandedMenus.includes(menu) 
      ? state.expandedMenus.filter(m => m !== menu) 
      : [...state.expandedMenus, menu]
  })),

  transactions: [],
  paginatedTransactions: [],
  totalTransactions: 0,
  accounts: [],
  contractors: [],
  projects: [],
  entities: [],
  products: [],
  deals: [],
  invoices: [],
  purchases: [],
  documents: [],
  plannedOperations: [],
  assets: [],
  loans: [],
  paymentRequests: [],
  budgetScenarios: [],
  budgetLines: [],
  bdrBudgets: [],
  bddsBudgets: [],
  auditLogs: [],
  notifications: [],
  categories: [],
  funds: [],
  exchangeRates: [] as ExchangeRate[],
  importRules: [],
  users: [],

  settings: {
    companyName: 'WorkSpace Pro',
    baseCurrency: 'UZS',
    pnlMode: 'direct_indirect'
  },
  updateSettings: async (updates) => {
    try {
      const state = get();
      const newSettings = { ...state.settings, ...updates };
      await apiFetch(`/api/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
      set({ settings: newSettings });
    } catch (e) { console.error(e); }
  },

  // UI State for Transactions
  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q }),
  selectedTxIds: [],
  toggleTxSelection: (id) => set(state => ({
    selectedTxIds: state.selectedTxIds.includes(id)
      ? state.selectedTxIds.filter(x => x !== id)
      : [...state.selectedTxIds, id]
  })),
  clearTxSelection: () => set({ selectedTxIds: [] }),
  typeFilter: ['income', 'expense', 'transfer', 'accrual'],
  setTypeFilter: (types) => set({ typeFilter: types }),
  
  filterStatusPaid: true,
  setFilterStatusPaid: (v) => set({ filterStatusPaid: v }),
  filterStatusUnpaid: true,
  setFilterStatusUnpaid: (v) => set({ filterStatusUnpaid: v }),
  filterAccounts: [],
  setFilterAccounts: (v) => set({ filterAccounts: v }),
  filterContractors: [],
  setFilterContractors: (v) => set({ filterContractors: v }),
  filterCategories: [],
  setFilterCategories: (v) => set({ filterCategories: v }),
  filterProjects: [],
  setFilterProjects: (v) => set({ filterProjects: v }),
  filterDateFrom: '',
  setFilterDateFrom: (v) => set({ filterDateFrom: v }),
  filterDateTo: '',
  setFilterDateTo: (v) => set({ filterDateTo: v }),
  filterAmountFrom: '',
  setFilterAmountFrom: (v) => set({ filterAmountFrom: v }),
  filterAmountTo: '',
  setFilterAmountTo: (v) => set({ filterAmountTo: v }),

  addAccount: async (acc) => {
    try {
      const res = await apiFetch(`/api/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(acc)
      });
      if (!res.ok) { console.error('addAccount failed:', await res.text()); return; }
      const newAcc = await res.json();
      set(state => ({ accounts: [newAcc, ...state.accounts] }));
    } catch (e) { console.error(e); }
  },

  updateAccount: async (id, updates) => {
    try {
      const res = await apiFetch(`/api/accounts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!res.ok) { console.error('updateAccount failed:', await res.text()); return; }
      const updated = await res.json();
      set(state => ({ accounts: state.accounts.map(a => a.id === id ? updated : a) }));
    } catch (e) { console.error(e); }
  },

  deleteAccount: async (id) => {
    try {
      const res = await apiFetch(`/api/accounts/${id}`, { method: 'DELETE' });
      if (!res.ok) { console.error('deleteAccount failed:', await res.text()); return; }
      set(state => ({ accounts: state.accounts.filter(a => a.id !== id) }));
    } catch (e) { console.error(e); }
  },

  addProduct: async (p) => {
    try {
      const res = await apiFetch(`/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p)
      });
      const newProduct = await res.json();
      set(state => ({ products: [newProduct, ...state.products] }));
    } catch (e) { console.error(e); }
  },
  updateProduct: async (id, updates) => {
    try {
      const res = await apiFetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const updatedProduct = await res.json();
      set(state => ({ products: state.products.map(p => p.id === id ? updatedProduct : p) }));
    } catch (e) { console.error(e); }
  },
  deleteProduct: async (id) => {
    try {
      await apiFetch(`/api/products/${id}`, { method: 'DELETE' });
      set(state => ({ products: state.products.filter(p => p.id !== id) }));
    } catch (e) { console.error(e); }
  },
  addFund: async (fund) => {
    try {
      const res = await apiFetch(`/api/funds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fund)
      });
      if (!res.ok) { console.error('addFund failed:', await res.text()); return; }
      const newF = await res.json();
      set(state => ({ funds: [newF, ...state.funds] }));
    } catch (e) { console.error(e); }
  },
  deleteFund: async (id) => {
    try {
      const res = await apiFetch(`/api/funds/${id}`, { method: 'DELETE' });
      if (!res.ok) { console.error('deleteFund failed:', await res.text()); return; }
      set(state => ({ funds: state.funds.filter(f => f.id !== id) }));
    } catch (e) { console.error(e); }
  },
  updateExchangeRate: async (currency, rate) => {
    try {
      const res = await apiFetch(`/api/exchange-rates/${currency}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rate }),
      });
      if (!res.ok) { console.error('updateExchangeRate failed:', await res.text()); return; }
      const updated = await res.json();
      set(state => ({
        exchangeRates: state.exchangeRates.some(r => r.currency === currency)
          ? state.exchangeRates.map(r => r.currency === currency ? updated : r)
          : [...state.exchangeRates, updated]
      }));
    } catch (e) { console.error(e); }
  },
  transferToFund: async (fundId, amount) => {
    try {
      const state = useFinanceStore.getState();
      const fund = state.funds.find(f => f.id === fundId);
      if (!fund) return;
      
      let newBalance = fund.currentBalance + amount;
      if (newBalance < 0) newBalance = 0; // Prevent negative fund balances

      const res = await apiFetch(`/api/funds/${fundId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentBalance: newBalance }),
      });
      if (!res.ok) { console.error('transferToFund failed:', await res.text()); return; }
      set(st => ({ funds: st.funds.map(f => f.id === fundId ? { ...f, currentBalance: newBalance } : f) }));
    } catch (e) { console.error(e); }
  },

  addTransaction: async (tx) => {
    try {
      const res = await apiFetch(`/api/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tx)
      });
      const newTx = await res.json();
      set(state => ({ transactions: [{ ...newTx, isPaidConfirmed: true }, ...state.transactions] }));
    } catch (e) { console.error(e); }
  },
  updateTransaction: async (id, updates) => {
    try {
      const res = await apiFetch(`/api/transactions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const updatedTx = await res.json();
      set(state => ({ transactions: state.transactions.map(t => t.id === id ? { ...updatedTx, isPaidConfirmed: true } : t) }));
    } catch (e) { console.error(e); }
  },
  deleteTransaction: async (id) => {
    try {
      await apiFetch(`/api/transactions/${id}`, { method: 'DELETE' });
      set(state => ({ transactions: state.transactions.filter(t => t.id !== id) }));
    } catch (e) { console.error(e); }
  },
  
  addDeal: async (deal) => {
    try {
      const res = await apiFetch(`/api/deals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deal)
      });
      const newDeal = await res.json();
      set(state => ({ deals: [newDeal, ...state.deals] }));
    } catch (e) { console.error(e); }
  },
  updateDeal: async (id, updates) => {
    try {
      const res = await apiFetch(`/api/deals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const updatedDeal = await res.json();
      set(state => ({ deals: state.deals.map(d => d.id === id ? updatedDeal : d) }));
    } catch (e) { console.error(e); }
  },
  deleteDeal: async (id) => {
    try {
      await apiFetch(`/api/deals/${id}`, { method: 'DELETE' });
      set(state => ({ deals: state.deals.filter(d => d.id !== id) }));
    } catch (e) { console.error(e); }
  },

  addInvoice: async (inv) => {
    try {
      const res = await apiFetch(`/api/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inv)
      });
      const newInv = await res.json();
      set(state => ({ invoices: [newInv, ...state.invoices] }));
    } catch (e) { console.error(e); }
  },
  updateInvoice: async (id, updates) => {
    try {
      const res = await apiFetch(`/api/invoices/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const updatedInv = await res.json();
      set(state => ({ invoices: state.invoices.map(i => i.id === id ? updatedInv : i) }));
    } catch (e) { console.error(e); }
  },
  deleteInvoice: async (id) => {
    try {
      await apiFetch(`/api/invoices/${id}`, { method: 'DELETE' });
      set(state => ({ invoices: state.invoices.filter(i => i.id !== id) }));
    } catch (e) { console.error(e); }
  },

  addPurchase: async (p) => {
    try {
      const res = await apiFetch(`/api/purchases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p)
      });
      const newP = await res.json();
      set(state => ({ purchases: [newP, ...state.purchases] }));
    } catch (e) { console.error(e); }
  },
  updatePurchase: async (id, updates) => {
    try {
      const res = await apiFetch(`/api/purchases/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const updatedP = await res.json();
      set(state => ({ purchases: state.purchases.map(p => p.id === id ? updatedP : p) }));
    } catch (e) { console.error(e); }
  },
  deletePurchase: async (id) => {
    try {
      await apiFetch(`/api/purchases/${id}`, { method: 'DELETE' });
      set(state => ({ purchases: state.purchases.filter(p => p.id !== id) }));
    } catch (e) { console.error(e); }
  },

  addLoan: async (loan) => {
    try {
      const res = await apiFetch(`/api/loans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loan)
      });
      const newLoan = await res.json();
      set(state => ({ loans: [newLoan, ...state.loans] }));
    } catch (e) { console.error(e); }
  },
  updateLoan: async (id, updates) => {
    try {
      const res = await apiFetch(`/api/loans/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const updatedLoan = await res.json();
      set(state => ({ loans: state.loans.map(l => l.id === id ? updatedLoan : l) }));
    } catch (e) { console.error(e); }
  },
  deleteLoan: async (id) => {
    try {
      await apiFetch(`/api/loans/${id}`, { method: 'DELETE' });
      set(state => ({ loans: state.loans.filter(l => l.id !== id) }));
    } catch (e) { console.error(e); }
  },

  addAsset: async (asset) => {
    try {
      const res = await apiFetch(`/api/assets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(asset)
      });
      const newAsset = await res.json();
      set(state => ({ assets: [...state.assets, newAsset] }));
    } catch (e) { console.error(e); }
  },
  updateAsset: async (id, updates) => {
    try {
      const res = await apiFetch(`/api/assets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const updatedAsset = await res.json();
      set(state => ({ assets: state.assets.map(a => a.id === id ? updatedAsset : a) }));
    } catch (e) { console.error(e); }
  },
  deleteAsset: async (id) => {
    try {
      await apiFetch(`/api/assets/${id}`, { method: 'DELETE' });
      set(state => ({ assets: state.assets.filter(a => a.id !== id) }));
    } catch (e) { console.error(e); }
  },

  addPlannedOperation: async (op) => {
    try {
      const res = await apiFetch(`/api/planned-operations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(op)
      });
      const newOp = await res.json();
      set(state => ({ plannedOperations: [newOp, ...state.plannedOperations] }));
    } catch (e) { console.error(e); }
  },
  updatePlannedOperation: async (id, updates) => {
    try {
      const res = await apiFetch(`/api/planned-operations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const updatedOp = await res.json();
      set(state => ({ plannedOperations: state.plannedOperations.map(o => o.id === id ? updatedOp : o) }));
    } catch (e) { console.error(e); }
  },
  deletePlannedOperation: async (id) => {
    try {
      await apiFetch(`/api/planned-operations/${id}`, { method: 'DELETE' });
      set(state => ({ plannedOperations: state.plannedOperations.filter(o => o.id !== id) }));
    } catch (e) { console.error(e); }
  },
  
  addDocument: (doc) => set((state) => {
    const computedTotal = doc.items?.reduce((s: number, i: any) => s + (i.price * i.quantity), 0) ?? 0;
    const newDoc = {
      id: `doc_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      status: 'draft',
      totalAmount: computedTotal,
      vatAmount: 0,
      ...doc, // caller's values override defaults
    } as FinanceDocument;
    return { documents: [newDoc, ...state.documents] };
  }),


  addPaymentRequest: async (req) => {
    try {
      const res = await apiFetch(`/api/payment-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req)
      });
      const newPRQ = await res.json();
      set(state => ({ paymentRequests: [newPRQ, ...state.paymentRequests] }));
    } catch (e) { console.error(e); }
  },

  updatePaymentRequestStatus: async (id, status) => {
    try {
      const res = await apiFetch(`/api/payment-requests/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const updatedPRQ = await res.json();
      set(state => ({
        paymentRequests: state.paymentRequests.map(p => p.id === id ? updatedPRQ : p)
      }));
    } catch (e) { console.error(e); }
  },

  payPaymentRequest: async (id, accountId) => {
    try {
      // In a real app, this would be an atomic transaction on the backend
      const prq = useFinanceStore.getState().paymentRequests.find(p => p.id === id);
      if (!prq) return;

      const resTx = await apiFetch(`/api/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: new Date().toISOString().split('T')[0],
          amount: prq.amount,
          type: 'expense',
          accountId: accountId,
          categoryId: prq.categoryId,
          contractorId: prq.contractorId,
          projectId: prq.projectId,
          isPaidConfirmed: true
        })
      });
      const newTx = await resTx.json();

      const resPRQ = await apiFetch(`/api/payment-requests/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'paid', linkedTransactionId: newTx.id })
      });
      const updatedPRQ = await resPRQ.json();

      set(state => ({
        transactions: [newTx, ...state.transactions],
        paymentRequests: state.paymentRequests.map(p => p.id === id ? updatedPRQ : p)
      }));
      
      // Update account balance
      await apiFetch(`/api/accounts/${accountId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ balance: useFinanceStore.getState().accounts.find(a => a.id === accountId)!.balance - prq.amount })
      });
      // Refresh accounts
      const accounts = await apiFetch(`/api/accounts`).then(r => r.json());
      set({ accounts });
    } catch (e) { console.error(e); }
  },

  addImportRule: async (rule) => {
    try {
      const res = await apiFetch(`/api/import-rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rule)
      });
      const newRule = await res.json();
      set(state => ({ importRules: [newRule, ...state.importRules] }));
    } catch (e) { console.error(e); }
  },

  deleteImportRule: async (id) => {
    try {
      await apiFetch(`/api/import-rules/${id}`, { method: 'DELETE' });
      set(state => ({ importRules: state.importRules.filter(r => r.id !== id) }));
    } catch (e) { console.error(e); }
  },

  toggleImportRule: async (id) => {
    try {
      const rule = useFinanceStore.getState().importRules.find(r => r.id === id);
      if (!rule) return;
      const res = await apiFetch(`/api/import-rules/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !rule.isActive })
      });
      const updatedRule = await res.json();
      set(state => ({ importRules: state.importRules.map(r => r.id === id ? updatedRule : r) }));
    } catch (e) { console.error(e); }
  },

  addBudgetScenario: async (scen) => {
    try {
      const res = await apiFetch(`/api/budget-scenarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scen)
      });
      const newScen = await res.json();
      set(state => ({ budgetScenarios: [newScen, ...state.budgetScenarios] }));
    } catch (e) { console.error(e); }
  },

  updateBudgetScenario: async (id, updates) => {
    try {
      const res = await apiFetch(`/api/budget-scenarios/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const updatedScen = await res.json();
      set(state => ({ budgetScenarios: state.budgetScenarios.map(s => s.id === id ? updatedScen : s) }));
    } catch (e) { console.error(e); }
  },

  cloneBudgetScenario: async (baseId, newName) => {
    try {
      const baseScenario = useFinanceStore.getState().budgetScenarios.find(s => s.id === baseId);
      if (!baseScenario) return;

      // 1. Create the new scenario
      const resScen = await apiFetch(`/api/budget-scenarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          year: baseScenario.year,
          isApproved: false,
          parentId: baseId,
          createdAt: new Date().toISOString()
        })
      });
      const newScen = await resScen.json();

      // 2. Clone the lines (this is heavy, in production you'd do this on the backend)
      const baseLines = useFinanceStore.getState().budgetLines.filter(l => l.scenarioId === baseId);
      const newLines: any[] = [];
      
      for (const line of baseLines) {
        const resLine = await apiFetch(`/api/budget-lines/upsert`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scenarioId: newScen.id,
            categoryId: line.categoryId,
            month: line.month,
            year: line.year,
            amount: line.amount
          })
        });
        newLines.push(await resLine.json());
      }

      set(state => ({
        budgetScenarios: [newScen, ...state.budgetScenarios],
        budgetLines: [...state.budgetLines, ...newLines]
      }));
    } catch (e) { console.error(e); }
  },

  updateBudgetLine: async (scenarioId, categoryId, month, year, amount) => {
    try {
      const res = await apiFetch(`/api/budget-lines/upsert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId, categoryId, month, year, amount })
      });
      const updatedLine = await res.json();
      
      set(state => {
        const otherLines = state.budgetLines.filter(l => l.id !== updatedLine.id);
        return { budgetLines: [...otherLines, updatedLine] };
      });
    } catch (e) { console.error(e); }
  },

  addUser: async (user) => {
    try {
      const res = await apiFetch(`/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
      });
      const newUser = await res.json();
      set(state => ({ users: [...state.users, newUser] }));
    } catch (e) { console.error(e); }
  },

  updateUserPermissions: async (id, permissions) => {
    try {
      const res = await apiFetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: JSON.stringify(permissions) })
      });
      const updatedUser = await res.json();
      set(state => ({ users: state.users.map(u => u.id === id ? updatedUser : u) }));
    } catch (e) { console.error(e); }
  },

  deleteUser: async (id) => {
    try {
      await apiFetch(`/api/users/${id}`, { method: 'DELETE' });
      set(state => ({ users: state.users.filter(u => u.id !== id) }));
    } catch (e) { console.error(e); }
  },

  addBdrBudget: async (b) => {
    try {
      const res = await apiFetch(`/api/bdr-budgets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(b)
      });
      const newBdr = await res.json();
      set(state => ({ bdrBudgets: [...state.bdrBudgets, newBdr] }));
    } catch (e) { console.error(e); }
  },

  updateBdrBudget: async (id, updates) => {
    try {
      const res = await apiFetch(`/api/bdr-budgets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const updatedBdr = await res.json();
      set(state => ({ bdrBudgets: state.bdrBudgets.map(b => b.id === id ? updatedBdr : b) }));
    } catch (e) { console.error(e); }
  },

  deleteBdrBudget: async (id) => {
    try {
      await apiFetch(`/api/bdr-budgets/${id}`, { method: 'DELETE' });
      set(state => ({ bdrBudgets: state.bdrBudgets.filter(b => b.id !== id) }));
    } catch (e) { console.error(e); }
  },

  addBddsBudget: async (b) => {
    try {
      const res = await apiFetch(`/api/bdds-budgets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(b)
      });
      const newBdds = await res.json();
      set(state => ({ bddsBudgets: [...state.bddsBudgets, newBdds] }));
    } catch (e) { console.error(e); }
  },

  updateBddsBudget: async (id, updates) => {
    try {
      const res = await apiFetch(`/api/bdds-budgets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const updatedBdds = await res.json();
      set(state => ({ bddsBudgets: state.bddsBudgets.map(b => b.id === id ? updatedBdds : b) }));
    } catch (e) { console.error(e); }
  },

  deleteBddsBudget: async (id) => {
    try {
      await apiFetch(`/api/bdds-budgets/${id}`, { method: 'DELETE' });
      set(state => ({ bddsBudgets: state.bddsBudgets.filter(b => b.id !== id) }));
    } catch (e) { console.error(e); }
  },

  addProject: async (p) => {
    try {
      const res = await apiFetch(`/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p)
      });
      const newP = await res.json();
      set(state => ({ projects: [newP, ...state.projects] }));
    } catch (e) { console.error(e); }
  },
  updateProject: async (id, updates) => {
    try {
      const res = await apiFetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const updatedP = await res.json();
      set(state => ({ projects: state.projects.map(p => p.id === id ? updatedP : p) }));
    } catch (e) { console.error(e); }
  },
  deleteProject: async (id) => {
    try {
      await apiFetch(`/api/projects/${id}`, { method: 'DELETE' });
      set(state => ({ projects: state.projects.filter(p => p.id !== id) }));
    } catch (e) { console.error(e); }
  },
  addEntity: async (e) => {
    try {
      const res = await apiFetch(`/api/legal-entities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(e)
      });
      const newEntity = await res.json();
      set(state => ({ entities: [...state.entities, newEntity] }));
    } catch (err) { console.error(err); }
  },
  updateEntity: async (id, updates) => {
    try {
      const res = await apiFetch(`/api/legal-entities/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const updatedEntity = await res.json();
      set(state => ({ entities: state.entities.map(e => e.id === id ? updatedEntity : e) }));
    } catch (err) { console.error(err); }
  },
  deleteEntity: async (id) => {
    try {
      await apiFetch(`/api/legal-entities/${id}`, { method: 'DELETE' });
      set(state => ({ entities: state.entities.filter(e => e.id !== id) }));
    } catch (err) { console.error(err); }
  },
  setMainEntity: async (id) => {
    try {
      // First, set all to false locally so UI responds instantly
      set(state => ({
        entities: state.entities.map(e => ({ ...e, isMain: e.id === id }))
      }));
      // Then sync via API (we can use updateEntity for the chosen one, 
      // but usually the backend should unset others automatically if we put a special endpoint, 
      // or we can do a loop, or just update the one)
      await apiFetch(`/api/legal-entities/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isMain: true })
      });
      // The backend should handle setting others to false
    } catch (err) { console.error(err); }
  },
  fetchTransactionsPage: async (params) => {
    try {
      const q = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null && v !== '') {
          q.append(k, String(v));
        }
      }
      const res = await apiFetch(`/api/transactions?${q.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.data) {
          set({ paginatedTransactions: data.data.map((t: any) => ({ ...t, isPaidConfirmed: true })), totalTransactions: data.total });
        } else {
          set({ paginatedTransactions: data.map((t: any) => ({ ...t, isPaidConfirmed: true })), totalTransactions: data.length });
        }
      }
    } catch (e) {
      console.error(e);
    }
  }
}));
