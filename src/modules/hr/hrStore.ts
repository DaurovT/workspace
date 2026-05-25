import { create } from 'zustand';

const apiFetch = async (url: string, options: RequestInit = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    ...options.headers,
  };
  const res = await fetch(url, { ...options, headers, credentials: 'include' });
  if (res.status === 401) {
    localStorage.removeItem('has_session');
    window.location.href = '/';
    await new Promise(() => {});
  }
  return res;
};

// --- Types ---

export interface Employee {
  id: string;
  userId: string;
  department?: string;
  position?: string;
  hireDate: string;
  salary: number;
  salaryType: 'monthly' | 'hourly';
  currency: string;
  contractorId?: string;
  taxProfile: string;
  advancePct: number;
  status: 'active' | 'on_leave' | 'terminated';
  terminationDate?: string;
  bankAccount?: string;
  notes?: string;
  absences?: Absence[];
  salaryHistory?: SalaryHistory[];
}

export interface SalaryHistory {
  id: string;
  employeeId: string;
  amount: number;
  reason: string;
  effectiveDate: string;
}

export interface Absence {
  id: string;
  employeeId: string;
  type: 'vacation' | 'sick' | 'personal' | 'maternity';
  startDate: string;
  endDate: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  note?: string;
}

export interface PayrollEntry {
  id: string;
  payrollRunId: string;
  employeeId: string;
  baseSalary: number;
  bonus: number;
  deductions: number;
  netAmount: number;
  transactionId?: string;
  details?: PayrollDetail[];
}

export interface PayrollDetail {
  id: string;
  payrollEntryId: string;
  type: string;
  label: string;
  amount: number;
}

export interface PayrollRun {
  id: string;
  month: number;
  year: number;
  type: string;
  status: 'draft' | 'calculated' | 'approved' | 'paid';
  totalGross: number;
  totalNet: number;
  createdBy?: string;
  entries: PayrollEntry[];
}

export type HRViewState =
  | 'dashboard'
  | 'employees'
  | 'absences'
  | 'payroll'
  | 'org'
  | 'my-dashboard';

interface HRState {
  // Navigation
  activeView: HRViewState;
  setActiveView: (view: HRViewState) => void;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;

  // Data
  employees: Employee[];
  absences: Absence[];
  payrollRuns: PayrollRun[];
  myProfile: any | null;
  employeeKPIs: any[];
  _loaded: boolean;

