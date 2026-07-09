import { create } from 'zustand';
import type { Vouch } from '../types';
import { INITIAL_POSTS } from '../data/mockData';

const STORAGE_KEY = 'vouchedge_vouches';

function seedVouches(): Vouch[] {
  return INITIAL_POSTS.filter((p) => p.vouch).map((p) => p.vouch!);
}

type VouchesState = {
  savedVouches: Vouch[];
  syncVouches: (vouches: Vouch[]) => void;
  hydrateFromStorage: () => void;
  resetVouches: () => void;
};

export const useVouchesStore = create<VouchesState>((set) => ({
  savedVouches: [],

  syncVouches: (vouches) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(vouches));
    } catch {
      // ignore storage failures
    }
    set({ savedVouches: vouches });
  },

  hydrateFromStorage: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        set({ savedVouches: JSON.parse(stored) });
        return;
      }
      const seeds = seedVouches();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeds));
      set({ savedVouches: seeds });
    } catch {
      const seeds = seedVouches();
      set({ savedVouches: seeds });
    }
  },

  resetVouches: () => {
    const seeds = seedVouches();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeds));
    } catch {
      // ignore storage failures
    }
    set({ savedVouches: seeds });
  },
}));

export const selectSavedVouches = (state: VouchesState) => state.savedVouches;
export const selectSyncVouches = (state: VouchesState) => state.syncVouches;
