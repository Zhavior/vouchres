/**
 * Total Bases Score Engine — v1 Heuristic, Phase 2 / Beta (not backtested)
 *
 * Judge panel synthesis:
 * - ISO and slugging are the dominant signals — weight heavily (Judge notes)
 * - Extra-base park factor is unique to this stat: not just HR park factor,
 *   but specifically doubles/triples territory (deep gaps, foul territory)
 * - Opposing pitcher hard-contact allowed still relevant
 * - Lineup protection (hitting behind big slugger = more fastballs)
 *
 * Total Bases Score =
 *   30% ISO (Isolated Power percentile, trailing 30g)
 *   25% Slugging % (trailing 30g vs career)
 *   20% Extra-Base Park Factor (park doubles+triples factor, not just HR)
 *   15% Pitcher Hard-Contact Allowed (xwOBA, hard-hit%)
 *   10% Lineup Protection (batting behind a feared hitter = fastball frequency)
 */

import type { StatScoreEngine, StatScoreOutput, WeightedFactor } from '../types/statHubTypes';
import { assignTier } from '../types/statHubTypes';
import { STAT_CONFIG } from './statHubConfig';

export interface TotalBasesScoreInput {
  iso:                       number | null;  // 0-100 percentile
  slugPct:                   number | null;  // 0-100 percentile (trailing 30g)
  parkExtraBaseFactor:       number | null;  // 0-100 (park-specific extra-base factor)
  pitcherHardContactAllowed: number | null;  // 0-100
  lineupProtection:          number | null;  // 0-100 (hitting behind feared hitter)
  samplePa?:                 number;
}

export const totalBasesScoreEngine: StatScoreEngine<TotalBasesScoreInput> = {
  statType: 'total_bases',
  thresholds: STAT_CONFIG.total_bases.thresholds,

  compute(input: TotalBasesScoreInput): StatScoreOutput {
    const factors: WeightedFactor[] = [
      { id: 'iso',        label: 'ISO (Isolated Power)',    icon: '💪', value: input.iso,                       weight: 30 },
      { id: 'slug',       label: 'Slugging %',             icon: '📊', value: input.slugPct,                   weight: 25 },
      { id: 'park',       label: 'Extra-Base Park Factor', icon: '🏟️', value: input.parkExtraBaseFactor,       weight: 20 },
      { id: 'pitcher',    label: 'Pitcher Hard Contact',   icon: '⚾', value: input.pitcherHardContactAllowed, weight: 15 },
      { id: 'protection', label: 'Lineup Protection',      icon: '📋', value: input.lineupProtection,          weight: 10 },
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
      tier: assignTier(score, STAT_CONFIG.total_bases.thresholds),
      confidence,
      drivers: factors,
      sampleSize: input.samplePa,
      isHeuristic: true,
    };
  },
};
