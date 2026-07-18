/**
 * Player Edge Lab research bundle — real MLB Stats API + Statcast only.
 * Never synthesizes BvP, game logs, or zone/power metrics.
 */
import { sportsFetchJson } from "../../lib/sports/sportsHttpClient";
import { getBatterVsPitcher, getHitterStats } from "./statsClient";
import {
  getBattedBallProfileMap,
  getPitchMixMap,
  getPlateDisciplineMap,
  getStatcastBatterMap,
  type StatcastBatterQuality,
  type StatcastBattedBallProfile,
  type StatcastPitchMixRow,
  type StatcastPlateDiscipline,
} from "./statcastClient";
import { getGameWeather, type GameWeather } from "./weatherService";

const BASE = (process.env.MLB_API_BASE_URL || "https://statsapi.mlb.com/api").replace(/\/$/, "");
const SEASON = new Date().getFullYear();

export interface PlayerGameLogRow {
  date: string;
  opponentAbbr: string;
  opponentName: string;
  ab: number;
  hits: number;
  homeRuns: number;
  rbi: number;
  doubles: number;
  triples: number;
  totalBases: number;
  strikeOuts: number;
}

const TEAM_ABBR_BY_NAME: Record<string, string> = {
  "Los Angeles Angels": "LAA",
  "Arizona Diamondbacks": "AZ",
  "Baltimore Orioles": "BAL",
  "Boston Red Sox": "BOS",
  "Chicago Cubs": "CHC",
  "Cincinnati Reds": "CIN",
  "Cleveland Guardians": "CLE",
  "Colorado Rockies": "COL",
  "Detroit Tigers": "DET",
  "Houston Astros": "HOU",
  "Kansas City Royals": "KC",
  "Los Angeles Dodgers": "LAD",
  "Washington Nationals": "WSH",
  "New York Mets": "NYM",
  "Oakland Athletics": "ATH",
  Athletics: "ATH",
  "Pittsburgh Pirates": "PIT",
  "San Diego Padres": "SD",
  "Seattle Mariners": "SEA",
  "San Francisco Giants": "SF",
  "St. Louis Cardinals": "STL",
  "Tampa Bay Rays": "TB",
  "Texas Rangers": "TEX",
  "Toronto Blue Jays": "TOR",
  "Minnesota Twins": "MIN",
  "Philadelphia Phillies": "PHI",
  "Atlanta Braves": "ATL",
  "Chicago White Sox": "CHW",
  "Miami Marlins": "MIA",
  "New York Yankees": "NYY",
  "Milwaukee Brewers": "MIL",
};

function abbrFor(name: string): string {
  return TEAM_ABBR_BY_NAME[name] ?? name.slice(0, 3).toUpperCase();
}

async function fetchFullGameLog(playerId: number): Promise<PlayerGameLogRow[]> {
  const data = await sportsFetchJson<any>(
    `${BASE}/v1/people/${playerId}/stats?stats=gameLog&group=hitting&season=${SEASON}`,
    {
      cacheKey: `mlb:player-edge:gameLog:${playerId}:${SEASON}`,
      ttlMs: 15 * 60_000,
      timeoutMs: 8_000,
      retries: 1,
      debugLabel: "playerEdgeResearch",
    },
  );

  const splits: any[] = data?.stats?.[0]?.splits ?? [];
  if (!Array.isArray(splits) || splits.length === 0) return [];

  return splits
    .map((split): PlayerGameLogRow | null => {
      const s = split?.stat;
      if (!s) return null;
      const hrs = Number(s.homeRuns) || 0;
      const hits = Number(s.hits) || 0;
      const doubles = Number(s.doubles) || 0;
      const triples = Number(s.triples) || 0;
      const singles = Math.max(0, hits - doubles - triples - hrs);
      const opponentName = String(split?.opponent?.name ?? "Unknown");
      return {
        date: String(split?.date ?? ""),
        opponentAbbr: abbrFor(opponentName),
        opponentName,
        ab: Number(s.atBats) || 0,
        hits,
        homeRuns: hrs,
        rbi: Number(s.rbi) || 0,
        doubles,
        triples,
        totalBases: singles + doubles * 2 + triples * 3 + hrs * 4,
        strikeOuts: Number(s.strikeOuts) || 0,
      };
    })
    .filter((row): row is PlayerGameLogRow => row != null)
    .reverse();
}

