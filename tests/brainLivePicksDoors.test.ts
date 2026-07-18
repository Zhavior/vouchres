import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../server/middleware/auth", () => ({
  getSupabaseAdmin: vi.fn(async () => {
    throw new Error("supabase unavailable in unit test");
  }),
}));

function hrSnapshot(hoursUntilStart: number, overrides: Record<string, unknown> = {}) {
  const now = Date.now();
  return {
    schemaVersion: "1.0",
    sport: "mlb",
    market: "home_run",
    eventId: "1",
    subjectId: "100",
    subjectLabel: "Test Slugger",
    team: "NYY",
    opponent: "BOS",
    observedAt: new Date(now).toISOString(),
    scheduledAt: new Date(now + hoursUntilStart * 60 * 60_000).toISOString(),
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
    ...overrides,
  };
}

vi.mock("../server/services/intelligence/centralBrain/mlbFeatureAdapter", () => ({
  mlbHrFeatureAdapter: {
    build: vi.fn(async () => [hrSnapshot(2)]),
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
    vi.resetModules();
  });

  it("returns live HR picks with door provenance when ledger is unavailable", async () => {
    const { getBrainMlbPicksForDate } = await import(
      "../server/services/intelligence/centralBrain/brainLedgerService"
    );
    const bundle = await getBrainMlbPicksForDate("2026-07-18", 20);

    expect(bundle.provenance.home_run).toBe("live_selection");
    expect(bundle.publicationStatus.home_run).toBe("decision");
    expect(bundle.doors.schedule.source).toContain("MLB Stats API");
    expect(bundle.engineVersions.home_run).toContain("brain-hr-selection");
    expect(bundle.picks.length).toBeGreaterThan(0);
    expect(bundle.picks[0]?.playerName).toBe("Test Slugger");
  });

  it("returns a labeled monitoring slate outside the freeze window", async () => {
    const { mlbHrFeatureAdapter } = await import(
      "../server/services/intelligence/centralBrain/mlbFeatureAdapter"
    );
    vi.mocked(mlbHrFeatureAdapter.build).mockImplementation(async () => [
      hrSnapshot(6, {
        eventId: "2",
        subjectId: "200",
        subjectLabel: "Monitor Hitter",
        team: "LAD",
        opponent: "SF",
        quality: "partial",
        eligibility: "preview",
        features: {
          rawHrScore: 78,
          dataConfidence: 60,
          hitterPower: 80,
          pitcherVulnerability: 65,
          recentForm: 70,
          riskTier: "Watch",
        },
        missingFeatures: ["lineup"],
        risks: ["Official lineup not posted yet"],
      }),
    ] as never);

    const { getBrainMlbPicksForDate } = await import(
      "../server/services/intelligence/centralBrain/brainLedgerService"
    );
    const bundle = await getBrainMlbPicksForDate("2026-07-18", 20);

    expect(bundle.provenance.home_run).toBe("monitoring");
    expect(bundle.publicationStatus.home_run).toBe("monitoring");
    expect(bundle.picks.length).toBeGreaterThan(0);
    expect(bundle.picks[0]?.playerName).toBe("Monitor Hitter");
    expect(bundle.picks[0]?.evidenceQuality).toBe("preview");
    expect(bundle.picks[0]?.risks[0]).toMatch(/Monitoring only/i);
    expect(bundle.performance.sampleWarning).toMatch(/Monitoring slate/i);
  });
});
