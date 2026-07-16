import { describe, expect, it } from "vitest";
import {
  buildSaveParlayPayload,
  normalizeParlaySlip,
} from "../src/lib/parlays/parlayBridge";
import { canonicalToParlay, parlayToCanonical } from "../src/domain/parlay";

describe("ParlayOS decision context persistence", () => {
  it("preserves notes and signal snapshots through canonical and UI shapes", () => {
    const canonical = normalizeParlaySlip({
      id: "decision-slip",
      title: "Focused Parlay",
      metadata: {
        savedContext: {
          slipNote: "Two independent game environments.",
          capturedAt: "2026-07-16T12:00:00.000Z",
        },
      },
      legs: [{
        id: "judge-hr",
        sport: "MLB",
        selection: "Aaron Judge 1+ Home Run",
        playerName: "Aaron Judge",
        playerId: "592450",
        gamePk: "777001",
        marketCode: "ANYTIME_HR",
        statTarget: 1,
        comparator: ">=",
        note: "Price must stay above +250.",
        addSnapshot: {
          reasoningSnapshot: "Strong power and park conditions.",
          riskSnapshot: "Lineup not confirmed.",
        },
      }],
    });

    const roundTrip = parlayToCanonical(canonicalToParlay(canonical));
    expect(roundTrip.metadata?.savedContext).toEqual(canonical.metadata?.savedContext);
    expect(roundTrip.legs[0].metadata?.note).toBe("Price must stay above +250.");
    expect(roundTrip.legs[0].metadata?.addSnapshot).toEqual({
      reasoningSnapshot: "Strong power and park conditions.",
      riskSnapshot: "Lineup not confirmed.",
    });
  });

  it("builds a readable backend explanation from pre-result context", () => {
    const slip = normalizeParlaySlip({
      id: "decision-slip",
      title: "Focused Parlay",
      metadata: { savedContext: { slipNote: "Kept this to two legs." } },
      legs: [{
        id: "judge-hr",
        selection: "Aaron Judge 1+ Home Run",
        playerName: "Aaron Judge",
        note: "Do not chase below +250.",
        addSnapshot: {
          reasoningSnapshot: "Strong park conditions.",
          riskSnapshot: "Weather may shift.",
        },
      }],
    });

    const payload = buildSaveParlayPayload(slip);
    expect(payload.explanation).toContain("Slip note: Kept this to two legs.");
    expect(payload.explanation).toContain("Aaron Judge: Note: Do not chase below +250.");
    expect(payload.explanation).toContain("Why: Strong park conditions.");
    expect(payload.explanation).toContain("Risk: Weather may shift.");
  });
});
