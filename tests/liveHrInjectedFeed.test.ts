import { beforeEach, describe, expect, it, vi } from "vitest";

const getTodayHomeRuns = vi.fn();

const PENDING_LEGS = [
  {
    id: "leg-1",
    pick_id: "pick-1",
    leg_index: 0,
    game_id: "777001",
    event_id: "777001",
    player_id: "592450",
    market_code: "ANYTIME_HR",
    market: "Anytime home run",
    selection: "Aaron Judge 1+ HR",
    status: "pending",
    game_date: "2026-07-18",
  },
  {
    // Same player, different game — must not match on player alone.
    id: "leg-2",
    pick_id: "pick-2",
    leg_index: 0,
    game_id: "777002",
    event_id: "777002",
    player_id: "592450",
    market_code: "ANYTIME_HR",
    market: "Anytime home run",
    selection: "Aaron Judge 1+ HR",
    status: "pending",
    game_date: "2026-07-18",
  },
];

vi.mock("../server/services/mlb/hrFeedService", () => ({ getTodayHomeRuns }));
vi.mock("../server/middleware/auth", () => ({
  getSupabaseAdmin: vi.fn(async () => ({
    from: () => ({
      select: () => ({
        eq: vi.fn(async () => ({ data: PENDING_LEGS, error: null })),
      }),
    }),
  })),
}));

const HR_EVENT = {
  gamePk: 777001,
  playerId: 592450,
  playerName: "Aaron Judge",
  inning: 3,
  timestamp: "2026-07-18T23:14:02.000Z",
};

describe("previewLiveHrParlayMatches with an injected feed", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("matches on gamePk + playerId without re-fetching upstream", async () => {
    const { previewLiveHrParlayMatches } = await import(
      "../server/services/grading/liveHrParlayService"
    );

    const matches = await previewLiveHrParlayMatches(undefined, { events: [HR_EVENT] as any });

    expect(getTodayHomeRuns).not.toHaveBeenCalled();
    expect(matches).toHaveLength(1);
    expect(matches[0].leg.id).toBe("leg-1");
  });

  it("falls back to fetching the feed when no events are injected", async () => {
    getTodayHomeRuns.mockResolvedValue({ events: [HR_EVENT], warnings: [] });
    const { previewLiveHrParlayMatches } = await import(
      "../server/services/grading/liveHrParlayService"
    );

    const matches = await previewLiveHrParlayMatches();

    expect(getTodayHomeRuns).toHaveBeenCalledWith("2026-07-18");
    expect(matches).toHaveLength(1);
  });

  it("settles nothing when the injected feed has no home runs", async () => {
    const { previewLiveHrParlayMatches } = await import(
      "../server/services/grading/liveHrParlayService"
    );

    const matches = await previewLiveHrParlayMatches(undefined, { events: [] });

    expect(getTodayHomeRuns).not.toHaveBeenCalled();
    expect(matches).toHaveLength(0);
  });
});