export interface Rolling14DayEdge {
  games: number;
  atBats: number;
  homeRuns: number;
  totalBases: number;
  hits: number;
  hrRate: number | null;
  slugProxy: number | null;
  avgHrPerGame: number | null;
}

function buildRolling14Day(gameLog: PlayerGameLogRow[]): Rolling14DayEdge | null {
  const window = gameLog.slice(0, 14);
  if (!window.length) return null;
  const atBats = window.reduce((s, g) => s + g.ab, 0);
  const homeRuns = window.reduce((s, g) => s + g.homeRuns, 0);
  const totalBases = window.reduce((s, g) => s + g.totalBases, 0);
  const hits = window.reduce((s, g) => s + g.hits, 0);
  return {
    games: window.length,
    atBats,
    homeRuns,
    totalBases,
    hits,
    hrRate: atBats > 0 ? homeRuns / atBats : null,
    slugProxy: atBats > 0 ? totalBases / atBats : null,
    avgHrPerGame: window.length > 0 ? homeRuns / window.length : null,
  };
}

export interface PlayerEdgeResearch {
  playerId: number;
  season: Awaited<ReturnType<typeof getHitterStats>>["season"];
  recentGames: Awaited<ReturnType<typeof getHitterStats>>["recentGames"];
  gameLog: PlayerGameLogRow[];
  batterVsPitcher: Awaited<ReturnType<typeof getBatterVsPitcher>>;
  vsOpponent: PlayerGameLogRow[];
  statcast: StatcastBatterQuality | null;
  sprayProfile: StatcastBattedBallProfile | null;
  plateDiscipline: StatcastPlateDiscipline | null;
  pitchMix: StatcastPitchMixRow[];
  rolling14Day: Rolling14DayEdge | null;
  weather: GameWeather | null;
  warnings: string[];
  dataSource: "official_mlb";
  updatedAt: string;
}

