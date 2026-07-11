import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildGradeDueLogRows, persistGradingRunLogs } from "../server/services/grading/gradingLogService";

const supabase = vi.hoisted(() => ({
  from: vi.fn(),
}));

const pickAuditRepository = vi.hoisted(() => ({
  insertPickAuditLog: vi.fn(),
}));

vi.mock("../server/middleware/auth", () => ({
  getSupabaseAdmin: vi.fn(async () => supabase),
}));

vi.mock("../server/repositories/pickAuditRepository", () => pickAuditRepository);

describe("gradingLogService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pickAuditRepository.insertPickAuditLog.mockResolvedValue({ id: "audit-1" });
    supabase.from.mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: null }),
    });
  });

  it("builds grade-due log rows for settled, pending, and errors", () => {
    const rows = buildGradeDueLogRows({
      settled: [{ pick_id: "p1", status: "won" }],
      pending: [{ pick_id: "p2" }],
      errors: [{ pick_id: "p3", error: "boxscore_missing" }],
    });

    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatchObject({ pick_id: "p1", status: "won", reason: "graded" });
    expect(rows[2]).toMatchObject({ pick_id: "p3", status: "graded_error" });
  });

  it("writes grade_correction audit when status changes after settlement", async () => {
    const result = await persistGradingRunLogs([{
      pick_id: "p1",
      user_id: "user-1",
      status: "lost",
      reason: "boxscore_correction",
      source: "grade-due",
      previous_status: "won",
    }]);

    expect(result.corrections).toBe(1);
    expect(pickAuditRepository.insertPickAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: "grade_correction", pickId: "p1" }),
    );
  });
});
