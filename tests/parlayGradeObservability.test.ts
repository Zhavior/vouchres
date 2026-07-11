import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  buildSanitizedGradePayloadSummary,
  logParlayGradeValidationFailed,
  PARLAY_GRADE_ROUTE,
} from "../server/services/grading/parlayGradeObservability";
import {
  getParlayGradeMetricsSnapshot,
  resetParlayGradeMetricsForTests,
} from "../server/lib/observability/parlayGradeMetrics";
import { structuredLog } from "../server/lib/structuredLog";

vi.mock("../server/lib/structuredLog", () => ({
  structuredLog: vi.fn(),
}));

describe("parlayGradeObservability", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetParlayGradeMetricsForTests();
  });

  it("builds a sanitized payload summary without raw freeform text", () => {
    const summary = buildSanitizedGradePayloadSummary({
      stakeUnits: 2,
      legs: [
        {
          sport: "MLB",
          gameId: "777001",
          marketCode: "ANYTIME_HR",
          selection: "Aaron Judge Anytime HR",
          odds: -110,
          statTarget: 1,
        },
        {
          sport: "mlb",
          gamePk: "",
          market: "",
          selection: "",
        },
      ],
    });

    expect(summary.legCount).toBe(2);
    expect(summary.stakeUnits).toBe(2);
    expect(summary.sports).toEqual(["mlb"]);
    expect(summary.marketCodes).toEqual(["ANYTIME_HR"]);
    expect(summary.legs[0]).toMatchObject({
      sport: "mlb",
      gamePk: "777001",
      market: "ANYTIME_HR",
      selectionKey: "Aaron Judge Anytime HR",
      thresholdPresent: true,
      oddsPresent: true,
    });
    expect(summary.hasMissingGamePk).toBe(true);
    expect(summary.hasMissingMarket).toBe(true);
    expect(summary.hasMissingSelection).toBe(true);
  });

  it("truncates long selections in the summary", () => {
    const longSelection = "x".repeat(80);
    const summary = buildSanitizedGradePayloadSummary({
      legs: [{ sport: "mlb", gamePk: "1", market: "hr", selection: longSelection }],
    });
    expect(summary.legs[0]?.selectionKey).toContain("...(80)");
    expect(summary.legs[0]?.selectionKey?.length).toBeLessThan(longSelection.length);
  });

  it("logs validation failures with details and records metrics", () => {
    const req = {
      requestId: "req-test-1",
      method: "POST",
      parlayGradeStartedAt: Date.now() - 5,
      parlayGradeSummary: buildSanitizedGradePayloadSummary({ legs: [] }),
    };

    logParlayGradeValidationFailed(req as any, req.parlayGradeSummary!, [
      { path: "legs", message: "legs must include at least 1 item." },
    ]);

    expect(structuredLog).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "parlay_grade_validation_failed",
        requestId: "req-test-1",
        route: PARLAY_GRADE_ROUTE,
        status: 400,
        code: "validation_error",
        failureStage: "request_validation",
        details: [{ path: "legs", message: "legs must include at least 1 item." }],
      }),
    );

    const metrics = getParlayGradeMetricsSnapshot();
    expect(metrics.totals.validationErrors).toBe(1);
    expect(metrics.validationFailurePaths).toEqual([{ path: "legs", count: 1 }]);
  });
});
