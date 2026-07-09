/** Today's MLB lineups from Stats API with last-good fallback on upstream failure. */
import { TTL, TTLCache } from "../../lib/cache";
import { isUpstashEnabled, redisGetJson, redisSetJson } from "../../lib/upstashRedis";
import { sportsFetchJson } from "../../lib/sports/sportsHttpClient";
import { headshotUrl } from "./mlbTypes";
import { parseMlbPeopleResponse, parseMlbScheduleResponse, type MlbPlayer, type MlbScheduleGame } from "./mlbStatsApiSchemas";

const MLB_BASE = (process.env.MLB_API_BASE_URL || "https://statsapi.mlb.com/api").replace(/\/$/, "");

const LAST_GOOD_TTL_MS = 5 * 60_000;
const LAST_GOOD_WARNING =
  "Serving last-known lineup board; upstream refresh failed. Lineup confirmation flags reflect the prior successful fetch — do not treat stale rows as newly confirmed.";

export interface LineupPlayer {
  playerId: number;
  playerName: string;
  position: string;
  battingOrder: number;
  bats: "L" | "R" | "S" | "U";
  team: string | undefined;
  teamId: number | undefined;
  teamAbbrev: string | undefined;
  headshot: string;
}

export interface LineupGame {
  gamePk: number;
  gameDate: string | undefined;
  status: string;
  venue: string;
  awayTeam: { id: number | undefined; name: string | undefined; abbrev: string | undefined };
  homeTeam: { id: number | undefined; name: string | undefined; abbrev: string | undefined };
  awayPitcher: { id: number; name: string; throws: "L" | "R" | "U"; headshot: string } | null;
  homePitcher: { id: number; name: string; throws: "L" | "R" | "U"; headshot: string } | null;
  awayLineup: LineupPlayer[];
  homeLineup: LineupPlayer[];
  lineupConfirmed: boolean;
  totalPlayers: number;
}

export interface LineupPayload {
  lineups: LineupGame[];
  warnings: string[];
  servedFromLastGood?: boolean;
}

const lineupCache = new TTLCache<LineupPayload>(TTL.liveFeed, "mlb:lineups");

const lastGoodLineups = new Map<string, { lineups: LineupGame[]; storedAt: number }>();
const LAST_GOOD_REDIS_PREFIX = "mlb-lineups:last-good";

type LastGoodLineupEntry = { lineups: LineupGame[]; storedAt: number };

async function persistLastGoodToRedis(date: string, entry: LastGoodLineupEntry): Promise<void> {
  if (!isUpstashEnabled()) return;

  const redisKey = `${LAST_GOOD_REDIS_PREFIX}:${date}`;
  const ttlSeconds = Math.max(1, Math.floor(LAST_GOOD_TTL_MS / 1000));
  try {
    await redisSetJson(redisKey, entry, ttlSeconds);
  } catch (error) {
    console.warn(
      `[lineup] redis last-good write failed date=${date}`,
      (error as Error)?.message,
    );
  }
}

async function loadLastGoodFromRedis(date: string): Promise<LastGoodLineupEntry | null> {
  if (!isUpstashEnabled()) return null;

  const redisKey = `${LAST_GOOD_REDIS_PREFIX}:${date}`;
  try {
    const remote = await redisGetJson<LastGoodLineupEntry>(redisKey);
    if (!remote?.lineups || typeof remote.storedAt !== "number") return null;

    const ageMs = Date.now() - remote.storedAt;
    if (ageMs > LAST_GOOD_TTL_MS) return null;

    lastGoodLineups.set(date, remote);
    console.log(`[lineup] redis last-good hit date=${date} ageMs=${ageMs}`);
    return remote;
  } catch (error) {
    console.warn(
      `[lineup] redis last-good read failed date=${date}`,
      (error as Error)?.message,
    );
    return null;
  }
}

function rememberLastGoodLineups(date: string, lineups: LineupGame[]): void {
  const entry: LastGoodLineupEntry = { lineups, storedAt: Date.now() };
  lastGoodLineups.set(date, entry);
  void persistLastGoodToRedis(date, entry);
}

async function serveLastGoodLineups(date: string): Promise<LineupPayload | null> {
  let entry = lastGoodLineups.get(date);
  if (!entry) {
    entry = (await loadLastGoodFromRedis(date)) ?? undefined;
  }
  if (!entry) return null;
  if (Date.now() - entry.storedAt > LAST_GOOD_TTL_MS) return null;

  console.warn(`[lineup] serving last-good board date=${date} ageMs=${Date.now() - entry.storedAt}`);
  return {
    lineups: entry.lineups,
    warnings: [LAST_GOOD_WARNING],
    servedFromLastGood: true,
  };
}

export function resetLineupCachesForTests(): void {
  lineupCache.clear();
  lastGoodLineups.clear();
}

/** Test-only: drop cached lineups without clearing last-good snapshots. */
export function invalidateLineupCacheForTests(date?: string): void {
  if (date) {
    lineupCache.delete(`lineups:${date}`);
    return;
  }
  lineupCache.clear();
}

async function fetchMlb<T>(path: string): Promise<T> {
  const start = Date.now();
  console.log(`[lineup] MLB request ${path}`);
  const data = await sportsFetchJson<T>(`${MLB_BASE}${path}`, {
    cacheKey: `mlbLineup:${path}`,
    ttlMs: 60_000,
    timeoutMs: 10_000,
    retries: 1,
    debugLabel: "lineup",
  });
  console.log(`[lineup] MLB request complete ${path} ${Date.now() - start}ms`);
  return data;
}

