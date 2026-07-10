/**
 * Live at-bat snapshot — the pitch-by-pitch "sweat screen" data layer.
 *
 * Slims MLB's GUMBO live feed (via getGameFeed) down to one at-bat:
 * pitch sequence with strike-zone coordinates, batted-ball data on
 * contact, batter/pitcher game lines, linescore, and win probability
 * (separate free endpoint). Every field is real feed data — the one
 * Statcast-only stat (xBA) is deliberately absent rather than faked.
 */
import { headshotUrl } from "./mlbTypes";
import { isUpstashEnabled, redisGetJson, redisSetJson } from "../../lib/upstashRedis";
import { sportsFetchJson } from "../../lib/sports/sportsHttpClient";
import { getSharedGameFeed } from "../hubs/liveGameHub";

const BASE = (process.env.MLB_API_BASE_URL || "https://statsapi.mlb.com/api").replace(/\/$/, "");

export interface LiveAtBatPitch {
  number: number;
  result: string;
  isInPlay: boolean;
  isStrike: boolean;
  isBall: boolean;
  pitchType: string | null;
  velo: number | null;
  /** Horizontal/vertical plate-crossing position in feet (catcher's view). */
  px: number | null;
  pz: number | null;
  /** This batter's personal strike zone bounds in feet. */
  szTop: number | null;
  szBot: number | null;
}

export interface LiveAtBatHit {
  ev: number | null;
  la: number | null;
  distance: number | null;
  /** MLB Gameday spray coordinates (~0-250 grid, home plate bottom-center). */
  coordX: number | null;
  coordY: number | null;
}

export interface LiveAtBatRunner {
  id: number | null;
  name: string;
  initials: string;
}

export interface LiveAtBatSnapshot {
  gamePk: number;
  status: string;
  inning: number | null;
  halfInning: string | null;
  outs: number | null;
  count: { balls: number | null; strikes: number | null };
  runners: { first: LiveAtBatRunner | null; second: LiveAtBatRunner | null; third: LiveAtBatRunner | null };
  away: { teamId: number | null; abbr: string; runs: number | null };
  home: { teamId: number | null; abbr: string; runs: number | null };
  winProb: { homePct: number; awayPct: number; lastSwingHomePct: number } | null;
  play: {
    description: string | null;
    isComplete: boolean;
    batter: { id: number | null; name: string; headshot: string | null; gameLine: string | null };
    pitcher: { id: number | null; name: string; gameLine: string | null };
    pitches: LiveAtBatPitch[];
    hit: LiveAtBatHit | null;
  } | null;
  updatedAt: string;
}

const lastGoodSnapshots = new Map<number, { snapshot: LiveAtBatSnapshot; expiresAt: number }>();
const LAST_GOOD_TTL_MS = 2 * 60_000;
const MAX_LAST_GOOD_SNAPSHOTS = 64;
const LAST_GOOD_REDIS_PREFIX = "live-at-bat:last-good";

type LastGoodAtBatEntry = { snapshot: LiveAtBatSnapshot; storedAt: number };

async function persistLastGoodToRedis(gamePk: number, entry: LastGoodAtBatEntry): Promise<void> {
  if (!isUpstashEnabled()) return;

  const redisKey = `${LAST_GOOD_REDIS_PREFIX}:${gamePk}`;
  const ttlSeconds = Math.max(1, Math.floor(LAST_GOOD_TTL_MS / 1000));
  try {
    await redisSetJson(redisKey, entry, ttlSeconds);
  } catch (error) {
    console.warn(
      `[liveAtBat] redis last-good write failed gamePk=${gamePk}`,
      (error as Error)?.message,
    );
  }
}

async function loadLastGoodFromRedis(gamePk: number): Promise<LastGoodAtBatEntry | null> {
  if (!isUpstashEnabled()) return null;

  const redisKey = `${LAST_GOOD_REDIS_PREFIX}:${gamePk}`;
  try {
    const remote = await redisGetJson<LastGoodAtBatEntry>(redisKey);
    if (!remote?.snapshot || typeof remote.storedAt !== "number") return null;

    const ageMs = Date.now() - remote.storedAt;
    if (ageMs > LAST_GOOD_TTL_MS) return null;

    lastGoodSnapshots.set(gamePk, {
      snapshot: remote.snapshot,
      expiresAt: remote.storedAt + LAST_GOOD_TTL_MS,
    });
    console.log(`[liveAtBat] redis last-good hit gamePk=${gamePk} ageMs=${ageMs}`);
    return remote;
  } catch (error) {
    console.warn(
      `[liveAtBat] redis last-good read failed gamePk=${gamePk}`,
      (error as Error)?.message,
    );
    return null;
  }
}

