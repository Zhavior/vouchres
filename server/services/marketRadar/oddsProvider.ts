import { z } from "zod";
import { sportsFetchJson } from "../../lib/sports/sportsHttpClient";
import { structuredLog } from "../../lib/structuredLog";
import { normalizeOddsPrice } from "./math";
import type {
  MarketRadarMarket,
  MarketRadarProviderResult,
  MarketRadarQuote,
} from "./types";

const ODDS_API_BASE = "https://api.the-odds-api.com/v4/sports/baseball_mlb";
const MARKET_KEYS = [
  "pitcher_strikeouts",
  "batter_home_runs",
  "batter_stolen_bases",
  "batter_hits",
  "batter_total_bases",
  "batter_walks",
] as const satisfies readonly MarketRadarMarket[];

const OddsEventSchema = z.object({
  id: z.string().min(1),
  commence_time: z.string().datetime(),
  home_team: z.string().min(1),
  away_team: z.string().min(1),
});

const OddsOutcomeSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number(),
  point: z.number().optional(),
});

const OddsMarketSchema = z.object({
  key: z.string().min(1),
  last_update: z.string().datetime(),
  outcomes: z.array(OddsOutcomeSchema),
});

const OddsBookmakerSchema = z.object({
  key: z.string().min(1),
  title: z.string().min(1),
  last_update: z.string().datetime(),
  markets: z.array(OddsMarketSchema),
});

const EventOddsSchema = OddsEventSchema.extend({
  bookmakers: z.array(OddsBookmakerSchema),
});

type ProviderQuota = MarketRadarProviderResult["quota"];

export class MarketRadarConfigurationError extends Error {
  constructor() {
    super("ODDS_API_KEY or THE_ODDS_API_KEY is required for Market Radar.");
    this.name = "MarketRadarConfigurationError";
  }
}

export class MarketRadarProviderError extends Error {
  readonly operation: string;
  readonly providerStatus: number | null;

  constructor(operation: string, providerStatus: number | null, cause: unknown) {
    super(`Odds provider request failed during ${operation}.`, { cause });
    this.name = "MarketRadarProviderError";
    this.operation = operation;
    this.providerStatus = providerStatus;
  }
}

export function getMarketRadarApiKey(): string {
  const key = process.env.ODDS_API_KEY?.trim() || process.env.THE_ODDS_API_KEY?.trim();
  if (!key) throw new MarketRadarConfigurationError();
  return key;
}

function numberHeader(response: Response, name: string): number | null {
  const raw = response.headers.get(name);
  if (raw == null || raw.trim() === "") return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function statusFromError(error: unknown): number | null {
  const match = error instanceof Error ? /HTTP\s+(\d{3})/.exec(error.message) : null;
  return match ? Number(match[1]) : null;
}

function addUtcDays(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function normalizedSide(value: string): MarketRadarQuote["side"] | null {
  const side = value.trim().toLowerCase();
  return side === "over" || side === "under" || side === "yes" || side === "no"
    ? side
    : null;
}

function providerOptions(operation: string, quota: ProviderQuota) {
  return {
    timeoutMs: 8_000,
    retries: 1,
    ttlMs: 30_000,
    debugLabel: "marketRadarOddsApi",
    onResponse(response: Response, context: { attempt: number; durationMs: number }) {
      quota.remaining = numberHeader(response, "x-requests-remaining");
      quota.used = numberHeader(response, "x-requests-used");
      quota.lastCost = numberHeader(response, "x-requests-last");
      structuredLog({
        level: response.ok ? "info" : "warn",
        event: "market_radar_provider_http",
        provider: "odds_api",
        operation,
        status: response.status,
        attempt: context.attempt,
        durationMs: context.durationMs,
        quotaRemaining: quota.remaining,
        quotaUsed: quota.used,
        quotaLastCost: quota.lastCost,
      });
    },
  };
}

async function fetchEvents(apiKey: string, date: string, quota: ProviderQuota) {
  const url = new URL(`${ODDS_API_BASE}/events`);
  url.searchParams.set("apiKey", apiKey);
  url.searchParams.set("dateFormat", "iso");
  url.searchParams.set("commenceTimeFrom", `${date}T00:00:00Z`);
  url.searchParams.set("commenceTimeTo", `${addUtcDays(date, 1)}T00:00:00Z`);

  try {
    const payload = await sportsFetchJson<unknown>(url.toString(), {
      ...providerOptions("events", quota),
      cacheKey: `market-radar:events:${date}`,
    });
    return z.array(OddsEventSchema).parse(payload);
  } catch (error) {
    throw new MarketRadarProviderError("events", statusFromError(error), error);
  }
}

async function fetchEventQuotes(
  apiKey: string,
  event: z.infer<typeof OddsEventSchema>,
  quota: ProviderQuota,
): Promise<MarketRadarQuote[]> {
  const url = new URL(`${ODDS_API_BASE}/events/${encodeURIComponent(event.id)}/odds`);
  url.searchParams.set("apiKey", apiKey);
  url.searchParams.set("regions", "us");
  url.searchParams.set("markets", MARKET_KEYS.join(","));
  url.searchParams.set("oddsFormat", "american");
  url.searchParams.set("dateFormat", "iso");

  let payload: z.infer<typeof EventOddsSchema>;
  try {
    const raw = await sportsFetchJson<unknown>(url.toString(), {
      ...providerOptions(`event_odds:${event.id}`, quota),
      cacheKey: `market-radar:event:${event.id}:${MARKET_KEYS.join(",")}`,
    });
    payload = EventOddsSchema.parse(raw);
  } catch (error) {
    throw new MarketRadarProviderError(`event_odds:${event.id}`, statusFromError(error), error);
  }

  const quotes: MarketRadarQuote[] = [];
  for (const book of payload.bookmakers) {
    for (const market of book.markets) {
      if (!MARKET_KEYS.includes(market.key as MarketRadarMarket)) continue;
      for (const outcome of market.outcomes) {
        const side = normalizedSide(outcome.name);
        const subject = outcome.description?.trim();
        if (!side || !subject) continue;
        try {
          quotes.push({
            eventId: payload.id,
            commenceTime: payload.commence_time,
            homeTeam: payload.home_team,
            awayTeam: payload.away_team,
            bookmakerKey: book.key,
            bookmaker: book.title,
            market: market.key as MarketRadarMarket,
            subject,
            side,
            point: outcome.point ?? null,
            price: normalizeOddsPrice(outcome.price, "american"),
            lastUpdate: market.last_update || book.last_update,
          });
        } catch {
          structuredLog({
            level: "warn",
            event: "market_radar_invalid_price",
            provider: "odds_api",
            operation: `event_odds:${event.id}`,
            bookmaker: book.key,
            market: market.key,
          });
        }
      }
    }
  }
  return quotes;
}

export async function fetchMarketRadarOdds(date: string): Promise<MarketRadarProviderResult> {
  const apiKey = getMarketRadarApiKey();
  const quota: ProviderQuota = { remaining: null, used: null, lastCost: null };
  const events = await fetchEvents(apiKey, date, quota);
  const quotes: MarketRadarQuote[] = [];

  for (let index = 0; index < events.length; index += 4) {
    const batch = events.slice(index, index + 4);
    const results = await Promise.all(batch.map((event) => fetchEventQuotes(apiKey, event, quota)));
    for (const result of results) quotes.push(...result);
  }

  return { events: events.length, quotes, quota };
}
