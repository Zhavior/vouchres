import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../server/lib/sports/sportsHttpClient", () => ({
  sportsFetchJson: vi.fn(),
}));

describe("schedule fetch honesty", () => {
  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("throws on schedule upstream failure instead of returning []", async () => {
    const { sportsFetchJson } = await import("../server/lib/sports/sportsHttpClient");
    vi.mocked(sportsFetchJson).mockRejectedValue(new Error("statsapi down"));

    const { getScheduleByDate } = await import("../server/services/mlb/mlbClient");
    await expect(getScheduleByDate("2026-07-18")).rejects.toThrow(/statsapi down/i);
  });

  it("rejects date query injection before calling the MLB StatsAPI", async () => {
    const { sportsFetchJson } = await import("../server/lib/sports/sportsHttpClient");
    const { getScheduleByDate } = await import("../server/services/mlb/mlbClient");

    await expect(getScheduleByDate("2026-07-18&hydrate=linescore")).rejects.toThrow(/YYYY-MM-DD/);
    expect(sportsFetchJson).not.toHaveBeenCalled();
  });
});
