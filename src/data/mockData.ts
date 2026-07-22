import { FeedPost, CreatorProofProfile } from '../types';

export const INITIAL_PROFILE: CreatorProofProfile = {
  displayName: "",
  username: "",
  handle: "",
  avatarUrl: "",
  bio: "",
  verified: false,
  winRate: 0,
  totalPicks: 0,
  wonPicks: 0,
  unitsTracked: 0,
  unitsNetProfit: 0,
  subscriptionTier: 'BASIC',
};

// HOT_MARKETS removed — HotMarketsPanel now fetches real today's games from MLB Stats API.

// Empty on first load — posts come from user activity or backend.
export const INITIAL_POSTS: FeedPost[] = [];
