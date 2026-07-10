import { create } from 'zustand';

type NavUiState = {
  mobileDrawerOpen: boolean;
  setMobileDrawerOpen: (open: boolean) => void;
  openMobileDrawer: () => void;
  closeMobileDrawer: () => void;
};

export const useNavUiStore = create<NavUiState>((set) => ({
  mobileDrawerOpen: false,
  setMobileDrawerOpen: (open) => set({ mobileDrawerOpen: open }),
  openMobileDrawer: () => set({ mobileDrawerOpen: true }),
  closeMobileDrawer: () => set({ mobileDrawerOpen: false }),
}));
