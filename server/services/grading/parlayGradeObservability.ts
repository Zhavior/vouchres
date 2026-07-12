import { ZodError } from "zod";
import type { AuthedRequest } from "../../middleware/auth";
import type { RequestWithContext } from "../../middleware/requestContext";
import { structuredLog } from "../../lib/structuredLog";
import {
  PARLAY_GRADE_CONTRACT_VERSION,
  recordParlayGradeMetric,
  type ParlayGradeMetricOutcome,
} from "../../lib/observability/parlayGradeMetrics";
import { GradeParlaySchema } from "../../validators/parlaySchemas";

export const PARLAY_GRADE_ROUTE = "/api/parlays/grade";

export interface SanitizedGradeLegSummary {
  sport?: string;
  gamePk?: string;
  market?: string;
  selectionKey?: string;
  thresholdPresent: boolean;
  oddsPresent: boolean;
}

export interface SanitizedGradePayloadSummary {
  legCount: number;
  stakeUnits?: number;
  sports: string[];
  marketCodes: string[];
  legs: SanitizedGradeLegSummary[];
  hasMissingGamePk: boolean;
  hasMissingMarket: boolean;
  hasMissingSelection: boolean;
}

export type ParlayGradeRequest = RequestWithContext &
  AuthedRequest & {
    parlayGradeSummary?: SanitizedGradePayloadSummary;
    parlayGradeStartedAt?: number;
  };

function cleanText(value: unknown): string {
  return String(value ?? "").trim();
}

function selectionKey(selection: unknown): string {
  const text = cleanText(selection);
  if (!text) return "";
  if (text.length <= 48) return text;
  return `${text.slice(0, 45)}...(${text.length})`;
}

function readLegArray(body: unknown): unknown[] {
  if (!body || typeof body !== "object") return [];
  const legs = (body as { legs?: unknown }).legs;
  return Array.isArray(legs) ? legs : [];
}

