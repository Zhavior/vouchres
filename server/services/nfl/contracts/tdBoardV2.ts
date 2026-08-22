export const TD_BOARD_V2_VERSION = "2.0" as const;

export type TdBoardConnectionState =
  | "live"
  | "refreshing"
  | "partial"
  | "stale"
  | "unavailable"
  | "not_configured";

export type TdBoardDataQuality = "source_backed" | "partial" | "unavailable";

export type TdBoardV2Player = {
  id: string;
  name: string;
  position: "RB" | "WR" | "TE" | "QB";
  team: string;
  opponent: string;
  isHome: boolean;
  gameStatus: "PRE" | "LIVE" | "FINAL";
  gameClock?: string;
  isRedZoneActive?: boolean;
  tdpiScore: number;
  tier: "ELITE" | "STRONG" | "VALUE" | "SLEEPER";
  impliedTeamTotal: number;
  rzTouchShare: number;
  inside10Touches: number;
  oppRzDefRank: number;
  oppRzTdPercentAllowed: number;
  marketOdds: string;
  modelEdgePercent: number;
  jerseyNumber?: string;
  headshotUrl?: string;
  lineupStatus?: "CONFIRMED" | "PROJECTED" | "QUESTIONABLE";
  rzTargets?: number;
  goalLineSnapPercent?: number;
  reasons?: string[];
  warnings?: string[];
  provenance: {
    source: string;
    sourceUpdatedAt: string;
    ingestedAt: string;
    fields: Record<string, string>;
  };
};

export type TdBoardV2Game = {
  id: string;
  name: string;
  shortName: string;
  date: string;
  status: "PRE" | "LIVE" | "FINAL";
  period?: number;
  clock?: string;
  spread: string | null;
  overUnder: number | null;
  homeTeam: {
    id: string;
    name: string;
    abbreviation: string;
    color: string;
    logo: string;
    score: number | null;
    hasPossession?: boolean;
  };
  awayTeam: {
    id: string;
    name: string;
    abbreviation: string;
    color: string;
    logo: string;
    score: number | null;
    hasPossession?: boolean;
  };
  isRedZoneActive?: boolean;
  redZoneTeam?: string;
  redZoneYardLine?: number;
};

export type TdBoardV2Snapshot = {
  version: typeof TD_BOARD_V2_VERSION;
  connection: TdBoardConnectionState;
  dataQuality: TdBoardDataQuality;
  source: string;
  sourceUpdatedAt: string | null;
  generatedAt: string;
  ingestedAt: string;
  players: TdBoardV2Player[];
  games: TdBoardV2Game[];
  warnings: string[];
  coverage: {
    candidateCount: number;
    sourcedFieldPercent: number;
    missingCapabilities: string[];
  };
  servedFromLastGood?: boolean;
  staleAgeMs?: number;
};

export type TdBoardV2Response = TdBoardV2Snapshot & {
  pageInfo: {
    limit: number;
    returned: number;
    total: number;
    nextCursor: string | null;
  };
  diagnostics: {
    cache: "l1" | "l2" | "miss" | "last_good" | "none";
    durationMs: number;
  };
};

export function emptyTdBoardV2(
  connection: Extract<TdBoardConnectionState, "not_configured" | "unavailable" | "partial">,
  warning: string,
  missingCapabilities: string[],
): TdBoardV2Snapshot {
  const now = new Date().toISOString();
  return {
    version: TD_BOARD_V2_VERSION,
    connection,
    dataQuality: connection === "partial" ? "partial" : "unavailable",
    source: "sportsdataio",
    sourceUpdatedAt: null,
    generatedAt: now,
    ingestedAt: now,
    players: [],
    games: [],
    warnings: [warning],
    coverage: {
      candidateCount: 0,
      sourcedFieldPercent: 0,
      missingCapabilities,
    },
  };
}
