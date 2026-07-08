import { getSportsHttpStats } from "../../lib/sports/sportsHttpClient";
import { scheduleCache } from "./mlbCache";
import { getLiveGames } from "./liveGamesService";
import { getScheduleByDate, todayISO } from "./mlbClient";
import { isMlbFinalStatusText, isMlbLiveStatus } from "./gameStatus";

type MlbHealthStatus = "ok" | "degraded" | "down";

export interface MlbHealthReport {
  ok: boolean;
  status: MlbHealthStatus;
  service: "mlb";
  date: string;
  dependency: {
    name: "MLB Stats API";
    reachable: boolean;
    baseUrl: string;
  };
  consistency: {
    scheduleGames: number;
    liveGames: number;
    finalGames: number;
    liveEndpointGames: number;
    liveEndpointLiveGames: number;
    liveCountsAgree: boolean;
  };
  cache: {
    schedule: ReturnType<typeof scheduleCache.getStats>;
    sportsHttp: ReturnType<typeof getSportsHttpStats>;
  };
  dataQuality: "official_mlb_schedule" | "degraded_empty_schedule";
  warnings: string[];
  info: string[];
  updatedAt: string;
}

const MLB_BASE = (process.env.MLB_API_BASE_URL || "https://statsapi.mlb.com/api").replace(/\/$/, "");

export async function getMlbHealthReport(date = todayISO(), now = new Date()): Promise<MlbHealthReport> {
  const warnings: string[] = [];
  const info: string[] = [];
  const [scheduleResult, liveResult] = await Promise.allSettled([
    getScheduleByDate(date),
    getLiveGames(date),
  ]);

  const scheduleGames = scheduleResult.status === "fulfilled" ? scheduleResult.value : [];
  if (scheduleResult.status === "rejected") {
    warnings.push(`Schedule check failed: ${scheduleResult.reason instanceof Error ? scheduleResult.reason.message : "unknown error"}`);
  }

  const liveResponse = liveResult.status === "fulfilled" ? liveResult.value : null;
  if (liveResult.status === "rejected") {
    warnings.push(`Live endpoint check failed: ${liveResult.reason instanceof Error ? liveResult.reason.message : "unknown error"}`);
  }

  if (liveResponse?.warnings?.length) {
    for (const warning of liveResponse.warnings) {
      if (warning.includes("Probability fields are unavailable")) {
        info.push(warning);
      } else {
        warnings.push(warning);
      }
    }
  }

  const liveGames = scheduleGames.filter((game) => isMlbLiveStatus(game.status)).length;
  const finalGames = scheduleGames.filter((game) => isMlbFinalStatusText(game.status)).length;
  const liveEndpointGames = liveResponse?.games.length ?? 0;
  const liveEndpointLiveGames = liveResponse?.games.filter((game) => game.isLive).length ?? 0;
  const liveCountsAgree = liveGames === liveEndpointLiveGames;

  if (!liveCountsAgree) {
    warnings.push(`Live count mismatch: schedule=${liveGames}, liveEndpoint=${liveEndpointLiveGames}.`);
  }

  const dependencyReachable = scheduleResult.status === "fulfilled" || liveResult.status === "fulfilled";
  const hasOfficialGames = scheduleGames.length > 0 || liveEndpointGames > 0;
  const status: MlbHealthStatus = !dependencyReachable
    ? "down"
    : warnings.length > 0 || !hasOfficialGames || !liveCountsAgree
      ? "degraded"
      : "ok";

  return {
    ok: status !== "down",
    status,
    service: "mlb",
    date,
    dependency: {
      name: "MLB Stats API",
      reachable: dependencyReachable,
      baseUrl: MLB_BASE,
    },
    consistency: {
      scheduleGames: scheduleGames.length,
      liveGames,
      finalGames,
      liveEndpointGames,
      liveEndpointLiveGames,
      liveCountsAgree,
    },
    cache: {
      schedule: scheduleCache.getStats(),
      sportsHttp: getSportsHttpStats(),
    },
    dataQuality: hasOfficialGames ? "official_mlb_schedule" : "degraded_empty_schedule",
    warnings,
    info,
    updatedAt: now.toISOString(),
  };
}
