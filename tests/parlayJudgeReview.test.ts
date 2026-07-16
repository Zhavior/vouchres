import { describe, expect, it } from "vitest";
import { computeJudgeVerdict } from "../src/components/parlay/types/parlayOsTypes";

const officialLeg = {
  id: "judge-hr",
  playerName: "Aaron Judge",
  selection: "Aaron Judge 1+ Home Run",
  playerId: "592450",
  gamePk: "777001",
  teamId: "147",
  marketCode: "ANYTIME_HR",
  odds: 275,
  dataStatus: "official" as const,
  source: "manual",
};

describe("ParlayOS evidence-based Judge Review", () => {
  it("does not invent confidence when no confidence exists", () => {
    const verdict = computeJudgeVerdict([officialLeg]);

    expect(verdict.score).toBe(100);
    expect(verdict.findings).toHaveLength(0);
    expect(verdict.reasons.join(" ")).not.toContain("confidence");
    expect(verdict.reviewLabel).toBe("Structure score");
  });

  it("identifies projected and unpriced legs from visible evidence", () => {
    const verdict = computeJudgeVerdict([
      officialLeg,
      {
        ...officialLeg,
        id: "soto-hr",
        playerName: "Juan Soto",
        playerId: "665742",
        gamePk: "777002",
        teamId: "121",
        odds: null,
        dataStatus: "projected",
        riskSnapshot: "Weather could shift.",
      },
    ]);

    expect(verdict.highestRiskLeg?.id).toBe("soto-hr");
    expect(verdict.highestRiskLeg?.reasons).toContain("Lineup or game data is projected");
    expect(verdict.highestRiskLeg?.reasons).toContain("Current odds are unavailable");
    expect(verdict.saferConstruction?.moveToWaitingLegId).toBe("soto-hr");
    expect(verdict.tier).not.toBe("excellent");
  });

  it("flags duplicate players, same-game concentration, and HR concentration", () => {
    const verdict = computeJudgeVerdict([
      officialLeg,
      { ...officialLeg, id: "judge-hits", marketCode: "HIT", odds: -150 },
      { ...officialLeg, id: "stanton-hr", playerName: "Giancarlo Stanton", playerId: "519317" },
      { ...officialLeg, id: "volpe-hr", playerName: "Anthony Volpe", playerId: "683011" },
    ]);

    expect(verdict.findings.some((finding) => finding.id.startsWith("duplicate-player"))).toBe(true);
    expect(verdict.findings.some((finding) => finding.id.startsWith("correlation"))).toBe(true);
    expect(verdict.findings.some((finding) => finding.id === "hr-concentration")).toBe(true);
    expect(verdict.weakLegIds).toContain("judge-hr");
  });

  it("treats missing grading identity as a high-severity blocker", () => {
    const verdict = computeJudgeVerdict([{
      id: "unknown-player",
      selection: "Unknown prop",
      odds: 200,
      dataStatus: "official",
      source: "manual",
    }]);

    expect(verdict.findings[0]).toMatchObject({ severity: "high" });
    expect(verdict.highestRiskLeg?.reasons).toContain("Missing player, game, or market identity");
    expect(["caution", "risky", "reject"]).toContain(verdict.tier);
  });
});
