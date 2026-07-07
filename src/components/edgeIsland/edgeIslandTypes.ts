import type { CreatorProofProfile, Parlay } from '../../types';

export type EdgeTruthStatus = 'confirmed' | 'preview';

export interface EdgeBoardRow {
  id: string;
  playerName: string;
  team: string;
  opponent: string;
  market: string;
  angle: string;
  score: number | null;
  status: string;
  gameTime: string;
  signals: string[];
  truthStatus: EdgeTruthStatus;
}

export interface FavoriteSignal {
  id: string;
  label: string;
  context: string;
  status: string;
  edgeSummary: string;
}

export interface EdgeIslandSummary {
  gameCount: number | null;
  edgeCount: number;
  confirmedCount: number;
  previewCount: number;
  pendingSlipCount: number;
  settledSlipCount: number;
  favoriteCount: number;
  winRate: number | null;
  tierLabel: string;
  generatedAt: string | null;
}

export interface EdgeIslandSectionProps {
  onSectionChange: (section: string) => void;
}

export interface EdgeIslandPersonalContext {
  profile?: CreatorProofProfile | null;
  savedSlips: Parlay[];
  isLoggedIn: boolean;
}
