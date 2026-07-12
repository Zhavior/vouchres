import { getCachedValidatedHrBoard } from "../../hubs/hrBoardHub";
import { getScheduleByDate, todayISO } from "../../mlb/mlbClient";
import { buildBrainTemporalContext, type BrainEventPhase } from "./temporalPolicy";

export type BrainScanSourceStatus = "verified" | "partial" | "missing";

export interface BrainScanSource {
  key: string;
  label: string;
  status: BrainScanSourceStatus;
  coverage: number;
  source: string | null;
  note: string;
}

export interface BrainScanSnapshot {
  schemaVersion: "1.0";
  sport: "mlb" | "nba" | "nfl" | "nhl";
  date: string;
  generatedAt: string;
  engineVersion: string;
  coverage: { games: number; teams: number; playersScanned: number; eligiblePlayers: number; confirmedPlayers: number; parks: number };
  temporal: { phase: BrainEventPhase | "no_games"; nextGameAt: string | null; millisecondsToNextGame: number | null; decisionWindowOpen: boolean };
  sources: BrainScanSource[];
  markets: Record<BrainMarketKey, BrainMarketReadiness>;
  warnings: string[];
}

export type BrainMarketKey = "home_run" | "stolen_base" | "pitcher_strikeouts";
export type BrainMarketState = "no_games" | "waiting_for_window" | "waiting_for_evidence" | "ready_to_process" | "locked";
export interface BrainMarketReadiness {
  market: BrainMarketKey;
  readiness: number;
  state: BrainMarketState;
  requiredSources: string[];
  blockers: string[];
  evaluatedAt: string;
}

const MARKET_SOURCE_WEIGHTS: Record<BrainMarketKey, Record<string, number>> = {
  home_run: { schedule: 10, rosters: 15, lineups: 25, pitchers: 20, parks: 10, weather: 5, performance: 15 },
  stolen_base: { schedule: 10, rosters: 15, lineups: 25, performance: 25, sprint_speed: 10, catcher_defense: 10, pitcher_delivery: 5 },
  pitcher_strikeouts: { schedule: 15, probable_pitchers: 25, season_pitching: 25, recent_pitching: 20, opponent_lineup_k: 15 },
};
const MARKET_CRITICAL_SOURCES: Record<BrainMarketKey, string[]> = {
  home_run: ["schedule", "rosters", "lineups", "pitchers", "performance"],
  stolen_base: ["schedule", "rosters", "lineups", "performance"],
  pitcher_strikeouts: ["schedule", "probable_pitchers", "season_pitching", "recent_pitching"],
};

export function buildMarketReadiness(input: {
  sources: Record<string, number>;
  temporalPhase: BrainEventPhase | "no_games";
  decisionWindowOpen: boolean;
  evaluatedAt: string;
}): Record<BrainMarketKey, BrainMarketReadiness> {
  return Object.fromEntries((Object.keys(MARKET_SOURCE_WEIGHTS) as BrainMarketKey[]).map((market) => {
    const weights = MARKET_SOURCE_WEIGHTS[market];
    const readiness = Math.round(Object.entries(weights).reduce((sum, [key, weight]) => sum + (input.sources[key] ?? 0) / 100 * weight, 0));
    const blockers = MARKET_CRITICAL_SOURCES[market].filter((key) => (input.sources[key] ?? 0) < 50);
    const state: BrainMarketState = input.temporalPhase === "no_games" ? "no_games"
      : ["locked", "live", "final"].includes(input.temporalPhase) ? "locked"
      : !input.decisionWindowOpen ? "waiting_for_window"
      : blockers.length ? "waiting_for_evidence"
      : "ready_to_process";
    return [market, { market, readiness, state, requiredSources: Object.keys(weights), blockers, evaluatedAt: input.evaluatedAt }];
  })) as Record<BrainMarketKey, BrainMarketReadiness>;
}

