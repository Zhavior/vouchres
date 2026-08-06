import { beforeEach, describe, expect, it, vi } from "vitest";

const getTodayHomeRuns = vi.fn();
const processHomeRunEvents = vi.fn();
const applyLiveHrParlayMatches = vi.fn();
const captureGradingFailure = vi.fn();

vi.mock("../server/services/mlb/hrFeedService", () => ({ getTodayHomeRuns }));
vi.mock("../server/services/notifications/notificationService", () => ({ processHomeRunEvents }));
vi.mock("../server/services/grading/liveHrParlayWriteService", () => ({ applyLiveHrParlayMatches }));
vi.mock("../server/lib/sentry", () => ({ captureGradingFailure }));
vi.mock("../server/lib/distributedLock", () => ({
  runWithDistributedLock: vi.fn(async (_name: string, fn: () => Promise<unknown>) => fn()),
}));

const HR_EVENT = { gamePk: 777001, playerId: 592450, playerName: "Aaron Judge", inning: 3 };

const EMPTY_SETTLEMENT = {
  checked: 0,
  insertedEvents: 0,
  duplicateEvents: 0,
  updatedLegs: 0,
  skipped: 0,
};

const NOTIFY_RESULT = {
  scanned: 1,
  created: 1,
  duplicates: 0,
  pushSent: 1,
  pushSkipped: 0,
  warnings: [],
};

async function runOneTick(): Promise<void> {
  const { startLiveHrNotificationLoop } = await import("../server/cron/liveHrNotificationLoop");
  const handle = startLiveHrNotificationLoop();
  // startLiveHrNotificationLoop fires an immediate tick, then schedules an interval.
  await vi.waitFor(() => expect(processHomeRunEvents).toHaveBeenCalled());
  handle?.stop();
}

describe("live HR loop settles legs from the feed it already fetched", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    delete process.env.HR_LIVE_SETTLEMENT_ENABLED;
    getTodayHomeRuns.mockResolvedValue({ events: [HR_EVENT], warnings: [] });
    processHomeRunEvents.mockResolvedValue(NOTIFY_RESULT);
    applyLiveHrParlayMatches.mockResolvedValue({ ...EMPTY_SETTLEMENT, checked: 1, updatedLegs: 1 });
  });

  it("settles with the injected feed instead of re-fetching upstream", async () => {
    await runOneTick();

    expect(applyLiveHrParlayMatches).toHaveBeenCalledWith(undefined, { events: [HR_EVENT] });
    // One feed fetch for the whole tick — settlement must not trigger a second.
    expect(getTodayHomeRuns).toHaveBeenCalledTimes(1);
  });

  it("settles before notifying so the leg is graded when the push lands", async () => {
    const order: string[] = [];
    applyLiveHrParlayMatches.mockImplementation(async () => {
      order.push("settle");
      return { ...EMPTY_SETTLEMENT, checked: 1, updatedLegs: 1 };
    });
    processHomeRunEvents.mockImplementation(async () => {
      order.push("notify");
      return NOTIFY_RESULT;
    });

    await runOneTick();

    expect(order).toEqual(["settle", "notify"]);
  });

  it("still sends notifications when settlement throws", async () => {
    applyLiveHrParlayMatches.mockRejectedValue(new Error("pick_legs unavailable"));

    await runOneTick();

    expect(processHomeRunEvents).toHaveBeenCalledWith([HR_EVENT]);
    expect(captureGradingFailure).toHaveBeenCalled();
  });

  it("treats a concurrent lock holder as a skip, not an error", async () => {
    applyLiveHrParlayMatches.mockRejectedValue(Object.assign(new Error("busy"), { code: "conflict" }));

    await runOneTick();

    expect(processHomeRunEvents).toHaveBeenCalledWith([HR_EVENT]);
    expect(captureGradingFailure).not.toHaveBeenCalled();
  });

  it("skips grade writes when HR_LIVE_SETTLEMENT_ENABLED=false but keeps alerts", async () => {
    process.env.HR_LIVE_SETTLEMENT_ENABLED = "false";

    await runOneTick();

    expect(applyLiveHrParlayMatches).not.toHaveBeenCalled();
    expect(processHomeRunEvents).toHaveBeenCalledWith([HR_EVENT]);
  });
});
