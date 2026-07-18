import { getSportsHttpStats, sportsFetchJson } from "../../lib/sports/sportsHttpClient";
import {
  DATA_PROVIDERS,
  isOddsProviderConfigured,
  listDataProviders,
} from "./dataProviderRegistry";

const MLB_API = process.env.MLB_API_BASE_URL ?? "https://statsapi.mlb.com/api";

export type MlbGameLiveState = {
  gamePk: string;
  gameStatus: string | null;
  boxscore: Record<string, unknown> | null;
  hrCountByPlayer: Record<string, number>;
  source: "live_feed" | "boxscore_fallback";
};

function playerNumericId(playerId: string | number): string {
  return String(playerId).replace(/\D/g, "");
}

function extractBoxscoreFromFeed(feed: Record<string, unknown>): Record<string, unknown> | null {
  const liveData = feed.liveData as Record<string, unknown> | undefined;
  const box = liveData?.boxscore;
  return box && typeof box === "object" ? (box as Record<string, unknown>) : null;
}

function extractGameStatusFromFeed(feed: Record<string, unknown>): string | null {
  const gameData = feed.gameData as Record<string, unknown> | undefined;
  const status = gameData?.status as Record<string, unknown> | undefined;
  return String(status?.detailedState ?? status?.abstractGameState ?? "").trim() || null;
}

function countHomeRunsFromFeed(feed: Record<string, unknown>): Record<string, number> {
  const liveData = feed.liveData as Record<string, unknown> | undefined;
  const plays = liveData?.plays as Record<string, unknown> | undefined;
  const allPlays = Array.isArray(plays?.allPlays) ? plays.allPlays : [];
  const counts: Record<string, number> = {};

  for (const play of allPlays) {
    if (!play || typeof play !== "object") continue;
    const result = (play as Record<string, unknown>).result as Record<string, unknown> | undefined;
    if (String(result?.eventType ?? "") !== "home_run") continue;
    const matchup = (play as Record<string, unknown>).matchup as Record<string, unknown> | undefined;
    const batter = matchup?.batter as Record<string, unknown> | undefined;
    const id = playerNumericId(String(batter?.id ?? ""));
    if (!id) continue;
    counts[id] = (counts[id] ?? 0) + 1;
  }

  return counts;
}

export async function fetchMlbLiveFeed(gamePk: string): Promise<Record<string, unknown>> {
  return sportsFetchJson<Record<string, unknown>>(
    `${MLB_API}/v1.1/game/${encodeURIComponent(gamePk)}/feed/live`,
    {
      cacheKey: `gateway:mlb:live-feed:${gamePk}`,
      ttlMs: 10_000,
      staleIfErrorMs: 30_000,
      timeoutMs: 10_000,
      retries: 1,
      debugLabel: "sportsGateway:liveFeed",
    },
  );
}

export async function fetchMlbBoxscore(gamePk: string): Promise<Record<string, unknown>> {
  return sportsFetchJson<Record<string, unknown>>(
    `${MLB_API}/v1/game/${encodeURIComponent(gamePk)}/boxscore`,
    {
      cacheKey: `gateway:mlb:boxscore:${gamePk}`,
      ttlMs: 15_000,
      staleIfErrorMs: 45_000,
      timeoutMs: 10_000,
      retries: 1,
      debugLabel: "sportsGateway:boxscore",
    },
  );
}

export async function fetchMlbLinescore(gamePk: string): Promise<Record<string, unknown>> {
  return sportsFetchJson<Record<string, unknown>>(
    `${MLB_API}/v1/game/${encodeURIComponent(gamePk)}/linescore`,
    {
      cacheKey: `gateway:mlb:linescore:${gamePk}`,
      ttlMs: 15_000,
      staleIfErrorMs: 45_000,
      timeoutMs: 8_000,
      retries: 1,
      debugLabel: "sportsGateway:linescore",
    },
  );
}

/**
 * Prefer live feed (fresher boxscore + play-by-play HR counts), fall back to boxscore endpoint.
 */
export async function fetchMlbGameLiveState(gamePk: string): Promise<MlbGameLiveState> {
  try {
    const feed = await fetchMlbLiveFeed(gamePk);
    return {
      gamePk,
      gameStatus: extractGameStatusFromFeed(feed),
      boxscore: extractBoxscoreFromFeed(feed),
      hrCountByPlayer: countHomeRunsFromFeed(feed),
      source: "live_feed",
    };
  } catch {
    const [linescore, boxscore] = await Promise.all([
      fetchMlbLinescore(gamePk).catch(() => null),
      fetchMlbBoxscore(gamePk).catch(() => null),
    ]);
    const status = linescore?.status as Record<string, unknown> | undefined;
    return {
      gamePk,
      gameStatus: String(status?.detailedState ?? status ?? "").trim() || null,
      boxscore: boxscore as Record<string, unknown> | null,
      hrCountByPlayer: {},
      source: "boxscore_fallback",
    };
  }
}

export function getSportsDataGatewayStatus() {
  const http = getSportsHttpStats();
  // Public status stays lean — no upstream base URLs or architecture notes for recon.
  return {
    gateway: "sports_data_v1",
    providers: listDataProviders().map((provider) => ({
      id: provider.id,
      label: provider.label,
      configured:
        provider.id === "odds_api"
          ? isOddsProviderConfigured()
          : provider.id === "supabase"
            ? Boolean(process.env.SUPABASE_URL)
            : true,
    })),
    sportsHttp: {
      cacheSize: http.cacheSize,
      maxCacheEntries: http.maxCacheEntries,
      inflight: http.inflight,
    },
  };
}

export const SportsDataGateway = {
  fetchMlbLiveFeed,
  fetchMlbBoxscore,
  fetchMlbLinescore,
  fetchMlbGameLiveState,
  getStatus: getSportsDataGatewayStatus,
  providers: DATA_PROVIDERS,
};
