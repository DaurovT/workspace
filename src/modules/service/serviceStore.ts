import { apiFetch } from '../../lib/api';
import { create } from 'zustand';

export type TicketStatus = 'new' | 'in_progress' | 'blocked' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';
export type TicketCategory = 'it' | 'electric' | 'plumbing' | 'furniture' | 'other';

export interface Ticket {
  id: string;
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  reporterId: string;
  assigneeId: string | null;
  telegramChatId: string | null;
  telegramUsername: string | null;
  reporterName: string | null;
  location: string | null;
  photoUrl: string | null;
  number: number;
  createdAt: string;
  updatedAt: string;
  comments?: any[];
}

export type ServiceView = 'dashboard' | 'tickets' | 'archive' | 'settings' | 'references';

interface ServiceStore {
  activeView: ServiceView;
  tickets: Ticket[];
  users: { id: string; name: string }[];
  searchQuery: string;
  filterStatus: TicketStatus | null;
  isSidebarCollapsed: boolean;
  isSidebarMobileOpen: boolean;
  isLoading: boolean;
  selectedTicketId: string | null;
  archiveData: { tickets: Ticket[]; total: number; pages: number; currentPage: number };
  fetchInitialData: () => Promise<void>;
  fetchArchiveTickets: (page?: number, limit?: number) => Promise<void>;
  createTicket: (ticket: Partial<Ticket>) => Promise<void>;
  updateTicket: (id: string, updates: Partial<Ticket>) => Promise<void>;
  setSearchQuery: (query: string) => void;
  setFilterStatus: (status: TicketStatus | null) => void;
  setActiveView: (view: ServiceView) => void;
  toggleSidebar: () => void;
  setSidebarMobileOpen: (isOpen: boolean) => void;
  openTicket: (id: string) => void;
  closeTicket: () => void;
  postComment: (id: string, text: string) => Promise<void>;
}

export const useServiceStore = create<ServiceStore>()((set) => ({
  tickets: [],
  users: [],
  searchQuery: '',
  filterStatus: null,
  activeView: 'dashboard',
  isSidebarCollapsed: false,
  isSidebarMobileOpen: false,
  isLoading: false,
  selectedTicketId: null,
  archiveData: { tickets: [], total: 0, pages: 0, currentPage: 1 },

  fetchInitialData: async () => {
    set({ isLoading: true });
    try {
      const [ticketsRes, usersRes] = await Promise.all([
        fetch('/api/service-tickets'),
        fetch('/api/users')
      ]);
      const ticketsData = ticketsRes.ok ? await ticketsRes.json() : [];
      const usersData = usersRes.ok ? await usersRes.json() : [];
      set({ 
        tickets: Array.isArray(ticketsData) ? ticketsData : [], 
        users: Array.isArray(usersData) ? usersData : [] 
      });
    } catch (err) {
      console.error('Failed to fetch tickets', err);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchArchiveTickets: async (page = 1, limit = 20) => {
    set({ isLoading: true });
    try {
      const res = await apiFetch(`/api/service-tickets/archive?page=${page}&limit=${limit}`);
      const data = res.ok ? await res.json() : { tickets: [], total: 0, pages: 0 };
      set({ archiveData: { ...data, tickets: Array.isArray(data.tickets) ? data.tickets : [], currentPage: page } });
    } catch (err) {
      console.error('Failed to fetch archive tickets', err);
    } finally {
      set({ isLoading: false });
    }
  },

  createTicket: async (partial) => {
    try {
      const res = await apiFetch('/api/service-tickets', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(partial)
      });
      if (res.ok) {
        const newTicket = await res.json();
        set((state) => ({ tickets: [newTicket, ...state.tickets] }));
      }
    } catch (err) {
      console.error('Failed to create ticket', err);
    }
  },

  updateTicket: async (id, updates) => {
    // Optimistic update
    set((state) => ({
      tickets: state.tickets.map(t => 
        t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
      )
    }));

    try {
      await apiFetch(`/api/service-tickets/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(updates)
      });
    } catch (err) {
      console.error('Failed to update ticket', err);
      // Revert in case of failure would be ideal, but for now we just log
    }
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
  setFilterStatus: (status) => set({ filterStatus: status }),
  setActiveView: (view) => set({ activeView: view }),
  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  setSidebarMobileOpen: (isSidebarMobileOpen) => set({ isSidebarMobileOpen }),
  openTicket: (id) => set({ selectedTicketId: id }),
  closeTicket: () => set({ selectedTicketId: null }),

  postComment: async (id, text) => {
    try {
      await apiFetch(`/api/service-tickets/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      // the websocket handles the state update
    } catch (e) {
      console.error('Failed to post comment', e);
    }
  },
}));
