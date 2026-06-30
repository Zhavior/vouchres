/**
 * MLB Stats API client for season hitting/pitching stats and recent game logs.
 * All data sourced from statsapi.mlb.com — no synthetic or seeded values.
 * Cached 15 minutes (stats change only after games complete).
 */
import { TTLCache } from "../../lib/cache";

const BASE = (process.env.MLB_API_BASE_URL || "https://statsapi.mlb.com/api").replace(/\/$/, "");
const SEASON = new Date().getFullYear();

export interface HitterSeasonStats {
  homeRuns: number;
  atBats: number;
  plateAppearances: number;
  avg: number;   // batting average (0-1)
  slg: number;   // slugging (0+)
  ops: number;
  hrPerPA: number; // derived: homeRuns / plateAppearances
}

export interface RecentGame {
  date: string;
  homeRuns: number;
  hits: number;
  atBats: number;
  strikeOuts: number;
}

export interface PitcherRecentGame {
  date: string;
  inningsPitched: number;
  strikeOuts: number;
  earnedRuns: number;
  baseOnBalls: number;
}

export interface HitterStats {
  playerId: number;
  season: HitterSeasonStats | null;
  recentGames: RecentGame[]; // last 7 games, newest first
}

export interface PitcherSeasonStats {
  homeRunsPer9: number;
  era: number;
  inningsPitched: number; // as decimal (90.1 -> 90.1)
  strikeOuts: number;
  baseOnBalls: number;
  gamesStarted: number;
  gamesPitched: number;
  whip: number | null;
}

export interface PitcherStats {
  pitcherId: number;
  season: PitcherSeasonStats | null;
  recentGames: PitcherRecentGame[];
}

const hitterCache = new TTLCache<HitterStats>(15 * 60_000);
const pitcherCache = new TTLCache<PitcherStats>(15 * 60_000);

export interface BatterVsPitcher {
  ab: number;
  h: number;
  doubles: number;
  triples: number;
  hr: number;
  bb: number;
  k: number;
  avg: number | null;
  slg: number | null;
  ops: number | null;
  sampleSize: number; // = ab (convenience)
}

const bvpCache = new TTLCache<BatterVsPitcher | null>(60 * 60_000);

/**
 * Career batter-vs-pitcher totals from MLB Stats API (vsPlayerTotal).
 * Returns null when there is no recorded history. Never synthesizes numbers.
 */
