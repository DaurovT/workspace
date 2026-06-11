import { create } from 'zustand';

export interface ConfirmReq {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

interface ConfirmState {
  req: (ConfirmReq & { resolve: (v: boolean) => void }) | null;
  open: (req: ConfirmReq) => Promise<boolean>;
  close: (v: boolean) => void;
}

export const useConfirmStore = create<ConfirmState>((set, get) => ({
  req: null,
  open: (req) => new Promise<boolean>((resolve) => set({ req: { ...req, resolve } })),
  close: (v) => {
    const r = get().req;
    if (r) r.resolve(v);
    set({ req: null });
  },
}));

// Promise-based replacement for window.confirm(): const ok = await confirmDialog({ message: '…' })
export const confirmDialog = (req: ConfirmReq) => useConfirmStore.getState().open(req);
