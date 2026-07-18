/**
 * Real season Statcast batter quality from Baseball Savant public CSV
 * leaderboards (no API key). Two sources joined by player_id:
 *
 *   - expected_statistics → xBA / xSLG / xwOBA (est_ba / est_slg / est_woba)
 *   - statcast            → barrel % (brl_percent), hard-hit % (ev95percent),
 *                           average exit velocity (avg_hit_speed)
 *
 * Truth rules:
 *   - SEASON-level quality, not a rolling window — consumers must label it so.
 *   - Players under the leaderboard PA threshold are simply absent → null.
 *     Nothing is estimated for them.
 *   - Feed failure → null, cached briefly, never synthesized.
 */
import { TTLCache } from "../../lib/cache";
import { sportsFetchText } from "../../lib/sports/sportsHttpClient";

export interface StatcastBatterQuality {
  playerId: number;
  pa: number | null;
  ba: number | null;
  xba: number | null;
  slg: number | null;
  xslg: number | null;
  woba: number | null;
  xwoba: number | null;
  barrelPct: number | null;
  hardHitPct: number | null;
  avgExitVelo: number | null;
}

const MIN_PA = 25;
const statcastCache = new TTLCache<unknown>(12 * 60 * 60_000, "mlb:statcast");

type StatcastBatterMap = Record<number, StatcastBatterQuality>;

const statcastBatterInflight = new Map<
  number,
  Promise<StatcastBatterMap>
>();

/** Minimal CSV line parser that respects double-quoted fields ("Last, First"). */
function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

function parseCsv(text: string): Array<Record<string, string>> {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cells = parseCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = cells[i] ?? "";
    });
    return row;
  });
}

