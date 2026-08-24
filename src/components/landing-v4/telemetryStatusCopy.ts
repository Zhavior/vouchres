import type { TelemetryMode } from '../../hooks/public/useLandingTelemetry';

/**
 * One status line for every panel that renders live model numbers.
 *
 * The landing used to print a dash whenever the confirmed-candidate list was
 * empty, which is most of the day — a page arguing for evidence discipline that
 * looked broken. The numbers now come from the board's projected pool or from
 * the last slate that answered, and this badge is the price of that: it states
 * which population is on screen, so a projected row is never mistaken for a
 * confirmed one.
 */

interface ModeCopy {
  /** Shown inside the bracketed status line. */
  status: string;
  /** Short qualifier for panel corners where the full line does not fit. */
  chip: string;
  /** Plain-English explanation of what the visitor is looking at. */
  detail: string;
  tone: string;
}

export const MODE_COPY: Record<TelemetryMode, ModeCopy> = {
  live: {
    status: 'LIVE SLATE — OFFICIAL LINEUPS POSTED',
    chip: 'LIVE',
    detail: 'Confirmed batting orders. Every row below is a candidate the model will be held to.',
    tone: 'text-ve-emerald border-ve-emerald/40',
  },
  preview: {
    status: 'PROJECTED PREVIEW MODE',
    chip: 'PROJECTED',
    detail:
      'Lineups are not posted yet. These are real scored candidates from today’s board, ranked on season and matchup evidence, and none of them count as confirmed until the card is official.',
    tone: 'text-ve-cyan border-ve-cyan/40',
  },
  replay: {
    status: 'REPLAY PREVIEW MODE',
    chip: 'REPLAY',
    detail:
      'No slate is open. This is the most recent board the model actually published, replayed exactly as it stood.',
    tone: 'text-ve-cyan border-ve-cyan/40',
  },
  offline: {
    status: 'FEED UNREACHABLE',
    chip: 'OFF-SLATE',
    detail: 'The board did not answer. Nothing is estimated in its place.',
    tone: 'text-ve-amber border-ve-amber/40',
  },
};

/** `15:00 UTC` from an ISO timestamp — the badge states the clock it uses. */
export function utcClock(iso: string | null): string | null {
  if (!iso) return null;
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return null;
  return `${String(at.getUTCHours()).padStart(2, '0')}:${String(at.getUTCMinutes()).padStart(2, '0')} UTC`;
}

/** `AUG 23` — replay attribution, so a past slate is never read as today's. */
export function slateLabel(date: string | null): string | null {
  if (!date) return null;
  const at = new Date(`${date}T12:00:00`);
  if (Number.isNaN(at.getTime())) return null;
  return at.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
}

