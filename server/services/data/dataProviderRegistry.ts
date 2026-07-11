/**
 * Catalog of upstream data providers — free-first, trust-labeled.
 * All production reads should flow through SportsDataGateway.
 */

export type DataProviderCost = "free" | "free_tier" | "paid";

export type DataProviderDefinition = {
  id: string;
  label: string;
  cost: DataProviderCost;
  authRequired: boolean;
  baseUrl?: string;
  capabilities: string[];
  trustNote?: string;
};

export const DATA_PROVIDERS: Record<string, DataProviderDefinition> = {
  mlb_stats: {
    id: "mlb_stats",
    label: "MLB Stats API",
    cost: "free",
    authRequired: false,
    baseUrl: process.env.MLB_API_BASE_URL ?? "https://statsapi.mlb.com/api",
    capabilities: ["schedule", "lineups", "boxscore", "live_feed", "grading", "rosters"],
    trustNote: "Official public Stats API — no key required.",
  },
  baseball_savant: {
    id: "baseball_savant",
    label: "Baseball Savant CSV",
    cost: "free",
    authRequired: false,
    baseUrl: "https://baseballsavant.mlb.com",
    capabilities: ["statcast", "expected_stats", "barrel_pct"],
    trustNote: "Season-level CSV leaderboards — not pitch-level realtime.",
  },
  open_meteo: {
    id: "open_meteo",
    label: "Open-Meteo",
    cost: "free",
    authRequired: false,
    baseUrl: "https://api.open-meteo.com",
    capabilities: ["weather_forecast"],
    trustNote: "Outdoor forecast only; fixed-roof venues labeled indoor.",
  },
  odds_api: {
    id: "odds_api",
    label: "The Odds API",
    cost: "free_tier",
    authRequired: true,
    baseUrl: "https://api.the-odds-api.com",
    capabilities: ["player_props", "game_odds"],
    trustNote: "Optional — ParlayOS shows TBD when key missing or quota exhausted.",
  },
  open_timestamps: {
    id: "open_timestamps",
    label: "OpenTimestamps",
    cost: "free",
    authRequired: false,
    capabilities: ["proof_anchor"],
    trustNote: "Bitcoin-calendar proof anchoring for locked slips.",
  },
  supabase: {
    id: "supabase",
    label: "Supabase",
    cost: "free_tier",
    authRequired: true,
    capabilities: ["auth", "picks", "grading_logs", "realtime"],
    trustNote: "Primary persistence — not a sports stats upstream.",
  },
};

export function listDataProviders(): DataProviderDefinition[] {
  return Object.values(DATA_PROVIDERS);
}

export function isOddsProviderConfigured(): boolean {
  return Boolean(String(process.env.ODDS_API_KEY ?? "").trim());
}
