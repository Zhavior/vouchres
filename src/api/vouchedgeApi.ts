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
import type { MarketRadarResponse } from "../types/marketRadar";
import { dailyReportDirect, liveGamesDirect, matchupsDirect, hrBoardDirect } from "../lib/mlbDirect";
import type { LiveGamesDirectPayload } from "../lib/mlbDirect";
import { isMlbDirectFallbackAllowed } from "../lib/mlbGatewayClient";
import { apiUrl } from "../lib/apiBase";
import { parseApiErrorBody, unwrapApiPayload } from "../lib/apiEnvelope";
import { recordHrBoardCacheControl } from "../lib/hrBoardCache";
import { HR_BOARD_CANONICAL_FETCH_LIMIT } from "../lib/hrBoardSlice";
import { parseHrBoardApiResponse } from "./hrBoardApiContract";

const CLIENT_FETCH_TIMEOUT_MS = 12_000;

export class VouchEdgeHttpError extends Error {
  readonly status: number;
  readonly code: string;
  readonly requestId?: string;

  constructor(input: { status: number; code?: string; message?: string; requestId?: string }) {
    super(input.message || `VouchEdge API request failed (${input.status}).`);
    this.name = "VouchEdgeHttpError";
    this.status = input.status;
    this.code = input.code ?? "request_failed";
    this.requestId = input.requestId;
  }
}

async function getJson<T>(url: string, timeoutMs = CLIENT_FETCH_TIMEOUT_MS, signal?: AbortSignal): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  const abortFromCaller = () => controller.abort(signal?.reason);
  if (signal?.aborted) abortFromCaller();
  else signal?.addEventListener("abort", abortFromCaller, { once: true });
  try {
    const res = await fetch(apiUrl(url), { signal: controller.signal });
    if (!res.ok) {
      const errorBody = await res.json().catch(() => null);
      const parsed = parseApiErrorBody(errorBody, res.status);
      throw new VouchEdgeHttpError({
        status: res.status,
        code: typeof parsed.code === "string" ? parsed.code : undefined,
        message: typeof parsed.message === "string" ? parsed.message : `GET ${url} -> ${res.status}`,
        requestId: typeof parsed.requestId === "string" ? parsed.requestId : undefined,
      });
    }
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
    signal?.removeEventListener("abort", abortFromCaller);
  }
}

/** Try the backend; optional direct Stats API fallback (dev / explicit flag only). */
async function withFallback<T>(primary: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
  try {
    return await primary();
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    if (!isMlbDirectFallbackAllowed()) throw err;
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

async function hrBoardTodayWithFallback(
  previewLimit = HR_BOARD_CANONICAL_FETCH_LIMIT,
  signal?: AbortSignal,
): Promise<HrBoardResponse> {
  const localPath = `/api/mlb/hr-board/today?previewLimit=${previewLimit}&compact=1`;

  const response = await withFallback<unknown>(
    () => getJson<unknown>(localPath, CLIENT_FETCH_TIMEOUT_MS, signal),
    () => hrBoardDirect(),
  );
  return parseHrBoardApiResponse(response);
}

function normalizeLiveGamesFallback(raw: LiveGamesDirectPayload): LiveGamesPayload {
  return {
    ...raw,
    games: raw.games.map((game) => ({
      ...game,
      homeAbbr: null,
      awayAbbr: null,
      homeTeamId: null,
      awayTeamId: null,
      inning: null,
      halfInning: null,
      outs: null,
      liveStateLabel: null,
      feedAsOf: null,
    })),
  };
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
  marketRadar: (date?: string) => getJson<MarketRadarResponse>(`/api/market-radar${date ? `?date=${encodeURIComponent(date)}` : ""}`),

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
      () => liveGamesDirect().then(normalizeLiveGamesFallback),
    ),
  matchupsToday: () => withFallback(() => getJson<MatchupsResponse>("/api/mlb/matchups/today"), () => matchupsDirect()),
  matchup: (gamePk: number) => getJson<{ matchup: GameMatchup }>(`/api/mlb/matchup/${gamePk}`),
  scoresToday: () => getJson<{ scores: LiveScore[]; updatedAt: string }>("/api/mlb/scores/today"),

  // Daily HR Board
  hrBoardToday: (previewLimit?: number, signal?: AbortSignal) => hrBoardTodayWithFallback(previewLimit, signal),
  hrBoardByDate: async (date: string, previewLimit?: number, signal?: AbortSignal) =>
    parseHrBoardApiResponse(await getJson<unknown>(
      `/api/mlb/hr-board/date/${date}?compact=1${previewLimit ? `&previewLimit=${previewLimit}` : ""}`,
      CLIENT_FETCH_TIMEOUT_MS,
      signal,
    )),
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
