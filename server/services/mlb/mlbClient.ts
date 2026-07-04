/**
 * MLB Stats API client. Backend-only, cached, with timeout + safe fallback.
 * Base URL comes from MLB_API_BASE_URL (default https://statsapi.mlb.com/api).
 */
import { scheduleCache, gameFeedCache } from "./mlbCache";
import { normalizeGame } from "./mlbNormalizer";
import { NormalizedGame, NormalizedPitcher, headshotUrl } from "./mlbTypes";
import {
  isUpstashEnabled,
  redisDel,
  redisGetJson,
  redisSet,
  redisSetJson,
  sleep,
} from "../../lib/upstashRedis";

import { sportsFetchJson } from "../../lib/sports/sportsHttpClient";

const BASE = (process.env.MLB_API_BASE_URL || "https://statsapi.mlb.com/api").replace(/\/$/, "");
const TIMEOUT_MS = 8000;
let mlbRequestCount = 0;

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

async function fetchJson<T>(url: string): Promise<T> {
  const requestNumber = ++mlbRequestCount;
  const start = Date.now();
  if (process.env.DEBUG_MLB_CLIENT === "true") {
    console.log(`[mlbClient] request #${requestNumber} ${new URL(url).pathname}`);
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`MLB API ${res.status} for ${new URL(url).pathname}`);
    console.log(`[mlbClient] request #${requestNumber} complete ${Date.now() - start}ms`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export function getMlbRequestCount(): number {
  return mlbRequestCount;
}

export function resetMlbRequestCount(): void {
  mlbRequestCount = 0;
}

/** Schedule for a date (YYYY-MM-DD), normalized. Falls back to [] on failure. */
export async function getScheduleByDate(date: string): Promise<NormalizedGame[]> {
  return scheduleCache.getOrSet(`schedule:${date}`, async () => {
    const url = `${BASE}/v1/schedule?sportId=1&date=${date}&hydrate=probablePitcher(note),linescore,team`;
    try {
      const data = await fetchJson<any>(url);
      const games: any[] = data?.dates?.[0]?.games ?? [];
      return games.map(normalizeGame);
    } catch (err) {
      console.error("[mlbClient] getScheduleByDate failed:", (err as Error).message);
      return [];
    }
  }) as Promise<NormalizedGame[]>;
}

export async function getTodayGames(): Promise<NormalizedGame[]> {
  return getScheduleByDate(todayISO());
}

/** Probable pitchers for a date, de-duplicated. */
export async function getProbablePitchers(date: string): Promise<NormalizedPitcher[]> {
  const games = await getScheduleByDate(date);
  const out: NormalizedPitcher[] = [];
  for (const g of games) {
    if (g.probablePitchers.away) out.push(g.probablePitchers.away);
    if (g.probablePitchers.home) out.push(g.probablePitchers.home);
  }
  return out;
}

const gameFeedInflight = new Map<number, Promise<any | null>>();

/** Live feed for a game. Returns raw feed (large); cached briefly. */
export async function getGameFeed(gamePk: number): Promise<any | null> {
  const localKey = `feed:${gamePk}`;
  const redisKey = `mlb:game:live:${gamePk}`;
  const lockKey = `lock:mlb:game:live:${gamePk}`;
  const feedTtlSeconds = Number(process.env.MLB_LIVE_FEED_REDIS_TTL_SECONDS ?? 45);
  const lockTtlSeconds = Number(process.env.MLB_LIVE_FEED_LOCK_TTL_SECONDS ?? 10);

  const existingInflight = gameFeedInflight.get(gamePk);
  if (existingInflight) {
    console.log(`[MLB_CACHE] local inflight hit gamePk=${gamePk}`);
    return existingInflight;
  }

  const promise = gameFeedCache.getOrSet(localKey, async () => {
    const url = `${BASE}/v1.1/game/${gamePk}/feed/live`;

    if (isUpstashEnabled()) {
      try {
        const cached = await redisGetJson<any>(redisKey);
        if (cached) {
          console.log(`[MLB_CACHE] redis hit gamePk=${gamePk}`);
          return cached;
        }

        const lockValue = `${process.pid}:${Date.now()}`;
        const gotLock = await redisSet(lockKey, lockValue, {
          nx: true,
          exSeconds: lockTtlSeconds,
        });

        if (gotLock) {
          try {
            console.log(`[MLB_CACHE] redis miss lock-acquired gamePk=${gamePk}`);
            const fresh = await fetchJson<any>(url);
            await redisSetJson(redisKey, fresh, feedTtlSeconds);
            return fresh;
          } finally {
            await redisDel(lockKey).catch(() => {});
          }
        }

        console.log(`[MLB_CACHE] redis wait-for-lock gamePk=${gamePk}`);
        for (let i = 0; i < 3; i += 1) {
          await sleep(250);
          const polled = await redisGetJson<any>(redisKey);
          if (polled) {
            console.log(`[MLB_CACHE] redis hit-after-wait gamePk=${gamePk}`);
            return polled;
          }
        }

        console.log(`[MLB_CACHE] redis lock-timeout fallback gamePk=${gamePk}`);
      } catch (err) {
        console.warn("[MLB_CACHE] redis fallback:", (err as Error).message);
      }
    }

    try {
      return await fetchJson<any>(url);
    } catch (err) {
      console.error("[mlbClient] getGameFeed failed:", (err as Error).message);
      return null;
    }
  }) as Promise<any | null>;

  gameFeedInflight.set(gamePk, promise);
  try {
    return await promise;
  } finally {
    gameFeedInflight.delete(gamePk);
  }
}

export async function getLinescore(gamePk: number): Promise<any | null> {
  const url = `${BASE}/v1/game/${gamePk}/linescore`;
  try {
    return await fetchJson<any>(url);
  } catch {
    return null;
  }
}

export async function getBoxscore(gamePk: number): Promise<any | null> {
  const url = `${BASE}/v1/game/${gamePk}/boxscore`;
  try {
    return await fetchJson<any>(url);
  } catch {
    return null;
  }
}

/** Lightweight player lookup (basics + headshot). */
export async function getPlayerBasics(playerId: number): Promise<any | null> {
  const url = `${BASE}/v1/people/${playerId}`;
  try {
    const data = await fetchJson<any>(url);
    const p = data?.people?.[0];
    if (!p) return null;
    return {
      playerId: p.id,
      playerName: p.fullName,
      position: p.primaryPosition?.abbreviation ?? "—",
      bats: p.batSide?.code ?? "U",
      throws: p.pitchHand?.code ?? "U",
      team: p.currentTeam?.name ?? "Free Agent",
      headshot: headshotUrl(p.id),
    };
  } catch {
    return null;
  }
}
