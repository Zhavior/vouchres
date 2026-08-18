/**
 * MLB news & intel wire.
 *
 * Reads ESPN's public MLB news feed, strips it down to what the wire ticker
 * actually renders, and tags each story so the UI can colour it. The feed is
 * small (roughly half a dozen stories) and changes slowly, so it is cached for
 * five minutes with a stale-if-error window — a wire that briefly shows a
 * six-minute-old headline is better than a wire that shows an error.
 *
 * Player mentions come from ESPN's own `athlete` categories, not from scanning
 * prose for names. ESPN ids are not MLBAM ids, so the payload carries the name
 * as well and the client resolves the mention against the loaded slate.
 */
import { sportsFetchJson } from "../../lib/sports/sportsHttpClient";

const NEWS_URL = "https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/news";
const TTL_MS = 5 * 60_000;
const STALE_IF_ERROR_MS = 30 * 60_000;
const MAX_ITEMS = 12;

/** Wire tag. `NEWS` is the honest default — most of the feed is recaps. */
export type MlbNewsCategory = "INJURY" | "LINEUP" | "ROSTER" | "ALERT" | "NEWS";

export interface MlbNewsMention {
  /** ESPN athlete id — not an MLBAM id. Kept for links, not for joins. */
  espnId: string | null;
  name: string;
}

export interface MlbNewsItem {
  id: string;
  headline: string;
  description: string;
  /** ISO-8601 publish time. The relative label is formatted client-side. */
  publishedAt: string | null;
  category: MlbNewsCategory;
  playerMentions: MlbNewsMention[];
  /** Public ESPN story URL, or null when the feed omits a web link. */
  url: string | null;
}

export interface MlbNewsPayload {
  items: MlbNewsItem[];
  source: "ESPN";
  fetchedAt: string;
}

interface EspnCategory {
  type?: string;
  description?: string;
  athlete?: { id?: number | string; displayName?: string };
}

interface EspnArticle {
  id?: number | string;
  headline?: string;
  description?: string;
  published?: string;
  lastModified?: string;
  categories?: EspnCategory[];
  links?: { web?: { href?: string }; mobile?: { href?: string } };
}

/*
 * Keyword triggers, most specific first — a story about a pitcher scratched
 * from a start is an injury story before it is a rotation story.
 */
const CATEGORY_RULES: ReadonlyArray<{ category: MlbNewsCategory; pattern: RegExp }> = [
  {
    category: "INJURY",
    pattern: /\b(injur\w*|injured list|\bIL\b|strain\w*|sprain\w*|blister|soreness|discomfort|surgery|MRI|concussion|scratched|placed on the)\b/i,
  },
  { category: "LINEUP", pattern: /\b(lineup|batting (?:order|second|third|cleanup)|starts? at|day off|rest\w*|scratched from the lineup)\b/i },
  { category: "ROSTER", pattern: /\b(roster|call(?:ed)?[- ]up|option\w*|designat\w* for assignment|\bDFA\b|trade\w*|acquir\w*|sign\w*|waiver\w*|rotation|promot\w*)\b/i },
  { category: "ALERT", pattern: /\b(weather|rain(?:out|ed)?|postpon\w*|delay\w*|suspend\w*|forecast|wind)\b/i },
];

function classify(text: string): MlbNewsCategory {
  for (const rule of CATEGORY_RULES) {
    if (rule.pattern.test(text)) return rule.category;
  }
  return "NEWS";
}

/** ESPN descriptions often open with a stray em dash from the AP wire. */
function cleanText(value: unknown): string {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .replace(/^[\s—–-]+/, "")
    .trim();
}

function toHttps(href: unknown): string | null {
  const raw = cleanText(href);
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    url.protocol = "https:";
    return url.toString();
  } catch {
    return null;
  }
}

function toIso(value: unknown): string | null {
  const raw = cleanText(value);
  if (!raw) return null;
  const ms = Date.parse(raw);
  return Number.isFinite(ms) ? new Date(ms).toISOString() : null;
}

function mentionsOf(article: EspnArticle): MlbNewsMention[] {
  const seen = new Set<string>();
  const out: MlbNewsMention[] = [];

  for (const category of article.categories ?? []) {
    if (category?.type !== "athlete") continue;
    const name = cleanText(category.athlete?.displayName ?? category.description);
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const espnId = category.athlete?.id != null ? String(category.athlete.id) : null;
    out.push({ espnId, name });
  }

  return out;
}

function mapArticle(article: EspnArticle): MlbNewsItem | null {
  const headline = cleanText(article.headline);
  if (!headline) return null;

  const id = cleanText(article.id);
  if (!id) return null;

  const description = cleanText(article.description);

  return {
    id,
    headline,
    description,
    publishedAt: toIso(article.published ?? article.lastModified),
    category: classify(`${headline} ${description}`),
    playerMentions: mentionsOf(article),
    url: toHttps(article.links?.web?.href) ?? toHttps(article.links?.mobile?.href),
  };
}

export async function getMlbNewsWire(): Promise<MlbNewsPayload> {
  const raw = await sportsFetchJson<{ articles?: EspnArticle[] }>(NEWS_URL, {
    ttlMs: TTL_MS,
    staleIfErrorMs: STALE_IF_ERROR_MS,
    cacheKey: "mlb:news:wire",
    debugLabel: "mlbNews",
  });

  const items = (raw?.articles ?? [])
    .map(mapArticle)
    .filter((item): item is MlbNewsItem => item != null)
    .sort((a, b) => (Date.parse(b.publishedAt ?? "") || 0) - (Date.parse(a.publishedAt ?? "") || 0))
    .slice(0, MAX_ITEMS);

  return { items, source: "ESPN", fetchedAt: new Date().toISOString() };
}
