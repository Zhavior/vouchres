import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useParlayOsStore } from './parlayOsStore';

type NavUiState = {
  mobileDrawerOpen: boolean;
  setMobileDrawerOpen: (open: boolean) => void;
  openMobileDrawer: () => void;
  closeMobileDrawer: () => void;
  
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  
  /** Mirrors WorldChatWidget's open state so other mobile chrome (the bottom
   * nav pill) can hide itself while the chat panel is open. */
  worldChatOpen: boolean;
  setWorldChatOpen: (open: boolean) => void;

  /** The ⌘K palette, hoisted out of HomeFeedLayout for the same reason
   * worldChatOpen lives here: chrome rendered inside a route (Today's mobile
   * header owns search now that it replaces the app top bar) has no path to
   * the layout's local state. */
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  openCommandPalette: () => void;
};

export const useNavUiStore = create<NavUiState>()(
  persist(
    (set, get) => ({
      mobileDrawerOpen: false,
      setMobileDrawerOpen: (open) => set({ mobileDrawerOpen: open }),
      commandPaletteOpen: false,
      setCommandPaletteOpen: (open: boolean) => set({ commandPaletteOpen: open }),
      openCommandPalette: () => set({ commandPaletteOpen: true }),

      openMobileDrawer: () => {
        // Mobile drawer and the ParlayOS dock share the bottom-screen mobile
        // real estate — only one can be on screen at a time.
        useParlayOsStore.getState().closeSheet();
        set({ mobileDrawerOpen: true });
      },
      closeMobileDrawer: () => set({ mobileDrawerOpen: false }),
      
      isSidebarCollapsed: false,
      toggleSidebar: () => set({ isSidebarCollapsed: !get().isSidebarCollapsed }),
      setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),
      
      worldChatOpen: false,
      setWorldChatOpen: (open) => set({ worldChatOpen: open }),
    }),
    {
      name: 'vouchedge_sidebar_state',
      partialize: (state) => ({ isSidebarCollapsed: state.isSidebarCollapsed }),
    }
  )
);
