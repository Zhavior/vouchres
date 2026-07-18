/**
 * Optional live odds feed via The Odds API (ODDS_API_KEY).
 * Trust-first: returns null when key missing or price not found — never synthetic odds.
 *
 * Player props use the per-event endpoint documented at:
 * https://the-odds-api.com/sports-odds-data/betting-markets.html
 */

export type LiveOddsQuote = {
  odds: number | null;
  source: "live" | "tbd";
  provider: string;
  detail: string;
};

export type OddsApiMarketSpec = {
  marketKey: string;
  overPoint: number;
};

const ODDS_API_BASE = "https://api.the-odds-api.com/v4/sports/baseball_mlb";

/** Strip apiKey from Odds API URLs before logging or error messages. */
export function redactOddsApiUrl(url: string): string {
  try {
    const u = new URL(url);
    if (u.searchParams.has("apiKey")) u.searchParams.set("apiKey", "REDACTED");
    return u.toString();
  } catch {
    return String(url).replace(/([?&]apiKey=)[^&]*/gi, "$1REDACTED");
  }
}

function parseAmerican(value: unknown): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) && n !== 0 ? n : null;
}

function normalizeText(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

/** Map ParlayOS tier → Odds API market key + Over line. */
export function mapTierToOddsApiMarket(
  marketCode: string,
  statTarget: number,
): OddsApiMarketSpec | null {
  const code = String(marketCode ?? "").toUpperCase();
  const target = Math.max(1, Number(statTarget) || 1);
  const overPoint = target - 0.5;
  const useAlternate = target > 1;

  switch (code) {
    case "ANYTIME_HR":
      return {
        marketKey: target <= 1 ? "batter_home_runs" : "batter_home_runs_alternate",
        overPoint: target <= 1 ? 0.5 : overPoint,
      };
    case "HIT":
      return {
        marketKey: useAlternate ? "batter_hits_alternate" : "batter_hits",
        overPoint,
      };
    case "TOTAL_BASES":
      return {
        marketKey: useAlternate ? "batter_total_bases_alternate" : "batter_total_bases",
        overPoint,
      };
    case "RUN":
      return {
        marketKey: useAlternate ? "batter_runs_scored_alternate" : "batter_runs_scored",
        overPoint,
      };
    case "RBI":
      return {
        marketKey: useAlternate ? "batter_rbis_alternate" : "batter_rbis",
        overPoint,
      };
    case "STOLEN_BASE":
      return {
        marketKey: useAlternate ? "batter_stolen_bases_alternate" : "batter_stolen_bases",
        overPoint,
      };
    case "STRIKEOUTS":
      return {
        marketKey: useAlternate ? "pitcher_strikeouts_alternate" : "pitcher_strikeouts",
        overPoint,
      };
    case "PITCHER_OUTS":
      return {
        marketKey: useAlternate ? "pitcher_outs_alternate" : "pitcher_outs",
        overPoint,
      };
    default:
      return null;
  }
}

export function teamMatchesOddsApiName(query: string, eventTeamName: string): boolean {
  const q = normalizeText(query);
  const full = normalizeText(eventTeamName);
  if (!q || !full) return false;
  if (q === full) return true;
  if (full.includes(q) || q.includes(full)) return true;

  const lastWord = full.split(/\s+/).pop() ?? "";
  if (lastWord && (lastWord.startsWith(q) || q.startsWith(lastWord))) return true;

  const initials = eventTeamName
    .split(/\s+/)
    .map((part) => part[0] ?? "")
    .join("")
    .toLowerCase();
  if (q.length >= 2 && q === initials) return true;

  return false;
}

type OddsApiEvent = {
  id: string;
  home_team: string;
  away_team: string;
};

function findEventForTeam(
  events: OddsApiEvent[],
  teamName?: string | null,
  homeTeam?: string | null,
  awayTeam?: string | null,
): OddsApiEvent | null {
  if (homeTeam && awayTeam) {
    const match = events.find(
      (event) =>
        (teamMatchesOddsApiName(homeTeam, event.home_team)
          && teamMatchesOddsApiName(awayTeam, event.away_team))
        || (teamMatchesOddsApiName(homeTeam, event.away_team)
          && teamMatchesOddsApiName(awayTeam, event.home_team)),
    );
    if (match) return match;
  }

  const needle = String(teamName ?? "").trim();
  if (!needle) return null;

  return (
    events.find(
      (event) =>
        teamMatchesOddsApiName(needle, event.home_team)
        || teamMatchesOddsApiName(needle, event.away_team),
    ) ?? null
  );
}

async function fetchMlbEvents(apiKey: string): Promise<OddsApiEvent[]> {
  const url = new URL(`${ODDS_API_BASE}/events`);
  url.searchParams.set("apiKey", apiKey);
  try {
    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(8000) });
    if (!res.ok) {
      console.warn(`[odds-api] events HTTP ${res.status} ${redactOddsApiUrl(url.toString())}`);
      return [];
    }
    const data = await res.json();
    return Array.isArray(data) ? (data as OddsApiEvent[]) : [];
  } catch (error) {
    console.warn(
      `[odds-api] events fetch failed ${redactOddsApiUrl(url.toString())}:`,
      (error as Error)?.message ?? error,
    );
    return [];
  }
}

