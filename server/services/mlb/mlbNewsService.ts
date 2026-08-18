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
/**
 * ESPN's per-article reader. The wire listing omits `story` on every item —
 * verified against the live feed — so the full body has to be fetched per id.
 * This is the same public API the ESPN apps read; it returns the editorial body
 * as lightly-marked-up text, which is parsed into paragraphs below.
 */
const ARTICLE_URL = (id: string) => `https://now.core.api.espn.com/v1/sports/news/${id}`;
const TTL_MS = 5 * 60_000;
const STALE_IF_ERROR_MS = 30 * 60_000;
/** A published story does not change; an hour of cache costs nothing. */
const ARTICLE_TTL_MS = 60 * 60_000;
const ARTICLE_STALE_IF_ERROR_MS = 12 * 60 * 60_000;
const MAX_ITEMS = 12;
/** Long enough for a full game recap; a hard stop against a runaway payload. */
const MAX_PARAGRAPHS = 60;
/** ESPN article ids are numeric. Anything else never reaches the upstream. */
const ARTICLE_ID_RE = /^\d{1,15}$/;

/** Wire tag. `NEWS` is the honest default — most of the feed is recaps. */
export type MlbNewsCategory = "INJURY" | "LINEUP" | "ROSTER" | "ALERT" | "NEWS";

export interface MlbNewsMention {
  /** ESPN athlete id — not an MLBAM id. Kept for links, not for joins. */
  espnId: string | null;
  name: string;
}

export interface MlbNewsImage {
  url: string;
  alt: string;
  width: number | null;
  height: number | null;
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
  /** Lead art for the reader's hero, when the feed ships usable art. */
  image: MlbNewsImage | null;
  /**
   * Body text, one entry per paragraph. The listing rarely carries a body, so
   * this is usually just the summary here and is filled in properly by
   * `getMlbNewsArticle`. `hasFullStory` says which one the reader is holding.
   */
  paragraphs: string[];
  hasFullStory: boolean;
}

