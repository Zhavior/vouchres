import { fetchMlbGameLiveState } from "../data/sportsDataGateway";
import { isPlayerNameMatch, extractPlayerName } from "../grading/gradingService";

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
  playerId?: string | number | null;
  selection?: string | null;
  playerName?: string | null;
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

function playerNumericId(playerId: string | number): string {
  return String(playerId).replace(/\D/g, "");
}

function readPlayerStat(
  boxscore: any,
  playerId: string | number | null | undefined,
  selectionOrName: string | null | undefined,
  marketCode: string
): number | null {
  const mapping = MARKET_STAT_MAP[String(marketCode).toUpperCase()];
  if (!mapping || !boxscore?.teams) return null;

  const pIdStr = playerId != null ? playerNumericId(playerId) : "";

  for (const side of ["away", "home"]) {
    const players = boxscore.teams[side]?.players;
    if (!players) continue;

    if (pIdStr) {
      const playerById = players[`ID${pIdStr}`];
      if (playerById) {
        const bucket = playerById.stats?.[mapping.side];
        if (!bucket) return 0;
        if (mapping.stat === "outsRecorded") return readPitcherOuts(bucket);
        const value = bucket[mapping.stat];
        return typeof value === "number" ? value : 0;
      }
    }

    const cleanSelection = selectionOrName ? extractPlayerName(String(selectionOrName), marketCode) : "";
    if (cleanSelection) {
      for (const p of Object.values(players) as any[]) {
        const fullName = String(p?.person?.fullName || p?.name || "");
        if (fullName && isPlayerNameMatch(fullName, cleanSelection)) {
          const bucket = p.stats?.[mapping.side];
          if (!bucket) return 0;
          if (mapping.stat === "outsRecorded") return readPitcherOuts(bucket);
          const value = bucket[mapping.stat];
          return typeof value === "number" ? value : 0;
        }
      }
    }
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
    let hrCountByPlayer: Record<string, number> = {};
    try {
      const liveState = await fetchMlbGameLiveState(gamePk);
      boxscore = liveState.boxscore;
      gameStatus = liveState.gameStatus;
      hrCountByPlayer = liveState.hrCountByPlayer;
    } catch {
      boxscore = null;
    }

    for (const leg of gameLegs) {
      const target = Number(leg.statTarget ?? 1);
      const marketCode = String(leg.marketCode ?? "ANYTIME_HR");
      const code = marketCode.toUpperCase();
      const isHrMarket = code.includes("HR") || code === "HOME_RUN";
      const playerIdKey = leg.playerId ? String(leg.playerId).replace(/\D/g, "") : "";
      const hrFromFeed = isHrMarket && playerIdKey ? hrCountByPlayer[playerIdKey] : undefined;
      const current = hrFromFeed !== undefined
        ? hrFromFeed
        : boxscore
          ? readPlayerStat(boxscore, leg.playerId, leg.selection || leg.playerName, marketCode)
          : null;
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
