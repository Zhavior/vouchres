/**
 * Typed client for the VouchEdge backend. The frontend calls these — never the
 * Gemini/MLB providers directly — so keys and heavy logic stay server-side.
 */
import type {
  DailyMlbReport,
  ApiGame,
  VulnerablePitcher,
  HrTarget,
  SneakyHrTarget,
  RunEnvironment,
} from "../types/mlb";
import type { CapperAgent, JudgeAgent, AgentPicksResponse } from "../types/agents";
import type { JudgeVerdict, PickCandidate } from "../types/judging";
import type { TrustScore, VerifiedRecord } from "../types/trust";
import type { PickRecord, LearningNote } from "../types/results";
import type { HrBoardResponse, HrBoardRow } from "../types/hrBoard";
import type { HrFeedResponse } from "../types/notifications";
import type { MatchupsResponse, GameMatchup } from "../types/matchup";
import { dailyReportDirect, hrBoardDirect, matchupsDirect } from "../lib/mlbDirect";
import { apiUrl } from "../lib/apiBase";

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(apiUrl(url));
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  return (await res.json()) as T;
}

/** Try the backend, fall back to a direct-statsapi client build (real data, no mock). */
async function withFallback<T>(primary: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
  try {
    return await primary();
  } catch {
    return await fallback();
  }
}
async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(apiUrl(url), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${url} -> ${res.status}`);
  return (await res.json()) as T;
}

export const vouchedgeApi = {
  // MLB
  todayGames: () => getJson<{ date: string; games: ApiGame[] }>("/api/mlb/games/today"),
  gamesByDate: (date: string) => getJson<{ date: string; games: ApiGame[] }>(`/api/mlb/games/date/${date}`),
  dailyReport: (date?: string) =>
    withFallback(
      () => getJson<DailyMlbReport>(`/api/mlb/reports/daily${date ? `?date=${date}` : ""}`),
      () => dailyReportDirect(date)
    ),
  vulnerablePitchers: () => getJson<{ report: VulnerablePitcher[] }>("/api/mlb/reports/vulnerable-pitchers"),
  hrTargets: () => getJson<{ targets: HrTarget[] }>("/api/mlb/reports/hr-targets"),
  sneakyHr: () => getJson<{ sneaky: SneakyHrTarget[] }>("/api/mlb/reports/sneaky-hr"),
  runEnvironments: () => getJson<{ environments: RunEnvironment[] }>("/api/mlb/reports/run-environments"),

  // Agents
  agents: () => getJson<{ cappers: CapperAgent[]; judges: JudgeAgent[] }>("/api/agents"),
  generatePicks: (agentId: string, date?: string) =>
    postJson<AgentPicksResponse>(`/api/agents/${agentId}/generate-picks`, { date }),

  // Judges
  judgePick: (pick: PickCandidate) => postJson<{ verdict: JudgeVerdict }>("/api/judge/pick", { pick }),
  judgeParlay: (pick: PickCandidate) => postJson<{ verdict: JudgeVerdict }>("/api/judge/parlay", { pick }),

  // AI
  explainPick: (pick: PickCandidate) =>
    postJson<{ explanation: string; confidenceReason: string; riskWarning: string; judgeSummary: string; verdict: JudgeVerdict; source: string }>(
      "/api/ai/explain-pick",
      { pick }
    ),
  aiDailyReport: (date?: string) =>
    postJson<{ date: string; gameCount: number; narrative: string; source: string; data: DailyMlbReport }>(
      "/api/ai/daily-report",
      { date }
    ),

  // Live HR notification feed
  hrFeedToday: () => getJson<HrFeedResponse>("/api/mlb/hr-feed/today"),

  // Live Games matchups
  matchupsToday: () => withFallback(() => getJson<MatchupsResponse>("/api/mlb/matchups/today"), () => matchupsDirect()),
  matchup: (gamePk: number) => getJson<{ matchup: GameMatchup }>(`/api/mlb/matchup/${gamePk}`),

  // Daily HR Board
  hrBoardToday: (previewLimit?: number) =>
    withFallback(
      () => getJson<HrBoardResponse>(`/api/mlb/hr-board/today${previewLimit ? `?previewLimit=${previewLimit}` : ""}`),
      () => hrBoardDirect()
    ),
  hrBoardByDate: (date: string, previewLimit?: number) =>
    getJson<HrBoardResponse>(`/api/mlb/hr-board/date/${date}${previewLimit ? `?previewLimit=${previewLimit}` : ""}`),
  hrBoardPlayer: (playerId: number, date?: string) =>
    getJson<{ player: HrBoardRow }>(`/api/mlb/hr-board/player/${playerId}${date ? `?date=${date}` : ""}`),

  // Trust + results
  userTrust: (userId: string) => getJson<TrustScore>(`/api/trust/user/${userId}`),
  capperTrust: (capperId: string) =>
    getJson<{ trust: TrustScore; verifiedRecord: VerifiedRecord }>(`/api/trust/capper/${capperId}`),
  resultLedger: (capperId?: string) =>
    getJson<{ picks: PickRecord[] }>(`/api/results/ledger${capperId ? `?capperId=${capperId}` : ""}`),
  gradeResult: (pickId: string, result: "win" | "loss" | "push", whatActuallyHappened?: string) =>
    postJson<{ pick: PickRecord; learningNote: LearningNote; capperTrust: TrustScore }>("/api/results/grade", {
      pickId,
      result,
      whatActuallyHappened,
    }),
};
