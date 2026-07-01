/**
 * colors.ts — Shared accent palette for the premium command-center theme.
 *
 * Design system:
 *   - Deep graphite/navy base
 *   - Cyan primary + restrained indigo secondary
 *   - Gold only for premium/confidence moments
 *   - Soft glow on fills, never neon
 *
 * Separated from normalized.ts (types file) — colors are theme constants,
 * not type definitions. Components import colors from here.
 *
 * Sport-agnostic — same palette works for MLB, NBA, NHL, NFL.
 */

export const ACCENT = {
  // Core accents
  power: 'hsl(var(--ve-accent-gold))',       // gold — premium power/confidence
  matchup: 'hsl(var(--ve-accent-cyan))',     // cyan — pitcher/opponent context
  form: 'hsl(var(--ve-accent-pink))',        // restrained indigo — recent form
  confidence: 'hsl(var(--ve-accent-cyan))',  // cyan — data confidence
  lineup: 'hsl(var(--ve-accent-gold))',      // gold — lineup/playing status
  risk: 'hsl(var(--ve-danger))',             // red — risk
  final: 'hsl(var(--ve-accent-gold))',       // gold — final premium composite score

  // Status colors
  emerald: 'hsl(var(--ve-success))',         // success/confirmed
  gold: 'hsl(var(--ve-accent-gold))',        // premium accents
  danger: 'hsl(var(--ve-danger))',           // errors/blocked
  warning: 'hsl(var(--ve-warning))',         // warnings

  // Base colors
  navy: 'hsl(var(--ve-bg-panel))',           // dark panel base
  navyDeep: 'hsl(var(--ve-bg-deep))',        // deeper page base
  slate: 'hsl(var(--ve-border))',            // border color
} as const;

export function withAlpha(color: string, alpha: number): string {
  const clamped = Math.max(0, Math.min(1, alpha));
  const tokenMatch = color.match(/^hsl\(var\((--[^)]+)\)\)$/);
  if (tokenMatch) return `hsl(var(${tokenMatch[1]}) / ${clamped})`;
  if (color.startsWith('#')) {
    const hex = Math.round(clamped * 255).toString(16).padStart(2, '0');
    return `${color}${hex}`;
  }
  return `color-mix(in srgb, ${color} ${Math.round(clamped * 100)}%, transparent)`;
}

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
  A: ACCENT.emerald,
  B: ACCENT.matchup,
  C: ACCENT.gold,
  D: ACCENT.warning,
  F: ACCENT.risk,
};

/**
 * Get a risk color safely — returns slate if label is unknown.
 */
export function getRiskColor(label?: string | null): string {
  if (!label) return 'hsl(var(--ve-text-muted))';
  return RISK_COLORS[label] ?? 'hsl(var(--ve-text-muted))';
}

/**
 * Get a grade color safely — returns slate if grade is unknown.
 */
export function getGradeColor(grade?: string | null): string {
  if (!grade) return 'hsl(var(--ve-text-muted))';
  return GRADE_COLORS[grade] ?? 'hsl(var(--ve-text-muted))';
}
