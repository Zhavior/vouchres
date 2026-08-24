/**
 * Grades a user's saved slips against the slate the Results desk is showing.
 *
 * The desk already knows every home run that happened on that date, so an
 * anytime-HR leg can be graded exactly, from the same feed that grades the
 * tracked cappers — one record, one source, no second opinion.
 *
 * Markets the HR feed cannot speak to (hits, RBI, total bases) are returned as
 * `ungraded` rather than assumed. A leg the desk cannot settle says so.
 */
import type { Leg, Parlay } from '../../types';
import type { SlateHomeRun } from '../../kernel/contracts/slateResults';

export type SlateLegVerdict = 'bang' | 'no_go' | 'live' | 'ungraded';

export interface GradedSlateLeg {
  id: string;
  selection: string;
  market: string;
  verdict: SlateLegVerdict;
  /** Home runs this player actually hit on the slate. */
  homeRuns: number;
  /** How many the leg needed. */
  needed: number;
}

export interface GradedSlateSlip {
  id: string;
  title: string;
  legs: GradedSlateLeg[];
  hrHits: number;
  hrLegs: number;
}

export interface SlateSlipGrade {
  slips: GradedSlateSlip[];
  /** Anytime-HR legs across every slip on this slate. */
  legTally: { hit: number; total: number };
}

const HR_MARKET = /^(anytime_?hr|home_?run|hr)$/i;

function isHomeRunLeg(leg: Leg): boolean {
  if (leg.marketCode && HR_MARKET.test(leg.marketCode.replace(/\s+/g, '_'))) return true;
  // Older legs predate marketCode and carry only the display market.
  return /home run|\bhr\b/i.test(leg.market ?? '');
}

function legPlayerId(leg: Leg): number | null {
  const raw = leg.playerId ?? leg.mlbPlayerId;
  if (raw == null) return null;
  const id = Number(raw);
  return Number.isFinite(id) && id > 0 ? id : null;
}

/** Local calendar date a leg belongs to, from its own game clock. */
export function slateDateForLeg(leg: Leg): string | null {
  if (!leg.gameStartTime) return null;
  const start = new Date(leg.gameStartTime);
  if (Number.isNaN(start.getTime())) return null;
  return `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
}

/**
 * A slip belongs to a slate when any of its legs starts that day. Slips whose
 * legs carry no start time fall back to the date they were saved, which is what
 * the ledger has always used to place them.
 */
export function slipBelongsToSlate(parlay: Parlay, date: string): boolean {
  const dated = parlay.legs.map(slateDateForLeg).filter((value): value is string => value != null);
  if (dated.length > 0) return dated.includes(date);
  return parlay.createdAt.slice(0, 10) === date;
}

export function gradeSlipsForSlate(
  parlays: Parlay[],
  date: string,
  homeRuns: SlateHomeRun[],
  isToday: boolean,
): SlateSlipGrade {
  const hrCountByPlayer = new Map<number, number>();
  for (const event of homeRuns) {
    hrCountByPlayer.set(event.playerId, (hrCountByPlayer.get(event.playerId) ?? 0) + 1);
  }

  const slips: GradedSlateSlip[] = [];
  let hit = 0;
  let total = 0;

  for (const parlay of parlays) {
    if (!slipBelongsToSlate(parlay, date)) continue;

    const legs: GradedSlateLeg[] = parlay.legs.map((leg) => {
      const playerId = legPlayerId(leg);
      const needed = Math.max(1, Number(leg.statTarget ?? leg.threshold ?? 1) || 1);

      if (!isHomeRunLeg(leg) || playerId == null) {
        return {
          id: leg.id,
          selection: leg.selection,
          market: leg.market,
          verdict: 'ungraded' as const,
          homeRuns: 0,
          needed,
        };
      }

      const scored = hrCountByPlayer.get(playerId) ?? 0;
      const cleared = scored >= needed;
      return {
        id: leg.id,
        selection: leg.selection,
        market: leg.market,
        // Mid-slate a miss is not yet a loss: the player may still bat again.
        verdict: cleared ? 'bang' : isToday ? 'live' : 'no_go',
        homeRuns: scored,
        needed,
      };
    });

    const hrLegs = legs.filter((leg) => leg.verdict !== 'ungraded');
    const hrHits = hrLegs.filter((leg) => leg.verdict === 'bang').length;
    hit += hrHits;
    total += hrLegs.length;

    slips.push({ id: parlay.id, title: parlay.title, legs, hrHits, hrLegs: hrLegs.length });
  }

  return { slips, legTally: { hit, total } };
}
