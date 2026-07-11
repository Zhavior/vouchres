import { describe, expect, it } from "vitest";
import { buildParlayProofPayload, computeParlayProofHash } from "../server/lib/parlayProofHash";

describe("parlayProofHash", () => {
  it("produces a stable sha256 hash for canonical parlay payload", () => {
    const input = {
      id: "pick-1",
      created_at: "2026-07-10T10:00:00.000Z",
      locked_at: "2026-07-10T12:00:00.000Z",
      odds_decimal: 4.5,
      stake_units: 1,
      legs: [
        {
          leg_index: 0,
          event_key: "MLB_123_TEAM_PLAYER_ANYTIME_HR_1_GTE",
          market_code: "ANYTIME_HR",
          player_id: "660271",
          stat_target: 1,
          comparator: ">=",
          selection: "Shohei Ohtani 1+ HR",
          odds_decimal: 2.1,
        },
      ],
    };

    const first = computeParlayProofHash(input);
    const second = computeParlayProofHash(input);

    expect(first).toHaveLength(64);
    expect(first).toBe(second);
    expect(buildParlayProofPayload(input).legs[0].event_key).toBe("MLB_123_TEAM_PLAYER_ANYTIME_HR_1_GTE");
  });

  it("changes hash when locked_at changes", () => {
    const base = {
      id: "pick-1",
      created_at: "2026-07-10T10:00:00.000Z",
      odds_decimal: 2,
      stake_units: 1,
      legs: [],
    };

    const beforeLock = computeParlayProofHash({ ...base, locked_at: null });
    const afterLock = computeParlayProofHash({ ...base, locked_at: "2026-07-10T12:00:00.000Z" });

    expect(beforeLock).not.toBe(afterLock);
  });
});
