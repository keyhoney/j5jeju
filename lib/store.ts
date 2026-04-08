import { create } from 'zustand';

interface ScheduleState {
  currentDayIndex: number;
  selectedPlaceId: string | null;
  syncStatus: 'saved' | 'syncing' | 'offline' | 'error';
  fontScale: 'base' | 'large';
  highContrast: boolean;
  setCurrentDayIndex: (index: number) => void;
  setSelectedPlaceId: (placeId: string | null) => void;
  setSyncStatus: (status: 'saved' | 'syncing' | 'offline' | 'error') => void;
  toggleFontScale: () => void;
  toggleHighContrast: () => void;
}

export const useTripStore = create<ScheduleState>((set) => ({
  currentDayIndex: 0,
  selectedPlaceId: null,
  syncStatus: 'saved',
  fontScale: 'base',
  highContrast: false,
  setCurrentDayIndex: (index) => set({ currentDayIndex: index, selectedPlaceId: null }),
  setSelectedPlaceId: (placeId) => set({ selectedPlaceId: placeId }),
  setSyncStatus: (status) => set({ syncStatus: status }),
  toggleFontScale: () => set((state) => ({ fontScale: state.fontScale === 'base' ? 'large' : 'base' })),
  toggleHighContrast: () => set((state) => ({ highContrast: !state.highContrast })),
}));