function normalizeBat(value: unknown): "L" | "R" | "S" | "U" {
  return value === "L" || value === "R" || value === "S" ? value : "U";
}

function normalizeThrow(value: unknown): "L" | "R" | "U" {
  return value === "L" || value === "R" ? value : "U";
}

async function fetchPlayerHandedness(playerIds: number[]) {
  const uniqueIds = [...new Set(playerIds.filter((id) => Number.isFinite(id)))];
  const hands = new Map<number, { bats: "L" | "R" | "S" | "U"; throws: "L" | "R" | "U" }>();

  for (let i = 0; i < uniqueIds.length; i += 75) {
    const batch = uniqueIds.slice(i, i + 75);
    if (!batch.length) continue;

    const data = await fetchMlb<unknown>(`/v1/people?personIds=${batch.join(",")}`);
    const { people, warnings } = parseMlbPeopleResponse(data, "lineup:people");
    for (const warning of warnings) console.warn(`[lineup] ${warning}`);
    for (const person of people) {
      hands.set(Number(person.id), {
        bats: normalizeBat(person?.batSide?.code),
        throws: normalizeThrow(person?.pitchHand?.code),
      });
    }
  }

  return hands;
}

async function fetchLineupsFromUpstream(date: string): Promise<LineupGame[]> {
  const data = await fetchMlb<unknown>(
    `/v1/schedule?sportId=1&date=${date}&hydrate=lineups,probablePitcher(note),team,linescore`,
  );

  const { games, warnings } = parseMlbScheduleResponse(data, `lineup:${date}`);
  for (const warning of warnings) console.warn(`[lineup] ${warning}`);

  const lineupPlayers = (game: MlbScheduleGame, side: "awayPlayers" | "homePlayers"): MlbPlayer[] => {
    const rawLineups = game.lineups as { awayPlayers?: unknown; homePlayers?: unknown } | undefined;
    const rawPlayers = rawLineups?.[side];
    return Array.isArray(rawPlayers)
      ? parseMlbPeopleResponse({ people: rawPlayers }, `lineup:${date}:${side}`).people
      : [];
  };

  const playerIds = games.flatMap((game) => [
    ...lineupPlayers(game, "awayPlayers").map((p) => Number(p.id)),
    ...lineupPlayers(game, "homePlayers").map((p) => Number(p.id)),
    Number(game.teams?.away?.probablePitcher?.id),
    Number(game.teams?.home?.probablePitcher?.id),
  ]);
  const handedness = await fetchPlayerHandedness(playerIds);

  return games.map((game) => {
    const awayTeam = {
      id: game.teams?.away?.team?.id,
      name: game.teams?.away?.team?.name,
      abbrev: game.teams?.away?.team?.abbreviation,
    };
    const homeTeam = {
      id: game.teams?.home?.team?.id,
      name: game.teams?.home?.team?.name,
      abbrev: game.teams?.home?.team?.abbreviation,
    };

    const mapPlayers = (players: MlbPlayer[], team: typeof awayTeam) =>
      players.map((p, idx) => ({
        playerId: p.id,
        playerName: p.fullName ?? "Unknown",
        position: p.primaryPosition?.abbreviation ?? "—",
        battingOrder: idx + 1,
        bats: handedness.get(Number(p.id))?.bats ?? normalizeBat(p.batSide?.code),
        team: team.name,
        teamId: team.id,
        teamAbbrev: team.abbrev,
        headshot: headshotUrl(p.id),
      }));

    const awayLineup = mapPlayers(lineupPlayers(game, "awayPlayers"), awayTeam);
    const homeLineup = mapPlayers(lineupPlayers(game, "homePlayers"), homeTeam);

    const awayPitcher = game.teams?.away?.probablePitcher;
    const homePitcher = game.teams?.home?.probablePitcher;

    return {
      gamePk: game.gamePk,
      gameDate: game.gameDate,
      status: game.status?.detailedState ?? game.status?.abstractGameState ?? "Scheduled",
      venue: game.venue?.name ?? "TBD",
      awayTeam,
      homeTeam,
      awayPitcher: awayPitcher
        ? {
            id: awayPitcher.id,
            name: awayPitcher.fullName,
            throws: handedness.get(Number(awayPitcher.id))?.throws ?? normalizeThrow(awayPitcher.pitchHand?.code),
            headshot: headshotUrl(awayPitcher.id),
          }
        : null,
      homePitcher: homePitcher
        ? {
            id: homePitcher.id,
            name: homePitcher.fullName,
            throws: handedness.get(Number(homePitcher.id))?.throws ?? normalizeThrow(homePitcher.pitchHand?.code),
            headshot: headshotUrl(homePitcher.id),
          }
        : null,
      awayLineup,
      homeLineup,
      lineupConfirmed: awayLineup.length > 0 || homeLineup.length > 0,
      totalPlayers: awayLineup.length + homeLineup.length,
    };
  });
}

/** Fetch all lineups for a date; serves last-good snapshot when upstream refresh fails. */
export async function getTodayLineups(date: string): Promise<LineupPayload> {
  return lineupCache.getOrSet(`lineups:${date}`, async () => {
    try {
      const lineups = await fetchLineupsFromUpstream(date);
      rememberLastGoodLineups(date, lineups);
      return { lineups, warnings: [] };
    } catch (error) {
      const lastGood = await serveLastGoodLineups(date);
      if (lastGood) return lastGood;
      throw error;
    }
  });
}
