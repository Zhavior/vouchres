/**
 * Pitcher Strikeout Score Engine — v1 Heuristic, Phase 2 / Beta (not backtested)
 *
 * Judge panel synthesis:
 * - PRIMARY drivers = trailing K average + opposing lineup K%
 *   (Judge 12: these two signals alone explain ~70% of K output variance)
 * - NOT "opponent weakness" as a generic catch-all — specifically lineup K%
 * - Swinging strike rate (SwStr%) is the most predictive single-game K indicator
 * - Pitch mix depth: high zone fastball + off-speed combo = higher K ceiling
 * - NOTE: umpire zone size explicitly excluded — too noisy day-to-day per judge panel
 *
 * Pitcher K Score =
 *   30% Trailing K Average (last 5 starts K/9 percentile)
 *   28% Opposing Lineup K% (opponent team's K% vs RHP/LHP this season)
 *   22% Swinging Strike Rate (SwStr%, trailing 5 starts)
 *   12% Pitch Mix Depth (arsenal diversity + off-speed usage rate)
 *    8% Park / Temperature (cold temps suppress breaking ball movement)
 */

import type { StatScoreEngine, StatScoreOutput, WeightedFactor } from '../types/statHubTypes';
import { assignTier } from '../types/statHubTypes';
import { STAT_CONFIG } from './statHubConfig';

export interface PitcherKScoreInput {
  trailingKAvg:        number | null;  // 0-100 percentile (last 5 starts K/9)
  opposingLineupKPct:  number | null;  // 0-100 percentile (opponent lineup K% vs hand)
  swingingStrikeRate:  number | null;  // 0-100 percentile (SwStr%, trailing 5 starts)
  pitchMixDepth:       number | null;  // 0-100 (arsenal diversity + off-speed usage)
  parkTempFactor:      number | null;  // 0-100 (warm + enclosed parks score high)
  sampleStarts?:       number;
}

export const pitcherKScoreEngine: StatScoreEngine<PitcherKScoreInput> = {
  statType: 'pitcher_k',
  thresholds: STAT_CONFIG.pitcher_k.thresholds,

  compute(input: PitcherKScoreInput): StatScoreOutput {
    const factors: WeightedFactor[] = [
      { id: 'trailing_k',   label: 'Trailing K Avg',       icon: '🔥', value: input.trailingKAvg,       weight: 30 },
      { id: 'lineup_k',     label: 'Opposing Lineup K%',   icon: '📊', value: input.opposingLineupKPct,  weight: 28 },
      { id: 'swstr',        label: 'Swinging Strike Rate', icon: '⚾', value: input.swingingStrikeRate,  weight: 22 },
      { id: 'pitch_mix',    label: 'Pitch Mix Depth',      icon: '🎭', value: input.pitchMixDepth,      weight: 12 },
      { id: 'park_temp',    label: 'Park / Temperature',   icon: '🌡️', value: input.parkTempFactor,     weight:  8 },
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
          - (input.sampleStarts != null && input.sampleStarts < 5 ? 25 : 0)
    ));

    return {
      score,
      tier: assignTier(score, STAT_CONFIG.pitcher_k.thresholds),
      confidence,
      drivers: factors,
      sampleSize: input.sampleStarts,
      isHeuristic: true,
    };
  },
};
