import { createContext, useContext, type ReactNode } from 'react';
import type { CreatorProofProfile, FeedPost, Leg, Parlay, Vouch } from '../types';

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
