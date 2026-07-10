/**
 * VouchEdge HR Engine — Tier Assignment
 *
 * Thresholds align with the MLB HR pipeline score distribution (1–100):
 *   82–100  → Elite
 *   72–81   → Strong
 *   62–71   → Watch
 *   52–61   → Sleeper
 *   < 52    → Fade
 *
 * Board columns map Elite / Strong / Watch / Sleepers via normalizeHrWatch riskTier.
 */

import { HrTier, TierResult } from './types';

export const TIER_THRESHOLDS = {
  elite: 82,
  strong: 72,
  watch: 62,
  sleeper: 52,
} as const;

export type CardTierStyle = {
  label: string;
  scoreColor: string;
  badge: string;
  shell: string;
  barColor: string;
};

export function tierStyleForScore(score: number): CardTierStyle {
  if (score >= TIER_THRESHOLDS.elite) {
    return {
      label: 'Elite',
      scoreColor: '#fcd34d',
      badge: 'border-amber-300/40 bg-amber-400/15 text-amber-100',
      shell: 've-tier-elite',
      barColor: 'linear-gradient(90deg, #f59e0b, #fcd34d)',
    };
  }
  if (score >= TIER_THRESHOLDS.strong) {
    return {
      label: 'Strong',
      scoreColor: '#67e8f9',
      badge: 'border-cyan-300/35 bg-cyan-400/12 text-cyan-100',
      shell: 've-tier-strong',
      barColor: 'linear-gradient(90deg, #0891b2, #67e8f9)',
    };
  }
  if (score >= TIER_THRESHOLDS.watch) {
    return {
      label: 'Watch',
      scoreColor: '#cbd5e1',
      badge: 'border-slate-400/30 bg-slate-500/10 text-slate-200',
      shell: 've-tier-watch',
      barColor: 'linear-gradient(90deg, #475569, #94a3b8)',
    };
  }
  if (score >= TIER_THRESHOLDS.sleeper) {
    return {
      label: 'Sleeper',
      scoreColor: '#c4b5fd',
      badge: 'border-violet-400/35 bg-violet-500/12 text-violet-200',
      shell: 've-tier-sleeper',
      barColor: 'linear-gradient(90deg, #7c3aed, #c4b5fd)',
    };
  }
  return {
    label: 'Fade',
    scoreColor: '#94a3b8',
    badge: 'border-rose-900/50 bg-rose-950/40 text-rose-300/70',
    shell: 've-tier-fade',
    barColor: 'linear-gradient(90deg, #475569, #64748b)',
  };
}

export function tierLabelForScore(score: number): string {
  return tierStyleForScore(score).label.toUpperCase();
}

export function assignHrTier(score: number): TierResult {
  let tier: HrTier;
  let label: string;
  let description: string;

  if (score >= TIER_THRESHOLDS.elite) {
    tier = 'Elite';
    label = 'Elite HR Target';
    description = 'All major signals aligned — top probability, maximum edge';
  } else if (score >= TIER_THRESHOLDS.strong) {
    tier = 'Strong';
    label = 'Strong HR Target';
    description = 'Strong HR profile with favorable matchup and park conditions';
  } else if (score >= TIER_THRESHOLDS.watch) {
    tier = 'Watch';
    label = 'Watch — HR Candidate';
    description = 'Solid HR candidate with some mixed signals — worth monitoring';
  } else if (score >= TIER_THRESHOLDS.sleeper) {
    tier = 'Sleeper';
    label = 'Sleeper HR Target';
    description = 'Lower-probability HR with upside if matchup breaks right';
  } else {
    tier = 'Avoid';
    label = 'Fade';
    description = 'Insufficient signals — book likely has better price';
  }

  return { tier, label, description };
}
