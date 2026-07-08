import type { HrEligibleHitter, HrHitterStats } from "./hrEngineTypes.js";

const MLB_API = "https://statsapi.mlb.com/api/v1";

async function fetchJson(url: string) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`MLB fetch failed ${response.status}: ${url}`);
  }

  return response.json();
}

function toNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function buildHitterStats(raw: any): HrHitterStats {
  const atBats = toNumber(raw?.atBats);
  const homeRuns = toNumber(raw?.homeRuns);
  const doubles = toNumber(raw?.doubles);
  const triples = toNumber(raw?.triples);
  const hits = toNumber(raw?.hits);
  const slugging = toNumber(raw?.slg ?? raw?.slugging);
  const ops = toNumber(raw?.ops);
  const avg = toNumber(raw?.avg);

  const hrRate = atBats > 0 ? homeRuns / atBats : 0;
  const extraBaseHits = homeRuns + doubles + triples;
  const isoProxy = atBats > 0 ? extraBaseHits / atBats : 0;

  return {
    gamesPlayed: toNumber(raw?.gamesPlayed),
    atBats,
    plateAppearances: toNumber(raw?.plateAppearances),
    homeRuns,
    doubles,
    triples,
    hits,
    slugging,
    ops,
    avg,
    hrRate,
    isoProxy,
  };
}

async function fetchSeasonHittingStats(playerId: number, season: string): Promise<HrHitterStats | null> {
  const url =
    `${MLB_API}/people/${playerId}/stats?stats=season&group=hitting&season=${season}`;

  const data: any = await fetchJson(url);
  const split = data?.stats?.[0]?.splits?.[0];

  if (!split?.stat) {
    return null;
  }

  return buildHitterStats(split.stat);
}

export async function attachHitterStats(hitters: HrEligibleHitter[], season: string) {
  const warnings: string[] = [];
  const enriched: HrEligibleHitter[] = [];

  await Promise.all(
    hitters.map(async (hitter) => {
      try {
        const hitterStats = await fetchSeasonHittingStats(hitter.playerId, season);

        enriched.push({
          ...hitter,
          hitterStats: hitterStats ?? undefined,
        });

        if (!hitterStats) {
          warnings.push(`${hitter.playerName}: no season hitting stats`);
        }
      } catch (error: any) {
        warnings.push(`${hitter.playerName}: ${error?.message ?? "hitting stats unavailable"}`);
        enriched.push(hitter);
      }
    })
  );

  return {
    hitters: enriched,
    warnings,
  };
}
