/**
 * Hits Score Engine — v1 Heuristic, Phase 2 / Beta (not backtested)
 *
 * Judge panel synthesis:
 * - Primary driver = contact rate + BABIP tendency (Judge 12 note: hits are contact-first)
 * - Opposing pitcher hard-contact allowed (xwOBA proxy) as matchup factor
 * - Platoon advantage is real and measurable — keep as moderate weight
 * - Recent 10-game hit streak as momentum signal (small weight — noisy but useful)
 *
 * Hits Score =
 *   28% Contact Rate (K%-avoidance percentile)
 *   24% BABIP Trend (trailing 30g BABIP vs career baseline)
 *   22% Pitcher Hard-Contact Allowed (xwOBA, hard-hit% conceded)
 *   14% Platoon Advantage (R vs R, L vs L neutral; favorable splits get boost)
 *   12% Recent Form (10-game hit streak / hit rate momentum)
 */

import type { StatScoreEngine, StatScoreOutput, WeightedFactor } from '../types/statHubTypes';
import { assignTier } from '../types/statHubTypes';
import { STAT_CONFIG } from './statHubConfig';

export interface HitScoreInput {
  contactRate:               number | null;  // 0-100 percentile
  babipTrend:                number | null;  // 0-100 (trailing 30g BABIP vs career)
  pitcherHardContactAllowed: number | null;  // 0-100 (high = pitcher allows hard contact)
  platoonAdvantage:          number | null;  // 0-100 (favorable = 70+, neutral = 50, unfavorable = 30-)
  recentForm:                number | null;  // 0-100 (trailing 10g hit rate percentile)
  samplePa?:                 number;
}

export const hitScoreEngine: StatScoreEngine<HitScoreInput> = {
  statType: 'hits',
  thresholds: STAT_CONFIG.hits.thresholds,

  compute(input: HitScoreInput): StatScoreOutput {
    const factors: WeightedFactor[] = [
      { id: 'contact',  label: 'Contact Rate',           icon: '🎯', value: input.contactRate,               weight: 28 },
      { id: 'babip',    label: 'BABIP Trend',            icon: '📊', value: input.babipTrend,                weight: 24 },
      { id: 'pitcher',  label: 'Pitcher Hard Contact',   icon: '⚾', value: input.pitcherHardContactAllowed, weight: 22 },
      { id: 'platoon',  label: 'Platoon Advantage',      icon: '🔄', value: input.platoonAdvantage,          weight: 14 },
      { id: 'form',     label: 'Recent Form',            icon: '🔥', value: input.recentForm,               weight: 12 },
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
      tier: assignTier(score, STAT_CONFIG.hits.thresholds),
      confidence,
      drivers: factors,
      sampleSize: input.samplePa,
      isHeuristic: true,
    };
  },
};
