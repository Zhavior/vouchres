/**
 * Pro Mode — the global Standard/Pro switch for Home Run Intelligence.
 *
 * Standard (default) is what cold traffic lands on: four spotlight highlights
 * and a stripped signal grid. Pro unlocks the full analytics suite — every view
 * switcher, workspace and filter layer. The choice is global rather than local
 * to the page so any surface can read it, and it persists so a power user who
 * opted into depth doesn't get demoted on every reload.
 */

import { create } from 'zustand';

const STORAGE_KEY = 'vouchedge_hr_pro_mode';

function readStoredProMode(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function persistProMode(enabled: boolean): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(enabled));
  } catch {
    // The toggle still works for this session when storage is blocked.
  }
}

type ProModeState = {
  isProMode: boolean;
  setProMode: (enabled: boolean) => void;
  toggleProMode: () => void;
};

export const useProModeStore = create<ProModeState>()((set, get) => ({
  isProMode: readStoredProMode(),

  setProMode: (enabled) => {
    persistProMode(enabled);
    set({ isProMode: enabled });
  },

  toggleProMode: () => get().setProMode(!get().isProMode),
}));

/** `[isProMode, toggleProMode]` for components that only need the switch. */
export function useProMode(): [boolean, () => void] {
  const isProMode = useProModeStore((state) => state.isProMode);
  const toggleProMode = useProModeStore((state) => state.toggleProMode);
  return [isProMode, toggleProMode];
}
