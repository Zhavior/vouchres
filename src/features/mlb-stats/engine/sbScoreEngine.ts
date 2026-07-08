/**
 * Stolen Base Score Engine — v1 Heuristic (not backtested)
 *
 * Judge panel synthesis:
 * - REMOVED "umpire tendency" — was a copy-paste error from K formula, irrelevant for SB
 * - Combined catcher pop time + pitcher hold into single "defResponseTime" composite
 *   (addresses Judge 6's de-collinearization note — avoids two correlated defensive signals)
 * - Team aggression flag: manager tendency to run (season SB attempts / opportunities)
 * - Game script: closer game = more running (avoids blowout bias)
 *
 * SB Score =
 *   30% Sprint Speed (Statcast ft/s percentile)
 *   25% Steal Rate (SB attempts / opportunities at 1B — trailing 60g)
 *   20% Defensive Response Time (composite: catcher pop + pitcher hold score, inverted)
 *   15% Team Aggression (manager running tendency)
 *   10% Game Script (score differential / expected close game)
 */

import type { StatScoreEngine, StatScoreOutput, WeightedFactor } from '../types/statHubTypes';
import { assignTier } from '../types/statHubTypes';
import { STAT_CONFIG } from './statHubConfig';

export interface SbScoreInput {
  sprintSpeed:     number | null;  // 0-100 percentile (Statcast ft/s)
  stealRate:       number | null;  // 0-100 (SB attempts / opportunities, trailing 60g)
  defResponseTime: number | null;  // 0-100 — INVERTED: high = slow catcher+hold = good for runner
  teamAggression:  number | null;  // 0-100 (manager running tendency this season)
  gameScript:      number | null;  // 0-100 (close game likelihood — model projection)
  sampleGames?:    number;
}

export const sbScoreEngine: StatScoreEngine<SbScoreInput> = {
  statType: 'sb',
  thresholds: STAT_CONFIG.sb.thresholds,

  compute(input: SbScoreInput): StatScoreOutput {
    const factors: WeightedFactor[] = [
      { id: 'sprint',    label: 'Sprint Speed',        icon: '⚡', value: input.sprintSpeed,     weight: 30 },
      { id: 'steal',     label: 'Steal Rate',          icon: '🏃', value: input.stealRate,       weight: 25 },
      { id: 'defense',   label: 'Def Response Time',   icon: '🧤', value: input.defResponseTime, weight: 20 },
      { id: 'aggro',     label: 'Team Aggression',     icon: '📋', value: input.teamAggression,  weight: 15 },
      { id: 'script',    label: 'Game Script',         icon: '🎮', value: input.gameScript,      weight: 10 },
    ];

    let sumScore = 0, sumWeight = 0, nullCount = 0;
    for (const f of factors) {
      if (f.value != null) {
        sumScore  += f.value * f.weight;
        sumWeight += f.weight;
      } else {
        nullCount++;
      }
    }

    const score = sumWeight > 0 ? Math.round(sumScore / sumWeight) : 0;
    const confidence = Math.max(20, Math.round(
      100 - (nullCount / factors.length) * 60
          - (input.sampleGames != null && input.sampleGames < 30 ? 20 : 0)
    ));

    return {
      score,
      tier: assignTier(score, STAT_CONFIG.sb.thresholds),
      confidence,
      drivers: factors,
      sampleSize: input.sampleGames,
      isHeuristic: true,
    };
  },
};
