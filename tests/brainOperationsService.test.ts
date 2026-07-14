import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../server/lib/distributedLock", () => ({
  runWithDistributedLock: vi.fn(async (_name: string, fn: () => Promise<unknown>) => fn()),
}));
vi.mock("../server/lib/structuredLog", () => ({ structuredLog: vi.fn() }));
vi.mock("../server/services/mlb/mlbClient", () => ({
  todayISO: vi.fn(() => "2026-07-12"),
  getScheduleByDate: vi.fn(),
}));
vi.mock("../server/services/hubs/hrBoardHub", () => ({
  getCachedValidatedHrBoard: vi.fn(),
}));
vi.mock("../server/services/intelligence/centralBrain/brainLedgerService", () => ({
  snapshotDailyBrainHrPicks: vi.fn(async () => undefined),
  snapshotDailyBrainStolenBasePicks: vi.fn(async () => undefined),
  snapshotDailyBrainPitcherKPicks: vi.fn(async () => undefined),
  settleBrainHrPicks: vi.fn(async () => 1),
  settleBrainStolenBasePicks: vi.fn(async () => 1),
  settleBrainPitcherKPicks: vi.fn(async () => 1),
}));
vi.mock("../server/services/intelligence/centralBrain/brainGeminiReviewService", () => ({
  generateBrainGeminiReviews: vi.fn(async () => 2),
}));

import { getScheduleByDate } from "../server/services/mlb/mlbClient";
import { getCachedValidatedHrBoard } from "../server/services/hubs/hrBoardHub";
import { settleBrainHrPicks, snapshotDailyBrainHrPicks, snapshotDailyBrainPitcherKPicks } from "../server/services/intelligence/centralBrain/brainLedgerService";
import { executeBrainOperations } from "../server/services/intelligence/centralBrain/brainOperationsService";

describe("Brain operations service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCachedValidatedHrBoard).mockResolvedValue({
      debug: { lastRefresh: "2026-07-12T16:55:00.000Z" },
    } as any);
  });

  it("snapshots when a game starts inside the controlled pregame window", async () => {
    vi.mocked(getScheduleByDate).mockResolvedValue([{ gamePk: 1, gameDate: "2026-07-12T20:00:00.000Z" }] as any);
    const result = await executeBrainOperations("2026-07-12", new Date("2026-07-12T17:00:00.000Z"));
    expect(snapshotDailyBrainHrPicks).toHaveBeenCalledWith("2026-07-12");
    expect(snapshotDailyBrainPitcherKPicks).toHaveBeenCalledWith("2026-07-12");
    expect(result).toMatchObject({
      upcomingGames: 1,
      snapshotAttempted: true,
      evidenceObservedAt: "2026-07-12T16:55:00.000Z",
      settled: 6,
    });
  });

  it("skips the expensive snapshot when no game is approaching", async () => {
    vi.mocked(getScheduleByDate).mockResolvedValue([{ gamePk: 1, gameDate: "2026-07-13T20:00:00.000Z" }] as any);
    const result = await executeBrainOperations("2026-07-12", new Date("2026-07-12T17:00:00.000Z"));
    expect(snapshotDailyBrainHrPicks).not.toHaveBeenCalled();
    expect(result.snapshotAttempted).toBe(false);
    expect(settleBrainHrPicks).toHaveBeenCalledWith("2026-07-11");
  });

  it("skips snapshot when the HR board evidence is stale even inside the window", async () => {
    vi.mocked(getCachedValidatedHrBoard).mockResolvedValue({
      debug: { lastRefresh: "2026-07-12T16:00:00.000Z" },
    } as any);
    vi.mocked(getScheduleByDate).mockResolvedValue([{ gamePk: 1, gameDate: "2026-07-12T20:00:00.000Z" }] as any);
    const result = await executeBrainOperations("2026-07-12", new Date("2026-07-12T17:30:00.000Z"));
    expect(snapshotDailyBrainHrPicks).not.toHaveBeenCalled();
    expect(result).toMatchObject({ upcomingGames: 0, snapshotAttempted: false });
  });
});
