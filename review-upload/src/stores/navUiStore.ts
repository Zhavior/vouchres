import { create } from 'zustand';
import { useParlayOsStore } from './parlayOsStore';

type NavUiState = {
  mobileDrawerOpen: boolean;
  setMobileDrawerOpen: (open: boolean) => void;
  openMobileDrawer: () => void;
  closeMobileDrawer: () => void;
  /** Mirrors WorldChatWidget's open state so other mobile chrome (the bottom
   * nav pill) can hide itself while the chat panel is open. */
  worldChatOpen: boolean;
  setWorldChatOpen: (open: boolean) => void;
};

export const useNavUiStore = create<NavUiState>((set) => ({
  mobileDrawerOpen: false,
  setMobileDrawerOpen: (open) => set({ mobileDrawerOpen: open }),
  openMobileDrawer: () => {
    // Mobile drawer and the ParlayOS dock share the bottom-screen mobile
    // real estate — only one can be on screen at a time.
    useParlayOsStore.getState().closeSheet();
    set({ mobileDrawerOpen: true });
  },
  closeMobileDrawer: () => set({ mobileDrawerOpen: false }),
  worldChatOpen: false,
  setWorldChatOpen: (open) => set({ worldChatOpen: open }),
}));
