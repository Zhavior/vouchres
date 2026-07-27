import { create } from 'zustand';
import type { Parlay } from '../types';
import { accountStorageKey } from '../lib/accountStorage';

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
      localStorage.setItem(accountStorageKey(STORAGE_KEY), JSON.stringify(slips));
    } catch {
      // ignore storage failures
    }
    set({ savedSlips: slips });
  },

  hydrateFromStorage: () => {
    try {
      const stored = localStorage.getItem(accountStorageKey(STORAGE_KEY));
      set({ savedSlips: stored ? JSON.parse(stored) : [] });
    } catch {
      set({ savedSlips: [] });
    }
  },

  resetSlips: () => {
    try {
      localStorage.setItem(accountStorageKey(STORAGE_KEY), JSON.stringify([]));
    } catch {
      // ignore storage failures
    }
    set({ savedSlips: [] });
  },
}));

export const selectSavedSlips = (state: SlipsState) => state.savedSlips;
export const selectSyncSlips = (state: SlipsState) => state.syncSlips;
