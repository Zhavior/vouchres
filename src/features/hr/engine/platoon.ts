/**
 * L/R platoon split — the handedness matchup between a hitter and the starter.
 *
 * A left-handed bat facing a right-handed pitcher (and the mirror) sees the ball
 * longer and pulls it in the air more often, which is why the platoon edge is a
 * standard input to any home-run read. A switch hitter takes whichever side is
 * favourable, so they never carry the penalty.
 *
 * The verdict here is derived from the same handedness rules the pipeline scores
 * with (`handednessEdge` in hrPipeline.ts), so the label a card shows can never
 * contradict the number sitting next to it.
 */

import type { BatSide, HrWatchRow, ThrowHand } from '../types/hrWatch';

export type PlatoonAdvantage = 'favorable' | 'unfavorable' | 'neutral' | 'unknown';

export interface PlatoonMatchup {
  /** Compact matchup label, e.g. "L vs RHP". Null when handedness is unknown. */
  label: string | null;
  advantage: PlatoonAdvantage;
  /** The pipeline's 0–100 handedness edge, or null when it isn't published. */
  score: number | null;
  /** One-line explanation, suitable for a tooltip. */
  detail: string;
}

const HAND_LABEL: Record<ThrowHand, string> = { L: 'LHP', R: 'RHP' };

function normalizeBatSide(value: unknown): BatSide | null {
  const side = typeof value === 'string' ? value.trim().toUpperCase() : '';
  return side === 'L' || side === 'R' || side === 'S' ? side : null;
}

function normalizeHand(value: unknown): ThrowHand | null {
  const hand = typeof value === 'string' ? value.trim().toUpperCase() : '';
  return hand === 'L' || hand === 'R' ? hand : null;
}

export function platoonMatchup(row: HrWatchRow): PlatoonMatchup {
  const bats = normalizeBatSide(row.batSide);
  const throws = normalizeHand(row.pitcherHand);
  const score = row.platoon != null && Number.isFinite(row.platoon) ? Math.round(row.platoon) : null;

  if (!bats || !throws) {
    return {
      label: bats && !throws ? `${bats} vs TBD` : null,
      advantage: 'unknown',
      score,
      detail: !bats
        ? 'Batting side unavailable for this hitter.'
        : 'Probable starter not announced, so the platoon split is unresolved.',
    };
  }

  const label = `${bats} vs ${HAND_LABEL[throws]}`;

  if (bats === 'S') {
    return {
      label,
      advantage: 'favorable',
      score,
      detail: `Switch hitter — bats from the favourable side against a ${HAND_LABEL[throws]}.`,
    };
  }

  const opposite = bats !== throws;

  return {
    label,
    advantage: opposite ? 'favorable' : 'unfavorable',
    score,
    detail: opposite
      ? `Opposite-handed matchup — ${bats}HH sees a ${HAND_LABEL[throws]} longer and lifts more balls to the pull side.`
      : `Same-handed matchup — ${bats}HH against a ${HAND_LABEL[throws]} is the harder look.`,
  };
}

/** Tailwind classes for a platoon pill, keyed by how the matchup grades out. */
export const PLATOON_TONE: Record<PlatoonAdvantage, string> = {
  favorable: 'border-vouch-emerald/35 bg-vouch-emerald/10 text-vouch-emerald',
  unfavorable: 'border-amber-400/30 bg-amber-400/10 text-amber-200',
  neutral: 'border-white/12 bg-black/30 text-white/60',
  unknown: 'border-white/10 bg-black/25 text-white/45',
};
