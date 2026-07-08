/**
 * Real home-run feed. Scans today's in-progress/final game feeds and extracts
 * actual HR plays from MLB's play-by-play. Cached ~45s so we never spam the API.
 */
import { getScheduleByDate, getGameFeed, todayISO } from "./mlbClient";
import { TTLCache } from "../../lib/cache";
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
}

const HR_CACHE_TTL = 900_000;
const hrCache = new TTLCache<HrFeedPayload>(HR_CACHE_TTL);
const MAX_GAMES = 15;

const LAST_GOOD_TTL_MS = 5 * 60_000;
const LAST_GOOD_WARNING =
  "Serving last-known home run feed; upstream refresh failed. Events are real plays from the prior successful fetch.";

export interface HrFeedPayload {
  events: HrEvent[];
  warnings: string[];
}

const lastGoodHrFeeds = new Map<string, { payload: HrFeedPayload; storedAt: number }>();

function rememberLastGoodHrFeed(date: string, payload: HrFeedPayload): void {
  lastGoodHrFeeds.set(date, { payload, storedAt: Date.now() });
}

function serveLastGoodHrFeed(date: string): HrFeedPayload | null {
  const entry = lastGoodHrFeeds.get(date);
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
      const lastGood = serveLastGoodHrFeed(date);
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
          });
        }
        return out;
      })
    );

    const events = batches.flat();
    events.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1)); // newest first
    return events.slice(0, 60);
}
