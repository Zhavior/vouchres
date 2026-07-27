import { create } from 'zustand';
import type { CreatorProofProfile } from '../types';
import { INITIAL_PROFILE } from '../data/mockData';
import { accountStorageKey } from '../lib/accountStorage';

const STORAGE_KEY = 'vouchedge_profile';

type ProfileState = {
  profile: CreatorProofProfile;
  syncProfile: (profile: CreatorProofProfile) => void;
  updateUiPreferences: (prefs: Partial<CreatorProofProfile['uiPreferences']>) => void;
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

  updateUiPreferences: (prefs) => {
    set((state) => {
      const updatedProfile = {
        ...state.profile,
        uiPreferences: {
          ...state.profile.uiPreferences,
          ...prefs,
        }
      };
      // Send intent to V3 backend outbox in the background
      // (This will be intercepted by the V3 worker)
      // apiClient.post('/api/v3/preferences', { uiPreferences: updatedProfile.uiPreferences }).catch(() => {});
      
      try {
        localStorage.setItem(accountStorageKey(STORAGE_KEY), JSON.stringify(updatedProfile));
      } catch {}
      return { profile: updatedProfile };
    });
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
