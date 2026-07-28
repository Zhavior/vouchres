import { describe, expect, it } from "vitest";

import {
  getHrDecisionHistory,
  materializeValidatedHrBoardAurora,
} from "../server/services/hubs/hrBoardAurora";

describe("HR Board Aurora materialization", () => {
  it("does not record projected or incomplete candidates", () => {
    const persisted = materializeValidatedHrBoardAurora({
      date: "2026-07-26",
      candidates: [
        {
          playerId: 1,
          playerName: "Projected Player",
          gamePk: 10,
          lineupStatus: "projected_unconfirmed",
          dataQuality: "projection_preview",
          estimatedHrProbability: 0.08,
          dataConfidence: 80,
        },
        {
          playerId: 2,
          playerName: "Missing Probability",
          gamePk: 11,
          lineupStatus: "confirmed",
          dataQuality: "partial",
          dataConfidence: 80,
        },
      ],
    });

    expect(persisted).toBe(0);
  });

  it("records only explicit source-backed probability and confidence", () => {
    const persisted = materializeValidatedHrBoardAurora({
      date: "2026-07-26",
      candidates: [
        {
          playerId: 3,
          playerName: "Confirmed Player",
          gamePk: 12,
          lineupStatus: "confirmed",
          dataQuality: "partial",
          estimatedHrProbability: 0.075,
          dataConfidence: 80,
          hrScore: 72,
          dataSource: "MLB Stats API + validated pipeline",
        },
      ],
    });

    const [event] = getHrDecisionHistory("mlb-hr:2026-07-26:12:3");
    const payload = event.payload as {
      assumptions: Array<{
        summary: string;
        weight: number;
        confidence: number;
      }>;
      modelVersion?: string;
    };

    expect(persisted).toBe(1);
    expect(payload.assumptions[0]).toMatchObject({
      summary: "Estimated HR probability 7.5%; data confidence 80%.",
      weight: 0.075,
      confidence: 0.8,
    });
    expect(payload.modelVersion).toBeUndefined();
  });
});
