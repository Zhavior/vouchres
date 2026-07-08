import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../server/services/mlb/mlbClient", () => ({
  getScheduleByDate: vi.fn(),
  todayISO: vi.fn(() => "2026-07-08"),
}));

vi.mock("../server/services/mlb/statsClient", () => ({
  getPitcherStats: vi.fn(),
}));

vi.mock("../server/lib/upstashRedis", () => ({
  isUpstashEnabled: vi.fn(() => false),
  redisGetJson: vi.fn(),
  redisSetJson: vi.fn(),
}));

import { getScheduleByDate } from "../server/services/mlb/mlbClient";
import { isUpstashEnabled, redisGetJson, redisSetJson } from "../server/lib/upstashRedis";
import {
  clearDailyReportCache,
  getSharedDailyReport,
  resetDailyReportLastGoodForTests,
} from "../server/services/intelligence/mlbIntelligenceEngine";

describe("getSharedDailyReport last-good fallback", () => {
  beforeEach(() => {
    clearDailyReportCache();
    resetDailyReportLastGoodForTests();
    vi.clearAllMocks();
    vi.mocked(isUpstashEnabled).mockReturnValue(false);
  });

  afterEach(() => {
    clearDailyReportCache();
    resetDailyReportLastGoodForTests();
  });

  it("serves last-known daily report with warning when rebuild fails", async () => {
    vi.mocked(getScheduleByDate)
      .mockResolvedValueOnce([
        {
          gamePk: 777001,
          status: "Scheduled",
          gameDate: "2026-07-08",
          awayTeam: { name: "Boston Red Sox", abbreviation: "BOS" },
          homeTeam: { name: "New York Yankees", abbreviation: "NYY" },
          probablePitchers: { away: null, home: null },
          score: { home: 0, away: 0 },
          venue: "Yankee Stadium",
        },
      ] as any)
      .mockRejectedValueOnce(new Error("schedule timeout"));

    const first = await getSharedDailyReport("2026-07-08");
    expect(first.gameCount).toBe(1);
    expect(first.warnings).not.toContain(expect.stringContaining("last-known daily report"));

    clearDailyReportCache("2026-07-08");

    const second = await getSharedDailyReport("2026-07-08");
    expect(second.gameCount).toBe(1);
    expect(second.warnings.join(" ")).toContain("last-known daily report");
    expect(["partial", "limited"]).toContain(second.dataQuality);
  });

  it("returns empty limited report when rebuild fails and no last-good exists", async () => {
    vi.mocked(getScheduleByDate).mockRejectedValueOnce(new Error("schedule down"));

    const report = await getSharedDailyReport("2026-07-08");
    expect(report.gameCount).toBe(0);
    expect(report.dataQuality).toBe("limited");
    expect(report.warnings.join(" ")).toContain("Daily report build failed");
  });

  it("serves last-good daily report from Redis when local L1 is empty", async () => {
    vi.mocked(isUpstashEnabled).mockReturnValue(true);
    vi.mocked(getScheduleByDate)
      .mockResolvedValueOnce([
        {
          gamePk: 777001,
          status: "Scheduled",
          gameDate: "2026-07-08",
          awayTeam: { name: "Boston Red Sox", abbreviation: "BOS" },
          homeTeam: { name: "New York Yankees", abbreviation: "NYY" },
          probablePitchers: { away: null, home: null },
          score: { home: 0, away: 0 },
          venue: "Yankee Stadium",
        },
      ] as any)
      .mockRejectedValueOnce(new Error("schedule timeout"));

    const first = await getSharedDailyReport("2026-07-08");
    expect(first.gameCount).toBe(1);
    expect(redisSetJson).toHaveBeenCalled();

    clearDailyReportCache("2026-07-08");
    resetDailyReportLastGoodForTests();

    const storedAt = Date.now() - 5_000;
    vi.mocked(redisGetJson).mockResolvedValueOnce({ report: first, storedAt });

    const fallback = await getSharedDailyReport("2026-07-08");
    expect(fallback.gameCount).toBe(1);
    expect(fallback.warnings.join(" ")).toContain("last-known daily report");
    expect(redisGetJson).toHaveBeenCalled();
  });
});