function readStakeUnits(body: unknown): number | undefined {
  if (!body || typeof body !== "object") return undefined;
  const raw = (body as { stakeUnits?: unknown; stake_units?: unknown }).stakeUnits
    ?? (body as { stake_units?: unknown }).stake_units;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

function summarizeLeg(raw: unknown): SanitizedGradeLegSummary {
  const leg = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const sport = cleanText(leg.sport).toLowerCase() || undefined;
  const gamePk =
    cleanText(leg.gamePk)
    || cleanText(leg.gameId)
    || cleanText(leg.game_pk)
    || cleanText(leg.game_id)
    || cleanText(leg.eventId)
    || cleanText(leg.event_id)
    || undefined;
  const market =
    cleanText(leg.market)
    || cleanText(leg.marketCode)
    || cleanText(leg.market_code)
    || undefined;
  const selection =
    cleanText(leg.selection)
    || [leg.playerName, leg.marketLabel].filter(Boolean).join(" ").trim()
    || undefined;
  const thresholdPresent =
    leg.threshold != null
    || leg.statTarget != null
    || leg.stat_target != null;
  const oddsPresent =
    leg.oddsDecimal != null
    || leg.odds_decimal != null
    || leg.odds != null;

  return {
    sport,
    gamePk,
    market,
    selectionKey: selectionKey(selection),
    thresholdPresent,
    oddsPresent,
  };
}

export function buildSanitizedGradePayloadSummary(body: unknown): SanitizedGradePayloadSummary {
  const legs = readLegArray(body).map(summarizeLeg);
  const sports = [...new Set(legs.map((leg) => leg.sport).filter(Boolean))] as string[];
  const marketCodes = [...new Set(legs.map((leg) => leg.market).filter(Boolean))] as string[];

  return {
    legCount: legs.length,
    stakeUnits: readStakeUnits(body),
    sports,
    marketCodes,
    legs,
    hasMissingGamePk: legs.some((leg) => !leg.gamePk),
    hasMissingMarket: legs.some((leg) => !leg.market),
    hasMissingSelection: legs.some((leg) => !leg.selectionKey),
  };
}

function actorFields(req: ParlayGradeRequest): Record<string, unknown> {
  const userId = req.user?.id;
  const staffUserId = req.user?.profile?.is_staff ? userId : undefined;
  return {
    ...(userId ? { userId } : {}),
    ...(staffUserId ? { staffUserId } : {}),
  };
}

export function logParlayGradeRequestStarted(
  req: ParlayGradeRequest,
  summary: SanitizedGradePayloadSummary,
): void {
  structuredLog({
    level: "info",
    event: "parlay_grade_request_started",
    requestId: req.requestId,
    method: req.method,
    route: PARLAY_GRADE_ROUTE,
    contractVersion: PARLAY_GRADE_CONTRACT_VERSION,
    legCount: summary.legCount,
    stakeUnits: summary.stakeUnits,
    sports: summary.sports,
    marketCodes: summary.marketCodes,
    payloadSummary: summary,
    ...actorFields(req),
  });
}

export function logParlayGradeValidationFailed(
  req: ParlayGradeRequest,
  summary: SanitizedGradePayloadSummary,
  details: Array<{ path: string; message: string }>,
): void {
  structuredLog({
    level: "warn",
    event: "parlay_grade_validation_failed",
    requestId: req.requestId,
    method: req.method,
    route: PARLAY_GRADE_ROUTE,
    status: 400,
    code: "validation_error",
    failureStage: "request_validation",
    contractVersion: PARLAY_GRADE_CONTRACT_VERSION,
    details,
    payloadSummary: summary,
    ...actorFields(req),
  });

  recordParlayGradeMetric({
    outcome: "validation_error",
    durationMs: Date.now() - (req.parlayGradeStartedAt ?? Date.now()),
    legCount: summary.legCount,
    requestId: req.requestId,
    validationPaths: details.map((detail) => detail.path),
  });
}

export interface ParlayGradeSuccessOutcome {
  legCount: number;
  gradedLegCount: number;
  pendingLegCount: number;
  wonLegCount: number;
  lostLegCount: number;
  voidLegCount: number;
  errorLegCount: number;
  parlayStatus: string;
  dataSources: string[];
  warningCount: number;
}

export function logParlayGradeSucceeded(
  req: ParlayGradeRequest,
  outcome: ParlayGradeSuccessOutcome,
  durationMs: number,
): void {
  structuredLog({
    level: "info",
    event: "parlay_grade_succeeded",
    requestId: req.requestId,
    method: req.method,
    route: PARLAY_GRADE_ROUTE,
    contractVersion: PARLAY_GRADE_CONTRACT_VERSION,
    durationMs: Math.round(durationMs),
    legCount: outcome.legCount,
    gradedLegCount: outcome.gradedLegCount,
    pendingLegCount: outcome.pendingLegCount,
    wonLegCount: outcome.wonLegCount,
    lostLegCount: outcome.lostLegCount,
    voidLegCount: outcome.voidLegCount,
    errorLegCount: outcome.errorLegCount,
    parlayStatus: outcome.parlayStatus,
    dataSources: outcome.dataSources,
    warningCount: outcome.warningCount,
    payloadSummary: req.parlayGradeSummary,
    ...actorFields(req),
  });

  recordParlayGradeMetric({
    outcome: "success",
    durationMs,
    legCount: outcome.legCount,
    gradedLegCount: outcome.gradedLegCount,
    pendingLegCount: outcome.pendingLegCount,
    requestId: req.requestId,
  });
}

export function logParlayGradeFailed(
  req: ParlayGradeRequest,
  input: {
    status: number;
    code: string;
    message: string;
    failureStage: ParlayGradeMetricOutcome;
    upstreamDependency?: string;
    cause?: unknown;
  },
): void {
  const causeMessage =
    input.cause instanceof Error
      ? input.cause.message
      : input.cause != null
        ? String(input.cause)
        : undefined;

  structuredLog({
    level: input.status >= 500 ? "error" : "warn",
    event: "parlay_grade_failed",
    requestId: req.requestId,
    method: req.method,
    route: PARLAY_GRADE_ROUTE,
    status: input.status,
    code: input.code,
    message: input.message,
    failureStage: input.failureStage,
    contractVersion: PARLAY_GRADE_CONTRACT_VERSION,
    payloadSummary: req.parlayGradeSummary,
    ...(input.upstreamDependency ? { upstreamDependency: input.upstreamDependency } : {}),
    ...(causeMessage ? { causeMessage } : {}),
    ...actorFields(req),
  });

  recordParlayGradeMetric({
    outcome: input.failureStage,
    durationMs: Date.now() - (req.parlayGradeStartedAt ?? Date.now()),
    legCount: req.parlayGradeSummary?.legCount ?? 0,
    requestId: req.requestId,
  });
}

export function beginParlayGradeObservability(
  req: ParlayGradeRequest,
  _res: unknown,
  next: (err?: unknown) => void,
): void {
  req.parlayGradeStartedAt = Date.now();
  req.parlayGradeSummary = buildSanitizedGradePayloadSummary(req.body);
  logParlayGradeRequestStarted(req, req.parlayGradeSummary);
  next();
}

export function validateParlayGradeBody(
  req: ParlayGradeRequest,
  _res: unknown,
  next: (err?: unknown) => void,
): void {
  const summary = req.parlayGradeSummary ?? buildSanitizedGradePayloadSummary(req.body);

  try {
    req.body = GradeParlaySchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      const details = error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      }));
      logParlayGradeValidationFailed(req, summary, details);
    }
    next(error);
  }
}

const GRADER_DATA_SOURCES: Record<string, string> = {
  mlb: "mlb_statsapi",
  nba: "nba_stats_stub",
  nfl: "nfl_stats_stub",
};

export function graderDataSourcesForSports(sports: string[]): string[] {
  return [...new Set(sports.map((sport) => GRADER_DATA_SOURCES[sport] ?? `${sport}_unknown`))];
}
