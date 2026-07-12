import { create } from 'zustand';
import type { CreatorProofProfile } from '../types';
import { INITIAL_PROFILE } from '../data/mockData';
import { accountStorageKey } from '../lib/accountStorage';

const STORAGE_KEY = 'vouchedge_profile';

type ProfileState = {
  profile: CreatorProofProfile;
  syncProfile: (profile: CreatorProofProfile) => void;
  hydrateFromStorage: () => void;
  resetProfile: () => void;
};

export const useProfileStore = create<ProfileState>((set) => ({
  profile: INITIAL_PROFILE,

  syncProfile: (profile) => {
    try {
      localStorage.setItem(accountStorageKey(STORAGE_KEY), JSON.stringify(profile));
    } catch {
      // ignore storage failures
    }
    set({ profile });
  },

  hydrateFromStorage: () => {
    try {
      const stored = localStorage.getItem(accountStorageKey(STORAGE_KEY));
      if (stored) {
        set({ profile: JSON.parse(stored) as CreatorProofProfile });
        return;
      }
      localStorage.setItem(accountStorageKey(STORAGE_KEY), JSON.stringify(INITIAL_PROFILE));
      set({ profile: INITIAL_PROFILE });
    } catch {
      set({ profile: INITIAL_PROFILE });
    }
  },

  resetProfile: () => {
    try {
      localStorage.setItem(accountStorageKey(STORAGE_KEY), JSON.stringify(INITIAL_PROFILE));
    } catch {
      // ignore storage failures
    }
    set({ profile: INITIAL_PROFILE });
  },
}));

export const selectProfile = (state: ProfileState) => state.profile;
export const selectSyncProfile = (state: ProfileState) => state.syncProfile;
