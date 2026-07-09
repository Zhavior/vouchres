import { create } from 'zustand';
import type { Parlay } from '../types';

const STORAGE_KEY = 'vouchedge_slips';

type SlipsState = {
  savedSlips: Parlay[];
  syncSlips: (slips: Parlay[]) => void;
  hydrateFromStorage: () => void;
  resetSlips: () => void;
};

export const useSlipsStore = create<SlipsState>((set) => ({
  savedSlips: [],

  syncSlips: (slips) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(slips));
    } catch {
      // ignore storage failures
    }
    set({ savedSlips: slips });
  },

  hydrateFromStorage: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      set({ savedSlips: stored ? JSON.parse(stored) : [] });
    } catch {
      set({ savedSlips: [] });
    }
  },

  resetSlips: () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    } catch {
      // ignore storage failures
    }
    set({ savedSlips: [] });
  },
}));

export const selectSavedSlips = (state: SlipsState) => state.savedSlips;
export const selectSyncSlips = (state: SlipsState) => state.syncSlips;
