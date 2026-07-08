import { describe, expect, it, vi } from "vitest";
import { getMlbHealthReport } from "../server/services/mlb/mlbHealthService";

vi.mock("../server/services/mlb/mlbClient", () => ({
  todayISO: () => "2026-07-07",
  getScheduleByDate: vi.fn(async () => [
    { gamePk: 1, status: "In Progress" },
    { gamePk: 2, status: "Warmup" },
    { gamePk: 3, status: "Final" },
    { gamePk: 4, status: "Pre-Game" },
  ]),
}));

vi.mock("../server/services/mlb/liveGamesService", () => ({
  getLiveGames: vi.fn(async () => ({
    games: [
      { id: "1", isLive: true },
      { id: "2", isLive: true },
      { id: "3", isLive: false },
      { id: "4", isLive: false },
    ],
    warnings: [],
  })),
}));

describe("MLB health report", () => {
  it("reports official dependency and live-count consistency", async () => {
    const report = await getMlbHealthReport("2026-07-07", new Date("2026-07-08T01:00:00Z"));

    expect(report).toMatchObject({
      ok: true,
      status: "ok",
      service: "mlb",
      date: "2026-07-07",
      dependency: {
        name: "MLB Stats API",
        reachable: true,
      },
      consistency: {
        scheduleGames: 4,
        liveGames: 2,
        finalGames: 1,
        liveEndpointGames: 4,
        liveEndpointLiveGames: 2,
        liveCountsAgree: true,
      },
      dataQuality: "official_mlb_schedule",
      warnings: [],
      info: [],
      updatedAt: "2026-07-08T01:00:00.000Z",
    });
  });
});
