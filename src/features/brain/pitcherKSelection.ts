/**
 * @deprecated LEGACY CLIENT PROJECTION — DO NOT IMPORT IN RUNTIME UI.
 * Server path: centralBrain/pitcherKSelectionPolicy.ts + getBrainMlbPicksForDate.
 */

import type { StatPlayerRow } from '../mlb-stats/types/statHubTypes';
import type { BrainPickTag } from './brainSelection';

export type PitcherKBrainPick = {
  pitcher: StatPlayerRow;
  tags: BrainPickTag[];
  explanation: string;
};

/** @deprecated Use server pitcherKSelectionPolicy instead. */
export function selectPitcherKBrainPicks(rows: StatPlayerRow[], limit = 12): PitcherKBrainPick[] {
  const teamCounts = new Map<string, number>();
  const chosen: StatPlayerRow[] = [];
  const ranked = [...rows].sort((a, b) => b.statScore - a.statScore || b.confidence - a.confidence);
  const primary = ranked.filter((row) => ['elite', 'strong'].includes(row.tier) && row.statScore >= 68);
  const watch = ranked.filter((row) => row.tier === 'watch' && row.statScore >= 58);

  for (const row of [...primary, ...watch]) {
    if (row.confidence < 55 || row.lineupStatus === 'out') continue;
    if ((teamCounts.get(row.team) ?? 0) >= 1) continue;
    chosen.push(row);
    teamCounts.set(row.team, 1);
    if (chosen.length >= limit) break;
  }

  return chosen.map((pitcher) => {
    const strongest = [...pitcher.drivers]
      .filter((driver) => driver.value != null)
      .sort((a, b) => (b.value ?? 0) * b.weight - (a.value ?? 0) * a.weight)
      .slice(0, 2);
    const tags: BrainPickTag[] = [
      { label: pitcher.tier === 'elite' ? 'Elite K profile' : 'Strong K profile', tone: 'positive' as const },
      ...strongest.map((driver) => ({ label: driver.label, tone: 'neutral' as const })),
      ...(pitcher.confidence < 70 ? [{ label: 'Confidence caution', tone: 'warning' as const }] : []),
    ].slice(0, 4);

    return {
      pitcher,
      tags,
      explanation: `${pitcher.playerName} is one of the highest-rated strikeout profiles on today's slate at ${pitcher.statScore}/100. ` +
        `${strongest.length ? `The leading signals are ${strongest.map((driver) => driver.label.toLowerCase()).join(' and ')}.` : 'Key supporting inputs are incomplete.'} ` +
        `This is a heuristic ranking against ${pitcher.opponent}, not a calibrated sportsbook-line prediction.`,
    };
  });
}
