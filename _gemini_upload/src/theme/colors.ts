/**
 * colors.ts — Shared accent palette for the premium command-center theme.
 *
 * Design system:
 *   - Dark navy/black base
 *   - Cyan + emerald + muted gold accents
 *   - Soft glow on fills, never neon
 *
 * Separated from normalized.ts (types file) — colors are theme constants,
 * not type definitions. Components import colors from here.
 *
 * Sport-agnostic — same palette works for MLB, NBA, NHL, NFL.
 */

export const ACCENT = {
  // Core accents
  power: '#fb923c',       // orange — hitter/athlete power
  matchup: '#38bdf8',     // cyan — pitcher/opponent context
  form: '#c084fc',        // soft violet — recent form
  confidence: '#22d3ee',  // cyan-light — data confidence
  lineup: '#facc15',      // gold — lineup/playing status
  risk: '#f87171',        // rose — risk
  final: '#f97316',       // vivid orange — final composite score

  // Status colors
  emerald: '#34d399',     // emerald — success/confirmed
  gold: '#fbbf24',        // muted gold — premium accents
  danger: '#ef4444',      // red — errors/blocked
  warning: '#f59e0b',     // amber — warnings

  // Base colors
  navy: '#0b1120',        // dark navy base
  navyDeep: '#0a0e1a',    // deeper navy for panels
  slate: '#1e293b',       // slate border color
} as const;

/**
 * Risk tier colors — maps risk labels to accent colors.
 * Sport-agnostic (works for any sport with risk tiers).
 */
export const RISK_COLORS: Record<string, string> = {
  Strong: ACCENT.emerald,
  Safe: ACCENT.emerald,
  Playable: ACCENT.matchup,
  Balanced: ACCENT.matchup,
  Sneaky: ACCENT.form,
  Risky: ACCENT.power,
  Lotto: ACCENT.power,
  Avoid: ACCENT.risk,
  Trap: ACCENT.risk,
};

/**
 * Grade colors — maps letter grades to accent colors.
 */
export const GRADE_COLORS: Record<string, string> = {
  'A+': ACCENT.emerald,
  A: '#4ade80',
  B: ACCENT.matchup,
  C: ACCENT.gold,
  D: ACCENT.power,
  F: ACCENT.risk,
};

/**
 * Get a risk color safely — returns slate if label is unknown.
 */
export function getRiskColor(label?: string | null): string {
  if (!label) return '#94a3b8';
  return RISK_COLORS[label] ?? '#94a3b8';
}

/**
 * Get a grade color safely — returns slate if grade is unknown.
 */
export function getGradeColor(grade?: string | null): string {
  if (!grade) return '#94a3b8';
  return GRADE_COLORS[grade] ?? '#94a3b8';
}
