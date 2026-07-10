/**
 * Unified live-game hub — one feed snapshot per gamePk shared by schedule + at-bat views.
 *
 * - In-flight promise coalescing per gamePk
 * - SWR: serve stale up to LIVE_HUB_SWR_MS while refreshing in background
 * - Single parse path for scores (homeScore, awayScore, inning, outs)
 */
import { isUpstashEnabled, redisGetJson, redisSetJson } from "../../lib/upstashRedis";
import type { MlbLiveFeed } from "../../types/mlbLiveFeed";
import { getGameFeed } from "../mlb/mlbClient";

export const LIVE_HUB_TTL_MS = Number(process.env.LIVE_GAME_HUB_TTL_MS ?? 4_500);
export const LIVE_HUB_SWR_MS = Number(process.env.LIVE_GAME_HUB_SWR_MS ?? 15_000);
const LAST_GOOD_TTL_MS = 2 * 60_000;
const LAST_GOOD_REDIS_PREFIX = "live-game-hub:last-good";
const HOT_REDIS_PREFIX = "live-game-hub:hot";

export interface LiveGameScore {
  gamePk: number;
  homeScore: number | null;
  awayScore: number | null;
  inning: number | null;
  halfInning: string | null;
  outs: number | null;
  status: string;
  asOf: string;
}

export interface SharedGameFeedSnapshot {
  gamePk: number;
  feed: MlbLiveFeed | null;
  score: LiveGameScore;
  asOf: string;
  servedStale?: boolean;
}

type FeedCacheEntry = {
  snapshot: SharedGameFeedSnapshot;
  expiresAt: number;
};

type LastGoodEntry = { snapshot: SharedGameFeedSnapshot; storedAt: number };

const localFeedCache = new Map<number, FeedCacheEntry>();
const localFeedBuilds = new Map<number, Promise<SharedGameFeedSnapshot>>();
const lastGoodFeeds = new Map<number, LastGoodEntry>();

