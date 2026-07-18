import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../server/middleware/auth", () => ({
  getSupabaseAdmin: vi.fn(async () => {
    throw new Error("supabase unavailable in unit test");
  }),
}));

vi.mock("../server/services/intelligence/centralBrain/mlbFeatureAdapter", () => ({
  mlbHrFeatureAdapter: {
    build: vi.fn(async () => {
      const now = Date.now();
      return [
        {
          schemaVersion: "1.0",
          sport: "mlb",
          market: "home_run",
          eventId: "1",
          subjectId: "100",
          subjectLabel: "Test Slugger",
          team: "NYY",
          opponent: "BOS",
          // Must be inside the 4h decision window with fresh evidence.
          observedAt: new Date(now).toISOString(),
          scheduledAt: new Date(now + 2 * 60 * 60_000).toISOString(),
          adapterVersion: "mlb-hr-features@1",
          quality: "full",
          eligibility: "eligible",
          features: {
            rawHrScore: 88,
            dataConfidence: 80,
            hitterPower: 85,
            pitcherVulnerability: 70,
            recentForm: 72,
            riskTier: "Elite",
          },
          missingFeatures: [],
          reasons: ["Power"],
          risks: [],
          evidence: [],
        },
      ];
    }),
  },
}));

vi.mock("../server/services/intelligence/centralBrain/mlbStolenBaseAdapter", () => ({
  mlbStolenBaseFeatureAdapter: { build: vi.fn(async () => []) },
}));

vi.mock("../server/services/intelligence/centralBrain/mlbPitcherKAdapter", () => ({
  mlbPitcherKFeatureAdapter: { build: vi.fn(async () => []) },
  BRAIN_PITCHER_K_TARGET: 5,
}));

vi.mock("../server/services/mlb/mlbClient", () => ({
  todayISO: () => "2026-07-18",
  getScheduleByDate: vi.fn(async () => []),
  getGameFeed: vi.fn(async () => null),
}));

vi.mock("../server/services/mlb/hrFeedService", () => ({
  getTodayHomeRuns: vi.fn(async () => []),
}));

describe("Brain live picks from MLB doors", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns live HR picks with door provenance when ledger is unavailable", async () => {
    const { getBrainMlbPicksForDate } = await import(
      "../server/services/intelligence/centralBrain/brainLedgerService"
    );
    const bundle = await getBrainMlbPicksForDate("2026-07-18", 20);

    expect(bundle.provenance.home_run).toBe("live_selection");
    expect(bundle.doors.schedule.source).toContain("MLB Stats API");
    expect(bundle.engineVersions.home_run).toContain("brain-hr-selection");
    expect(bundle.picks.length).toBeGreaterThan(0);
    expect(bundle.picks[0]?.playerName).toBe("Test Slugger");
  });
});
