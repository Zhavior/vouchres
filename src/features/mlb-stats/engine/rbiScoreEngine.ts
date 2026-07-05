/**
 * RBI Score Engine — v1 Heuristic (not backtested)
 *
 * Judge panel synthesis:
 * - Split "clutch" out of contact rate — clutch is noise, contact rate is real skill
 * - Bullpen weakness labeled as "dynamic by PA number" — static for now, flag for v2
 * - De-collinearized: removed separate "team total" weight, folded into teamRunProjection
 * - Lineup confirmation data freshness is a caller responsibility
 *
 * RBI Score =
 *   25% Lineup Spot (1-2-3 = prime RBI opportunity)
 *   20% Team Run Projection (today's Vegas team total / park-adjusted)
 *   15% Opponent Pitcher Weakness (HR/9, hard-contact allowed, xFIP)
 *   15% Runners-on-Base Likelihood (team OBP leaders hitting in front)
 *   10% Contact Rate (K% avoidance — stable skill, not "clutch")
 *   10% Bullpen Weakness (NOTE: v2 should decay by expected PA number)
 *    5% Park/Weather
 */

import type { StatScoreEngine, StatScoreOutput, WeightedFactor } from '../types/statHubTypes';
import { assignTier } from '../types/statHubTypes';
import { STAT_CONFIG } from './statHubConfig';

export interface RbiScoreInput {
  lineupSpot:           number | null;   // 1-9
  teamRunProjection:    number | null;   // e.g. 4.8 (team Vegas total)
  pitcherWeaknessScore: number | null;   // 0-100 (pre-computed: high = vulnerable)
  runnersOnBaseScore:   number | null;   // 0-100 (OBP of hitters in front)
  contactRate:          number | null;   // 0-100 (K%-avoidance percentile)
  bullpenWeaknessScore: number | null;   // 0-100
  parkWeatherScore:     number | null;   // 0-100
  samplePa?:            number;
}

function lineupSpotScore(spot: number | null): number {
  if (spot == null) return 50;
  // 3-4-5 hitters = highest RBI spots, 1-2 = high, 6-7 = moderate, 8-9 = low
  const map: Record<number, number> = { 1: 72, 2: 78, 3: 95, 4: 100, 5: 92, 6: 75, 7: 60, 8: 40, 9: 25 };
  return map[spot] ?? 50;
}

function teamRunProjectionScore(total: number | null): number {
  if (total == null) return 50;
  // League avg team total ~4.5 runs
  if (total >= 6.0) return 100;
  if (total >= 5.5) return 88;
  if (total >= 5.0) return 76;
  if (total >= 4.5) return 64;
  if (total >= 4.0) return 52;
  if (total >= 3.5) return 38;
  return 24;
}

export const rbiScoreEngine: StatScoreEngine<RbiScoreInput> = {
  statType: 'rbi',
  thresholds: STAT_CONFIG.rbi.thresholds,

  compute(input: RbiScoreInput): StatScoreOutput {
    const factors: WeightedFactor[] = [
      { id: 'lineup',    label: 'Lineup Spot',          icon: '📋', value: lineupSpotScore(input.lineupSpot),             weight: 25 },
      { id: 'team_run',  label: 'Team Run Projection',  icon: '📈', value: teamRunProjectionScore(input.teamRunProjection), weight: 20 },
      { id: 'pitcher',   label: 'Pitcher Weakness',     icon: '⚾', value: input.pitcherWeaknessScore,                    weight: 15 },
      { id: 'runners',   label: 'Runners-on-Base Opp',  icon: '🏃', value: input.runnersOnBaseScore,                      weight: 15 },
      { id: 'contact',   label: 'Contact Rate',         icon: '🎯', value: input.contactRate,                             weight: 10 },
      { id: 'bullpen',   label: 'Bullpen Weakness',     icon: '🔄', value: input.bullpenWeaknessScore,                    weight: 10 },
      { id: 'park',      label: 'Park / Weather',       icon: '🌤️', value: input.parkWeatherScore,                        weight:  5 },
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
    const confidence = Math.max(20, Math.round(100 - (nullCount / factors.length) * 60 - (input.samplePa != null && input.samplePa < 100 ? 15 : 0)));

    return {
      score,
      tier: assignTier(score, STAT_CONFIG.rbi.thresholds),
      confidence,
      drivers: factors,
      sampleSize: input.samplePa,
      isHeuristic: true,
    };
  },
};