export async function getPlayerEdgeResearch(
  playerId: number,
  options?: { pitcherId?: number; opponentAbbr?: string; gamePk?: number },
): Promise<PlayerEdgeResearch> {
  const warnings: string[] = [];
  const requestStartedAt = Date.now();
  const timings: Record<string, number> = {};

  const timed = async <T>(
    label: string,
    task: () => Promise<T>,
  ): Promise<T> => {
    const startedAt = Date.now();

    try {
      return await task();
    } finally {
      timings[label] = Date.now() - startedAt;
    }
  };

  const pitcherId = options?.pitcherId;
  const gamePk = options?.gamePk;

  const [
    hitterStats,
    gameLog,
    statcastMap,
    sprayMap,
    disciplineMap,
    pitchMixMap,
    batterVsPitcher,
    weather,
  ] = await Promise.all([
    timed("hitterStats", () => getHitterStats(playerId).catch((err) => {
      console.warn(`[playerEdgeResearch] hitter stats failed ${playerId}:`, (err as Error).message);
      warnings.push("Season hitting stats unavailable from MLB Stats API.");
      return null;
    })),
    timed("gameLog", () => fetchFullGameLog(playerId).catch((err) => {
      console.warn(`[playerEdgeResearch] game log failed ${playerId}:`, (err as Error).message);
      warnings.push("Game log unavailable from MLB Stats API.");
      return [] as PlayerGameLogRow[];
    })),
    timed("statcast", () => getStatcastBatterMap().catch((err) => {
      console.warn("[playerEdgeResearch] statcast map failed:", (err as Error).message);
      warnings.push("Statcast season leaderboard unavailable.");
      return {} as Record<number, StatcastBatterQuality>;
    })),
    timed("sprayProfile", () => getBattedBallProfileMap().catch((err) => {
      console.warn("[playerEdgeResearch] spray profile failed:", (err as Error).message);
      warnings.push("Savant batted-ball spray profile unavailable.");
      return {} as Record<number, StatcastBattedBallProfile>;
    })),
    timed("plateDiscipline", () => getPlateDisciplineMap().catch((err) => {
      console.warn("[playerEdgeResearch] plate discipline failed:", (err as Error).message);
      warnings.push("Savant plate discipline leaderboard unavailable.");
      return {} as Record<number, StatcastPlateDiscipline>;
    })),
    timed("pitchMix", () => getPitchMixMap().catch((err) => {
      console.warn("[playerEdgeResearch] pitch mix failed:", (err as Error).message);
      warnings.push("Savant pitch-type breakdown unavailable.");
      return {} as Record<number, StatcastPitchMixRow[]>;
    })),
    pitcherId && pitcherId > 0
      ? timed(
          "bvp",
          () => getBatterVsPitcher(playerId, pitcherId).catch((err) => {
            console.warn(
              `[playerEdgeResearch] BvP failed ${playerId} vs ${pitcherId}:`,
              (err as Error).message,
            );
            warnings.push("Batter-vs-pitcher lookup failed.");
            return null;
          }),
        )
      : Promise.resolve(null),
    gamePk && gamePk > 0
      ? timed(
          "weather",
          () => getGameWeather(gamePk).catch((err) => {
            console.warn(
              `[playerEdgeResearch] weather failed gamePk=${gamePk}:`,
              (err as Error).message,
            );
            warnings.push("Game weather forecast unavailable.");
            return null;
          }),
        )
      : Promise.resolve(null),
  ]);

  if (!gameLog.length) {
    warnings.push("No game log rows returned for this season.");
  }

  if (pitcherId && pitcherId > 0) {
    if (!batterVsPitcher?.ab) {
      warnings.push("No recorded career history vs this pitcher.");
    }
  } else {
    timings.bvp = 0;
    warnings.push("Opposing pitcher ID unavailable — BvP needs today's probable pitcher.");
  }

  const opponentTarget = options?.opponentAbbr?.trim().toUpperCase() ?? "";
  const vsOpponent = opponentTarget
    ? gameLog.filter((g) => g.opponentAbbr.toUpperCase() === opponentTarget).slice(0, 10)
    : [];

  if (opponentTarget && !vsOpponent.length) {
    warnings.push(`No ${opponentTarget} games found in the current season log.`);
  }

  const statcast = statcastMap[playerId] ?? null;
  if (!statcast) {
    warnings.push("Statcast season quality unavailable (PA threshold or feed miss). Zone heatmaps are not fabricated.");
  }

  const sprayProfile = sprayMap[playerId] ?? null;
  if (!sprayProfile) {
    warnings.push("Savant spray profile unavailable for this batter.");
  }

  const plateDiscipline = disciplineMap[playerId] ?? null;
  if (!plateDiscipline) {
    warnings.push("Savant plate discipline unavailable — not a strike-zone heatmap.");
  }

  const pitchMix = pitchMixMap[playerId] ?? [];
  if (!pitchMix.length) {
    warnings.push("No Savant pitch-type rows for this batter.");
  }

  const rolling14Day = buildRolling14Day(gameLog);
  if (!rolling14Day) {
    warnings.push("Rolling 14-day edge needs at least one game in the season log.");
  }

  if (gamePk && gamePk > 0) {
    if (!weather) {
      warnings.push("No verified weather row for this gamePk on today's slate.");
    }
  } else {
    timings.weather = 0;
    warnings.push("gamePk unavailable — weather impact needs today's scheduled game.");
  }

  console.log(
    "[playerEdgeResearch:timing]",
    JSON.stringify({
      playerId,
      ...timings,
      total: Date.now() - requestStartedAt,
    }),
  );

  return {
    playerId,
    season: hitterStats?.season ?? null,
    recentGames: hitterStats?.recentGames ?? [],
    gameLog,
    batterVsPitcher,
    vsOpponent,
    statcast,
    sprayProfile,
    plateDiscipline,
    pitchMix,
    rolling14Day,
    weather,
    warnings,
    dataSource: "official_mlb",
    updatedAt: new Date().toISOString(),
  };
}
