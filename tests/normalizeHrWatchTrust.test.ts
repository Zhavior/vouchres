import { describe, expect, it } from "vitest";
import { buildBoard } from "../src/features/hr/utils/normalizeHrWatch";

describe("normalizeHrWatch trust labels", () => {
  it("honors isConfirmed on confirmed-bucket rows", () => {
    const board = buildBoard({
      candidates: [{
        playerName: "Aaron Judge",
        playerId: 592450,
        team: "NYY",
        opponent: "BOS",
        hrScore: 88,
        isConfirmed: true,
      }],
    });
    expect(board.confirmed[0]?.truthStatus).toBe("official");
  });

  it("does not invent confirmed from unlabeled candidate rows", () => {
    const board = buildBoard({
      candidates: [{
        playerName: "Mystery Bat",
        playerId: 1,
        team: "NYY",
        opponent: "BOS",
        hrScore: 70,
      }],
    });
    expect(board.confirmed[0]?.truthStatus).not.toBe("official");
  });

  it("injects Official lineup warning on every projected row", () => {
    const board = buildBoard({
      projectedCandidates: [{
        playerName: "Juan Soto",
        playerId: 665742,
        team: "NYM",
        opponent: "PHI",
        hrScore: 91,
      }],
    });
    expect(board.curated[0]?.truthStatus).toBe("projected");
    expect(
      board.curated[0]?.warnings.some((w) => /official lineup not posted yet/i.test(w)),
    ).toBe(true);
  });

  it("treats isConfirmed false as projected even with confirmed status text", () => {
    const board = buildBoard({
      candidates: [{
        playerName: "Scratch Risk",
        playerId: 2,
        team: "LAD",
        opponent: "SF",
        hrScore: 80,
        lineupStatus: "confirmed",
        isConfirmed: false,
      }],
    });
    expect(board.confirmed[0]?.truthStatus).toBe("projected");
    expect(
      board.confirmed[0]?.warnings.some((w) => /official lineup not posted yet/i.test(w)),
    ).toBe(true);
  });
});
