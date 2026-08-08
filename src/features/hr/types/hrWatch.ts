export type HrWatchMode = 'confirmed' | 'curated' | 'all' | 'blocked';
export type TruthStatus = 'official' | 'projected' | 'blocked' | 'unknown';
export type RiskTier = 'Elite' | 'Core' | 'Watch' | 'Deep' | 'Blocked';

/** Which side a hitter bats from. `S` is a switch hitter. */
export type BatSide = 'L' | 'R' | 'S';
/** Which hand a pitcher throws with. */
export type ThrowHand = 'L' | 'R';

export type HrWatchAddLegHandler = (
  player: {
    id: string;
    name: string;
    team: string;
    headshot?: string;
  },
  prop: {
    id: string;
    market: string;
    odds: number | null;
    spec: string;
    gamePk?: string | number;
    playerId?: string | number;
  },
) => void;

export interface HrWatchRow {
  stableId: string;
  playerName: string;
  playerId: string | number | null;
  team: string;
  opponent: string;
  teamLogoUrl: string | null;
  opponentLogoUrl: string | null;
  pitcherName?: string | null;
  /** Side the hitter bats from, for the L/R platoon split. */
  batSide?: BatSide | null;
  /** Hand the opposing starter throws with, for the L/R platoon split. */
  pitcherHand?: ThrowHand | null;
  venue?: string | null;
  gamePk: string | number | null;
  gameTime: string | null;
  headshotUrl: string | null;
  rank: number | null;
  hrScore: number;

  // Layer sub-scores (0–100 each)
  hitterPower: number | null;
  pitcherVulnerability: number | null;
  pitchMix?: number | null;
  parkFactor: number | null;
  /** Park HR environment as a 0–100 layer score (pipeline `scoreBreakdown.parkContext`). */
  parkContext?: number | null;
  /** Raw venue HR index, centred on 100 — Coors ≈ 121, Petco ≈ 88. */
  parkIndex?: number | null;
  /** Micro-weather as a 0–100 index; null when the game feed carries no forecast. */
  weather?: number | null;
  platoon?: number | null;
  recentForm: number | null;
  swingDecisions?: number | null;
  lineupContext?: number | null;
  bullpen?: number | null;
  bvpScore?: number | null;
  vegasEdgeScore?: number | null;

  vouchScore: number | null;
  /** Real pipeline data-confidence (0-100), null when the payload omits it. */
  dataConfidence: number | null;
  truthStatus: TruthStatus;
  riskTier: RiskTier;
  oddsLabel: string;

  /** American odds for Vegas edge display, e.g. +280 */
  bookOdds?: number | null;
  /** Model HR probability 0–1 */
  hrProbability?: number | null;
  /** Book implied probability 0–1 (after vig) */
  impliedProbability?: number | null;

  /** Verified results from the MLB recent-game-log feed. */
  recentHomeRuns?: number | null;
  recentHrGames?: number | null;
  recentGamesChecked?: number | null;

  reasons: string[];
  warnings: string[];
  sourceMode: HrWatchMode;
}

export interface HrWatchBoard {
  confirmed: HrWatchRow[];
  curated: HrWatchRow[];
  all: HrWatchRow[];
  blocked: HrWatchRow[];
  warnings: string[];
  note: string | null;
  disclaimer: string | null;
  truthMessage: string | null;
  counts: {
    confirmedCandidates: number;
    projectedCandidates: number;
    hiddenProjectedCandidates: number;
    blockedPlayers: number;
    totalVisiblePool: number;
  };
}
