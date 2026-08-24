import type { HrWatchRow } from '../../../hr/types/hrWatch';
import type { MlbNewsCategory, MlbNewsItem } from '../../hooks/useMlbNewsWire';

export type TacticalNewsCategory = 'LINEUP' | 'PITCHER' | 'WEATHER' | 'DEVIATION';

/*
 * Category tone on the registered ve-* tokens.
 *
 * These were on raw Tailwind ramps (emerald-500, sky-500, amber-500,
 * fuchsia-500) at hues that drift from the system palette, and DEVIATION's
 * fuchsia had no token anywhere in the product. Three Today surfaces render
 * from this map; the News Wire page keeps its own local tone map and reads
 * only `label` from here.
 */
export const CATEGORY_STYLES: Record<
  TacticalNewsCategory | 'ALERT' | 'INJURY' | 'ROSTER' | 'NEWS',
  { label: string; pill: string; dot: string; border: string; accent: string }
> = {
  LINEUP: {
    label: 'LINEUP',
    pill: 'border-ve-emerald/25 bg-ve-emerald/10 text-ve-emerald font-medium',
    dot: 'bg-ve-emerald',
    border: 'border-ve-emerald/25',
    accent: '#31B583',
  },
  PITCHER: {
    label: 'PITCHER',
    pill: 'border-ve-cyan/25 bg-ve-cyan/10 text-ve-cyan font-medium',
    dot: 'bg-ve-cyan',
    border: 'border-ve-cyan/25',
    accent: '#4FB8DC',
  },
  WEATHER: {
    label: 'WEATHER',
    pill: 'border-ve-amber/25 bg-ve-amber/10 text-ve-amber font-medium',
    dot: 'bg-ve-amber',
    border: 'border-ve-amber/25',
    accent: '#D99C4A',
  },
  DEVIATION: {
    label: 'DEVIATION',
    pill: 'border-ve-red/25 bg-ve-red/10 text-ve-red font-medium',
    dot: 'bg-ve-red',
    border: 'border-ve-red/25',
    accent: '#D96359',
  },
  // Compatibility mappings
  INJURY: {
    label: 'PITCHER',
    pill: 'border-ve-red/25 bg-ve-red/10 text-ve-red font-medium',
    dot: 'bg-ve-red',
    border: 'border-ve-red/25',
    accent: '#D96359',
  },
  ROSTER: {
    label: 'LINEUP',
    pill: 'border-ve-emerald/25 bg-ve-emerald/10 text-ve-emerald font-medium',
    dot: 'bg-ve-emerald',
    border: 'border-ve-emerald/25',
    accent: '#31B583',
  },
  ALERT: {
    label: 'DEVIATION',
    pill: 'border-ve-amber/25 bg-ve-amber/10 text-ve-amber font-medium',
    dot: 'bg-ve-amber',
    border: 'border-ve-amber/25',
    accent: '#D99C4A',
  },
  NEWS: {
    label: 'LINEUP',
    pill: 'border-white/[0.08] bg-white/[0.04] text-white/70 font-medium',
    dot: 'bg-white/40',
    border: 'border-white/[0.08]',
    accent: 'rgba(255,255,255,0.55)',
  },
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

/**
 * Classifies an MLB news item into strict tactical categories:
 * - LINEUP: lineup announcements, batting order changes, benchings, activations
 * - PITCHER: starter announcements, bullpen fatigue/usage, pitching deviations
 * - WEATHER: wind, humidity, rain delays, dome status, park atmospheric shifts
 * - DEVIATION: Statcast anomalies, exit velo spikes, unexpected metric swings
 */
export function classifyTacticalNews(item: MlbNewsItem): TacticalNewsCategory {
  const text = `${item.headline} ${item.description} ${item.paragraphs.join(' ')}`.toLowerCase();

  // Weather anomaly detection
  if (
    /\b(weather|wind|rain|delay|humidity|air density|roof|dome|temperature|forecast|wet)\b/i.test(
      text,
    )
  ) {
    return 'WEATHER';
  }

  // Statcast / Deviation / EV anomaly detection (check before general pitcher stats)
  if (
    /\b(statcast|exit velo|barrel|launch angle|hard-hit|expected|woba|deviation|spike|slump|streak|anomaly|power surge|hr rate)\b/i.test(
      text,
    ) ||
    item.category === 'ALERT'
  ) {
    return 'DEVIATION';
  }

  // Pitcher / Bullpen fatigue detection
  if (
    /\b(pitcher|starter|bullpen|rotation|era|whip|innings|arm|elbow|shoulder|fastball|slider|sinker|closer|reliever|warmup|saves)\b/i.test(
      text,
    ) ||
    item.category === 'INJURY'
  ) {
    return 'PITCHER';
  }

  // Lineup / Roster alerts
  return 'LINEUP';
}

/**
 * Filter out non-tactical noise (e.g. concert tours, non-sports celebrity news, general broadcast fluff).
 */
export function isTacticalMlbItem(item: MlbNewsItem): boolean {
  const text = `${item.headline} ${item.description}`.toLowerCase();
  if (/concert|tour|halftime|grammy|oscar|celebrity|entertainment|movie|album|song|jonas/i.test(text)) {
    return false;
  }
  return true;
}

/**
 * Generates an SVG data URI fallback for cybernetic telemetry placeholders
 */
export function getCyberFallbackImage(label = 'TACTICAL INTEL'): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240" viewBox="0 0 400 240" fill="#0A0D0E">
    <rect width="400" height="240" fill="#0A0D0E"/>
    <defs>
      <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(0,255,135,0.08)" stroke-width="1"/>
      </pattern>
    </defs>
    <rect width="400" height="240" fill="url(#grid)"/>
    <rect x="20" y="20" width="360" height="200" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
    <circle cx="200" cy="110" r="32" fill="#131B1E" stroke="#00FF87" stroke-width="1.5" stroke-dasharray="4 2"/>
    <path d="M190 110 L210 110 M200 100 L200 120" stroke="#00FF87" stroke-width="2"/>
    <text x="200" y="165" font-family="monospace" font-size="11" font-weight="bold" fill="#00FF87" text-anchor="middle" letter-spacing="2">${label.toUpperCase()}</text>
    <text x="200" y="180" font-family="monospace" font-size="9" fill="rgba(255,255,255,0.4)" text-anchor="middle" letter-spacing="1">TELEMETRY WIRE</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Which slate players a story is about, in confidence order.
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
      if (new RegExp(`\\b${escapeRegExp(name)}\\b`).test(prose)) push(row);
    }
  }

  return rows;
}