function num(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Single parse path for live scores — used by schedule overlay and at-bat snapshot. */
export function parseLiveScoreFromFeed(feed: MlbLiveFeed, gamePk: number): LiveGameScore {
  const linescore = feed?.liveData?.linescore ?? {};
  const asOf = new Date().toISOString();

  return {
    gamePk,
    homeScore: num(linescore.teams?.home?.runs),
    awayScore: num(linescore.teams?.away?.runs),
    inning: num(linescore.currentInning),
    halfInning: typeof linescore.inningHalf === "string" ? linescore.inningHalf : null,
    outs: num(linescore.outs),
    status: String(feed?.gameData?.status?.detailedState ?? "Unknown"),
    asOf,
  };
}

function buildSnapshotFromFeed(gamePk: number, feed: MlbLiveFeed | null): SharedGameFeedSnapshot {
  const asOf = new Date().toISOString();
  if (!feed) {
    return {
      gamePk,
      feed: null,
      score: {
        gamePk,
        homeScore: null,
        awayScore: null,
        inning: null,
        halfInning: null,
        outs: null,
        status: "Unknown",
        asOf,
      },
      asOf,
    };
  }

  const score = parseLiveScoreFromFeed(feed, gamePk);
  return { gamePk, feed, score, asOf: score.asOf };
}

async function persistLastGoodToRedis(gamePk: number, entry: LastGoodEntry): Promise<void> {
  if (!isUpstashEnabled()) return;
  const redisKey = `${LAST_GOOD_REDIS_PREFIX}:${gamePk}`;
  try {
    await redisSetJson(redisKey, entry, Math.max(1, Math.floor(LAST_GOOD_TTL_MS / 1000)));
  } catch (error) {
    console.warn(`[LIVE_GAME_HUB] redis last-good write failed gamePk=${gamePk}`, (error as Error)?.message);
  }
}

async function loadLastGoodFromRedis(gamePk: number): Promise<LastGoodEntry | null> {
  if (!isUpstashEnabled()) return null;
  const redisKey = `${LAST_GOOD_REDIS_PREFIX}:${gamePk}`;
  try {
    const remote = await redisGetJson<LastGoodEntry>(redisKey);
    if (!remote?.snapshot || typeof remote.storedAt !== "number") return null;
    if (Date.now() - remote.storedAt > LAST_GOOD_TTL_MS) return null;
    lastGoodFeeds.set(gamePk, remote);
    return remote;
  } catch (error) {
    console.warn(`[LIVE_GAME_HUB] redis last-good read failed gamePk=${gamePk}`, (error as Error)?.message);
    return null;
  }
}

function rememberLastGood(gamePk: number, snapshot: SharedGameFeedSnapshot): void {
  if (!snapshot.feed) return;
  const entry: LastGoodEntry = { snapshot, storedAt: Date.now() };
  lastGoodFeeds.set(gamePk, entry);
  void persistLastGoodToRedis(gamePk, entry);
}

async function resolveLastGood(gamePk: number): Promise<SharedGameFeedSnapshot | null> {
  const local = lastGoodFeeds.get(gamePk);
  if (local && Date.now() - local.storedAt <= LAST_GOOD_TTL_MS) {
    return { ...local.snapshot, servedStale: true };
  }
  const remote = await loadLastGoodFromRedis(gamePk);
  return remote ? { ...remote.snapshot, servedStale: true } : null;
}

async function persistHotToRedis(gamePk: number, entry: FeedCacheEntry): Promise<void> {
  if (!isUpstashEnabled()) return;
  const redisKey = `${HOT_REDIS_PREFIX}:${gamePk}`;
  const ttlSeconds = Math.max(1, Math.floor((entry.expiresAt - Date.now()) / 1000));
  try {
    await redisSetJson(redisKey, entry, ttlSeconds);
  } catch (error) {
    console.warn(`[LIVE_GAME_HUB] redis hot write failed gamePk=${gamePk}`, (error as Error)?.message);
  }
}

async function loadHotFromRedis(gamePk: number): Promise<FeedCacheEntry | null> {
  if (!isUpstashEnabled()) return null;
  const redisKey = `${HOT_REDIS_PREFIX}:${gamePk}`;
  try {
    const remote = await redisGetJson<FeedCacheEntry>(redisKey);
    if (!remote?.snapshot || typeof remote.expiresAt !== "number") return null;
    if (remote.expiresAt <= Date.now() - LIVE_HUB_SWR_MS) return null;
    localFeedCache.set(gamePk, remote);
    return remote;
  } catch (error) {
    console.warn(`[LIVE_GAME_HUB] redis hot read failed gamePk=${gamePk}`, (error as Error)?.message);
    return null;
  }
}

async function fetchFreshFeed(gamePk: number): Promise<SharedGameFeedSnapshot> {
  try {
    const feed = (await getGameFeed(gamePk)) as MlbLiveFeed | null;
    const snapshot = buildSnapshotFromFeed(gamePk, feed);
    if (feed) rememberLastGood(gamePk, snapshot);

    const entry: FeedCacheEntry = {
      snapshot,
      expiresAt: Date.now() + LIVE_HUB_TTL_MS,
    };
    localFeedCache.set(gamePk, entry);
    void persistHotToRedis(gamePk, entry);
    return snapshot;
  } catch (error) {
    const lastGood = await resolveLastGood(gamePk);
    if (lastGood) {
      console.warn(
        `[LIVE_GAME_HUB] serving last-good gamePk=${gamePk}:`,
        error instanceof Error ? error.message : String(error),
      );
      return lastGood;
    }
    throw error;
  }
}

function scheduleBackgroundRefresh(gamePk: number): void {
  if (localFeedBuilds.has(gamePk)) return;

  const buildPromise = fetchFreshFeed(gamePk);
  localFeedBuilds.set(gamePk, buildPromise);
  void buildPromise.finally(() => {
    localFeedBuilds.delete(gamePk);
  });
}

/**
 * Shared live feed snapshot — coalesced per gamePk with SWR.
 * Schedule list and at-bat detail both read scores from this path.
 */
export async function getSharedGameFeed(gamePk: number): Promise<SharedGameFeedSnapshot> {
  const cached = localFeedCache.get(gamePk);
  const now = Date.now();

  if (cached) {
    const ageMs = now - new Date(cached.snapshot.asOf).getTime();
    if (cached.expiresAt > now) {
      return cached.snapshot;
    }
    if (ageMs < LIVE_HUB_SWR_MS) {
      scheduleBackgroundRefresh(gamePk);
      return { ...cached.snapshot, servedStale: true };
    }
    localFeedCache.delete(gamePk);
  }

  const activeBuild = localFeedBuilds.get(gamePk);
  if (activeBuild) return activeBuild;

  const buildPromise = (async (): Promise<SharedGameFeedSnapshot> => {
    const redisHot = await loadHotFromRedis(gamePk);
    if (redisHot && redisHot.expiresAt > now) {
      return redisHot.snapshot;
    }
    if (redisHot) {
      const ageMs = now - new Date(redisHot.snapshot.asOf).getTime();
      if (ageMs < LIVE_HUB_SWR_MS) {
        scheduleBackgroundRefresh(gamePk);
        return { ...redisHot.snapshot, servedStale: true };
      }
    }
    return fetchFreshFeed(gamePk);
  })();

  localFeedBuilds.set(gamePk, buildPromise);
  try {
    return await buildPromise;
  } finally {
    localFeedBuilds.delete(gamePk);
  }
}

/** Overlay hub feed scores onto a schedule card for live games. */
export function overlayFeedScoreOnCard<T extends {
  homeScore: number | null;
  awayScore: number | null;
  status: string;
}>(card: T, score: LiveGameScore): T {
  return {
    ...card,
    homeScore: score.homeScore ?? card.homeScore,
    awayScore: score.awayScore ?? card.awayScore,
    status: score.status || card.status,
  };
}

/** Test-only reset for hub caches and last-good snapshots. */
export function resetLiveGameHubForTests(): void {
  localFeedCache.clear();
  localFeedBuilds.clear();
  lastGoodFeeds.clear();
}

/** Test-only: force a rebuild on next fetch while keeping last-good snapshots. */
export function expireLiveGameHubCacheForTests(gamePk?: number): void {
  if (gamePk == null) {
    localFeedCache.clear();
    return;
  }
  const entry = localFeedCache.get(gamePk);
  if (entry) {
    localFeedCache.set(gamePk, { ...entry, expiresAt: Date.now() - 1 });
  } else {
    localFeedCache.delete(gamePk);
  }
}
