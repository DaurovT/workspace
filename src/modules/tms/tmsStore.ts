import { create } from 'zustand';
import { initialLocations, initialRoutes } from './tmsData';
import type { TMSLocation, TMSRoute } from './tmsData';

interface TmsStore {
  locations: TMSLocation[];
  routes: TMSRoute[];
  updateLocation: (id: string, updates: Partial<TMSLocation>) => void;
}

export const useTmsStore = create<TmsStore>((set) => ({
  locations: initialLocations,
  routes: initialRoutes,
  updateLocation: (id, updates) => set((state) => ({
    locations: state.locations.map(loc => loc.id === id ? { ...loc, ...updates } : loc)
  }))
}));
