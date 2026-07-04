export type HrWatchV2Mode = 'confirmed' | 'curated' | 'all' | 'blocked';

export type HrWatchV2TruthStatus =
  | 'official_lineup'
  | 'projected_unconfirmed'
  | 'blocked'
  | 'unknown';

export type HrWatchV2RiskLabel = 'Elite' | 'Core' | 'Watch' | 'Deep' | 'Blocked';

export interface HrWatchV2ScoreBreakdown {
  hitterPower: number | null;
  pitcherVulnerability: number | null;
  parkFactor: number | null;
  recentForm: number | null;
  vouchScore: number | null;
}

export interface HrWatchV2RecentForm {
  gamesChecked: number | null;
  homeRuns: number | null;
  extraBaseHits: number | null;
  slugging: number | null;
}

export interface HrWatchV2Row {
  stableId: string;
  playerId: string | number | null;
  playerName: string;
  team: string;
  opponent: string;
  pitcherName: string;
  venue: string;
  gamePk: string | number | null;
  gameTime: string | null;
  headshot: string | null;
  rank: number | null;

  hrScore: number;
  vouchScore: number | null;
  pitcherVulnerability: number | null;
  recentPower: number | null;
  parkFactor: number | null;

  riskLabel: HrWatchV2RiskLabel;
  truthStatus: HrWatchV2TruthStatus;
  formTag: string;
  oddsLabel: string;

  reasons: string[];
  scoreBreakdown: HrWatchV2ScoreBreakdown;
  recentForm: HrWatchV2RecentForm | null;

  sourceMode: HrWatchV2Mode;
}

export interface HrWatchV2Board {
  confirmed: HrWatchV2Row[];
  curated: HrWatchV2Row[];
  all: HrWatchV2Row[];
  blocked: HrWatchV2Row[];
  warnings: string[];
  counts: {
    confirmed: number;
    curated: number;
    all: number;
    blocked: number;
    visibleTruthPool: number;
  };
}
