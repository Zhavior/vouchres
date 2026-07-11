export const PARLAY_GRADE_CONTRACT_VERSION = "grade_parlay_v1";

export type ParlayGradeMetricOutcome =
  | "success"
  | "validation_error"
  | "upstream_fetch"
  | "grading_engine"
  | "response_build"
  | "error";

export interface ParlayGradeMetricsSnapshot {
  contractVersion: typeof PARLAY_GRADE_CONTRACT_VERSION;
  startedAt: string;
  uptimeMs: number;
  totals: {
    requests: number;
    successes: number;
    validationErrors: number;
    failures: number;
    allLegsPending: number;
  };
  latencyMs: {
    avg: number;
    p95: number;
    max: number;
  };
  legs: {
    avgPerRequest: number;
    totalGraded: number;
  };
  validationFailurePaths: Array<{ path: string; count: number }>;
  recent: Array<{
    at: string;
    outcome: ParlayGradeMetricOutcome;
    durationMs: number;
    legCount: number;
    requestId?: string;
  }>;
}

interface ParlayGradeEvent {
  outcome: ParlayGradeMetricOutcome;
  durationMs: number;
  legCount: number;
  gradedLegCount?: number;
  pendingLegCount?: number;
  requestId?: string;
  validationPaths?: string[];
}

const MAX_DURATIONS = 500;
const MAX_RECENT = 50;
const MAX_VALIDATION_PATHS = 25;

const startedAtMs = Date.now();
const startedAt = new Date(startedAtMs).toISOString();
const durations: number[] = [];
const validationPathCounts = new Map<string, number>();
const recent: ParlayGradeMetricsSnapshot["recent"] = [];

let totalRequests = 0;
let totalSuccesses = 0;
let totalValidationErrors = 0;
let totalFailures = 0;
let totalAllLegsPending = 0;
let totalDurationMs = 0;
let maxDurationMs = 0;
let totalLegs = 0;
let totalGradedLegs = 0;

function percentile(values: number[], pct: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((pct / 100) * sorted.length) - 1);
  return sorted[index] ?? 0;
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function trimDurations(): void {
  if (durations.length > MAX_DURATIONS) durations.splice(0, durations.length - MAX_DURATIONS);
}

function recordValidationPaths(paths: string[] | undefined): void {
  if (!paths?.length) return;
  for (const path of paths) {
    const key = path || "(root)";
    validationPathCounts.set(key, (validationPathCounts.get(key) ?? 0) + 1);
  }
}

export function recordParlayGradeMetric(event: ParlayGradeEvent): void {
  totalRequests += 1;
  totalDurationMs += event.durationMs;
  maxDurationMs = Math.max(maxDurationMs, event.durationMs);
  durations.push(event.durationMs);
  trimDurations();
  totalLegs += event.legCount;
  totalGradedLegs += event.gradedLegCount ?? 0;

  if (event.outcome === "success") {
    totalSuccesses += 1;
    if (event.pendingLegCount != null && event.pendingLegCount === event.legCount && event.legCount > 0) {
      totalAllLegsPending += 1;
    }
  } else if (event.outcome === "validation_error") {
    totalValidationErrors += 1;
    recordValidationPaths(event.validationPaths);
  } else {
    totalFailures += 1;
  }

  if (event.outcome !== "success" || event.durationMs >= 1_500) {
    recent.push({
      at: new Date().toISOString(),
      outcome: event.outcome,
      durationMs: Math.round(event.durationMs),
      legCount: event.legCount,
      requestId: event.requestId,
    });
    if (recent.length > MAX_RECENT) recent.splice(0, recent.length - MAX_RECENT);
  }
}

export function getParlayGradeMetricsSnapshot(now = new Date()): ParlayGradeMetricsSnapshot {
  const validationFailurePaths = [...validationPathCounts.entries()]
    .map(([path, count]) => ({ path, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, MAX_VALIDATION_PATHS);

  return {
    contractVersion: PARLAY_GRADE_CONTRACT_VERSION,
    startedAt,
    uptimeMs: now.getTime() - startedAtMs,
    totals: {
      requests: totalRequests,
      successes: totalSuccesses,
      validationErrors: totalValidationErrors,
      failures: totalFailures,
      allLegsPending: totalAllLegsPending,
    },
    latencyMs: {
      avg: totalRequests > 0 ? Math.round(totalDurationMs / totalRequests) : 0,
      p95: Math.round(percentile(durations, 95)),
      max: Math.round(maxDurationMs),
    },
    legs: {
      avgPerRequest: totalRequests > 0 ? Math.round((totalLegs / totalRequests) * 100) / 100 : 0,
      totalGraded: totalGradedLegs,
    },
    validationFailurePaths,
    recent: [...recent].reverse(),
  };
}

export function resetParlayGradeMetricsForTests(): void {
  durations.splice(0, durations.length);
  validationPathCounts.clear();
  recent.splice(0, recent.length);
  totalRequests = 0;
  totalSuccesses = 0;
  totalValidationErrors = 0;
  totalFailures = 0;
  totalAllLegsPending = 0;
  totalDurationMs = 0;
  maxDurationMs = 0;
  totalLegs = 0;
  totalGradedLegs = 0;
}
