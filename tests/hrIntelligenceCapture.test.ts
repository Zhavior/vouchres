import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  runSnapshotCapture: vi.fn(async () => undefined),
  runHrShadowCapture: vi.fn(async () => undefined),
  runOutcomeIngest: vi.fn(async () => ({ reports: [], failedDates: [] })),
}));

vi.mock("../server/cron/hrSnapshotCapture", () => ({ runSnapshotCapture: mocks.runSnapshotCapture }));
vi.mock("../server/cron/hrShadowCapture", () => ({ runHrShadowCapture: mocks.runHrShadowCapture }));
vi.mock("../server/cron/hrOutcomeIngest", () => ({ runOutcomeIngest: mocks.runOutcomeIngest }));

import { runHrIntelligenceCapture } from "../server/cron/hrIntelligenceCapture";

describe("HR intelligence capture schedule", () => {
  beforeEach(() => vi.clearAllMocks());

  it("captures snapshots every run without shadow or outcome work between schedule boundaries", async () => {
    await runHrIntelligenceCapture(new Date("2026-08-12T08:15:00.000Z"));
    expect(mocks.runSnapshotCapture).toHaveBeenCalledOnce();
    expect(mocks.runHrShadowCapture).not.toHaveBeenCalled();
    expect(mocks.runOutcomeIngest).not.toHaveBeenCalled();
  });

  it("runs shadow scoring on the half-hour", async () => {
    await runHrIntelligenceCapture(new Date("2026-08-12T08:30:00.000Z"));
    expect(mocks.runHrShadowCapture).toHaveBeenCalledWith("2026-08-12");
  });

  it("ingests outcomes once at the daily UTC boundary", async () => {
    const now = new Date("2026-08-12T09:00:00.000Z");
    await runHrIntelligenceCapture(now);
    expect(mocks.runOutcomeIngest).toHaveBeenCalledWith({ dryRun: false, date: null }, now);
    expect(mocks.runHrShadowCapture).toHaveBeenCalledWith("2026-08-12");
  });
});
