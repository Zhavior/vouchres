import { describe, expect, it } from "vitest";
import { renderHrShareCardSvg } from "../server/services/share/hrShareCard";

describe("HR share card honesty", () => {
  const baseCandidate = {
    playerId: 1,
    playerName: "Test Player",
    team: "NYY",
    opponent: "BOS",
    hrScore: 72,
    dataConfidence: 80,
    riskTier: "medium",
    scoreBreakdown: {
      finalScore: 72,
      pitcherVulnerability: 60,
      hitterPower: 70,
      parkFactor: 55,
      recentForm: 50,
    },
    recentForm: {
      gamesChecked: 15,
      homeRuns: 3,
      extraBaseHits: 8,
      slugging: 0.5,
    },
  };

  it("never labels non-confirmed lineup rows as confirmed", () => {
    for (const lineupStatus of ["projected", "projected_unconfirmed", undefined, "unknown"]) {
      const svg = renderHrShareCardSvg(
        { ...baseCandidate, lineupStatus } as any,
        { theme: "dark", date: "2026-07-18" },
      );
      expect(svg).toContain("Official lineup not posted yet.");
      expect(svg).not.toContain("Confirmed lineup data available.");
    }
  });

  it("labels confirmed lineup rows as confirmed", () => {
    const svg = renderHrShareCardSvg(
      { ...baseCandidate, lineupStatus: "confirmed" } as any,
      { theme: "dark", date: "2026-07-18" },
    );
    expect(svg).toContain("Confirmed lineup data available.");
  });
});
