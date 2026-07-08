import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "../server/errors/AppError";

const getSupabaseAdmin = vi.fn();

vi.mock("../server/middleware/auth", () => ({
  getSupabaseAdmin: () => getSupabaseAdmin(),
}));

vi.mock("../server/lib/sports/sportsHttpClient", () => ({
  sportsFetchJson: vi.fn(),
}));

vi.mock("../server/services/persistence/pickService", () => ({
  gradePick: vi.fn(),
}));

vi.mock("../server/services/notifications/notificationService", () => ({
  createParlayGradedNotification: vi.fn(),
}));

import { gradePendingPicks } from "../server/services/grading/gradingService";

function mockPendingQuery(result: { data: unknown; error: unknown }) {
  const limit = vi.fn(async () => result);
  const order = vi.fn(() => ({ limit }));
  const gte = vi.fn(() => ({ order }));
  const not = vi.fn(() => ({ gte }));
  const eq = vi.fn(() => ({ not }));
  const select = vi.fn(() => ({ eq }));
  getSupabaseAdmin.mockResolvedValue({
    from: vi.fn(() => ({ select })),
  });
}

describe("gradePendingPicks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty summary when there are no pending picks", async () => {
    mockPendingQuery({ data: [], error: null });

    const result = await gradePendingPicks({ days: 1 });

    expect(result).toEqual({
      graded: [],
      skipped: [],
      summary: {
        total_pending: 0,
        total_graded: 0,
        wins: 0,
        losses: 0,
        pushes: 0,
        voids: 0,
        warnings: [],
      },
    });
  });

  it("coalesces concurrent non-dryRun runs onto one in-flight query", async () => {
    let releases: (() => void) | null = null;
    const gate = new Promise<void>((resolve) => {
      releases = resolve;
    });
    const limit = vi.fn(async () => {
      await gate;
      return { data: [], error: null };
    });
    const order = vi.fn(() => ({ limit }));
    const gte = vi.fn(() => ({ order }));
    const not = vi.fn(() => ({ gte }));
    const eq = vi.fn(() => ({ not }));
    const select = vi.fn(() => ({ eq }));
    getSupabaseAdmin.mockResolvedValue({
      from: vi.fn(() => ({ select })),
    });

    const first = gradePendingPicks({ days: 1 });
    const second = gradePendingPicks({ days: 1 });
    await Promise.resolve();
    expect(select).toHaveBeenCalledTimes(1);
    releases?.();
    const [a, b] = await Promise.all([first, second]);
    expect(a).toEqual(b);
    expect(select).toHaveBeenCalledTimes(1);
  });

  it("throws AppError when Supabase pending fetch fails", async () => {
    mockPendingQuery({ data: null, error: { message: "db down", code: "57P01" } });

    await expect(gradePendingPicks({ days: 1 })).rejects.toMatchObject({
      name: "AppError",
      status: 503,
      code: "external_service_error",
      message: "Unable to load pending picks for grading.",
    });

    try {
      await gradePendingPicks({ days: 1 });
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).details).toEqual({ reason: "pending_picks_fetch_failed" });
    }
  });

  it("skips legacy / non-numeric event ids without calling MLB", async () => {
    mockPendingQuery({
      data: [
        {
          id: "pick-1",
          user_id: "user-1",
          market: "hr",
          selection: "Aaron Judge 1+ HR",
          event_id: "leg-manual-abc",
          odds_decimal: 2.2,
          stake_units: 1,
          leg_type: "player",
          sport: "mlb",
          created_at: new Date().toISOString(),
          game_date: "2026-07-08",
          graded_at: null,
          status: "pending",
        },
      ],
      error: null,
    });

    const result = await gradePendingPicks({ days: 1, dryRun: true });

    expect(result.graded).toEqual([]);
    expect(result.skipped).toHaveLength(1);
    expect(result.skipped[0]).toMatchObject({
      pick_id: "pick-1",
      status: "graded_error",
      error: expect.stringContaining("legacy/manual event id skipped"),
    });
    expect(result.summary.total_pending).toBe(1);
    expect(result.summary.total_graded).toBe(0);
  });
});