export async function scanMlbSlate(date = todayISO()): Promise<BrainScanSnapshot> {
  const [board, games] = await Promise.all([getCachedValidatedHrBoard(date), getScheduleByDate(date)]);
  const allPlayers = [...board.candidates, ...board.projectedCandidates];
  const uniquePlayers = new Set(allPlayers.map((player) => player.playerId));
  const uniqueTeams = new Set(games.flatMap((game) => [game.homeTeam.teamId, game.awayTeam.teamId]));
  const uniqueParks = new Set(games.map((game) => game.venue).filter(Boolean));
  const withPitcher = allPlayers.filter((player) => player.opponentPitcherId > 0).length;
  const withPark = allPlayers.filter((player) => typeof player.parkFactor === "number").length;
  const confirmed = board.candidates.filter((player) => player.lineupStatus === "confirmed").length;
  const denominator = Math.max(1, allPlayers.length);
  const now = new Date();
  const nextGame = [...games]
    .filter((game) => new Date(game.gameDate).getTime() > now.getTime())
    .sort((a, b) => new Date(a.gameDate).getTime() - new Date(b.gameDate).getTime())[0];
  const nextTemporal = nextGame
    ? buildBrainTemporalContext({ now, scheduledAt: nextGame.gameDate, observedAt: board.debug.lastRefresh, gameStatus: nextGame.status })
    : null;

  const generatedAt = new Date().toISOString();
  const sourceCoverage = {
    schedule: games.length ? 100 : 0,
    rosters: allPlayers.length ? 100 : 0,
    lineups: Math.round((confirmed / denominator) * 100),
    pitchers: Math.round((withPitcher / denominator) * 100),
    parks: Math.round((withPark / denominator) * 100),
    weather: 0,
    performance: allPlayers.length ? 100 : 0,
    sprint_speed: 0,
    catcher_defense: 0,
    pitcher_delivery: 0,
    probable_pitchers: games.length ? Math.round((games.filter((game) => game.probablePitchers.away && game.probablePitchers.home).length / games.length) * 100) : 0,
    season_pitching: games.some((game) => game.probablePitchers.away || game.probablePitchers.home) ? 100 : 0,
    recent_pitching: games.some((game) => game.probablePitchers.away || game.probablePitchers.home) ? 100 : 0,
    opponent_lineup_k: 0,
  };

  return {
    schemaVersion: "1.0",
    sport: "mlb",
    date,
    generatedAt,
    engineVersion: "mlb-slate-scan@1",
    coverage: {
      games: games.length,
      teams: uniqueTeams.size,
      playersScanned: uniquePlayers.size,
      eligiblePlayers: allPlayers.length,
      confirmedPlayers: confirmed,
      parks: uniqueParks.size,
    },
    temporal: {
      phase: nextTemporal?.phase ?? "no_games",
      nextGameAt: nextTemporal?.scheduledAt ?? null,
      millisecondsToNextGame: nextTemporal?.millisecondsToStart ?? null,
      decisionWindowOpen: nextTemporal?.canSnapshot ?? false,
    },
    sources: [
      { key: "schedule", label: "Games, teams, home and away", status: games.length ? "verified" : "missing", coverage: games.length ? 100 : 0, source: "MLB Stats API schedule", note: `${games.length} scheduled games scanned.` },
      { key: "rosters", label: "Active players and team identity", status: allPlayers.length ? "verified" : "missing", coverage: allPlayers.length ? 100 : 0, source: "MLB Stats API active rosters", note: "Stale and mismatched team assignments remain blocked by the HR validator." },
      { key: "lineups", label: "Official batting orders", status: confirmed === allPlayers.length && allPlayers.length ? "verified" : confirmed ? "partial" : "missing", coverage: Math.round((confirmed / denominator) * 100), source: "MLB Stats API boxscores", note: confirmed ? `${confirmed} eligible players are officially confirmed.` : "Official lineups are not posted yet; previews remain labeled and penalized." },
      { key: "pitchers", label: "Probable pitchers and matchup", status: withPitcher === allPlayers.length && allPlayers.length ? "verified" : withPitcher ? "partial" : "missing", coverage: Math.round((withPitcher / denominator) * 100), source: "MLB Stats API probable pitchers", note: "Unknown probable pitchers reduce confidence and cannot be silently guessed." },
      { key: "parks", label: "Venue and park context", status: withPark === allPlayers.length && allPlayers.length ? "verified" : withPark ? "partial" : "missing", coverage: Math.round((withPark / denominator) * 100), source: "VouchEdge sourced park-factor table", note: `${uniqueParks.size} ballparks represented on the slate.` },
      { key: "weather", label: "Weather and wind", status: "missing", coverage: 0, source: null, note: "No verified weather provider is connected. Weather contributes zero rather than a fabricated signal." },
      { key: "performance", label: "Season and recent performance", status: allPlayers.length ? "partial" : "missing", coverage: allPlayers.length ? 100 : 0, source: "MLB Stats API statistics", note: "Selection uses season power, recent form, pitcher vulnerability, lineup volume, and evidence confidence when available." },
    ],
    markets: buildMarketReadiness({
      sources: sourceCoverage,
      temporalPhase: nextTemporal?.phase ?? "no_games",
      decisionWindowOpen: nextTemporal?.canSnapshot ?? false,
      evaluatedAt: generatedAt,
    }),
    warnings: [
      ...(board.lastGoodWarnings ?? []),
      "Weather is unavailable and excluded from scoring.",
      ...(confirmed ? [] : ["Official lineups are incomplete; preview picks may change."]),
    ],
  };
}
