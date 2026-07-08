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
  const lines = text.replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim().length > 0);
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
export async function getStatcastBatterMap(year = seasonYear()): Promise<Record<number, StatcastBatterQuality>> {
  const cacheKey = `batters:${year}`;
  const cached = statcastCache.get(cacheKey);
  if (cached !== undefined) return cached as Record<number, StatcastBatterQuality>;

  try {
    const [expected, statcast] = await Promise.all([
        fetchCsv(
          `https://baseballsavant.mlb.com/leaderboard/expected_statistics?type=batter&year=${year}&position=&team=&min=${MIN_PA}&csv=true`
        ),
        fetchCsv(
          `https://baseballsavant.mlb.com/leaderboard/statcast?type=batter&year=${year}&min=${MIN_PA}&csv=true`
        ),
      ]);

      const map: Record<number, StatcastBatterQuality> = {};

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

      console.log(`[statcastClient] loaded ${Object.keys(map).length} batters for ${year}`);
      statcastCache.set(cacheKey, map); // success → default 12h TTL
      return map;
  } catch (err) {
    console.warn("[statcastClient] leaderboard fetch failed:", (err as Error).message);
    statcastCache.set(cacheKey, {}, 30 * 60_000); // failure → empty map, retry in 30 min
    return {};
  }
}

export const STATCAST_MIN_PA = MIN_PA;