export async function getBatterVsPitcher(
  batterId: number,
  pitcherId: number
): Promise<BatterVsPitcher | null> {
  return bvpCache.getOrSet(`bvp:${batterId}:${pitcherId}`, async () => {
    try {
      const data = await fetchJson<any>(
        `${BASE}/v1/people/${batterId}/stats?stats=vsPlayerTotal&opposingPlayerId=${pitcherId}&group=hitting&sportId=1`
      );
      const s = data?.stats?.[0]?.splits?.[0]?.stat;
      if (!s) return null;
      const ab = Number(s.atBats) || 0;
      const num = (v: unknown) => {
        const n = parseFloat(String(v));
        return Number.isFinite(n) ? n : null;
      };
      return {
        ab,
        h: Number(s.hits) || 0,
        doubles: Number(s.doubles) || 0,
        triples: Number(s.triples) || 0,
        hr: Number(s.homeRuns) || 0,
        bb: Number(s.baseOnBalls) || 0,
        k: Number(s.strikeOuts) || 0,
        avg: num(s.avg),
        slg: num(s.slg),
        ops: num(s.ops),
        sampleSize: ab,
      };
    } catch (err) {
      console.warn(`[statsClient] BvP failed ${batterId} vs ${pitcherId}:`, (err as Error).message);
      return null;
    }
  });
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

function parseInnings(value: unknown): number {
  const ipRaw = String(value ?? "0");
  const [wholeRaw, thirdsRaw] = ipRaw.split(".");
  const whole = parseInt(wholeRaw || "0", 10);
  const thirds = parseInt(thirdsRaw || "0", 10);
  return (Number.isFinite(whole) ? whole : 0) + (Number.isFinite(thirds) ? thirds / 3 : 0);
}

export async function getHitterStats(playerId: number): Promise<HitterStats> {
  return hitterCache.getOrSet(`hitter:${playerId}:${SEASON}`, async () => {
    let season: HitterSeasonStats | null = null;
    let recentGames: RecentGame[] = [];

    try {
      const data = await fetchJson<any>(
        `${BASE}/v1/people/${playerId}/stats?stats=season&group=hitting&season=${SEASON}`
      );
      const s = data?.stats?.[0]?.splits?.[0]?.stat;
      if (s) {
        const pa = Number(s.plateAppearances) || 0;
        const hr = Number(s.homeRuns) || 0;
        season = {
          homeRuns: hr,
          atBats: Number(s.atBats) || 0,
          plateAppearances: pa,
          avg: parseFloat(s.avg) || 0,
          slg: parseFloat(s.slg) || 0,
          ops: parseFloat(s.ops) || 0,
          hrPerPA: pa > 0 ? hr / pa : 0,
        };
      }
    } catch (err) {
      console.warn(`[statsClient] hitter season stats failed for ${playerId}:`, (err as Error).message);
    }

    try {
      const data = await fetchJson<any>(
        `${BASE}/v1/people/${playerId}/stats?stats=gameLog&group=hitting&season=${SEASON}&limit=7`
      );
      const splits = data?.stats?.[0]?.splits ?? [];
      recentGames = splits.map((sp: any) => ({
        date: sp.date ?? "",
        homeRuns: Number(sp.stat?.homeRuns) || 0,
        hits: Number(sp.stat?.hits) || 0,
        atBats: Number(sp.stat?.atBats) || 0,
        strikeOuts: Number(sp.stat?.strikeOuts) || 0,
      }));
    } catch (err) {
      console.warn(`[statsClient] hitter game log failed for ${playerId}:`, (err as Error).message);
    }

    return { playerId, season, recentGames };
  });
}

export async function getPitcherStats(pitcherId: number): Promise<PitcherStats> {
  return pitcherCache.getOrSet(`pitcher:${pitcherId}:${SEASON}`, async () => {
    let season: PitcherSeasonStats | null = null;
    let recentGames: PitcherRecentGame[] = [];

    try {
      const data = await fetchJson<any>(
        `${BASE}/v1/people/${pitcherId}/stats?stats=season&group=pitching&season=${SEASON}`
      );
      const s = data?.stats?.[0]?.splits?.[0]?.stat;
      if (s) {
        // homeRunsPer9 may not be returned directly; compute from homeRunsAllowed + IP
        const hrAllowed = Number(s.homeRunsAllowed) || 0;
        const ip = parseInnings(s.inningsPitched);
        const computedHrPer9 = ip > 0 ? (hrAllowed / ip) * 9 : parseFloat(s.homeRunsPer9) || 0;
        const hrPer9 = parseFloat(s.homeRunsPer9) > 0 ? parseFloat(s.homeRunsPer9) : computedHrPer9;

        season = {
          homeRunsPer9: hrPer9,
          era: parseFloat(s.era) || 0,
          inningsPitched: ip,
          strikeOuts: Number(s.strikeOuts) || 0,
          baseOnBalls: Number(s.baseOnBalls) || 0,
          gamesStarted: Number(s.gamesStarted) || 0,
          gamesPitched: Number(s.gamesPitched) || 0,
          whip: Number.isFinite(parseFloat(s.whip)) ? parseFloat(s.whip) : null,
        };
      }
    } catch (err) {
      console.warn(`[statsClient] pitcher stats failed for ${pitcherId}:`, (err as Error).message);
    }

    try {
      const data = await fetchJson<any>(
        `${BASE}/v1/people/${pitcherId}/stats?stats=gameLog&group=pitching&season=${SEASON}&limit=5`
      );
      const splits = data?.stats?.[0]?.splits ?? [];
      recentGames = splits.map((sp: any) => ({
        date: sp.date ?? "",
        inningsPitched: parseInnings(sp.stat?.inningsPitched),
        strikeOuts: Number(sp.stat?.strikeOuts) || 0,
        earnedRuns: Number(sp.stat?.earnedRuns) || 0,
        baseOnBalls: Number(sp.stat?.baseOnBalls) || 0,
      }));
    } catch (err) {
      console.warn(`[statsClient] pitcher game log failed for ${pitcherId}:`, (err as Error).message);
    }

    return { pitcherId, season, recentGames };
  });
}
