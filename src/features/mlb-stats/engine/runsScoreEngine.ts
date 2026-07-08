/**
 * Runs Score Engine — v1 Heuristic (not backtested)
 *
 * Judge panel synthesis:
 * - De-collinearized: removed separate "team total" weight, folded into teamOffenseScore
 *   (one unified team offense signal, not two correlated inputs)
 * - Lineup top-of-order matters most — 1-2 hitters score best for Runs
 * - Speed/baserunning as secondary complement to OBP, not a standalone
 *
 * Runs Score =
 *   30% OBP Trend (trailing 30-game OBP percentile vs league)
 *   22% Lineup Spot (1-2 = prime, 3-4 = good, mid-low = reduced)
 *   20% Team Offense Score (Vegas total + wRC+ proxy — single unified signal)
 *   15% Opposing Pitcher Weakness (xFIP, BB/9, HR/9)
 *    8% Speed / Baserunning (sprint speed + base-taking aggressiveness)
 *    5% Park / Weather
 */

import type { StatScoreEngine, StatScoreOutput, WeightedFactor } from '../types/statHubTypes';
import { assignTier } from '../types/statHubTypes';
import { STAT_CONFIG } from './statHubConfig';

export interface RunsScoreInput {
  obpTrend:             number | null;  // 0-100 percentile (trailing 30g OBP)
  lineupSpot:           number | null;  // 1-9
  teamOffenseScore:     number | null;  // 0-100 unified (Vegas total + wRC+)
  pitcherWeaknessScore: number | null;  // 0-100 (BB/9, xFIP, HR/9)
  speedScore:           number | null;  // 0-100 (sprint speed + base-taking percentile)
  parkWeatherScore:     number | null;  // 0-100
  samplePa?:            number;
}

function lineupSpotScore(spot: number | null): number {
  if (spot == null) return 50;
  // Top of order scores highest for Runs (need to come around to score)
  const map: Record<number, number> = { 1: 100, 2: 95, 3: 85, 4: 78, 5: 70, 6: 55, 7: 45, 8: 30, 9: 20 };
  return map[spot] ?? 50;
}

export const runsScoreEngine: StatScoreEngine<RunsScoreInput> = {
  statType: 'runs',
  thresholds: STAT_CONFIG.runs.thresholds,

  compute(input: RunsScoreInput): StatScoreOutput {
    const factors: WeightedFactor[] = [
      { id: 'obp',      label: 'OBP Trend',           icon: '📊', value: input.obpTrend,             weight: 30 },
      { id: 'lineup',   label: 'Lineup Spot',          icon: '📋', value: lineupSpotScore(input.lineupSpot), weight: 22 },
      { id: 'offense',  label: 'Team Offense',         icon: '⚡', value: input.teamOffenseScore,     weight: 20 },
      { id: 'pitcher',  label: 'Pitcher Weakness',     icon: '⚾', value: input.pitcherWeaknessScore, weight: 15 },
      { id: 'speed',    label: 'Speed / Baserunning',  icon: '🏃', value: input.speedScore,           weight:  8 },
      { id: 'park',     label: 'Park / Weather',       icon: '🌤️', value: input.parkWeatherScore,     weight:  5 },
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
      tier: assignTier(score, STAT_CONFIG.runs.thresholds),
      confidence,
      drivers: factors,
      sampleSize: input.samplePa,
      isHeuristic: true,
    };
  },
};
