/**
 * Remote image → data URI inliner for share-card SVGs.
 *
 * Why this exists: sharp renders SVG through librsvg, which refuses to load
 * remote resources (`<image href="https://...">` silently renders blank). Any
 * headshot or team logo on a share card must therefore be fetched here,
 * rasterised to PNG, and embedded as a base64 data URI before the SVG string
 * reaches sharp.
 *
 * Team logos are SVG upstream; librsvg's nested-SVG-in-<image> support is
 * unreliable, so everything is normalised to PNG regardless of source format.
 */
import sharp from "sharp";

/**
 * SSRF guard. Card renderers build these URLs from numeric MLB ids, but the ids
 * originate in board payloads, so the host is pinned rather than trusted.
 */
const ALLOWED_HOSTS = new Set([
  "img.mlbstatic.com",
  "www.mlbstatic.com",
  "mlbstatic.com",
  "midfield.mlbstatic.com",
]);

const FETCH_TIMEOUT_MS = 2500;
const MAX_BYTES = 3 * 1024 * 1024;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const CACHE_MAX_ENTRIES = 400;

type CacheEntry = { dataUri: string | null; expiresAt: number };

const cache = new Map<string, CacheEntry>();
/** Coalesces concurrent misses so a 10-player card fetches each asset once. */
const inflight = new Map<string, Promise<string | null>>();

function cacheKey(url: string, width: number, height: number): string {
  return `${url}|${width}x${height}`;
}

function pruneCache(): void {
  if (cache.size <= CACHE_MAX_ENTRIES) return;
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (entry.expiresAt <= now) cache.delete(key);
  }
  // Still oversized after dropping expired entries — evict oldest-inserted.
  while (cache.size > CACHE_MAX_ENTRIES) {
    const oldest = cache.keys().next();
    if (oldest.done) break;
    cache.delete(oldest.value);
  }
}

async function fetchAndRasterise(
  url: string,
  width: number,
  height: number,
  fit: "cover" | "contain",
): Promise<string | null> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:" || !ALLOWED_HOSTS.has(parsed.hostname)) {
    console.warn("[shareImage] blocked non-allowlisted asset host", parsed.hostname);
    return null;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(parsed.toString(), {
      signal: controller.signal,
      headers: { accept: "image/png,image/svg+xml,image/*" },
    });
    if (!response.ok) return null;

    const declared = Number(response.headers.get("content-length") ?? 0);
    if (Number.isFinite(declared) && declared > MAX_BYTES) return null;

    const raw = Buffer.from(await response.arrayBuffer());
    if (raw.byteLength === 0 || raw.byteLength > MAX_BYTES) return null;

    // `density` only affects vector input; it keeps upstream team-logo SVGs
    // from rasterising at their tiny intrinsic size.
    const png = await sharp(raw, { density: 288 })
      .resize(width, height, {
        fit,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png({ compressionLevel: 9 })
      .toBuffer();

    return `data:image/png;base64,${png.toString("base64")}`;
  } catch (error) {
    // A missing headshot must never fail the whole card — callers fall back to
    // initials. Log at warn and move on.
    console.warn("[shareImage] asset inline failed", JSON.stringify({
      url: parsed.toString(),
      message: error instanceof Error ? error.message : String(error),
    }));
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fetches `url`, resizes to `width`×`height`, and returns a PNG data URI.
 * Returns null on any failure so the caller can render a text fallback.
 */
export async function inlineRemoteImage(
  url: string | null | undefined,
  width: number,
  height: number,
  fit: "cover" | "contain" = "cover",
): Promise<string | null> {
  if (!url) return null;

  const key = cacheKey(url, width, height);
  const hit = cache.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.dataUri;

  const pending = inflight.get(key);
  if (pending) return pending;

  const task = fetchAndRasterise(url, width, height, fit)
    .then((dataUri) => {
      // Negative results are cached too, on a shorter TTL, so a player whose
      // headshot 404s does not re-fetch on every card render.
      cache.set(key, {
        dataUri,
        expiresAt: Date.now() + (dataUri ? CACHE_TTL_MS : CACHE_TTL_MS / 12),
      });
      pruneCache();
      return dataUri;
    })
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, task);
  return task;
}

export function mlbHeadshotUrl(playerId: number | string): string {
  return `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/${playerId}/headshot/67/current`;
}

export function mlbTeamLogoUrl(teamId: number | string): string {
  return `https://www.mlbstatic.com/team-logos/${teamId}.svg`;
}

/** Test seam — share-card tests need a clean slate between cases. */
export function __clearShareImageCache(): void {
  cache.clear();
  inflight.clear();
}
