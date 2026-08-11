import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../server/lib/distributedLock", () => ({
  runWithDistributedLock: vi.fn(async (_name: string, fn: () => Promise<unknown>) => fn()),
}));
vi.mock("../server/lib/structuredLog", () => ({ structuredLog: vi.fn() }));
vi.mock("../server/services/mlb/mlbClient", () => ({
  todayISO: vi.fn(() => "2026-07-12"),
  getScheduleByDate: vi.fn(),
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
import { settleBrainHrPicks, snapshotDailyBrainHrPicks, snapshotDailyBrainPitcherKPicks } from "../server/services/intelligence/centralBrain/brainLedgerService";
import { executeBrainOperations } from "../server/services/intelligence/centralBrain/brainOperationsService";
import { structuredLog } from "../server/lib/structuredLog";

describe("Brain operations service", () => {
  beforeEach(() => vi.clearAllMocks());

  it("snapshots when a game starts inside the controlled pregame window", async () => {
    vi.mocked(getScheduleByDate).mockResolvedValue([{ gamePk: 1, gameDate: "2026-07-12T20:00:00.000Z" }] as any);
    const result = await executeBrainOperations("2026-07-12", new Date("2026-07-12T17:00:00.000Z"));
    expect(snapshotDailyBrainHrPicks).toHaveBeenCalledWith("2026-07-12");
    expect(snapshotDailyBrainPitcherKPicks).toHaveBeenCalledWith("2026-07-12");
    expect(result).toMatchObject({ upcomingGames: 1, snapshotAttempted: true, snapshotReason: "games_in_capture_window", settled: 6 });
    expect(structuredLog).not.toHaveBeenCalledWith(expect.objectContaining({ event: "brain.operations.snapshot_skipped" }));
  });

  it("skips the expensive snapshot when no game is approaching", async () => {
    vi.mocked(getScheduleByDate).mockResolvedValue([{ gamePk: 1, gameDate: "2026-07-13T20:00:00.000Z" }] as any);
    const result = await executeBrainOperations("2026-07-12", new Date("2026-07-12T17:00:00.000Z"));
    expect(snapshotDailyBrainHrPicks).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      snapshotAttempted: false,
      snapshotReason: "outside_capture_window",
      games: 1,
      upcomingGames: 0,
      earliestFirstPitch: "2026-07-13T20:00:00.000Z",
      millisecondsToEarliestFirstPitch: 27 * 60 * 60 * 1000,
    });
    expect(structuredLog).toHaveBeenCalledWith(expect.objectContaining({
      event: "brain.operations.snapshot_skipped",
      reason: "outside_capture_window",
      message: expect.stringContaining("1 games on the schedule for 2026-07-12"),
      earliestFirstPitch: "2026-07-13T20:00:00.000Z",
      millisecondsToEarliestFirstPitch: 27 * 60 * 60 * 1000,
    }));
    expect(settleBrainHrPicks).toHaveBeenCalledWith("2026-07-11");
  });

  it("logs an empty schedule separately from an out-of-window slate", async () => {
    vi.mocked(getScheduleByDate).mockResolvedValue([]);
    const result = await executeBrainOperations("2026-07-12", new Date("2026-07-12T17:00:00.000Z"));
    expect(result).toMatchObject({
      games: 0,
      upcomingGames: 0,
      snapshotAttempted: false,
      snapshotReason: "empty_schedule",
      snapshotMessage: "No games on the schedule for 2026-07-12.",
    });
    expect(structuredLog).toHaveBeenCalledWith(expect.objectContaining({
      event: "brain.operations.snapshot_skipped",
      reason: "empty_schedule",
      message: "No games on the schedule for 2026-07-12.",
      games: 0,
    }));
  });
});
