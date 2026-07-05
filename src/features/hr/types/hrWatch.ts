export type HrWatchMode = 'confirmed' | 'curated' | 'all' | 'blocked';
export type TruthStatus = 'official' | 'projected' | 'blocked' | 'unknown';
export type RiskTier = 'Elite' | 'Core' | 'Watch' | 'Deep' | 'Blocked';

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
