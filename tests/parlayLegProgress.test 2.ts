import { describe, expect, it } from "vitest";
import { deriveLegProgress, deriveSlipProgress } from "../src/lib/parlayLegProgress";

describe("parlayLegProgress", () => {
  it("shows awaiting HR for pending anytime HR legs", () => {
    const progress = deriveLegProgress({
      status: "pending",
      marketCode: "ANYTIME_HR",
      selection: "Aaron Judge HR",
    });
    expect(progress).toEqual({ current: 0, target: 1, label: "Awaiting HR" });
  });

  it("shows hit when leg is won", () => {
    const progress = deriveLegProgress({
      status: "won",
      marketCode: "ANYTIME_HR",
      selection: "Aaron Judge HR",
    });
    expect(progress?.current).toBe(1);
    expect(progress?.label).toBe("HR hit");
  });

  it("derives slip progress from first open HR leg", () => {
    const progress = deriveSlipProgress([
      { status: "pending", marketCode: "ANYTIME_HR", playerName: "Judge" },
      { status: "pending", marketCode: "HIT", playerName: "Other" },
    ]);
    expect(progress?.label).toBe("Awaiting HR");
  });
});
