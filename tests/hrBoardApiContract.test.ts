import { describe, expect, it } from "vitest";
import { HrBoardContractError, parseHrBoardApiResponse } from "../src/api/hrBoardApiContract";

const base = {
  date: "2026-07-28",
  gameCount: 1,
  generatedAt: "2026-07-28T12:00:00.000Z",
  dataQuality: "projection_preview",
  disclaimer: "Research only",
};

describe("HR board API runtime contract", () => {
  it("hydrates compact transport aliases and preserves response provenance", () => {
    const projected = [{ playerId: 1, playerName: "Signal Hitter", lineupStatus: "projected_unconfirmed" }];
    const board = parseHrBoardApiResponse({
      ...base,
      contractVersion: "hr-board.v2",
      transportMode: "compact",
      candidates: [],
      projectedCandidates: projected,
      meta: {
        requestId: "req_hr_1",
        source: "validated_hr_board_last_good",
        warnings: ["Serving last good snapshot"],
      },
    });

    expect(board.rows).toEqual(projected);
    expect(board.allProjectedCandidates).toEqual(projected);
    expect(board.candidateBuckets?.projected).toEqual(projected);
    expect(board.meta).toMatchObject({
      requestId: "req_hr_1",
      source: "validated_hr_board_last_good",
    });
  });

  it("adapts the explicitly allowed MLB direct fallback instead of returning an empty board", () => {
    const directRow = { playerId: 2, playerName: "Fallback Hitter", projectionType: "Projection Preview" };
    const board = parseHrBoardApiResponse({
      ...base,
      dataQuality: "partial",
      games: [{ rows: [directRow] }],
    });

    expect(board.projectedCandidates).toEqual([directRow]);
    expect(board.rows).toEqual([directRow]);
  });

  it("keeps mlbapi_ stub ids from the client Stats API fallback", () => {
    const stubRow = { playerId: "mlbapi_676130", playerName: "Stub Hitter", headshot: "https://img.mlbstatic.com/mlb-photos/image/upload/v1/people/676130/headshot/67/current" };
    const board = parseHrBoardApiResponse({
      ...base,
      dataQuality: "partial",
      games: [{ rows: [stubRow] }],
    });

    expect(board.rows).toHaveLength(1);
    expect(board.rows[0]?.playerName).toBe("Stub Hitter");
  });

  it("rejects schema drift instead of turning it into an honest-looking empty slate", () => {
    expect(() => parseHrBoardApiResponse({ gameCount: "sixteen", rows: [] })).toThrow(HrBoardContractError);
  });
});

