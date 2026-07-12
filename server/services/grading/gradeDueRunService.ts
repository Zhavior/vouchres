import { captureGradingFailure } from "../../lib/sentry";
import { structuredLog } from "../../lib/structuredLog";
import { buildGradeDueLogRows, persistGradingRunLogs } from "./gradingLogService";
import {
  gradePendingPicks,
  type GradeRunResult,
  type GradeRunSummary,
} from "./gradingService";

type GradeDueRunSource = "staff" | "cron";

export interface GradeDueRunPayload extends Record<string, unknown> {
  mode: "grade_due" | "cron_grade_due";
  gradedParlays: number;
  gradedLegs: number;
  pendingLegs: number;
  summary: GradeRunSummary;
  warnings: string[];
  errors: Array<{ pick_id: string; error?: string }>;
  checkedAt: string;
}

function partitionGradeDueResult(result: GradeRunResult) {
  const { graded, skipped, summary } = result;
  const settled = graded.filter((row) => row.status !== "graded_error");
  const pending = skipped.filter(
    (row) => row.error?.includes("not final") || row.error?.includes("isComplete=false"),
  );
  const errors = skipped.filter(
    (row) => !row.error?.includes("not final") && !row.error?.includes("isComplete=false"),
  );
  return { settled, pending, errors, summary };
}

export async function executeGradeDueRun(input: {
  days: number;
  source: GradeDueRunSource;
  requestId: string;
  userId?: string | null;
}): Promise<GradeDueRunPayload> {
  const startedAt = Date.now();
  const mode = input.source === "cron" ? "cron_grade_due" : "grade_due";
  const logSource = input.source === "cron" ? "cron_grade_due" : "grade-due";

  let result;
  try {
    result = await gradePendingPicks({ days: input.days, legacyBacklogLimit: 50 });
  } catch (error) {
    structuredLog({
      level: "error",
      event: "parlay.grade_due.failed",
      requestId: input.requestId,
      mode,
      source: input.source,
      days: input.days,
      durationMs: Date.now() - startedAt,
      code: (error as { code?: string })?.code ?? "grading_failed",
    });
    if (input.source === "cron") {
      captureGradingFailure(error, {
        source: "cron",
        cron: true,
        extra: { days: input.days, route: "grade-due" },
      });
    }
    throw error;
  }

  const { settled, pending, errors, summary } = partitionGradeDueResult(result);

  structuredLog({
    level: "info",
    event: "parlay.grade_due.completed",
    requestId: input.requestId,
    mode,
    source: input.source,
    days: input.days,
    durationMs: Date.now() - startedAt,
    gradedParlays: settled.length,
    gradedLegs: result.graded.length,
    pendingLegs: pending.length,
    errorCount: errors.length,
  });

  try {
    await persistGradingRunLogs(buildGradeDueLogRows({
      settled,
      pending,
      errors,
      source: logSource,
    }));
  } catch (error) {
    structuredLog({
      level: "warn",
      event: "parlay.grade_due.log_persistence_failed",
      requestId: input.requestId,
      mode,
      source: input.source,
      code: String((error as { code?: unknown })?.code ?? "grading_log_unavailable"),
    });
  }

  return {
    mode,
    gradedParlays: settled.length,
    gradedLegs: result.graded.length,
    pendingLegs: pending.length,
    summary,
    warnings: summary.warnings,
    errors: errors.map((row) => ({ pick_id: row.pick_id, error: row.error })),
    checkedAt: new Date().toISOString(),
  };
}
