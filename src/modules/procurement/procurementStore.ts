import { apiFetch } from '../../lib/api';
import { create } from 'zustand';
import { apiHeaders, handleRes } from '../../services/api';

export interface ProcurementRequest {
  id: string;
  number: string | null;
  dateStr: string;
  initiator: string | null;
  department: string | null;
  comment: string | null;
  status: string;
  tenderAmount: number;
  netAmount: number;
  _count?: { items: number };
  createdAt: string;
}

export interface ProcurementItem {
  id: string;
  requestId: string;
  tenderId: string | null;
  productName: string;
  category: string | null;
  unit: string;
  quantity: number;
  tenderPrice: number;
  supplierPrice: number;
  currency: string;
  exchangeRate: number;
  logisticsCost: number;
  brokerPct: number;
  brokerAmount: number;
  certification: number;
  customs: number;
  otherExpenses: number;
  vatRate: number;
  companyId: string | null;
  plannedDate: string | null;
  actualDate: string | null;
  status: string;
  comment: string | null;
  createdAt: string;
  request?: ProcurementRequest;
}

export interface Tender {
  id: string;
  number: string | null;
  startDate: string | null;
  endDate: string | null;
  status: string;
  winnerId: string | null;
  totalAmount: number;
  comment: string | null;
  items: ProcurementItem[];
  createdAt: string;
}

interface ProcurementStore {
  requests: ProcurementRequest[];
  items: ProcurementItem[];
  tenders: Tender[];
  loading: boolean;
  loadRequests: () => Promise<void>;
  loadItems: () => Promise<void>;
  loadTenders: () => Promise<void>;
  createRequest: (data: Partial<ProcurementRequest>) => Promise<ProcurementRequest>;
  updateRequest: (id: string, data: Partial<ProcurementRequest>) => Promise<ProcurementRequest>;
  createItem: (data: Partial<ProcurementItem>) => Promise<ProcurementItem>;
  updateItem: (id: string, data: Partial<ProcurementItem>) => Promise<ProcurementItem>;
  createTender: (data: Partial<Tender>) => Promise<Tender>;
  updateTender: (id: string, data: Partial<Tender>) => Promise<Tender>;
  attachItemsToTender: (tenderId: string, itemIds: string[]) => Promise<void>;
  removeItemFromTender: (tenderId: string, itemId: string) => Promise<void>;
}

export const useProcurementStore = create<ProcurementStore>((set) => ({
  requests: [],
  items: [],
  tenders: [],
  loading: false,

  loadRequests: async () => {
    set({ loading: true });
    try {
      const res = await apiFetch('/api/procurement/requests', { headers: apiHeaders(), credentials: 'include' });
      await handleRes(res);
      if (res.ok) set({ requests: await res.json() });
    } finally { set({ loading: false }); }
  },

  loadItems: async () => {
    set({ loading: true });
    try {
      const res = await apiFetch('/api/procurement/items', { headers: apiHeaders(), credentials: 'include' });
      await handleRes(res);
      if (res.ok) set({ items: await res.json() });
    } finally { set({ loading: false }); }
  },

  loadTenders: async () => {
    const res = await apiFetch('/api/procurement/tenders', { headers: apiHeaders(), credentials: 'include' });
    await handleRes(res);
    if (res.ok) set({ tenders: await res.json() });
  },

  createRequest: async (data) => {
    const res = await apiFetch('/api/procurement/requests', {
      method: 'POST', headers: apiHeaders(), credentials: 'include', body: JSON.stringify(data)
    });
    await handleRes(res);
    const newRequest = await res.json();
    set(state => ({ requests: [newRequest, ...state.requests] }));
    return newRequest;
  },

  updateRequest: async (id, data) => {
    set(state => ({ requests: state.requests.map(r => r.id === id ? { ...r, ...data } : r) }));
    const res = await apiFetch(`/api/procurement/requests/${id}`, {
      method: 'PUT', headers: apiHeaders(), credentials: 'include', body: JSON.stringify(data)
    });
    await handleRes(res);
    const updated = await res.json();
    set(state => ({ requests: state.requests.map(r => r.id === id ? updated : r) }));
    return updated;
  },

  createItem: async (data) => {
    const res = await apiFetch('/api/procurement/items', {
      method: 'POST', headers: apiHeaders(), credentials: 'include', body: JSON.stringify(data)
    });
    await handleRes(res);
    const newItem = await res.json();
    set(state => ({ items: [newItem, ...state.items] }));
    return newItem;
  },

  updateItem: async (id, data) => {
    set(state => ({ items: state.items.map(i => i.id === id ? { ...i, ...data } : i) }));
    try {
      const res = await apiFetch(`/api/procurement/items/${id}`, {
        method: 'PUT', headers: apiHeaders(), credentials: 'include', body: JSON.stringify(data)
      });
      await handleRes(res);
      const updated = await res.json();
      set(state => ({ items: state.items.map(i => i.id === id ? updated : i) }));
      return updated;
    } catch (err) {
      const res = await apiFetch('/api/procurement/items', { headers: apiHeaders(), credentials: 'include' });
      if (res.ok) set({ items: await res.json() });
      throw err;
    }
  },

  createTender: async (data) => {
    const res = await apiFetch('/api/procurement/tenders', {
      method: 'POST', headers: apiHeaders(), credentials: 'include', body: JSON.stringify(data)
    });
    await handleRes(res);
    const tender = await res.json();
    set(state => ({ tenders: [tender, ...state.tenders] }));
    return tender;
  },

  updateTender: async (id, data) => {
    const res = await apiFetch(`/api/procurement/tenders/${id}`, {
      method: 'PUT', headers: apiHeaders(), credentials: 'include', body: JSON.stringify(data)
    });
    await handleRes(res);
    const updated = await res.json();
    set(state => ({ tenders: state.tenders.map(t => t.id === id ? updated : t) }));
    return updated;
  },

  attachItemsToTender: async (tenderId, itemIds) => {
    const res = await apiFetch(`/api/procurement/tenders/${tenderId}/items`, {
      method: 'POST', headers: apiHeaders(), credentials: 'include', body: JSON.stringify({ itemIds })
    });
    await handleRes(res);
    const updated = await res.json();
    // Update local tender and mark items as in_tender
    set(state => ({
      tenders: state.tenders.map(t => t.id === tenderId ? updated : t),
      items: state.items.map(i => itemIds.includes(i.id) ? { ...i, tenderId, status: 'in_tender' } : i)
    }));
  },

  removeItemFromTender: async (tenderId, itemId) => {
    const res = await apiFetch(`/api/procurement/tenders/${tenderId}/items/${itemId}`, {
      method: 'DELETE', headers: apiHeaders(), credentials: 'include'
    });
    await handleRes(res);
    set(state => ({
      tenders: state.tenders.map(t => t.id === tenderId
        ? { ...t, items: t.items.filter(i => i.id !== itemId) }
        : t
      ),
      items: state.items.map(i => i.id === itemId ? { ...i, tenderId: null, status: 'calculated' } : i)
    }));
  }
}));

