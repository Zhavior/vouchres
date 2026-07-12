import { apiClient } from "../apiClient";
import { americanLabel } from "../odds";
import type { TierOddsQuote } from "./parlayTierOddsResolver";
import type { ParlayMarketTier } from "./parlayMarketCatalog";

type LiveOddsApiQuote = {
  odds: number | null;
  source: "live" | "tbd";
  provider: string;
  detail: string;
};

function toTierOddsQuote(quote: LiveOddsApiQuote): TierOddsQuote {
  if (quote.source === "live" && quote.odds != null) {
    return {
      odds: quote.odds,
      source: "live",
      label: americanLabel(quote.odds),
      detail: quote.detail,
    };
  }
  return {
    odds: null,
    source: "tbd",
    label: "TBD",
    detail: quote.detail,
  };
}

export async function fetchParlayTierOddsBatch(input: {
  playerName: string;
  teamName?: string | null;
  homeTeam?: string | null;
  awayTeam?: string | null;
  tiers: ParlayMarketTier[];
}): Promise<Map<string, TierOddsQuote>> {
  const map = new Map<string, TierOddsQuote>();
  if (input.tiers.length === 0) return map;

  try {
    const payload = await apiClient.post<{ quotes: Record<string, LiveOddsApiQuote> }>(
      "/api/mlb/parlay-tier-odds/batch",
      {
        playerName: input.playerName,
        teamName: input.teamName,
        homeTeam: input.homeTeam,
        awayTeam: input.awayTeam,
        tiers: input.tiers.map((tier) => ({
          key: tier.id,
          marketCode: tier.marketCode,
          statTarget: tier.statTarget,
        })),
      },
    );

    for (const tier of input.tiers) {
      const quote = payload.quotes?.[tier.id];
      if (quote) map.set(tier.id, toTierOddsQuote(quote));
    }
  } catch {
    // Trust-first: silent fallback to research/TBD quotes already shown in picker.
  }

  return map;
}
