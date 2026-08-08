import React from 'react';
import { platoonMatchup, PLATOON_TONE } from '../../engine/platoon';
import type { HrWatchRow } from '../../types/hrWatch';

interface PlatoonPillProps {
  player: HrWatchRow;
  /** Append the pipeline's 0–100 handedness edge next to the matchup label. */
  showScore?: boolean;
  className?: string;
}

/**
 * The L/R platoon split as a compact pill — "L vs RHP", coloured by whether the
 * handedness matchup favours the bat. Renders nothing when neither the batting
 * side nor the starter's hand is known, rather than showing an empty chip.
 */
export const PlatoonPill: React.FC<PlatoonPillProps> = ({ player, showScore = false, className = '' }) => {
  const matchup = platoonMatchup(player);
  if (!matchup.label) return null;

  return (
    <span
      title={matchup.detail}
      className={`inline-flex shrink-0 items-center gap-1 rounded-md border px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide ${PLATOON_TONE[matchup.advantage]} ${className}`}
    >
      {matchup.label}
      {showScore && matchup.score != null ? (
        <span className="tabular-nums opacity-70">{matchup.score}</span>
      ) : null}
    </span>
  );
};

export default PlatoonPill;