async function resolveLastGoodSnapshot(gamePk: number): Promise<LiveAtBatSnapshot | null> {
  const local = lastGoodSnapshots.get(gamePk);
  if (local && local.expiresAt > Date.now()) return local.snapshot;

  const remote = await loadLastGoodFromRedis(gamePk);
  if (!remote) return null;

  return remote.snapshot;
}

/** Test-only reset for live at-bat caches and last-good snapshots. */
export function resetLiveAtBatCachesForTests(): void {
  lastGoodSnapshots.clear();
}

function num(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function runnerInitials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

function mapRunner(raw: unknown): LiveAtBatRunner | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const id = num(r.id);
  const name = String(r.fullName ?? r.lastName ?? "").trim();
  if (!name && id == null) return null;
  return { id, name: name || "Runner", initials: runnerInitials(name || "??") };
}

function mapRunners(linescore: Record<string, unknown>): LiveAtBatSnapshot["runners"] {
  const offense = (linescore?.offense ?? {}) as Record<string, unknown>;
  return {
    first: mapRunner(offense.first),
    second: mapRunner(offense.second),
    third: mapRunner(offense.third),
  };
}

function mapCount(linescore: Record<string, unknown>, play: unknown): LiveAtBatSnapshot["count"] {
  const offense = (linescore?.offense ?? {}) as Record<string, unknown>;
  let balls = num(offense.balls);
  let strikes = num(offense.strikes);

  if (balls == null || strikes == null) {
    const pitchEvents = ((play as Record<string, unknown>)?.playEvents as unknown[] ?? []).filter(
      (e) => e && typeof e === "object" && (e as Record<string, unknown>).isPitch,
    );
    const last = pitchEvents[pitchEvents.length - 1] as Record<string, unknown> | undefined;
    const count = last?.count as Record<string, unknown> | undefined;
    if (count) {
      balls = num(count.balls) ?? balls;
      strikes = num(count.strikes) ?? strikes;
    }
  }

  return { balls, strikes };
}

function boxscoreLine(box: any, playerId: number | null, kind: "batting" | "pitching"): string | null {
  if (playerId == null) return null;
  for (const side of ["away", "home"]) {
    const player = box?.teams?.[side]?.players?.[`ID${playerId}`];
    const stats = player?.stats?.[kind];
    if (!stats || Object.keys(stats).length === 0) continue;
    if (kind === "batting") {
      const h = num(stats.hits);
      const ab = num(stats.atBats);
      if (h == null || ab == null) return null;
      return `${h}/${ab}`;
    }
    const ip = stats.inningsPitched ?? "0.0";
    const k = num(stats.strikeOuts) ?? 0;
    const er = num(stats.earnedRuns) ?? 0;
    const p = num(stats.numberOfPitches) ?? 0;
    return `${ip} ip, ${k} k, ${er} er, ${p} p`;
  }
  return null;
}

function mapPlay(play: any, box: any): LiveAtBatSnapshot["play"] {
  if (!play) return null;
  const batterId = num(play.matchup?.batter?.id);
  const pitcherId = num(play.matchup?.pitcher?.id);

  const pitches: LiveAtBatPitch[] = (play.playEvents ?? [])
    .filter((e: any) => e?.isPitch)
    .map((e: any, i: number) => ({
      number: i + 1,
      result: String(e.details?.description ?? "Pitch"),
      isInPlay: Boolean(e.details?.isInPlay),
      isStrike: Boolean(e.details?.isStrike),
      isBall: Boolean(e.details?.isBall),
      pitchType: e.details?.type?.description ?? null,
      velo: num(e.pitchData?.startSpeed),
      px: num(e.pitchData?.coordinates?.pX),
      pz: num(e.pitchData?.coordinates?.pZ),
      szTop: num(e.pitchData?.strikeZoneTop),
      szBot: num(e.pitchData?.strikeZoneBottom),
    }));

  const hitEvent = (play.playEvents ?? []).find((e: any) => e?.hitData);
  const hd = hitEvent?.hitData;
  const hit: LiveAtBatHit | null = hd
    ? {
        ev: num(hd.launchSpeed),
        la: num(hd.launchAngle),
        distance: num(hd.totalDistance),
        coordX: num(hd.coordinates?.coordX),
        coordY: num(hd.coordinates?.coordY),
      }
    : null;

  return {
    description: play.result?.description ?? null,
    isComplete: Boolean(play.about?.isComplete),
    batter: {
      id: batterId,
      name: String(play.matchup?.batter?.fullName ?? "Batter"),
      headshot: batterId != null ? headshotUrl(batterId) : null,
      gameLine: boxscoreLine(box, batterId, "batting"),
    },
    pitcher: {
      id: pitcherId,
      name: String(play.matchup?.pitcher?.fullName ?? "Pitcher"),
      gameLine: boxscoreLine(box, pitcherId, "pitching"),
    },
    pitches,
    hit,
  };
}

