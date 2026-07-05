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
  pitcherName: string;
  venue: string;
  gamePk: string | number | null;
  gameTime: string | null;
  headshotUrl: string | null;
  rank: number | null;
  hrScore: number;
  hitterPower: number | null;
  pitcherVulnerability: number | null;
  parkFactor: number | null;
  recentForm: number | null;
  vouchScore: number | null;
  truthStatus: TruthStatus;
  riskTier: RiskTier;
  oddsLabel: string;
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
