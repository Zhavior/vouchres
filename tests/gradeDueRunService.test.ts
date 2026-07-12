import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  gradePendingPicks: vi.fn(),
  persistGradingRunLogs: vi.fn(),
  captureGradingFailure: vi.fn(),
  structuredLog: vi.fn(),
}));

vi.mock("../server/services/grading/gradingService", () => ({
  gradePendingPicks: mocks.gradePendingPicks,
}));

vi.mock("../server/services/grading/gradingLogService", async (importOriginal) => {
  const original = await importOriginal<typeof import("../server/services/grading/gradingLogService")>();
  return {
    ...original,
    persistGradingRunLogs: mocks.persistGradingRunLogs,
  };
});

vi.mock("../server/lib/sentry", () => ({
  captureGradingFailure: mocks.captureGradingFailure,
}));

vi.mock("../server/lib/structuredLog", () => ({
  structuredLog: mocks.structuredLog,
}));

import { executeGradeDueRun } from "../server/services/grading/gradeDueRunService";

const gradeResult = {
  graded: [
    { pick_id: "pick-won", status: "won" },
    { pick_id: "pick-error", status: "graded_error", error: "feed_missing" },
  ],
  skipped: [
    { pick_id: "pick-pending", status: "graded_error", error: "game isComplete=false" },
    { pick_id: "pick-failed", status: "graded_error", error: "boxscore_missing" },
  ],
  summary: {
    total_pending: 4,
    total_graded: 1,
    wins: 1,
    losses: 0,
    pushes: 0,
    voids: 0,
    warnings: ["partial settle"],
  },
};

describe("executeGradeDueRun", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.gradePendingPicks.mockResolvedValue(gradeResult);
    mocks.persistGradingRunLogs.mockResolvedValue({ written: 3, corrections: 0 });
  });

  it("keeps staff and cron payloads structurally identical apart from mode", async () => {
    const staff = await executeGradeDueRun({
      days: 2,
      source: "staff",
      requestId: "req-staff",
      userId: "user-1",
    });
    const cron = await executeGradeDueRun({
      days: 2,
      source: "cron",
      requestId: "req-cron",
    });

    expect({ ...staff, mode: undefined, checkedAt: undefined }).toEqual({
      ...cron,
      mode: undefined,
      checkedAt: undefined,
    });
    expect(staff.mode).toBe("grade_due");
    expect(cron.mode).toBe("cron_grade_due");
    expect(mocks.gradePendingPicks).toHaveBeenNthCalledWith(1, { days: 2, legacyBacklogLimit: 50 });
    expect(mocks.gradePendingPicks).toHaveBeenNthCalledWith(2, { days: 2, legacyBacklogLimit: 50 });
    expect(mocks.structuredLog).toHaveBeenCalledWith(expect.objectContaining({
      level: "info",
      event: "parlay.grade_due.completed",
      requestId: "req-staff",
      mode: "grade_due",
      source: "staff",
      gradedParlays: 1,
      gradedLegs: 2,
      pendingLegs: 1,
      errorCount: 1,
      durationMs: expect.any(Number),
    }));
  });

  it("uses the existing source names when persisting grading logs", async () => {
    await executeGradeDueRun({ days: 2, source: "staff", requestId: "req-staff" });
    await executeGradeDueRun({ days: 2, source: "cron", requestId: "req-cron" });

    expect(mocks.persistGradingRunLogs.mock.calls[0][0][0].source).toBe("grade-due");
    expect(mocks.persistGradingRunLogs.mock.calls[1][0][0].source).toBe("cron_grade_due");
  });

  it("keeps a successful grade response when grading-log persistence fails", async () => {
    mocks.persistGradingRunLogs.mockRejectedValueOnce(new Error("log store down"));

    await expect(executeGradeDueRun({
      days: 2,
      source: "staff",
      requestId: "req-staff",
    })).resolves.toMatchObject({ gradedParlays: 1, gradedLegs: 2 });
    expect(mocks.structuredLog).toHaveBeenCalledWith(expect.objectContaining({
      level: "warn",
      event: "parlay.grade_due.log_persistence_failed",
      requestId: "req-staff",
      code: "grading_log_unavailable",
    }));
  });

  it("preserves cron-only failure capture and rethrows the grading error", async () => {
    const error = new Error("grading failed");
    mocks.gradePendingPicks.mockRejectedValueOnce(error);

    await expect(executeGradeDueRun({
      days: 2,
      source: "cron",
      requestId: "req-cron",
    })).rejects.toBe(error);
    expect(mocks.captureGradingFailure).toHaveBeenCalledWith(error, {
      source: "cron",
      cron: true,
      extra: { days: 2, route: "grade-due" },
    });
    expect(mocks.structuredLog).toHaveBeenCalledWith(expect.objectContaining({
      level: "error",
      event: "parlay.grade_due.failed",
      requestId: "req-cron",
      mode: "cron_grade_due",
      source: "cron",
      code: "grading_failed",
      durationMs: expect.any(Number),
    }));
  });
});
