import { beforeEach, describe, expect, it, vi } from "vitest";

const queryResult = vi.fn();
const chain: any = {
  select: vi.fn(() => chain), eq: vi.fn(() => chain), in: vi.fn(() => chain), order: vi.fn(() => chain),
  limit: vi.fn(() => queryResult()),
};
vi.mock("../server/middleware/auth", () => ({
  getSupabaseAdmin: vi.fn(async () => ({ from: vi.fn(() => chain) })),
}));

import { evaluateBrainHrHistory } from "../server/services/intelligence/centralBrain/brainLearningService";

const validSnapshot = {
  schemaVersion: "1.0", sport: "mlb", market: "home_run", eventId: "1", subjectId: "2", subjectLabel: "Player",
  team: "NYY", opponent: "BOS", observedAt: "2026-07-12T16:00:00.000Z", scheduledAt: "2026-07-12T20:00:00.000Z",
  adapterVersion: "mlb-hr-features@1", quality: "full", eligibility: "eligible",
  features: { estimatedHrProbability: 0.2 }, missingFeatures: [], reasons: [], risks: [], evidence: [],
};

describe("Brain learning service", () => {
  beforeEach(() => vi.clearAllMocks());

  it("evaluates only settled probability snapshots", async () => {
    queryResult.mockResolvedValue({ data: [
      { engine_version: "engine@1", feature_snapshot: validSnapshot, brain_decision_outcomes: [{ result: "hit" }] },
      { engine_version: "engine@1", feature_snapshot: { ...validSnapshot, subjectId: "3" }, brain_decision_outcomes: [{ result: "miss" }] },
    ], error: null });
    const [record] = await evaluateBrainHrHistory();
    expect(record.samples).toBe(2);
    expect(record.evaluation).toMatchObject({ samples: 2, positives: 1 });
    expect(record.readyForJudgment).toBe(false);
  });

  it("excludes temporal leakage and missing probabilities", async () => {
    queryResult.mockResolvedValue({ data: [
      { engine_version: "engine@1", feature_snapshot: { ...validSnapshot, observedAt: validSnapshot.scheduledAt }, brain_decision_outcomes: [{ result: "hit" }] },
      { engine_version: "engine@1", feature_snapshot: { ...validSnapshot, features: {} }, brain_decision_outcomes: [{ result: "miss" }] },
    ], error: null });
    const [record] = await evaluateBrainHrHistory();
    expect(record.samples).toBe(0);
    expect(record.excluded).toEqual({ missingProbability: 1, invalidSnapshot: 0, temporalLeakage: 1 });
  });
});
