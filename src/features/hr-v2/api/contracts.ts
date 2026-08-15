import { PlayerIdentity } from '../domain/player';
import { GameState } from '../domain/game';
import { HrIndexScore, IntelligenceSignal } from '../domain/intelligence';

export interface MarketOdds {
  price: number; // e.g., +350 or -110
  impliedProbability: number;
  provider: string; // e.g., 'DraftKings', 'FanDuel'
  updatedAt: string; // ISO8601
}

export interface StatcastSummary {
  xSLG: number;
  barrelRate: number;
  parkFactor: number;
}

/**
 * Chunk A - Immediate Decision Layer
 * Target: First useful paint. Renderable as a complete card.
 */
export interface ChunkA {
  playerId: string; // Matches PlayerIdentity.id for stable keys
  identity: PlayerIdentity;
  opponentTeamId: string;
  opposingPitcherId: string;
  opposingPitcherName: string;
  opposingPitcherHandedness: 'L' | 'R' | 'S';
  gameTime: string; // ISO8601
  gameState: GameState;
  score: HrIndexScore;
  rank: number;
  odds: MarketOdds | null;
  statcastSummary?: StatcastSummary;
  updatedAt: string; // ISO8601
  /**
   * Whether this player's presence in a lineup has been confirmed.
   * - 'confirmed_starter': Player ID found in game.lineups.homePlayers / awayPlayers
   *   from the MLB Stats API (hydrate=lineups). Score uses slot-aware bonus.
   * - 'roster': Player is on the active roster but lineups have not yet been posted,
   *   or this player was not in the posted lineup. Score uses roster_baseline model.
   * - 'unknown': lineups data was unavailable or errored for this game.
   */
  lineupStatus: 'confirmed_starter' | 'roster' | 'unknown';
  /**
   * Batting order slot (1-9) for confirmed starters.
   * Derived from array index in homePlayers/awayPlayers (0-indexed → +1).
   * Undefined for roster or unknown status players.
   */
  lineupSlot?: number;
}

/**
 * Chunk B - Analytical Enrichment
 * Target: Fetched near viewport, never controls card existence.
 */
export interface ChunkB {
  playerId: string;
  signals: IntelligenceSignal[];
  metrics: {
    barrelRate: number;
    hardHitRate: number;
    xSLG: number;
    parkFactor: number;
    weatherInfluence: number;
    pitcherHrTendencies: number;
    contactQuality: number;
    recentForm: number;
  };
  // Pre-aggregated insights for immediate display without client-side calculation
  insights: string[];
  updatedAt: string; // ISO8601
}

/**
 * Chunk C - Deep Research
 * Target: Explicit user action only (e.g. clicking "Open Research").
 */
export interface ChunkC {
  playerId: string;
  pitchLocationMapUrl?: string;
  sprayChartDataUrl?: string;
  // Deep data arrays to be populated lazily
  historicalPitches: Record<string, any>[];
  battedBallEvents: Record<string, any>[];
  gameLogExplorer: Record<string, any>[];
}

// Error & Degradation semantics
export interface ApiErrorMetadata {
  code: string;
  message: string;
  degradation: 'none' | 'partial' | 'fatal';
  affectedSubsystems: string[]; // e.g., ['odds', 'weather']
}

export interface ApiResponse<T> {
  data: T | null;
  error?: ApiErrorMetadata;
  // Used for global client-side build-version matching/invalidation
  buildId?: string;
}
