import type { HrEligibleHitter, HrRecentForm } from "./hrEngineTypes";
import { sportsFetchJson } from "../../../lib/sports/sportsHttpClient";

const MLB_API = "https://statsapi.mlb.com/api/v1";

async function fetchJson(url: string) {
  return sportsFetchJson<any>(url, {
    cacheKey: `mlb:hr-engine:recent-hitter-form:${url}`,
    ttlMs: 15 * 60_000,
    timeoutMs: 8_000,
    retries: 1,
    debugLabel: "hrEngineRecentHitterForm",
  });
}

function toNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function getGameLogDate(game: any) {
  return String(
    game?.date ??
      game?.gameDate ??
      game?.officialDate ??
      game?.game?.officialDate ??
      game?.gameDate ??
      ""
  );
}

function calculateRecentForm(games: any[]): HrRecentForm {
  let atBats = 0;
  let hits = 0;
  let homeRuns = 0;
  let doubles = 0;
  let triples = 0;
  let totalBases = 0;

  for (const game of games) {
    const stat = game?.stat ?? {};

    const ab = toNumber(stat.atBats);
    const h = toNumber(stat.hits);
    const hr = toNumber(stat.homeRuns);
    const twoB = toNumber(stat.doubles);
    const threeB = toNumber(stat.triples);

    atBats += ab;
    hits += h;
    homeRuns += hr;
    doubles += twoB;
    triples += threeB;

    const singles = Math.max(0, h - twoB - threeB - hr);
    totalBases += singles + twoB * 2 + threeB * 3 + hr * 4;
  }

  const extraBaseHits = homeRuns + doubles + triples;
  const slugging = atBats > 0 ? totalBases / atBats : 0;
  const recentHrRate = atBats > 0 ? homeRuns / atBats : 0;

  let recentPowerScore = 45;
  recentPowerScore += Math.min(20, homeRuns * 5);
  recentPowerScore += Math.min(12, extraBaseHits * 2.2);
  recentPowerScore += Math.min(10, Math.max(0, slugging - 0.38) * 28);
  recentPowerScore += Math.min(8, recentHrRate * 250);

  if (atBats > 0 && atBats < 20) {
    recentPowerScore -= 8;
  }

  return {
    gamesChecked: games.length,
    atBats,
    hits,
    homeRuns,
    doubles,
    triples,
    extraBaseHits,
    totalBases,
    slugging,
    recentHrRate,
    recentPowerScore: Math.max(30, Math.min(88, Math.round(recentPowerScore))),
  };
}

async function fetchRecentGameLog(playerId: number, season: string) {
  const url =
    `${MLB_API}/people/${playerId}/stats?stats=gameLog&group=hitting&season=${season}`;

  const data: any = await fetchJson(url);
  const splits = data?.stats?.[0]?.splits ?? [];

  return [...splits]
    .sort((a, b) => {
      const aDate = getGameLogDate(a);
      const bDate = getGameLogDate(b);

      if (aDate && bDate && aDate !== bDate) {
        return bDate.localeCompare(aDate);
      }

      if (aDate && !bDate) return -1;
      if (!aDate && bDate) return 1;

      return Number(b?.game?.gamePk ?? b?.gamePk ?? 0) - Number(a?.game?.gamePk ?? a?.gamePk ?? 0);
    })
    .slice(0, 15);
}

export async function attachRecentHitterForm(hitters: HrEligibleHitter[], season: string) {
  const warnings: string[] = [];

  const enriched = await Promise.all(
    hitters.map(async (hitter) => {
      try {
        const games = await fetchRecentGameLog(hitter.playerId, season);
        const recentForm = calculateRecentForm(games);

        return {
          ...hitter,
          recentForm,
        };
      } catch (error: any) {
        warnings.push(`${hitter.playerName}: ${error?.message ?? "recent hitter form unavailable"}`);
        return hitter;
      }
    })
  );

  return {
    hitters: enriched,
    warnings,
  };
}
