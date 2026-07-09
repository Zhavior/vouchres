/**
 * MLB player headshot helpers.
 *
 * We only ever build a headshot URL from a REAL MLB player id. We never guess
 * an id from a name and never scrape images — if there is no id, callers show
 * an initials avatar instead.
 */

/** Normalize any id-ish value (number, "12345", "hr-12345", "player_12345") to a
 *  bare numeric MLB id string, or null if there is no usable numeric id. */
export function normalizePlayerId(value?: number | string | null): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') {
    return Number.isFinite(value) && value > 0 ? String(Math.trunc(value)) : null;
  }
  const s = String(value).trim();
  if (!s) return null;
  // Pull the first run of digits (handles "hr-665487", "player_12345", "12345").
  const match = s.match(/\d{3,}/);
  return match ? match[0] : null;
}

/**
 * Build the official MLB headshot URL for a player id, or null when unknown.
 * Uses the public mlbstatic image CDN (no API key, no scraping).
 *
 * @param playerId MLB person id (number or id-ish string)
 * @param size     square render width in px (default 96)
 */
export function getMlbHeadshotUrl(playerId?: number | string | null, size = 96): string | null {
  const id = normalizePlayerId(playerId);
  if (!id) return null;
  const w = Math.max(48, Math.min(Math.round(size), 426));
  return `https://img.mlbstatic.com/mlb-photos/image/upload/w_${w},d_people:generic:headshot:silo:current.png,q_auto:best,f_auto/v1/people/${id}/headshot/67/current`;
}

/**
 * Tailwind classes for rendering MLB portrait headshots without cropping
 * foreheads or chins. `object-contain` keeps the full face visible inside
 * square/circular frames; vertical position nudges toward the face center.
 */
export const MLB_HEADSHOT_IMG_CLASS = 'h-full w-full object-contain object-[center_18%]';

/** Up to 2 uppercase initials from a player/selection name (fallback avatar). */
export function getPlayerInitials(name?: string): string {
  if (!name) return '?';
  // Strip common market suffixes so "Kyle Schwarber Anytime HR" → "Kyle Schwarber".
  const cleaned = name
    .replace(/\b(anytime|over|under|to|hit|hits|hr|home run|rbi|rbis|run|runs|total bases|tb)\b.*$/i, '')
    .replace(/[^\p{L}\s.'-]/gu, '')
    .trim();
  const SUFFIXES = new Set(['jr', 'jr.', 'sr', 'sr.', 'ii', 'iii', 'iv', 'v']);
  const parts = (cleaned || name)
    .split(/\s+/)
    .filter(Boolean)
    .filter((p) => !SUFFIXES.has(p.toLowerCase()));
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
