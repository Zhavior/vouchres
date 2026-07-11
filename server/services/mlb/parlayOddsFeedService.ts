/**
 * Optional live odds feed via The Odds API (ODDS_API_KEY).
 * Trust-first: returns null when key missing or price not found — never synthetic odds.
 */

export type LiveOddsQuote = {
  odds: number | null;
  source: "live" | "tbd";
  provider: string;
  detail: string;
};

function parseAmerican(value: unknown): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) && n !== 0 ? n : null;
}

/** Best-effort live quote — requires ODDS_API_KEY and a matching upstream market. */
export async function fetchLiveTierOdds(input: {
  playerName?: string | null;
  marketCode?: string | null;
  statTarget?: number | null;
}): Promise<LiveOddsQuote> {
  const key = process.env.ODDS_API_KEY?.trim();
  if (!key) {
    return {
      odds: null,
      source: "tbd",
      provider: "odds_api",
      detail: "ODDS_API_KEY not configured — using research prices only.",
    };
  }

  const marketCode = String(input.marketCode ?? "").toUpperCase();
  const oddsApiMarket =
    marketCode === "ANYTIME_HR" ? "batter_home_runs"
      : marketCode === "HIT" ? "batter_hits"
      : marketCode === "TOTAL_BASES" ? "batter_total_bases"
      : marketCode === "STRIKEOUTS" ? "pitcher_strikeouts"
      : null;

  if (!oddsApiMarket) {
    return {
      odds: null,
      source: "tbd",
      provider: "odds_api",
      detail: "No Odds API market mapping for this tier yet.",
    };
  }

  try {
    const url = new URL("https://api.the-odds-api.com/v4/sports/baseball_mlb/odds");
    url.searchParams.set("apiKey", key);
    url.searchParams.set("regions", "us");
    url.searchParams.set("markets", oddsApiMarket);
    url.searchParams.set("oddsFormat", "american");

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(8000) });
    if (!res.ok) {
      return {
        odds: null,
        source: "tbd",
        provider: "odds_api",
        detail: `Odds API returned ${res.status}.`,
      };
    }

    const events = await res.json() as Array<Record<string, unknown>>;
    const playerNeedle = String(input.playerName ?? "").toLowerCase().split(" ").filter(Boolean);
    const target = Number(input.statTarget ?? 1);

    for (const event of events) {
      const bookmakers = Array.isArray(event.bookmakers) ? event.bookmakers : [];
      for (const book of bookmakers) {
        const markets = Array.isArray((book as Record<string, unknown>).markets)
          ? (book as Record<string, unknown>).markets as Array<Record<string, unknown>>
          : [];
        for (const market of markets) {
          if (String(market.key) !== oddsApiMarket) continue;
          const outcomes = Array.isArray(market.outcomes) ? market.outcomes : [];
          for (const outcome of outcomes) {
            const desc = String(outcome.description ?? outcome.name ?? "").toLowerCase();
            const point = Number(outcome.point ?? target);
            const nameMatch = playerNeedle.length === 0
              || playerNeedle.every((part) => desc.includes(part));
            if (!nameMatch) continue;
            if (Number.isFinite(point) && point !== target && marketCode !== "ANYTIME_HR") continue;
            const odds = parseAmerican(outcome.price);
            if (odds != null) {
              return {
                odds,
                source: "live",
                provider: "odds_api_live",
                detail: `Live book price via The Odds API (${String((book as Record<string, unknown>).title ?? "book")}).`,
              };
            }
          }
        }
      }
    }

    return {
      odds: null,
      source: "tbd",
      provider: "odds_api",
      detail: "No matching live price found for this player/tier.",
    };
  } catch (err) {
    return {
      odds: null,
      source: "tbd",
      provider: "odds_api",
      detail: err instanceof Error ? err.message : "Odds API request failed.",
    };
  }
}
