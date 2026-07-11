import { describe, expect, it } from "vitest";
import { mergeTierOddsQuote, resolveTierOdds } from "../src/lib/parlays/parlayTierOddsResolver";
import { PARLAY_MARKET_FAMILIES } from "../src/lib/parlays/parlayMarketCatalog";

describe("parlayTierOddsResolver", () => {
  const hrTier = PARLAY_MARKET_FAMILIES.find((f) => f.id === "home_runs")!.tiers[0];

  it("uses research prop hint when tier matches", () => {
    const quote = resolveTierOdds({
      tier: hrTier,
      propHint: {
        id: "p1",
        market: "Home Run",
        spec: "Aaron Judge Anytime HR",
        odds: 450,
      },
    });
    expect(quote.source).toBe("live");
    expect(quote.odds).toBe(450);
  });

  it("returns TBD when no priced market exists", () => {
    const quote = resolveTierOdds({ tier: hrTier });
    expect(quote.source).toBe("tbd");
    expect(quote.odds).toBeNull();
    expect(quote.label).toBe("TBD");
  });

  it("matches player proposition catalog", () => {
    const quote = resolveTierOdds({
      tier: hrTier,
      propositions: [{
        id: "prop-1",
        market: "Home Run",
        spec: "Anytime HR",
        odds: 380,
      }],
    });
    expect(quote.source).toBe("live");
    expect(quote.odds).toBe(380);
  });

  it("prefers research odds over live feed fallback", () => {
    const research = resolveTierOdds({
      tier: hrTier,
      propHint: { id: "p1", market: "HR", spec: "Anytime", odds: 400 },
    });
    const merged = mergeTierOddsQuote(research, {
      odds: 350,
      source: "live",
      label: "+350",
      detail: "Live book",
    });
    expect(merged.odds).toBe(400);
  });

  it("uses live feed when research is TBD", () => {
    const research = resolveTierOdds({ tier: hrTier });
    const merged = mergeTierOddsQuote(research, {
      odds: 350,
      source: "live",
      label: "+350",
      detail: "Live book",
    });
    expect(merged.odds).toBe(350);
    expect(merged.source).toBe("live");
  });
});
