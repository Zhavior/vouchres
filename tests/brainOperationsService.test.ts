import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "../server/errors/AppError";

vi.mock("../server/lib/distributedLock", () => ({
  runWithDistributedLock: vi.fn(
    async (_name: string, fn: () => Promise<unknown>) => fn(),
  ),
}));
vi.mock("../server/lib/structuredLog", () => ({ structuredLog: vi.fn() }));
vi.mock("../server/services/mlb/mlbClient", () => ({
  todayISO: vi.fn(() => "2026-07-12"),
  getScheduleByDate: vi.fn(),
}));
vi.mock(
  "../server/services/intelligence/centralBrain/brainLedgerService",
  () => ({
    snapshotDailyBrainHrPicks: vi.fn(async () => undefined),
    snapshotDailyBrainStolenBasePicks: vi.fn(async () => undefined),
    snapshotDailyBrainPitcherKPicks: vi.fn(async () => undefined),
    settleBrainHrPicks: vi.fn(async () => 1),
    settleBrainStolenBasePicks: vi.fn(async () => 1),
    settleBrainPitcherKPicks: vi.fn(async () => 1),
  }),
);
vi.mock(
  "../server/services/intelligence/centralBrain/brainGeminiReviewService",
  () => ({
    generateBrainGeminiReviews: vi.fn(async () => 2),
  }),
);

import { getScheduleByDate } from "../server/services/mlb/mlbClient";
import {
  settleBrainHrPicks,
  snapshotDailyBrainHrPicks,
  snapshotDailyBrainPitcherKPicks,
} from "../server/services/intelligence/centralBrain/brainLedgerService";
import { executeBrainOperations } from "../server/services/intelligence/centralBrain/brainOperationsService";
import { runWithDistributedLock } from "../server/lib/distributedLock";
import { structuredLog } from "../server/lib/structuredLog";

describe("Brain operations service", () => {
  beforeEach(() => vi.clearAllMocks());

  it("snapshots when a game starts inside the controlled pregame window", async () => {
    vi.mocked(getScheduleByDate).mockResolvedValue([
      { gamePk: 1, gameDate: "2026-07-12T20:00:00.000Z" },
    ] as any);
    const result = await executeBrainOperations(
      "2026-07-12",
      new Date("2026-07-12T17:00:00.000Z"),
    );
    expect(snapshotDailyBrainHrPicks).toHaveBeenCalledWith("2026-07-12");
    expect(snapshotDailyBrainPitcherKPicks).toHaveBeenCalledWith("2026-07-12");
    expect(result).toMatchObject({
      upcomingGames: 1,
      snapshotAttempted: true,
      settled: 21,
      settlementLookbackDays: 7,
    });
  });

  it("skips the expensive snapshot when no game is approaching", async () => {
    vi.mocked(getScheduleByDate).mockResolvedValue([
      { gamePk: 1, gameDate: "2026-07-13T20:00:00.000Z" },
    ] as any);
    const result = await executeBrainOperations(
      "2026-07-12",
      new Date("2026-07-12T17:00:00.000Z"),
    );
    expect(snapshotDailyBrainHrPicks).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      snapshotAttempted: false,
      settlementLookbackDays: 7,
    });
    expect(settleBrainHrPicks).toHaveBeenCalledWith("2026-07-06");
  });

  it("emits a visible event when another Brain run owns the distributed lock", async () => {
    vi.mocked(runWithDistributedLock).mockRejectedValueOnce(
      new AppError({
        status: 409,
        code: "conflict",
        message: "Another operation is already in progress.",
      }),
    );

    await expect(executeBrainOperations("2026-07-12")).rejects.toMatchObject({
      code: "conflict",
    });
    expect(structuredLog).toHaveBeenCalledWith(
      expect.objectContaining({
        level: "warn",
        event: "brain.operations.lock_contended",
        date: "2026-07-12",
      }),
    );
  });
});
