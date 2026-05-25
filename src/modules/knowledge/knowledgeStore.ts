import { create } from 'zustand';

export interface KnowledgeNote {
  id: string;
  title: string;
  content: string;
  parentId: string | null;
  authorId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface KnowledgeState {
  notes: KnowledgeNote[];
  activeNoteId: string | null;
  isLoading: boolean;
  
  loadNotes: () => Promise<void>;
  createNote: (parentId: string | null, title?: string) => Promise<KnowledgeNote>;
  updateNote: (id: string, updates: Partial<KnowledgeNote>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  setActiveNoteId: (id: string | null) => void;
}

export const useKnowledgeStore = create<KnowledgeState>((set) => ({
  notes: [],
  activeNoteId: null,
  isLoading: false,

  setActiveNoteId: (id) => set({ activeNoteId: id }),

  loadNotes: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch('/api/knowledge');
      if (res.ok) {
        const notes = await res.json();
        set({ notes });
      }
    } catch (e) {
      console.error('Failed to load knowledge notes', e);
    } finally {
      set({ isLoading: false });
    }
  },

  createNote: async (parentId, title = 'Новая заметка') => {
    const res = await fetch('/api/knowledge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content: '', parentId })
    });
    
    if (res.ok) {
      const newNote = await res.json();
      set(state => ({ 
        notes: [newNote, ...state.notes],
        activeNoteId: newNote.id 
      }));
      return newNote;
    }
    throw new Error('Failed to create note');
  },

  updateNote: async (id, updates) => {
    set(state => ({
      notes: state.notes.map(n => n.id === id ? { ...n, ...updates } : n)
    }));

    await fetch(`/api/knowledge/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
  },

  deleteNote: async (id) => {
    const res = await fetch(`/api/knowledge/${id}`, { method: 'DELETE' });
    if (res.ok) {
      set(state => ({
        notes: state.notes.filter(n => n.id !== id),
        activeNoteId: state.activeNoteId === id ? null : state.activeNoteId
      }));
    }
  }
}));
