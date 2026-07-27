import { createContext, useContext, type ReactNode } from 'react';
import type { CreatorProofProfile, FeedPost, Leg, Parlay, Vouch } from '../types';
import { useFeedStore, selectPosts } from '../stores/feedStore';
import { useSlipsStore, selectSavedSlips } from '../stores/slipsStore';
import { useVouchesStore, selectSavedVouches } from '../stores/vouchesStore';
import { useProfileStore, selectProfile } from '../stores/profileStore';

export type AppShellState = {
  posts: FeedPost[];
  profile: CreatorProofProfile;
  savedVouchIds: string[];
  savedVouches: Vouch[];
  savedSlips: Parlay[];
  activeLegs: Leg[];
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

export function useAppProfile(): CreatorProofProfile {
  return useProfileStore(selectProfile);
}
