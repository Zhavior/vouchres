/**
 * Real home-run feed. Scans today's in-progress/final game feeds and extracts
 * actual HR plays from MLB's play-by-play. Cached ~45s so we never spam the API.
 */
import { getScheduleByDate, getGameFeed, todayISO } from "./mlbClient";
import { TTLCache } from "../../lib/cache";
import { isUpstashEnabled, redisGetJson, redisSetJson } from "../../lib/upstashRedis";
import { headshotUrl } from "./mlbTypes";

export interface HrEvent {
  id: string;
  playerId: number;
  playerName: string;
  headshot: string;
  team: string;
  teamAbbr: string;
  opponent: string;
  inning: number;
  halfInning: string;
  description: string;
  rbi: number;
  gamePk: number;
  matchup: string;
  timestamp: string;
  /** Statcast exit velocity in mph. Null when MLB published no hitData for the play. */
  exitVelocity: number | null;
  /** Statcast projected distance in feet. Null when MLB published no hitData. */
  distance: number | null;
}

const HR_CACHE_TTL = 45_000;
const hrCache = new TTLCache<HrFeedPayload>(HR_CACHE_TTL);
const MAX_GAMES = 15;
/**
 * Upper bound on events returned for one date. A full slate tops out around 60
 * home runs; the cap is headroom against a pathological feed, not a display
 * limit, so slate totals stay truthful.
 */
const MAX_EVENTS = 120;

const LAST_GOOD_TTL_MS = 5 * 60_000;
const LAST_GOOD_WARNING =
  "Serving last-known home run feed; upstream refresh failed. Events are real plays from the prior successful fetch.";

export interface HrFeedPayload {
  events: HrEvent[];
  warnings: string[];
}

const lastGoodHrFeeds = new Map<string, { payload: HrFeedPayload; storedAt: number }>();
const LAST_GOOD_REDIS_PREFIX = "mlb-hr-feed:last-good";

type LastGoodHrFeedEntry = { payload: HrFeedPayload; storedAt: number };

async function persistLastGoodToRedis(date: string, entry: LastGoodHrFeedEntry): Promise<void> {
  if (!isUpstashEnabled()) return;

  const redisKey = `${LAST_GOOD_REDIS_PREFIX}:${date}`;
  const ttlSeconds = Math.max(1, Math.floor(LAST_GOOD_TTL_MS / 1000));
  try {
    await redisSetJson(redisKey, entry, ttlSeconds);
  } catch (error) {
    console.warn(
      `[hrFeed] redis last-good write failed date=${date}`,
      (error as Error)?.message,
    );
  }
}

async function loadLastGoodFromRedis(date: string): Promise<LastGoodHrFeedEntry | null> {
  if (!isUpstashEnabled()) return null;

  const redisKey = `${LAST_GOOD_REDIS_PREFIX}:${date}`;
  try {
    const remote = await redisGetJson<LastGoodHrFeedEntry>(redisKey);
    if (!remote?.payload || typeof remote.storedAt !== "number") return null;

    const ageMs = Date.now() - remote.storedAt;
    if (ageMs > LAST_GOOD_TTL_MS) return null;

    lastGoodHrFeeds.set(date, remote);
    console.log(`[hrFeed] redis last-good hit date=${date} ageMs=${ageMs}`);
    return remote;
  } catch (error) {
    console.warn(
      `[hrFeed] redis last-good read failed date=${date}`,
      (error as Error)?.message,
    );
    return null;
  }
}

function rememberLastGoodHrFeed(date: string, payload: HrFeedPayload): void {
  const entry: LastGoodHrFeedEntry = { payload, storedAt: Date.now() };
  lastGoodHrFeeds.set(date, entry);
  void persistLastGoodToRedis(date, entry);
}

async function serveLastGoodHrFeed(date: string): Promise<HrFeedPayload | null> {
  let entry = lastGoodHrFeeds.get(date);
  if (!entry) {
    entry = (await loadLastGoodFromRedis(date)) ?? undefined;
  }
  if (!entry) return null;
  if (Date.now() - entry.storedAt > LAST_GOOD_TTL_MS) return null;

  console.warn(`[hrFeed] serving last-good feed date=${date} ageMs=${Date.now() - entry.storedAt}`);
  return {
    events: entry.payload.events,
    warnings: [...new Set([...entry.payload.warnings, LAST_GOOD_WARNING])],
  };
}

export function resetHrFeedCachesForTests(): void {
  hrCache.clear();
  lastGoodHrFeeds.clear();
}

/** Test-only: drop cached HR feed without clearing last-good snapshots. */
export function invalidateHrFeedCacheForTests(date?: string): void {
  if (date) {
    hrCache.delete(`hrfeed:${date}`);
    return;
  }
  hrCache.clear();
}

export async function getTodayHomeRuns(date = todayISO()): Promise<HrFeedPayload> {
  return hrCache.getOrSet(`hrfeed:${date}`, async () => {
    try {
      const events = await fetchHrEventsForDate(date);
      const payload: HrFeedPayload = { events, warnings: [] };
      rememberLastGoodHrFeed(date, payload);
      return payload;
    } catch (error) {
      const lastGood = await serveLastGoodHrFeed(date);
      if (lastGood) return lastGood;
      throw error;
    }
  });
}

async function fetchHrEventsForDate(date: string): Promise<HrEvent[]> {
    const games = await getScheduleByDate(date);
    // Only games that have started have play data.
    const relevant = games
      .filter((g) => /progress|final|live|in play|game over/i.test(g.status))
      .slice(0, MAX_GAMES);

    const batches = await Promise.all(
      relevant.map(async (g) => {
        const feed = await getGameFeed(g.gamePk);
        const allPlays: any[] = feed?.liveData?.plays?.allPlays ?? [];
        const out: HrEvent[] = [];
        for (const play of allPlays) {
          if (play?.result?.eventType !== "home_run") continue;
          const batter = play.matchup?.batter ?? {};
          // hitData rides on the pitch event that ended the at-bat. It is absent
          // for parks without tracking or when MLB has not published it yet, so
          // both fields stay null rather than being estimated.
          const hitData = [...(play.playEvents ?? [])].reverse()
            .find((event: any) => event?.hitData)?.hitData;
          const isTop = play.about?.halfInning === "top";
          const team = isTop ? g.awayTeam : g.homeTeam;
          const opp = isTop ? g.homeTeam : g.awayTeam;
          out.push({
            id: `${g.gamePk}-${play.atBatIndex ?? out.length}`,
            playerId: batter.id ?? 0,
            playerName: batter.fullName ?? "Unknown",
            headshot: headshotUrl(batter.id ?? 0),
            team: team.name,
            teamAbbr: team.abbreviation,
            opponent: opp.name,
            inning: play.about?.inning ?? 0,
            halfInning: play.about?.halfInning ?? "",
            description: play.result?.description ?? "Home run",
            rbi: play.result?.rbi ?? 1,
            gamePk: g.gamePk,
            matchup: `${g.awayTeam.abbreviation} @ ${g.homeTeam.abbreviation}`,
            timestamp: play.about?.endTime ?? play.about?.startTime ?? new Date().toISOString(),
            exitVelocity: Number.isFinite(Number(hitData?.launchSpeed)) ? Number(hitData.launchSpeed) : null,
            distance: Number.isFinite(Number(hitData?.totalDistance)) ? Number(hitData.totalDistance) : null,
          });
        }
        return out;
      })
    );

    const events = batches.flat();
    events.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1)); // newest first
    return events.slice(0, MAX_EVENTS);
}