/** One story, read in full — what the in-app reader renders. */
export interface MlbNewsArticle extends MlbNewsItem {
  source: "ESPN";
  fetchedAt: string;
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

interface EspnImage {
  url?: string;
  alt?: string;
  caption?: string;
  name?: string;
  width?: number;
  height?: number;
}

interface EspnArticle {
  id?: number | string;
  headline?: string;
  description?: string;
  /** Editorial body. Present on the per-article endpoint, absent on the list. */
  story?: string;
  published?: string;
  lastModified?: string;
  categories?: EspnCategory[];
  images?: EspnImage[];
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

/*
 * ESPN's story field is plain prose carrying a few inline tags — `<a>` for
 * team and player links, `<hl2>` for subheads — with paragraphs separated by
 * blank lines. Tags are dropped rather than forwarded: the reader renders text
 * nodes only, so no upstream markup can reach the DOM.
 */
const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  ndash: "\u2013",
  mdash: "\u2014",
  rsquo: "\u2019",
  lsquo: "\u2018",
  rdquo: "\u201d",
  ldquo: "\u201c",
  hellip: "\u2026",
};

function decodeEntities(value: string): string {
  return value
    .replace(/&#(\d{1,7});/g, (_m, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#[xX]([0-9a-fA-F]{1,6});/g, (_m, code: string) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&([a-zA-Z]+);/g, (match, name: string) => NAMED_ENTITIES[name.toLowerCase()] ?? match);
}

/*
 * Wire footers that only make sense as links. Stripping the anchor leaves
 * "See AP's full MLB coverage here" pointing at nothing, and a rule of
 * underscores is a print separator — both are noise at the end of the reader.
 */
const BOILERPLATE_RE = /^(?:[_\-\u2014\u2013\s]+|(?:see\s+)?ap(?:'|\u2019)?s?\s+(?:full|complete)\b.*|copyright\s+\d{4}.*)$/i;

function storyParagraphs(story: unknown): string[] {
  const raw = String(story ?? "");
  if (!raw.trim()) return [];

  return raw
    // Block boundaries become paragraph breaks before the tags are stripped,
    // so a body that uses <p> instead of blank lines still splits correctly.
    .replace(/<\s*br\s*\/?>/gi, "\n\n")
    .replace(/<\s*\/\s*(?:p|div|hl2|h[1-6]|li)\s*>/gi, "\n\n")
    .replace(/<[^>]*>/g, "")
    .split(/\n\s*\n+/)
    .map((paragraph) =>
      decodeEntities(paragraph)
        .replace(/\s+/g, " ")
        // AP datelines arrive double-punctuated ("PHILADELPHIA -- \u2014 ").
        .replace(/\s--\s*\u2014/g, " \u2014")
        .trim(),
    )
    // One- and two-character remnants are stray punctuation from stripped tags.
    .filter((paragraph) => paragraph.length > 2)
    .filter((paragraph) => !BOILERPLATE_RE.test(paragraph))
    .slice(0, MAX_PARAGRAPHS);
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

/** Widest usable frame ESPN offers, ignoring thumbnails too small to be a hero. */
function heroImage(article: EspnArticle): MlbNewsImage | null {
  let best: MlbNewsImage | null = null;
  let bestWidth = 0;

  for (const image of article.images ?? []) {
    const url = toHttps(image?.url);
    if (!url) continue;
    const width = Number(image?.width) || 0;
    const height = Number(image?.height) || 0;
    if (width && width < 320) continue;
    if (best && width <= bestWidth) continue;

    best = {
      url,
      // ESPN suffixes its alt text with the crop size ("Elly De La Cruz [600x400]").
      alt: cleanText(image?.alt || image?.caption || image?.name).replace(/\s*\[\d+x\d+\]$/, ""),
      width: width || null,
      height: height || null,
    };
    bestWidth = width;
  }

  return best;
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
  const body = storyParagraphs(article.story);
  const hasFullStory = body.length > 0;

  return {
    id,
    headline,
    description,
    publishedAt: toIso(article.published ?? article.lastModified),
    category: classify(`${headline} ${description}`),
    playerMentions: mentionsOf(article),
    url: toHttps(article.links?.web?.href) ?? toHttps(article.links?.mobile?.href),
    image: heroImage(article),
    // The summary stands in as a single paragraph so the reader always has
    // something to render, even before the full body is fetched.
    paragraphs: hasFullStory ? body : description ? [description] : [],
    hasFullStory,
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

/**
 * One story, read in full, for the in-app reader.
 *
 * The wire listing ships headlines and a one-line summary; the body lives
 * behind ESPN's per-article endpoint, so this is the fallback reader the drawer
 * calls when it opens a story whose `hasFullStory` is false. Everything is
 * parsed here rather than in the client: the browser only ever receives an
 * array of plain-text paragraphs, so no upstream markup can reach the DOM.
 *
 * Returns null for an unknown or malformed id — the caller turns that into a
 * 404 and the reader keeps showing the summary it already had.
 */
export async function getMlbNewsArticle(id: string): Promise<MlbNewsArticle | null> {
  const articleId = cleanText(id);
  if (!ARTICLE_ID_RE.test(articleId)) return null;

  const raw = await sportsFetchJson<{ headlines?: EspnArticle[] }>(ARTICLE_URL(articleId), {
    ttlMs: ARTICLE_TTL_MS,
    staleIfErrorMs: ARTICLE_STALE_IF_ERROR_MS,
    cacheKey: `mlb:news:article:${articleId}`,
    debugLabel: "mlbNewsArticle",
  });

  const headline = raw?.headlines?.[0];
  if (!headline) return null;

  // The per-article payload omits `id` on some story types; the requested id is
  // authoritative either way, and mapArticle rejects an item without one.
  const item = mapArticle({ ...headline, id: headline.id ?? articleId });
  if (!item) return null;

  return { ...item, source: "ESPN", fetchedAt: new Date().toISOString() };
}
