import { create } from 'zustand';
import type { CreatorProofProfile, FeedPost, MLBPlayer, Parlay } from '../types';
import type { CanonicalParlaySlip } from '../lib/parlays/parlayBridge';
import {
  handlePostCreated,
  handleLikePost,
  handleVouchPost,
  handleRepostPost,
  handleDeletePost,
  handleAddComment,
} from '../domain/feedActions';
import { handleRemoveVouchFromBoard } from '../domain/vouchActions';

export type AppLiveGame = {
  homeTeam: string;
  awayTeam: string;
  status: string;
  gamePk?: string | number;
};

export type ResearchProp = {
  id: string;
  market: string;
  odds: number | null;
  spec: string;
  gamePk?: string | number;
  playerId?: number | string;
};

type AppCommandBindings = {
  navigateSection: (section: string) => void;
  onLoginSuccess: () => void;
  onClearProfileViewUser: () => void;
  onSaveParlaySlip: (newParlay: Parlay | CanonicalParlaySlip) => Promise<void>;
  onCommitParlayTrust: (input: {
    parlay: Parlay;
    audience: "private" | "public" | "subscriber";
  }) => Promise<void>;
  onHideSavedParlay: (parlayId: string) => Promise<void>;
  onAddLegFromResearch: (player: MLBPlayer, prop: ResearchProp) => void;
  onConfirmParlayTier: (tier: import("../lib/parlays/parlayMarketCatalog").ParlayMarketTier) => void;
  onUpdateProfile: (updatedProfile: Partial<CreatorProofProfile>) => void;
  onResetDatabase: () => void;
  liveGames: AppLiveGame[];
};

type AppCommandState = AppCommandBindings & {
  bind: (bindings: Partial<AppCommandBindings>) => void;
  onPostCreated: (postData: Partial<FeedPost>) => void;
  onLikePost: (postId: string) => void;
  onVouchPost: (postId: string) => void;
  onRepostPost: (postId: string) => void;
  onDeletePost: (postId: string) => void;
  onAddComment: (postId: string, commentContent: string) => void;
  onRemoveVouchFromBoard: (vouchId: string) => void;
};

const noopAsync = async () => {};

const defaultBindings: AppCommandBindings = {
  navigateSection: () => {},
  onLoginSuccess: () => {},
  onClearProfileViewUser: () => {},
  onSaveParlaySlip: noopAsync,
  onCommitParlayTrust: noopAsync,
  onHideSavedParlay: noopAsync,
  onAddLegFromResearch: () => {},
  onConfirmParlayTier: () => {},
  onUpdateProfile: () => {},
  onResetDatabase: () => {},
  liveGames: [],
};

export const useAppCommandStore = create<AppCommandState>()((set) => ({
  ...defaultBindings,
  bind: (bindings) => set((state) => ({ ...state, ...bindings })),
  onPostCreated: handlePostCreated,
  onLikePost: handleLikePost,
  onVouchPost: handleVouchPost,
  onRepostPost: handleRepostPost,
  onDeletePost: handleDeletePost,
  onAddComment: handleAddComment,
  onRemoveVouchFromBoard: handleRemoveVouchFromBoard,
}));
