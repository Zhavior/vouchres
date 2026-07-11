import { sportsFetchJson } from "../../lib/sports/sportsHttpClient";

const MLB_API = process.env.MLB_API_BASE_URL ?? "https://statsapi.mlb.com/api";

const MARKET_STAT_MAP: Record<string, { side: "batting" | "pitching"; stat: string }> = {
  ANYTIME_HR: { side: "batting", stat: "homeRuns" },
  HR: { side: "batting", stat: "homeRuns" },
  HOME_RUN: { side: "batting", stat: "homeRuns" },
  RUN: { side: "batting", stat: "runs" },
  HIT: { side: "batting", stat: "hits" },
  RBI: { side: "batting", stat: "rbi" },
  TOTAL_BASES: { side: "batting", stat: "totalBases" },
  STRIKEOUTS: { side: "pitching", stat: "strikeOuts" },
  PITCHER_OUTS: { side: "pitching", stat: "outsRecorded" },
  STOLEN_BASE: { side: "batting", stat: "stolenBases" },
};

function readPitcherOuts(bucket: Record<string, unknown>): number {
  if (typeof bucket.outs === "number") return bucket.outs;
  if (typeof bucket.inningsPitched === "string") {
    const [whole, frac = "0"] = bucket.inningsPitched.split(".");
    const outs = Number(whole) * 3 + Number(frac);
    return Number.isFinite(outs) ? outs : 0;
  }
  return 0;
}

export type ParlayLegProgressRequest = {
  id?: string;
  gamePk: string;
  playerId: string | number;
  marketCode?: string | null;
  statTarget?: number | null;
};

export type ParlayLegProgressResult = {
  id?: string;
  current: number | null;
  target: number;
  label: string;
  gameStatus?: string | null;
};

function playerKey(playerId: string | number): string {
  const raw = String(playerId).replace(/^ID/i, "");
  return `ID${raw}`;
}

function readPlayerStat(boxscore: any, playerId: string | number, marketCode: string): number | null {
  const mapping = MARKET_STAT_MAP[String(marketCode).toUpperCase()];
  if (!mapping || !boxscore?.teams) return null;

  for (const side of ["away", "home"]) {
    const player = boxscore.teams[side]?.players?.[playerKey(playerId)];
    if (!player) continue;
    const bucket = player.stats?.[mapping.side];
    if (!bucket) return 0;
    if (mapping.stat === "outsRecorded") return readPitcherOuts(bucket);
    const value = bucket[mapping.stat];
    return typeof value === "number" ? value : 0;
  }
  return null;
}

function progressLabel(marketCode: string): string {
  const code = String(marketCode).toUpperCase();
  if (code.includes("HR")) return "Home runs";
  if (code === "RUN") return "Runs";
  if (code === "HIT") return "Hits";
  if (code === "RBI") return "RBI";
  if (code === "TOTAL_BASES") return "Total bases";
  if (code === "STRIKEOUTS") return "Strikeouts";
  if (code === "PITCHER_OUTS") return "Outs";
  if (code === "STOLEN_BASE") return "Stolen bases";
  return "Progress";
}

export async function fetchParlayLegProgressBatch(
  legs: ParlayLegProgressRequest[],
): Promise<ParlayLegProgressResult[]> {
  const byGame = new Map<string, ParlayLegProgressRequest[]>();
  for (const leg of legs) {
    const gamePk = String(leg.gamePk ?? "").trim();
    if (!gamePk || !leg.playerId) continue;
    const bucket = byGame.get(gamePk) ?? [];
    bucket.push(leg);
    byGame.set(gamePk, bucket);
  }

  const results: ParlayLegProgressResult[] = [];

  for (const [gamePk, gameLegs] of byGame.entries()) {
    let boxscore: any = null;
    let gameStatus: string | null = null;
    try {
      const [linescore, box] = await Promise.all([
        sportsFetchJson<any>(`${MLB_API}/v1/game/${gamePk}/linescore`, {
          cacheKey: `live-progress:linescore:${gamePk}`,
          ttlMs: 15_000,
          timeoutMs: 8_000,
          retries: 1,
          debugLabel: "parlayLiveProgress",
        }),
        sportsFetchJson<any>(`${MLB_API}/v1/game/${gamePk}/boxscore`, {
          cacheKey: `live-progress:boxscore:${gamePk}`,
          ttlMs: 15_000,
          timeoutMs: 10_000,
          retries: 1,
          debugLabel: "parlayLiveProgress",
        }),
      ]);
      boxscore = box;
      gameStatus = String(linescore?.status?.detailedState ?? linescore?.status ?? "");
    } catch {
      boxscore = null;
    }

    for (const leg of gameLegs) {
      const target = Number(leg.statTarget ?? 1);
      const marketCode = String(leg.marketCode ?? "ANYTIME_HR");
      const current = boxscore ? readPlayerStat(boxscore, leg.playerId, marketCode) : null;
      results.push({
        id: leg.id,
        current,
        target: Number.isFinite(target) && target > 0 ? target : 1,
        label: progressLabel(marketCode),
        gameStatus,
      });
    }
  }

  return results;
}
