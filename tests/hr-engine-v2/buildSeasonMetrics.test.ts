import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../server/services/mlb/statcastClient", () => ({
  getSingleYearStatcastBatterMap: vi.fn(),
  getBattedBallProfileMapResult: vi.fn(),
}));

import {
  getBattedBallProfileMapResult,
  getSingleYearStatcastBatterMap,
} from "../../server/services/mlb/statcastClient";
import { buildSeasonMetrics } from "../../server/services/mlb/hr-engine/v2/adapters/buildSeasonMetrics";

describe("buildSeasonMetrics", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("builds season metrics from season-only Statcast inputs", async () => {
    vi.mocked(getSingleYearStatcastBatterMap).mockResolvedValue({
      42: {
        playerId: 42,
        pa: 300,
        ba: 0.271,
        xba: 0.281,
        slg: 0.501,
        xslg: 0.525,
        woba: 0.349,
        xwoba: 0.371,
        barrelPct: 14.2,
        hardHitPct: 48.5,
        avgExitVelo: 92.4,
        avgLaunchAngle: 17.3,
        sweetSpotPct: 39.1,
      },
    });

    vi.mocked(getBattedBallProfileMapResult).mockResolvedValue({
      map: {
        42: {
          playerId: 42,
          bbe: 180,
          pullPct: 44,
          straightPct: 33,
          oppoPct: 23,
          gbPct: 36,
          fbPct: 41,
          ldPct: 23,
          pullAirPct: 18,
        },
      },
      feedStatus: "ok",
    });

    const result = await buildSeasonMetrics(42, 2026);

    expect(result.warnings.join(" ")).toMatch(/xwOBAcon unavailable/i);
    expect(result.seasonMetrics).not.toBeNull();
    expect(result.seasonMetrics?.EV).toBe(92.4);
    expect(result.seasonMetrics?.FB_percent).toBe(0.41);
    expect(result.seasonMetrics?.HH_percent).toBe(0.485);
    expect(result.seasonMetrics?.Barrel_percent).toBe(0.142);
    expect(result.seasonMetrics?.xwOBAcon).toBeNull();
    expect(result.seasonMetrics?.pull_air_percent).toBe(0.18);
    expect(result.seasonMetrics?.avg_launch_angle).toBe(17.3);
    expect(result.seasonMetrics?.sweet_spot_percent).toBe(0.391);
  });

  it("returns null when both backing sources are absent", async () => {
    vi.mocked(getSingleYearStatcastBatterMap).mockResolvedValue({});
    vi.mocked(getBattedBallProfileMapResult).mockResolvedValue({
      map: {},
      feedStatus: "ok",
    });

    const result = await buildSeasonMetrics(42, 2026);

    expect(result.seasonMetrics).toBeNull();
    expect(result.warnings.join(" ")).toMatch(/No season Statcast quality/i);
  });

  it("surfaces feed warnings without fabricating missing inputs", async () => {
    vi.mocked(getSingleYearStatcastBatterMap).mockResolvedValue({
      42: {
        playerId: 42,
        pa: 300,
        ba: 0.271,
        xba: 0.281,
        slg: 0.501,
        xslg: 0.525,
        woba: 0.349,
        xwoba: 0.371,
        barrelPct: 14.2,
        hardHitPct: 48.5,
        avgExitVelo: 92.4,
        avgLaunchAngle: 17.3,
        sweetSpotPct: 39.1,
      },
    });

    vi.mocked(getBattedBallProfileMapResult).mockResolvedValue({
      map: {},
      feedStatus: "unavailable",
      errorMessage: "timeout",
    });

    const result = await buildSeasonMetrics(42, 2026);

    expect(result.seasonMetrics).toBeNull();
    expect(result.warnings.join(" ")).toMatch(/withheld rather than zero-filled/i);
    expect(result.warnings.join(" ")).toMatch(/feed unavailable/i);
    expect(result.warnings.join(" ")).toMatch(/timeout/i);
  });
});