function playerNameMatches(needleParts: string[], outcome: Record<string, unknown>): boolean {
  if (needleParts.length === 0) return false;
  const desc = normalizeText(outcome.description ?? outcome.name ?? "");
  return needleParts.every((part) => desc.includes(part));
}

function extractOverPrice(input: {
  bookmakers: unknown[];
  marketKey: string;
  playerNeedle: string[];
  overPoint: number;
}): { odds: number; bookTitle: string } | null {
  for (const book of input.bookmakers) {
    const bookRec = book as Record<string, unknown>;
    const markets = Array.isArray(bookRec.markets)
      ? (bookRec.markets as Array<Record<string, unknown>>)
      : [];
    for (const market of markets) {
      if (String(market.key) !== input.marketKey) continue;
      const outcomes = Array.isArray(market.outcomes)
        ? (market.outcomes as Array<Record<string, unknown>>)
        : [];
      for (const outcome of outcomes) {
        const side = normalizeText(outcome.name);
        if (side !== "over" && side !== "yes") continue;
        if (!playerNameMatches(input.playerNeedle, outcome)) continue;

        const point = Number(outcome.point ?? input.overPoint);
        if (Number.isFinite(point) && Math.abs(point - input.overPoint) > 0.01) continue;

        const odds = parseAmerican(outcome.price);
        if (odds != null) {
          return {
            odds,
            bookTitle: String(bookRec.title ?? "book"),
          };
        }
      }
    }
  }
  return null;
}

async function fetchEventMarketOdds(
  apiKey: string,
  eventId: string,
  marketKeys: string[],
): Promise<Array<Record<string, unknown>>> {
  if (marketKeys.length === 0) return [];
  const url = new URL(`${ODDS_API_BASE}/events/${eventId}/odds`);
  url.searchParams.set("apiKey", apiKey);
  url.searchParams.set("regions", "us");
  url.searchParams.set("markets", marketKeys.join(","));
  url.searchParams.set("oddsFormat", "american");

  try {
    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(8000) });
    if (!res.ok) {
      console.warn(`[odds-api] event odds HTTP ${res.status} ${redactOddsApiUrl(url.toString())}`);
      return [];
    }

    const payload = await res.json() as Record<string, unknown>;
    const bookmakers = Array.isArray(payload.bookmakers) ? payload.bookmakers : [];
    return bookmakers as Array<Record<string, unknown>>;
  } catch (error) {
    console.warn(
      `[odds-api] event odds fetch failed ${redactOddsApiUrl(url.toString())}:`,
      (error as Error)?.message ?? error,
    );
    return [];
  }
}

function tbdQuote(detail: string, provider = "odds_api"): LiveOddsQuote {
  return { odds: null, source: "tbd", provider, detail };
}

