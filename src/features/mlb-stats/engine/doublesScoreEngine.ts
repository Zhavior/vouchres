/**
 * Doubles Score Engine — v1 Heuristic, Phase 2 / Beta (not backtested)
 *
 * Judge panel synthesis:
 * - Unique differentiator: OF arm strength — doubles are often gap balls where
 *   a weak outfield arm can't cut the runner down at 2B (Judge note: this is
 *   a genuine unique signal not used in HR/TB models)
 * - Gap power (line-drive rate + oppo-field tendency) is the primary driver
 * - Park gap factor: deep power alleys = more doubles territory
 * - Platoon splits matter for doubles (same as hits model)
 *
 * Doubles Score =
 *   28% Gap Power (LD% + oppo-field tendency percentile)
 *   24% Park Gap Factor (power alley depth + foul territory, doubles-specific)
 *   22% Opposing OF Arm Strength (INVERTED: weak OF = more doubles)
 *   15% Pitcher Soft-Contact Allowed (ground-ball% is bad for doubles; fly-ball/LD% is good)
 *   11% Platoon Advantage
 */

import type { StatScoreEngine, StatScoreOutput, WeightedFactor } from '../types/statHubTypes';
import { assignTier } from '../types/statHubTypes';
import { STAT_CONFIG } from './statHubConfig';

export interface DoublesScoreInput {
  gapPower:        number | null;  // 0-100 (LD% + oppo tendency percentile)
  parkGapFactor:   number | null;  // 0-100 (doubles-specific park factor)
  ofArmStrength:   number | null;  // 0-100 INVERTED: 0 = rocket arm (bad), 100 = weak arm (good for doubles)
  pitcherGBFactor: number | null;  // 0-100 INVERTED: low GB pitcher = more doubles territory
  platoonAdvantage: number | null; // 0-100
  samplePa?:       number;
}

export const doublesScoreEngine: StatScoreEngine<DoublesScoreInput> = {
  statType: 'doubles',
  thresholds: STAT_CONFIG.doubles.thresholds,

  compute(input: DoublesScoreInput): StatScoreOutput {
    const factors: WeightedFactor[] = [
      { id: 'gap',      label: 'Gap Power',          icon: '✌️', value: input.gapPower,        weight: 28 },
      { id: 'park',     label: 'Park Gap Factor',    icon: '🏟️', value: input.parkGapFactor,   weight: 24 },
      { id: 'of_arm',   label: 'OF Arm Weakness',    icon: '🧤', value: input.ofArmStrength,   weight: 22 },
      { id: 'pitcher',  label: 'Pitcher FB/LD Rate', icon: '⚾', value: input.pitcherGBFactor, weight: 15 },
      { id: 'platoon',  label: 'Platoon Advantage',  icon: '🔄', value: input.platoonAdvantage, weight: 11 },
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
          - (input.samplePa != null && input.samplePa < 100 ? 15 : 0)
    ));

    return {
      score,
      tier: assignTier(score, STAT_CONFIG.doubles.thresholds),
      confidence,
      drivers: factors,
      sampleSize: input.samplePa,
      isHeuristic: true,
    };
  },
};