  // Actions
  fetchInitialData: () => Promise<void>;
  fetchMyProfile: () => Promise<void>;
  addEmployee: (emp: Partial<Employee>) => Promise<void>;
  updateEmployee: (id: string, updates: Partial<Employee>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  addAbsence: (abs: Partial<Absence>) => Promise<void>;
  updateAbsence: (id: string, updates: Partial<Absence>) => Promise<void>;
  deleteAbsence: (id: string) => Promise<void>;
  createPayrollRun: (month: number, year: number, type: string) => Promise<void>;
  updatePayrollRun: (id: string, updates: Partial<PayrollRun>) => Promise<void>;
  deletePayrollRun: (id: string) => Promise<void>;
  fetchKPI: () => Promise<void>;
}

export const useHRStore = create<HRState>((set, get) => ({
  activeView: 'dashboard',
  setActiveView: (view) => set({ activeView: view }),
  isSidebarCollapsed: false,
  toggleSidebar: () => set(s => ({ isSidebarCollapsed: !s.isSidebarCollapsed })),

  employees: [],
  absences: [],
  payrollRuns: [],
  myProfile: null,
  employeeKPIs: [],
  _loaded: false,

  fetchInitialData: async () => {
    if (get()._loaded) return;
    try {
      const [empRes, absRes, payRes] = await Promise.all([
        apiFetch('/api/employees'),
        apiFetch('/api/absences'),
        apiFetch('/api/payroll'),
      ]);
      const [employees, absences, payrollRuns] = await Promise.all([
        empRes.ok ? empRes.json() : [],
        absRes.ok ? absRes.json() : [],
        payRes.ok ? payRes.json() : [],
      ]);
      set({ employees, absences, payrollRuns, _loaded: true });
      // Fetch KPI data in background
      get().fetchKPI();
    } catch (e) {
      console.error('Failed to fetch HR data:', e);
      set({ _loaded: true });
    }
  },

  fetchMyProfile: async () => {
    try {
      const res = await apiFetch('/api/employees/me');
      if (res.ok) {
        const data = await res.json();
        set({ myProfile: data });
      }
    } catch (e) { console.error(e); }
  },

  addEmployee: async (emp) => {
    try {
      const res = await apiFetch('/api/employees', { method: 'POST', body: JSON.stringify(emp) });
      if (res.ok) {
        const newEmp = await res.json();
        set(s => ({ employees: [newEmp, ...s.employees] }));
      }
    } catch (e) { console.error(e); }
  },

  updateEmployee: async (id, updates) => {
    try {
      const res = await apiFetch(`/api/employees/${id}`, { method: 'PUT', body: JSON.stringify(updates) });
      if (res.ok) {
        const updated = await res.json();
        set(s => ({ employees: s.employees.map(e => e.id === id ? { ...e, ...updated } : e) }));
      }
    } catch (e) { console.error(e); }
  },

  deleteEmployee: async (id) => {
    try {
      await apiFetch(`/api/employees/${id}`, { method: 'DELETE' });
      set(s => ({ employees: s.employees.filter(e => e.id !== id) }));
    } catch (e) { console.error(e); }
  },

  addAbsence: async (abs) => {
    try {
      const res = await apiFetch('/api/absences', { method: 'POST', body: JSON.stringify(abs) });
      if (res.ok) {
        const newAbs = await res.json();
        set(s => ({ absences: [newAbs, ...s.absences] }));
      }
    } catch (e) { console.error(e); }
  },

  updateAbsence: async (id, updates) => {
    try {
      const res = await apiFetch(`/api/absences/${id}`, { method: 'PUT', body: JSON.stringify(updates) });
      if (res.ok) {
        const updated = await res.json();
        set(s => ({ absences: s.absences.map(a => a.id === id ? { ...a, ...updated } : a) }));
      }
    } catch (e) { console.error(e); }
  },

  deleteAbsence: async (id) => {
    try {
      await apiFetch(`/api/absences/${id}`, { method: 'DELETE' });
      set(s => ({ absences: s.absences.filter(a => a.id !== id) }));
    } catch (e) { console.error(e); }
  },

  createPayrollRun: async (month, year, type) => {
    try {
      const res = await apiFetch('/api/payroll', { method: 'POST', body: JSON.stringify({ month, year, type }) });
      if (res.ok) {
        const run = await res.json();
        set(s => ({ payrollRuns: [run, ...s.payrollRuns] }));
      }
    } catch (e) { console.error(e); }
  },

  updatePayrollRun: async (id, updates) => {
    try {
      const res = await apiFetch(`/api/payroll/${id}`, { method: 'PUT', body: JSON.stringify(updates) });
      if (res.ok) {
        const updated = await res.json();
        set(s => ({ payrollRuns: s.payrollRuns.map(r => r.id === id ? { ...r, ...updated } : r) }));
      }
    } catch (e) { console.error(e); }
  },

  deletePayrollRun: async (id) => {
    try {
      await apiFetch(`/api/payroll/${id}`, { method: 'DELETE' });
      set(s => ({ payrollRuns: s.payrollRuns.filter(r => r.id !== id) }));
    } catch (e) { console.error(e); }
  },

  fetchKPI: async () => {
    try {
      const res = await apiFetch('/api/employees/kpi');
      if (res.ok) {
        const data = await res.json();
        set({ employeeKPIs: data });
      }
    } catch (e) { console.error('Failed to fetch KPI:', e); }
  },
}));
