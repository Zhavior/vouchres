/**
 * Persisted sidebar group collapse — owned by chrome layer, not FeedSidebar local state.
 */
import { create } from 'zustand';

const COLLAPSED_KEY = 've-sidebar-collapsed';

const DEFAULT_COLLAPSED: Record<string, boolean> = {
  Account: false,
  Social: false,
};

function loadCollapsedState(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(COLLAPSED_KEY);
    if (raw) return { ...DEFAULT_COLLAPSED, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return { ...DEFAULT_COLLAPSED };
}

function saveCollapsedState(state: Record<string, boolean>) {
  try {
    localStorage.setItem(COLLAPSED_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

type SidebarCollapseState = {
  groupsCollapsed: Record<string, boolean>;
  setGroupCollapsed: (group: string, collapsed: boolean) => void;
  toggleGroup: (group: string) => void;
};

export const useSidebarCollapseStore = create<SidebarCollapseState>((set, get) => ({
  groupsCollapsed: typeof window !== 'undefined' ? loadCollapsedState() : { ...DEFAULT_COLLAPSED },
  setGroupCollapsed: (group, collapsed) => {
    const next = { ...get().groupsCollapsed, [group]: collapsed };
    saveCollapsedState(next);
    set({ groupsCollapsed: next });
  },
  toggleGroup: (group) => {
    const current = Boolean(get().groupsCollapsed[group]);
    get().setGroupCollapsed(group, !current);
  },
}));
