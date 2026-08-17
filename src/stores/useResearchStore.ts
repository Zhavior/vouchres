import { create } from 'zustand';

type ResearchState = {
  isDrawerOpen: boolean;
  selectedPlayer: { id: string | number; name: string } | null;
  openDrawer: (player: { id: string | number; name: string }) => void;
  closeDrawer: () => void;
};

export const useResearchStore = create<ResearchState>((set) => ({
  isDrawerOpen: false,
  selectedPlayer: null,
  
  openDrawer: (player) => set(() => ({
    isDrawerOpen: true,
    selectedPlayer: player,
  })),
  
  closeDrawer: () => set({ isDrawerOpen: false }),
}));
