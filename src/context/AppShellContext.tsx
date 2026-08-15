import { createContext, useContext, type ReactNode } from 'react';
import { useShallow } from 'zustand/react/shallow';
import type { CreatorProofProfile, FeedPost, Leg, Parlay, Vouch } from '../types';
import { useFeedStore, selectPosts } from '../stores/feedStore';
import { useSlipsStore, selectSavedSlips } from '../stores/slipsStore';
import { useVouchesStore, selectSavedVouches } from '../stores/vouchesStore';
import { useProfileStore, selectProfile } from '../stores/profileStore';

export type AppShellState = {
  accountId: string | null;
  onSaveVouch: (vouch: Vouch) => void;
  onAuthLoginSuccess?: () => void;
  onAuthLogoutComplete?: () => void;
};

const AppShellContext = createContext<AppShellState | null>(null);

export function AppShellProvider({
  value,
  children,
}: {
  value: AppShellState;
  children: ReactNode;
}) {
  return <AppShellContext.Provider value={value}>{children}</AppShellContext.Provider>;
}

export function useAppShell(): AppShellState {
  const ctx = useContext(AppShellContext);
  if (!ctx) {
    throw new Error('useAppShell must be used within AppShellProvider');
  }
  return ctx;
}

/** Selector hooks — subscribe to domain stores without full AppShell re-renders. */
export function useAppPosts(): FeedPost[] {
  return useFeedStore(selectPosts);
}

export function useAppSavedSlips(): Parlay[] {
  return useSlipsStore(selectSavedSlips);
}

export function useAppSavedVouches(): Vouch[] {
  return useVouchesStore(selectSavedVouches);
}

/** Derived ids — must be useShallow; a fresh .map() array each getSnapshot loops React 19. */
const selectSavedVouchIds = (state: { savedVouches: Vouch[] }) =>
  state.savedVouches.map((vouch) => vouch.id);

export function useAppSavedVouchIds(): string[] {
  return useVouchesStore(useShallow(selectSavedVouchIds));
}

export function useAppProfile(): CreatorProofProfile {
  return useProfileStore(selectProfile);
}
