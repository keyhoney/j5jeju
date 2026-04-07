import { create } from 'zustand';

interface TripState {
  currentTripId: string | null;
  currentDayId: string | null;
  currentDayNumber: number | null;
  selectedPlaceId: string | null;
  syncStatus: 'saved' | 'syncing' | 'offline' | 'error';
  fontScale: 'base' | 'large';
  highContrast: boolean;
  setCurrentTrip: (tripId: string | null) => void;
  setCurrentDay: (dayId: string | null, dayNumber: number | null) => void;
  setSelectedPlaceId: (placeId: string | null) => void;
  setSyncStatus: (status: 'saved' | 'syncing' | 'offline' | 'error') => void;
  toggleFontScale: () => void;
  toggleHighContrast: () => void;
}

export const useTripStore = create<TripState>((set) => ({
  currentTripId: null,
  currentDayId: null,
  currentDayNumber: null,
  selectedPlaceId: null,
  syncStatus: 'saved',
  fontScale: 'base',
  highContrast: false,
  setCurrentTrip: (tripId) => set({ currentTripId: tripId, currentDayId: null, currentDayNumber: null }),
  setCurrentDay: (dayId, dayNumber) => set({ currentDayId: dayId, currentDayNumber: dayNumber }),
  setSelectedPlaceId: (placeId) => set({ selectedPlaceId: placeId }),
  setSyncStatus: (status) => set({ syncStatus: status }),
  toggleFontScale: () => set((state) => ({ fontScale: state.fontScale === 'base' ? 'large' : 'base' })),
  toggleHighContrast: () => set((state) => ({ highContrast: !state.highContrast })),
}));
