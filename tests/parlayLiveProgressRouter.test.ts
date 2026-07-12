import { describe, expect, it, vi } from "vitest";
import { fetchParlayLiveProgressBySport } from "../server/services/parlays/parlayLiveProgressRouter";

vi.mock("../server/services/mlb/parlayLiveProgressService", () => ({
  fetchParlayLegProgressBatch: vi.fn(async (legs) =>
    legs.map((leg: { id?: string }) => ({
      id: leg.id,
      current: 1,
      target: 1,
      label: "Home runs",
      gameStatus: "In Progress",
    })),
  ),
}));

vi.mock("../server/services/nfl/nflLiveProgressService", () => ({
  fetchNflParlayLegProgressBatch: vi.fn(async (legs) =>
    legs.map((leg: { id?: string }) => ({
      id: leg.id,
      current: null,
      target: 1,
      label: "Progress",
      gameStatus: "nfl_live_progress_not_yet_supported",
    })),
  ),
}));

describe("parlayLiveProgressRouter", () => {
  it("dispatches MLB legs to the MLB provider", async () => {
    const results = await fetchParlayLiveProgressBySport([
      { id: "mlb-1", sport: "mlb", gamePk: "777", playerId: "592450", marketCode: "ANYTIME_HR" },
    ]);
    expect(results[0]?.current).toBe(1);
    expect(results[0]?.label).toBe("Home runs");
  });

  it("dispatches NFL legs to the NFL stub", async () => {
    const results = await fetchParlayLiveProgressBySport([
      { id: "nfl-1", sport: "nfl", gamePk: "401", playerId: "123", marketCode: "TOUCHDOWN" },
    ]);
    expect(results[0]?.current).toBeNull();
    expect(results[0]?.gameStatus).toBe("nfl_live_progress_not_yet_supported");
  });

  it("handles mixed-sport slips", async () => {
    const results = await fetchParlayLiveProgressBySport([
      { id: "mlb-1", sport: "mlb", gamePk: "777", playerId: "1", marketCode: "ANYTIME_HR" },
      { id: "nfl-1", sport: "nfl", gamePk: "401", playerId: "2", marketCode: "TOUCHDOWN" },
    ]);
    expect(results).toHaveLength(2);
    expect(results.find((r) => r.id === "mlb-1")?.current).toBe(1);
    expect(results.find((r) => r.id === "nfl-1")?.current).toBeNull();
  });
});