function liveQuote(odds: number, bookTitle: string): LiveOddsQuote {
  return {
    odds,
    source: "live",
    provider: "odds_api_live",
    detail: `Live book price via The Odds API (${bookTitle}).`,
  };
}

/** Best-effort live quote — requires ODDS_API_KEY and a matching upstream market. */
export async function fetchLiveTierOdds(input: {
  playerName?: string | null;
  teamName?: string | null;
  homeTeam?: string | null;
  awayTeam?: string | null;
  marketCode?: string | null;
  statTarget?: number | null;
}): Promise<LiveOddsQuote> {
  const batch = await fetchLiveTierOddsBatch({
    playerName: input.playerName,
    teamName: input.teamName,
    homeTeam: input.homeTeam,
    awayTeam: input.awayTeam,
    tiers: [{
      key: "single",
      marketCode: input.marketCode,
      statTarget: input.statTarget,
    }],
  });
  return batch.single ?? tbdQuote("No matching live price found for this player/tier.");
}

export async function fetchLiveTierOddsBatch(input: {
  playerName?: string | null;
  teamName?: string | null;
  homeTeam?: string | null;
  awayTeam?: string | null;
  tiers: Array<{ key: string; marketCode?: string | null; statTarget?: number | null }>;
}): Promise<Record<string, LiveOddsQuote>> {
  const key = process.env.ODDS_API_KEY?.trim();
  const results: Record<string, LiveOddsQuote> = {};

  if (!key) {
    const missing = tbdQuote("ODDS_API_KEY not configured — using research prices only.");
    for (const tier of input.tiers) results[tier.key] = missing;
    return results;
  }

  const tierSpecs = input.tiers.map((tier) => {
    const spec = mapTierToOddsApiMarket(
      String(tier.marketCode ?? ""),
      Number(tier.statTarget ?? 1),
    );
    return { tier, spec };
  });

  for (const { tier } of tierSpecs) {
    if (!mapTierToOddsApiMarket(String(tier.marketCode ?? ""), Number(tier.statTarget ?? 1))) {
      results[tier.key] = tbdQuote("No Odds API market mapping for this tier yet.");
    }
  }

  const marketKeys = [
    ...new Set(
      tierSpecs
        .map(({ spec }) => spec?.marketKey)
        .filter((value): value is string => Boolean(value)),
    ),
  ];

  if (marketKeys.length === 0) return results;

  try {
    const events = await fetchMlbEvents(key);
    const event = findEventForTeam(
      events,
      input.teamName,
      input.homeTeam,
      input.awayTeam,
    );

    if (!event) {
      const detail = input.teamName
        ? `No Odds API game found for team ${input.teamName}.`
        : "No Odds API game found — team name required.";
      for (const { tier } of tierSpecs) {
        if (!results[tier.key]) results[tier.key] = tbdQuote(detail);
      }
      return results;
    }

    const bookmakers = await fetchEventMarketOdds(key, event.id, marketKeys);
    if (bookmakers.length === 0) {
      for (const { tier } of tierSpecs) {
        if (!results[tier.key]) {
          results[tier.key] = tbdQuote("Odds API returned no bookmaker prices for this game.");
        }
      }
      return results;
    }

    const playerNeedle = String(input.playerName ?? "")
      .toLowerCase()
      .split(" ")
      .filter(Boolean);

    for (const { tier, spec } of tierSpecs) {
      if (results[tier.key] || !spec) continue;

      const match = extractOverPrice({
        bookmakers,
        marketKey: spec.marketKey,
        playerNeedle,
        overPoint: spec.overPoint,
      });

      results[tier.key] = match
        ? liveQuote(match.odds, match.bookTitle)
        : tbdQuote("No matching live price found for this player/tier.");
    }

    return results;
  } catch (err) {
    const detail = err instanceof Error ? err.message : "Odds API request failed.";
    for (const { tier } of tierSpecs) {
      if (!results[tier.key]) results[tier.key] = tbdQuote(detail);
    }
    return results;
  }
}
