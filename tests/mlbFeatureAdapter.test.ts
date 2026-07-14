import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  "server/services/intelligence/centralBrain/mlbFeatureAdapter.ts",
  "utf8",
);

describe("mlb HR feature adapter honesty", () => {
  it("builds brain features from confirmed candidates only", () => {
    expect(source).toContain("const candidates = board.candidates");
    expect(source).not.toContain("board.projectedCandidates");
  });
});