function num(value: string | undefined): number | null {
  if (value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

async function fetchCsv(url: string): Promise<Array<Record<string, string>>> {
  const text = await sportsFetchText(url, {
    cacheKey: `statcast:csv:${url}`,
    ttlMs: 12 * 60 * 60_000,
    timeoutMs: 20_000,
    retries: 1,
    debugLabel: "statcastClient",
  });
  return parseCsv(text);
}

function seasonYear(): number {
  return new Date().getUTCFullYear();
}

/** Season Statcast quality for all qualified batters (>= MIN_PA), keyed by MLB player id.
 *  Success is cached 12h (daily data); a failed fetch caches an empty map for
 *  30 minutes so we retry soon without hammering Savant. */
export async function getStatcastBatterMap(
  year = seasonYear(),
): Promise<StatcastBatterMap> {
  const cacheKey = `batters:${year}`;
  const cached = statcastCache.get(cacheKey);

  if (cached !== undefined) {
    return cached as StatcastBatterMap;
  }

  const existingRequest = statcastBatterInflight.get(year);

  if (existingRequest) {
    console.log(`[statcastClient] awaiting in-flight batter map for ${year}`);
    return existingRequest;
  }

  const request = (async (): Promise<StatcastBatterMap> => {
    try {
      const [expected, statcast] = await Promise.all([
        fetchCsv(
          `https://baseballsavant.mlb.com/leaderboard/expected_statistics?type=batter&year=${year}&position=&team=&min=${MIN_PA}&csv=true`,
        ),
        fetchCsv(
          `https://baseballsavant.mlb.com/leaderboard/statcast?type=batter&year=${year}&min=${MIN_PA}&csv=true`,
        ),
      ]);

      const map: StatcastBatterMap = {};

      for (const row of expected) {
        const playerId = num(row.player_id);
        if (!playerId) continue;

        map[playerId] = {
          playerId,
          pa: num(row.pa),
          ba: num(row.ba),
          xba: num(row.est_ba),
          slg: num(row.slg),
          xslg: num(row.est_slg),
          woba: num(row.woba),
          xwoba: num(row.est_woba),
          barrelPct: null,
          hardHitPct: null,
          avgExitVelo: null,
        };
      }

      for (const row of statcast) {
        const playerId = num(row.player_id);
        if (!playerId) continue;

        const existing = map[playerId] ?? {
          playerId,
          pa: null,
          ba: null,
          xba: null,
          slg: null,
          xslg: null,
          woba: null,
          xwoba: null,
          barrelPct: null,
          hardHitPct: null,
          avgExitVelo: null,
        };

        existing.barrelPct = num(row.brl_percent);
        existing.hardHitPct = num(row.ev95percent);
        existing.avgExitVelo = num(row.avg_hit_speed);
        map[playerId] = existing;
      }

      statcastCache.set(cacheKey, map);
      console.log(
        `[statcastClient] loaded ${Object.keys(map).length} batters for ${year}`,
      );

      return map;
    } catch (err) {
      console.warn(
        "[statcastClient] leaderboard fetch failed:",
        err instanceof Error ? err.message : String(err),
      );

      const emptyMap: StatcastBatterMap = {};
      statcastCache.set(cacheKey, emptyMap, 30 * 60_000);
      return emptyMap;
    } finally {
      statcastBatterInflight.delete(year);
    }
  })();

  statcastBatterInflight.set(year, request);
  return request;
}

export const STATCAST_MIN_PA = MIN_PA;

export interface StatcastBattedBallProfile {
  playerId: number;
  bbe: number | null;
  pullPct: number | null;
  straightPct: number | null;
  oppoPct: number | null;
  gbPct: number | null;
  fbPct: number | null;
  ldPct: number | null;
  pullAirPct: number | null;
}

export interface StatcastPlateDiscipline {
  playerId: number;
  chasePct: number | null;
  whiffPct: number | null;
  kPct: number | null;
  bbPct: number | null;
}

export interface StatcastPitchMixRow {
  pitchType: string;
  pitchName: string;
  pitchUsage: number | null;
  woba: number | null;
  xwoba: number | null;
  whiffPct: number | null;
  hardHitPct: number | null;
  pitches: number | null;
}

/** Season spray / batted-ball direction from Savant Batted Ball Profile leaderboard. */
export async function getBattedBallProfileMap(
  year = seasonYear(),
): Promise<Record<number, StatcastBattedBallProfile>> {
  const cacheKey = `battedBall:${year}`;
  const cached = statcastCache.get(cacheKey);
  if (cached !== undefined) return cached as Record<number, StatcastBattedBallProfile>;

  try {
    const rows = await fetchCsv(
      `https://baseballsavant.mlb.com/leaderboard/batted-ball?type=batter&seasonStart=${year}&seasonEnd=${year}&gameType=Regular&minSwings=q&minGroupSwings=1&csv=true`,
    );
    const map: Record<number, StatcastBattedBallProfile> = {};
    for (const row of rows) {
      const playerId = num(row.id) ?? num(row.player_id);
      if (!playerId) continue;
      map[playerId] = {
        playerId,
        bbe: num(row.bbe),
        pullPct: pct(row.pull_rate),
        straightPct: pct(row.straight_rate),
        oppoPct: pct(row.oppo_rate),
        gbPct: pct(row.gb_rate),
        fbPct: pct(row.fb_rate),
        ldPct: pct(row.ld_rate),
        pullAirPct: pct(row.pull_air_rate),
      };
    }
    statcastCache.set(cacheKey, map);
    return map;
  } catch (err) {
    console.warn("[statcastClient] batted-ball fetch failed:", (err as Error).message);
    statcastCache.set(cacheKey, {}, 30 * 60_000);
    return {};
  }
}

/** Season plate discipline from Savant Percentile Rankings (raw values, not percentiles). */
export async function getPlateDisciplineMap(
  year = seasonYear(),
): Promise<Record<number, StatcastPlateDiscipline>> {
  const cacheKey = `plateDiscipline:${year}`;
  const cached = statcastCache.get(cacheKey);
  if (cached !== undefined) return cached as Record<number, StatcastPlateDiscipline>;

  try {
    const rows = await fetchCsv(
      `https://baseballsavant.mlb.com/leaderboard/percentile-rankings?type=batter&year=${year}&csv=true`,
    );
    const map: Record<number, StatcastPlateDiscipline> = {};
    for (const row of rows) {
      const playerId = num(row.player_id);
      if (!playerId) continue;
      map[playerId] = {
        playerId,
        chasePct: num(row.chase_percent),
        whiffPct: num(row.whiff_percent),
        kPct: num(row.k_percent),
        bbPct: num(row.bb_percent),
      };
    }
    statcastCache.set(cacheKey, map);
    return map;
  } catch (err) {
    console.warn("[statcastClient] plate-discipline fetch failed:", (err as Error).message);
    statcastCache.set(cacheKey, {}, 30 * 60_000);
    return {};
  }
}

/** Season pitch-type breakdown per batter from Savant Pitch Arsenal Stats. */
export async function getPitchMixMap(
  year = seasonYear(),
): Promise<Record<number, StatcastPitchMixRow[]>> {
  const cacheKey = `pitchMix:${year}`;
  const cached = statcastCache.get(cacheKey);
  if (cached !== undefined) return cached as Record<number, StatcastPitchMixRow[]>;

  try {
    const rows = await fetchCsv(
      `https://baseballsavant.mlb.com/leaderboard/pitch-arsenal-stats?type=batter&year=${year}&min=${MIN_PA}&csv=true`,
    );
    const map: Record<number, StatcastPitchMixRow[]> = {};
    for (const row of rows) {
      const playerId = num(row.player_id);
      if (!playerId) continue;
      const entry: StatcastPitchMixRow = {
        pitchType: String(row.pitch_type ?? "").trim(),
        pitchName: String(row.pitch_name ?? row.pitch_type ?? "Unknown").trim(),
        pitchUsage: num(row.pitch_usage),
        woba: num(row.woba),
        xwoba: num(row.est_woba) ?? num(row.woba),
        whiffPct: num(row.whiff_percent),
        hardHitPct: num(row.hard_hit_percent),
        pitches: num(row.pitches),
      };
      if (!map[playerId]) map[playerId] = [];
      map[playerId].push(entry);
    }
    for (const playerId of Object.keys(map)) {
      map[Number(playerId)].sort((a, b) => (b.pitchUsage ?? 0) - (a.pitchUsage ?? 0));
    }
    statcastCache.set(cacheKey, map);
    return map;
  } catch (err) {
    console.warn("[statcastClient] pitch-mix fetch failed:", (err as Error).message);
    statcastCache.set(cacheKey, {}, 30 * 60_000);
    return {};
  }
}

/** Convert 0–1 rate fields to 0–100 display percentages. */
function pct(value: string | undefined): number | null {
  const n = num(value);
  if (n == null) return null;
  return n <= 1 ? n * 100 : n;
}
