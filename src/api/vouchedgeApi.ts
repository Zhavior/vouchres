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
import type { LiveAtBatSnapshot } from "../types/liveAtBat";
import type { MatchupsResponse, GameMatchup, LiveScore } from "../types/matchup";
import type { LiveGamesPayload } from "../types/liveGames";
import { dailyReportDirect, liveGamesDirect, matchupsDirect, hrBoardDirect } from "../lib/mlbDirect";
import { apiUrl } from "../lib/apiBase";
import { unwrapApiPayload } from "../lib/apiEnvelope";
import { recordHrBoardCacheControl } from "../lib/hrBoardCache";
import { HR_BOARD_CANONICAL_FETCH_LIMIT } from "../lib/hrBoardSlice";

const CLIENT_FETCH_TIMEOUT_MS = 12_000;

/** Browser-side MLB bypass is dev-only — production must use validated server paths. */
const ALLOW_CLIENT_MLB_FALLBACK = import.meta.env.DEV;

async function getJson<T>(url: string, timeoutMs = CLIENT_FETCH_TIMEOUT_MS): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(apiUrl(url), { signal: controller.signal });
    if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
    if (url.includes("/api/mlb/hr-board/")) {
      recordHrBoardCacheControl(res.headers.get("cache-control"));
    }
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      throw new Error(`GET ${url} -> expected JSON, received ${contentType || "unknown content-type"}`);
    }
    return unwrapApiPayload<T>(await res.json());
  } finally {
    window.clearTimeout(timeout);
  }
}

/** Try the backend; optional direct-statsapi fallback in dev only. */
async function withFallback<T>(primary: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
  try {
    return await primary();
  } catch (err) {
    if (!ALLOW_CLIENT_MLB_FALLBACK) throw err;
    return await fallback();
  }
}

function normalizeDailyReport(raw: any): DailyMlbReport {
  const source = raw?.payload ?? raw?.report ?? raw?.data ?? raw ?? {};

  return {
    ...source,
    date: source.date ?? raw?.date ?? new Date().toISOString().slice(0, 10),
    gameCount: source.gameCount ?? source.games?.length ?? raw?.gameCount ?? 0,
    dataQuality: source.dataQuality ?? raw?.dataQuality ?? raw?.status ?? "limited",
    games: source.games ?? [],
    vulnerablePitchers: source.vulnerablePitchers ?? [],
    hrTargets: source.hrTargets ?? [],
    sneakyHr: source.sneakyHr ?? [],
    runEnvironments: source.runEnvironments ?? [],
  } as DailyMlbReport;
}

function normalizeLiveAtBatSnapshot(raw: LiveAtBatSnapshot | { data?: LiveAtBatSnapshot }): LiveAtBatSnapshot {
  return (raw as { data?: LiveAtBatSnapshot })?.data ?? (raw as LiveAtBatSnapshot);
}

async function hrBoardTodayWithFallback(): Promise<HrBoardResponse> {
  const localPath = `/api/mlb/hr-board/today?previewLimit=${HR_BOARD_CANONICAL_FETCH_LIMIT}`;

  return withFallback(
    () => getJson<HrBoardResponse>(localPath),
    () => hrBoardDirect(),
  );
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(apiUrl(url), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${url} -> ${res.status}`);
  return unwrapApiPayload<T>(await res.json());
}

export const vouchedgeApi = {
  // MLB
  todayGames: () => getJson<{ date: string; games: ApiGame[] }>("/api/mlb/games/today"),
  gamesByDate: (date: string) => getJson<{ date: string; games: ApiGame[] }>(`/api/mlb/games/date/${date}`),
  dailyReport: async (date?: string) => {
    const raw = await withFallback<any>(
      () => getJson<any>(`/api/mlb/reports/daily${date ? `?date=${date}` : ""}`),
      () => dailyReportDirect(date)
    );
    return normalizeDailyReport(raw);
  },
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
  hrFeedByDate: (date: string) => getJson<HrFeedResponse>(`/api/mlb/hr-feed/date/${date}`),

  // Live at-bat pitch-by-pitch snapshot
  liveAtBat: async (gamePk: number) =>
    normalizeLiveAtBatSnapshot(await getJson<LiveAtBatSnapshot | { data: LiveAtBatSnapshot }>(`/api/mlb/live-at-bat/${gamePk}`)),

  // Live Games matchups
  liveGames: () =>
    withFallback(
      () => getJson<LiveGamesPayload>("/api/mlb/live"),
      () => liveGamesDirect(),
    ),
  matchupsToday: () => withFallback(() => getJson<MatchupsResponse>("/api/mlb/matchups/today"), () => matchupsDirect()),
  matchup: (gamePk: number) => getJson<{ matchup: GameMatchup }>(`/api/mlb/matchup/${gamePk}`),
  scoresToday: () => getJson<{ scores: LiveScore[]; updatedAt: string }>("/api/mlb/scores/today"),

  // Daily HR Board
  hrBoardToday: () => hrBoardTodayWithFallback(),
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
