export type MarketRadarMarket =
  | 'pitcher_strikeouts'
  | 'batter_home_runs'
  | 'batter_stolen_bases'
  | 'batter_hits'
  | 'batter_total_bases'
  | 'batter_walks';

export interface MarketRadarEdge {
  id: string;
  eventId: string;
  market: MarketRadarMarket;
  subjectId: string;
  subject: string;
  team: string;
  opponent: string;
  direction: 'over' | 'under' | 'yes' | 'no';
  line: number | null;
  modelValue: number;
  marketImpliedProbability: number;
  modelProbability: number | null;
  delta: number;
  edgeScore: number;
  status: 'TARGET OVER' | 'TARGET UNDER' | 'NO EDGE / MONITOR' | 'VALUE' | 'HIGH SB EDGE';
  bookmaker: string;
  price: { american: number; decimal: number; impliedProbability: number };
  metrics: Record<string, number | null>;
  warnings: string[];
}

export interface MarketRadarResponse {
  date: string;
  generatedAt: string;
  provider: {
    id: 'odds_api';
    status: 'live';
    eventCount: number;
    quoteCount: number;
    quota: { remaining: number | null; used: number | null; lastCost: number | null };
  };
  edges: MarketRadarEdge[];
  counts: Record<MarketRadarMarket, number>;
  warnings: string[];
}
