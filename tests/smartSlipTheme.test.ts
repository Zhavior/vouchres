import { describe, expect, it } from "vitest";
import {
  deriveSlipDisplayTitle,
  deriveSlipMarketChips,
  deriveSlipVisualTheme,
} from "../src/components/parlay/smart/smartSlipTheme";
import type { SmartParlaySlip } from "../src/domain/parlay";

function slip(partial: Partial<SmartParlaySlip>): SmartParlaySlip {
  return {
    id: "slip-1",
    sourceId: "src-abc123",
    publicId: "VOUCH-ABC123",
    title: "3-Leg Parlay",
    status: "pending",
    statusLabel: "Pending",
    summary: "3 legs",
    oddsLabel: "+450",
    legCount: 3,
    legs: [
      {
        id: "l1",
        playerName: "Aaron Judge",
        marketLabel: "Anytime HR",
        selection: "Aaron Judge Anytime HR",
        oddsLabel: "+180",
        headshotUrl: null,
        status: "pending",
        statusLabel: "Pending",
        resultLabel: "Pending",
        sport: "MLB",
        marketCode: "ANYTIME_HR",
        identityComplete: true,
      },
      {
        id: "l2",
        playerName: "Shohei Ohtani",
        marketLabel: "Anytime HR",
        selection: "Shohei Ohtani Anytime HR",
        oddsLabel: "+200",
        headshotUrl: null,
        status: "pending",
        statusLabel: "Pending",
        resultLabel: "Pending",
        sport: "MLB",
        marketCode: "ANYTIME_HR",
        identityComplete: true,
      },
      {
        id: "l3",
        playerName: "Juan Soto",
        marketLabel: "Anytime HR",
        selection: "Juan Soto Anytime HR",
        oddsLabel: "+190",
        headshotUrl: null,
        status: "pending",
        statusLabel: "Pending",
        resultLabel: "Pending",
        sport: "MLB",
        marketCode: "ANYTIME_HR",
        identityComplete: true,
      },
    ],
    isLiveLike: true,
    identity: { complete: true, completeLegs: 3, totalLegs: 3, missingFields: [] },
    proofPickId: null,
    ...partial,
  };
}

describe("smartSlipTheme", () => {
  it("replaces generic titles with player names", () => {
    expect(deriveSlipDisplayTitle(slip({}))).toBe("Aaron Judge · Shohei Ohtani · Juan Soto");
  });

  it("themes HR-only slips as HR accent", () => {
    expect(deriveSlipVisualTheme(slip({})).id).toBe("hr");
  });

  it("themes mixed-market slips differently from HR-only", () => {
    const mixed = slip({
      legs: [
        slip({}).legs[0],
        {
          ...slip({}).legs[1],
          marketCode: "STRIKEOUTS",
        },
      ],
      legCount: 2,
    });
    expect(deriveSlipVisualTheme(mixed).id.startsWith("mixed")).toBe(true);
  });

  it("extracts unique market chips", () => {
    expect(deriveSlipMarketChips(slip({}).legs)).toEqual(["HR"]);
  });
});