function rememberLastGood(gamePk: number, snapshot: LiveAtBatSnapshot): void {
  const now = Date.now();
  for (const [key, value] of lastGoodSnapshots.entries()) {
    if (value.expiresAt <= now) lastGoodSnapshots.delete(key);
  }

  lastGoodSnapshots.set(gamePk, { snapshot, expiresAt: now + LAST_GOOD_TTL_MS });
  void persistLastGoodToRedis(gamePk, { snapshot, storedAt: now });

  while (lastGoodSnapshots.size > MAX_LAST_GOOD_SNAPSHOTS) {
    const oldest = lastGoodSnapshots.keys().next().value;
    if (oldest == null) break;
    lastGoodSnapshots.delete(oldest);
  }
}

async function fetchWinProb(gamePk: number): Promise<LiveAtBatSnapshot["winProb"]> {
  try {
    const entries = await sportsFetchJson<any[]>(`${BASE}/v1/game/${gamePk}/winProbability`, {
      cacheKey: `mlb:winprob:${gamePk}`,
      ttlMs: 15_000,
      timeoutMs: 8_000,
      retries: 0,
      debugLabel: "liveAtBat",
    });
    if (!Array.isArray(entries) || entries.length === 0) return null;
    const last = entries[entries.length - 1];
    return {
      homePct: num(last.homeTeamWinProbability) ?? 50,
      awayPct: num(last.awayTeamWinProbability) ?? 50,
      lastSwingHomePct: num(last.homeTeamWinProbabilityAdded) ?? 0,
    };
  } catch (err) {
    console.warn(
      `[liveAtBat] winProbability failed gamePk=${gamePk}:`,
      err instanceof Error ? err.message : String(err),
    );
    return null; // win prob is enrichment — never block the snapshot on it
  }
}

export async function getLiveAtBat(gamePk: number): Promise<LiveAtBatSnapshot | null> {
  try {
    const shared = await getSharedGameFeed(gamePk);
    const feed = shared.feed;
    if (!feed) return resolveLastGoodSnapshot(gamePk);

    const linescore = feed.liveData?.linescore ?? {};
    const box = feed.liveData?.boxscore;
    const allPlays: any[] = feed.liveData?.plays?.allPlays ?? [];
    const currentPlay = feed.liveData?.plays?.currentPlay;

    const withPitches = (p: any) => (p?.playEvents ?? []).some((e: any) => e?.isPitch);
    const play = withPitches(currentPlay)
      ? currentPlay
      : [...allPlays].reverse().find(withPitches) ?? null;

    const teamMeta = (side: "away" | "home") => ({
      teamId: num(feed.gameData?.teams?.[side]?.id),
      abbr: String(feed.gameData?.teams?.[side]?.abbreviation ?? (side === "away" ? "AWY" : "HOM")),
      runs: num(linescore.teams?.[side]?.runs),
    });

    const snapshot: LiveAtBatSnapshot = {
      gamePk,
      status: shared.score.status,
      inning: shared.score.inning,
      halfInning: shared.score.halfInning,
      outs: shared.score.outs,
      count: mapCount(linescore, play),
      runners: mapRunners(linescore),
      away: teamMeta("away"),
      home: teamMeta("home"),
      winProb: await fetchWinProb(gamePk),
      play: mapPlay(play, box),
      updatedAt: shared.asOf,
    };

    rememberLastGood(gamePk, snapshot);
    return snapshot;
  } catch (error) {
    const lastGood = await resolveLastGoodSnapshot(gamePk);
    if (lastGood) {
      console.warn(`[liveAtBat] serving last-good snapshot gamePk=${gamePk}:`, (error as Error).message);
      return lastGood;
    }

    throw error;
  }
}
