import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSupabaseAdmin } from "../server/middleware/auth";

const upsert = vi.fn();
const pairLimit = vi.fn();
const outcomeLimit = vi.fn();
const pairQuery: any = { select: vi.fn(() => pairQuery), order: vi.fn(() => pairQuery), limit: pairLimit };
const outcomeQuery: any = { select: vi.fn(() => outcomeQuery), limit: outcomeLimit };
const from = vi.fn((table: string) => table === "hr_game_outcomes" ? outcomeQuery : pairQuery);
vi.mock("../server/middleware/auth", () => ({ getSupabaseAdmin: vi.fn(async () => ({ from })) }));

import {
  buildHrObservationKey,
  evaluatePairedHrHistory,
  persistHrV2PairedPrediction,
} from "../server/services/intelligence/centralBrain/hrPairedEvaluationService";

const beforePitch = "2026-07-12T18:00:00.000Z";
const afterPitch = "2026-07-12T21:00:00.000Z";

function pair(index: number, challengerProbability = 0.1) {
  return {
    observation_key: buildHrObservationKey("2026-07-12", "game-1", index),
    game_pk: "game-1",
    player_id: String(index),
    scheduled_first_pitch: afterPitch,
    prediction_generated_at: beforePitch,
    incumbent_probability: 0.2,
    incumbent_engine_version: "production-hr-score",
    challenger_probability: challengerProbability,
    challenger_engine_version: "hr-probability-v2-seed",
  };
}

describe("paired HR evaluation bridge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    from.mockImplementation((table: string) => table === "hr_game_outcomes" ? outcomeQuery : pairQuery);
    vi.mocked(getSupabaseAdmin).mockResolvedValue({ from } as any);
    upsert.mockResolvedValue({ error: null });
    pairLimit.mockResolvedValue({ data: [], error: null });
    outcomeLimit.mockResolvedValue({ data: [], error: null });
  });

  it("uses the canonical date/game/player observation key", () => {
    expect(buildHrObservationKey("2026-07-12", 123, 456)).toBe("mlb:home_run:2026-07-12:123:456");
  });

  it("persists one idempotent paired row with both versions and timing", async () => {
    from.mockImplementationOnce(() => ({ upsert }));
    await persistHrV2PairedPrediction({
      date: "2026-07-12", gamePk: 123, playerId: 456,
      scheduledFirstPitch: afterPitch, predictionGeneratedAt: beforePitch,
      incumbentProbability: 0.2, challengerProbability: 0.1, challengerEngineVersion: "v2",
    });
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({
      observation_key: "mlb:home_run:2026-07-12:123:456",
      incumbent_engine_version: "production-hr-score",
      challenger_engine_version: "v2",
    }), { onConflict: "observation_key", ignoreDuplicates: true });
  });

  it("rejects temporal leakage before persistence", async () => {
    await expect(persistHrV2PairedPrediction({
      date: "2026-07-12", gamePk: 123, playerId: 456,
      scheduledFirstPitch: beforePitch, predictionGeneratedAt: afterPitch,
      incumbentProbability: 0.2, challengerProbability: 0.1, challengerEngineVersion: "v2",
    })).rejects.toThrow("before first pitch");
  });

  it("pairs by identity and drops missing outcomes instead of matching array positions", async () => {
    pairLimit.mockResolvedValue({ data: [pair(1), pair(2)], error: null });
    outcomeLimit.mockResolvedValue({ data: [{ game_pk: "game-1", player_id: "2", hr_flag: true }], error: null });
    const report = await evaluatePairedHrHistory();
    expect(report.pairedObservations).toBe(1);
    expect(report.positiveOutcomes).toBe(1);
    expect(report.dropped.missingOutcome).toBe(1);
    expect(report.status).toBe("INSUFFICIENT_DATA");
  });

  it("rejects leaked rows and never reports them as paired", async () => {
    pairLimit.mockResolvedValue({ data: [{ ...pair(1), prediction_generated_at: afterPitch }], error: null });
    outcomeLimit.mockResolvedValue({ data: [{ game_pk: "game-1", player_id: "1", hr_flag: false }], error: null });
    const report = await evaluatePairedHrHistory();
    expect(report.pairedObservations).toBe(0);
    expect(report.dropped.temporalLeakage).toBe(1);
  });

  it("drops rows missing either model probability", async () => {
    pairLimit.mockResolvedValue({ data: [{ ...pair(1), challenger_probability: null }, { ...pair(2), incumbent_probability: null }], error: null });
    outcomeLimit.mockResolvedValue({ data: [
      { game_pk: "game-1", player_id: "1", hr_flag: false },
      { game_pk: "game-1", player_id: "2", hr_flag: false },
    ], error: null });
    const report = await evaluatePairedHrHistory();
    expect(report.pairedObservations).toBe(0);
    expect(report.dropped.invalidPrediction).toBe(2);
  });

  it("keeps a qualifying challenger report-only", async () => {
    const rows = Array.from({ length: 250 }, (_, index) => pair(index, 0.05));
    const outcomes = rows.map((row, index) => ({ game_pk: row.game_pk, player_id: row.player_id, hr_flag: index < 20 }));
    pairLimit.mockResolvedValue({ data: rows, error: null });
    outcomeLimit.mockResolvedValue({ data: outcomes, error: null });
    const report = await evaluatePairedHrHistory();
    expect(report.promotionEligible).toBe(true);
    expect(report.status).toBe("CHALLENGER_ELIGIBLE_FOR_PROMOTION");
    expect(report.reasons).toEqual([]);
    expect(report.challengerModelVersions).toEqual(["hr-probability-v2-seed"]);
  });
});
