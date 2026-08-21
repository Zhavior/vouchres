// types/touchdown.ts
export type PlayerTier = 'ELITE' | 'STRONG' | 'VALUE' | 'SLEEPER';
export type PlayerPosition = 'RB' | 'WR' | 'TE' | 'QB';
export type GameStatus = 'PRE' | 'LIVE' | 'FINAL';

export interface TouchdownPlayer {
  id: string;
  name: string;
  position: PlayerPosition;
  team: string;
  opponent: string;
  isHome: boolean;
  gameStatus: GameStatus;
  gameClock?: string;
  isRedZoneActive?: boolean;
  redZoneYardLine?: number; // e.g. 14 if inside 20
  possession?: boolean;
  
  // Model Metrics
  tdpiScore: number;
  tier: PlayerTier;
  impliedTeamTotal: number;
  rzTouchShare: number;       // e.g. 78.5% (0-100)
  inside10Touches: number;     // e.g. 14
  inside5Carries?: number;     // e.g. 10
  oppRzDefRank: number;        // e.g. 29 (29th ranked = porous defense)
  oppRzTdPercentAllowed: number; // e.g. 68%
  marketOdds: string;          // e.g. "-115", "+185"
  modelEdgePercent: number;    // e.g. +14.2%
  
  // Extended Telemetry Context
  jerseyNumber?: string;
  headshotUrl?: string;
  lineupStatus?: 'CONFIRMED' | 'PROJECTED' | 'QUESTIONABLE';
  rzTargets?: number;
  goalLineSnapPercent?: number; // e.g. 92%
  aiVouchScore?: number;        // e.g. 94 (0-100)
  gameSpread?: string;          // e.g. "BAL -3.5"
  gameOverUnder?: number;       // e.g. 47.5
  touchdownsToday?: number;

  // Real coordinate telemetry mapping
  nextGenTelemetry?: {
    x: number; // Field width (-26.6 to +26.6 yards from center)
    y: number; // Field depth (0 is goal line, -10 back of endzone, 20 is 20-yard line)
    isSuccess: boolean;
    playDescription: string;
  }[];

  reasons?: string[];
  warnings?: string[];
  historicalTrend?: number[];   // last 5 games TD counts
}

export interface NflTickerGame {
  id: string;
  name: string;
  shortName: string;
  date: string;
  status: GameStatus;
  period?: number;
  clock?: string;
  spread: string;               // e.g. "BAL -3.5"
  overUnder: number;            // e.g. 47.5
  homeTeam: {
    id: string;
    name: string;
    abbreviation: string;
    color: string;
    logo: string;
    score: number;
    hasPossession?: boolean;
  };
  awayTeam: {
    id: string;
    name: string;
    abbreviation: string;
    color: string;
    logo: string;
    score: number;
    hasPossession?: boolean;
  };
  isRedZoneActive?: boolean;
  redZoneTeam?: string;         // Team abbreviation currently in red zone
  redZoneYardLine?: number;     // Yard line inside 20 (e.g. 14)
}

export interface SlateTelemetryMetrics {
  totalGames: number;
  liveRedZoneAlerts: number;
  avgRedZoneEff: number;        // e.g. 58.4
  maxMismatchMatchup: {
    label: string;              // e.g. "BAL @ MIN"
    divergence: number;         // e.g. +18.4%
  };
  systemAlpha: number;          // e.g. 88.4
  totalTdVolume: number;        // modeled projected total TDs
  weatherImpactCount: number;   // games with wind/snow impact
}

export type PositionFocusFilter = 'ALL' | 'GLR' | 'RZ_ALPHA' | 'DUAL_QB' | 'RB' | 'WR' | 'TE' | 'QB';

export interface TacticalRadarFilters {
  searchQuery: string;
  positionFocus: PositionFocusFilter;
  rzTouchShareMin25: boolean;
  inside10TargetMin30: boolean;
  oppRzDefBottom10: boolean;
  impliedTotalMin24_5: boolean;
  redZoneAlertOnly: boolean;
  positiveEdgeOnly: boolean;
  selectedGameId?: string | null;
}

export interface LiveThreatEvent {
  id: string;
  timestamp: string;
  gameId: string;
  team: string;
  opponent: string;
  yardLine: number;
  description: string;
  keyPlayers: string[];
}
