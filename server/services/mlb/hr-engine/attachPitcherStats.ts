import type { HrEligibleHitter, HrPitcherStats } from "./hrEngineTypes";
import { sportsFetchJson } from "../../../lib/sports/sportsHttpClient";

const MLB_API = "https://statsapi.mlb.com/api/v1";

async function fetchJson(url: string) {
  return sportsFetchJson<any>(url, {
    cacheKey: `mlb:hr-engine:pitcher-stats:${url}`,
    ttlMs: 15 * 60_000,
    timeoutMs: 8_000,
    retries: 1,
    debugLabel: "hrEnginePitcherStats",
  });
}

function toNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function parseInnings(value: unknown) {
  const raw = String(value ?? "0");
  const [whole, partial] = raw.split(".");
  const outs = Number(whole) * 3 + Number(partial ?? 0);
  return outs > 0 ? outs / 3 : 0;
}

function buildPitcherStats(raw: any): HrPitcherStats {
  const inningsPitched = parseInnings(raw?.inningsPitched);
  const homeRunsAllowed = toNumber(raw?.homeRuns);
  const walks = toNumber(raw?.baseOnBalls);
  const strikeOuts = toNumber(raw?.strikeOuts);

  return {
    gamesPlayed: toNumber(raw?.gamesPlayed),
    gamesStarted: toNumber(raw?.gamesStarted),
    inningsPitched,
    homeRunsAllowed,
    walks,
    strikeOuts,
    earnedRuns: toNumber(raw?.earnedRuns),
    era: toNumber(raw?.era),
    whip: toNumber(raw?.whip),
    hr9: inningsPitched > 0 ? (homeRunsAllowed * 9) / inningsPitched : 0,
    k9: inningsPitched > 0 ? (strikeOuts * 9) / inningsPitched : 0,
    bb9: inningsPitched > 0 ? (walks * 9) / inningsPitched : 0,
  };
}

async function fetchSeasonPitchingStats(playerId: number, season: string): Promise<HrPitcherStats | null> {
  const url =
    `${MLB_API}/people/${playerId}/stats?stats=season&group=pitching&season=${season}`;

  const data: any = await fetchJson(url);
  const split = data?.stats?.[0]?.splits?.[0];

  if (!split?.stat) {
    return null;
  }

  return buildPitcherStats(split.stat);
}

export async function attachPitcherStats(hitters: HrEligibleHitter[], season: string) {
  const warnings: string[] = [];
  const cache = new Map<number, HrPitcherStats | null>();

  const enriched = await Promise.all(
    hitters.map(async (hitter) => {
      const pitcherId = hitter.opponentPitcherId;

      if (!pitcherId) {
        warnings.push(`${hitter.playerName}: opposing pitcher id missing`);
        return hitter;
      }

      try {
        if (!cache.has(pitcherId)) {
          cache.set(pitcherId, await fetchSeasonPitchingStats(pitcherId, season));
        }

        const opponentPitcherStats = cache.get(pitcherId) ?? undefined;

        if (!opponentPitcherStats) {
          warnings.push(`${hitter.opponentPitcherName ?? pitcherId}: no season pitching stats`);
        }

        return {
          ...hitter,
          opponentPitcherStats,
        };
      } catch (error: any) {
        warnings.push(
          `${hitter.opponentPitcherName ?? pitcherId}: ${error?.message ?? "pitching stats unavailable"}`
        );
        return hitter;
      }
    })
  );

  return {
    hitters: enriched,
    warnings,
  };
}
