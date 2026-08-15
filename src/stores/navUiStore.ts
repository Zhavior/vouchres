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
};

export const useNavUiStore = create<NavUiState>()(
  persist(
    (set, get) => ({
      mobileDrawerOpen: false,
      setMobileDrawerOpen: (open) => set({ mobileDrawerOpen: open }),
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
