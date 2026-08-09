export type MarketRadarMarket =
  | "pitcher_strikeouts"
  | "batter_home_runs"
  | "batter_stolen_bases"
  | "batter_hits"
  | "batter_total_bases"
  | "batter_walks";

export type OddsFormat = "american" | "decimal";

export type NormalizedOdds = {
  american: number;
  decimal: number;
  impliedProbability: number;
};

export type MarketRadarQuote = {
  eventId: string;
  commenceTime: string;
  homeTeam: string;
  awayTeam: string;
  bookmakerKey: string;
  bookmaker: string;
  market: MarketRadarMarket;
  subject: string;
  side: "over" | "under" | "yes" | "no";
  point: number | null;
  price: NormalizedOdds;
  lastUpdate: string;
};

export type MarketRadarProviderResult = {
  events: number;
  quotes: MarketRadarQuote[];
  quota: {
    remaining: number | null;
    used: number | null;
    lastCost: number | null;
  };
};

export type PitcherKSignal = {
  eventId: string;
  subjectId: string;
  subject: string;
  team: string;
  opponent: string;
  quality: "full" | "partial" | "limited";
  pitcherCswPercent: number | null;
  opponentWhiffPercent: number | null;
  projectedBattersFaced: number | null;
};

export type HomeRunSignal = {
  eventId: string;
  subjectId: string;
  subject: string;
  team: string;
  opponent: string;
  quality: "full" | "partial" | "limited";
  lineupConfirmed: boolean;
  modelProbability: number;
  pitcherFlyBallPercent: number | null;
  pitcherBarrelAllowedPercent: number | null;
  parkFactorHr: number | null;
};

export type StolenBaseSignal = {
  eventId: string;
  subjectId: string;
  subject: string;
  team: string;
  opponent: string;
  quality: "full" | "partial" | "limited";
  lineupConfirmed: boolean;
  modelProbability: number;
  runnerSprintSpeedFtSec: number | null;
  catcherPopTime: number | null;
};

export type MarketRadarEdge = {
  id: string;
  eventId: string;
  market: MarketRadarMarket;
  subjectId: string;
  subject: string;
  team: string;
  opponent: string;
  direction: "over" | "under" | "yes" | "no";
  line: number | null;
  modelValue: number;
  marketImpliedProbability: number;
  modelProbability: number | null;
  delta: number;
  edgeScore: number;
  status: "TARGET OVER" | "TARGET UNDER" | "NO EDGE / MONITOR" | "VALUE" | "HIGH SB EDGE";
  bookmaker: string;
  price: NormalizedOdds;
  metrics: Record<string, number | null>;
  warnings: string[];
};

export type MarketRadarResponse = {
  date: string;
  generatedAt: string;
  provider: {
    id: "odds_api";
    status: "live";
    eventCount: number;
    quoteCount: number;
    quota: MarketRadarProviderResult["quota"];
  };
  edges: MarketRadarEdge[];
  counts: Record<MarketRadarMarket, number>;
  warnings: string[];
};
