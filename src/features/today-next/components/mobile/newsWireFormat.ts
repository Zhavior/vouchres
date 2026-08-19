import type { HrWatchRow } from '../../../hr/types/hrWatch';
import type { MlbNewsCategory, MlbNewsItem } from '../../hooks/useMlbNewsWire';

/**
 * Presentation shared by the wire ticker and the reader it opens.
 *
 * Both surfaces label the same story, so the pill colours and the timestamp
 * format live here rather than being copied — a category that reads INJURY red
 * on the ticker has to read INJURY red in the reader.
 */
export const CATEGORY_STYLES: Record<MlbNewsCategory, { label: string; pill: string; dot: string }> = {
  INJURY: { label: 'INJURY', pill: 'border-rose-400/35 bg-rose-500/12 text-rose-300', dot: 'bg-rose-400' },
  LINEUP: {
    label: 'LINEUP',
    pill: 'border-[var(--aurora-max-emerald)]/40 bg-[var(--aurora-max-emerald)]/12 text-[var(--aurora-max-emerald)]',
    dot: 'bg-[var(--aurora-max-emerald)]',
  },
  ROSTER: { label: 'ROSTER', pill: 'border-sky-400/35 bg-sky-500/12 text-sky-300', dot: 'bg-sky-400' },
  ALERT: { label: 'ALERT', pill: 'border-amber-400/35 bg-amber-500/12 text-amber-300', dot: 'bg-amber-400' },
  NEWS: { label: 'NEWS', pill: 'border-white/12 bg-white/[0.05] text-white/60', dot: 'bg-white/40' },
};

/** "6m ago". Absolute timestamps are noise on a ticker that rotates every 6s. */
export function relativeTime(iso: string | null): string {
  if (!iso) return '';
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return '';

  const seconds = Math.round((Date.now() - ms) / 1000);
  if (seconds < 60) return 'now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86_400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86_400)}d ago`;
}

export function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildSlateIndex(rows: readonly HrWatchRow[]): Map<string, HrWatchRow> {
  const index = new Map<string, HrWatchRow>();
  for (const row of rows) {
    const key = normalizeName(row.playerName ?? '');
    if (key && !index.has(key)) index.set(key, row);
  }
  return index;
}

/** Longest sensible CTA stack — past this the reader is a list of buttons. */
const MAX_MENTION_CTAS = 4;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/*
 * Which slate players a story is about, in confidence order.
 *
 * ESPN's own `athlete` categories come first — they are the publisher's
 * tagging, not a guess. They are also missing from most recaps (verified
 * against the live feed: the game clip carries four tagged athletes while the
 * written recap of the same game carries none), so the body is then matched
 * against the slate that is already loaded on this page. That direction
 * matters: names come from our own roster and are matched whole-word in the
 * prose, rather than pulling arbitrary capitalised words out of the text and
 * hoping they are players.
 *
 * ESPN athlete ids are not MLBAM ids, so nothing here joins on id — the match
 * is by normalised name, and an unmatched mention simply has no button.
 */
export function resolveMentions(
  item: MlbNewsItem,
  index: Map<string, HrWatchRow>,
  bodyParagraphs: readonly string[] = [],
): HrWatchRow[] {
  const seen = new Set<string>();
  const rows: HrWatchRow[] = [];

  const push = (row: HrWatchRow | undefined) => {
    if (!row || rows.length >= MAX_MENTION_CTAS) return;
    const key = String(row.playerId ?? row.playerName ?? '');
    if (seen.has(key)) return;
    seen.add(key);
    rows.push(row);
  };

  for (const mention of item.playerMentions) {
    push(index.get(normalizeName(mention.name)));
  }

  if (rows.length < MAX_MENTION_CTAS) {
    const prose = normalizeName([item.headline, ...bodyParagraphs].join(' '));
    for (const [name, row] of index) {
      if (rows.length >= MAX_MENTION_CTAS) break;
      // Whole-name match only: "Bello" inside another word is not a mention.
      if (new RegExp(`\\b${escapeRegExp(name)}\\b`).test(prose)) push(row);
    }
  }

  return rows;
}
