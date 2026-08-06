/**
 * Shared 0–100 research-score scale for the Today surface.
 *
 * Every score the page renders — HR signal, run environment, pitcher
 * vulnerability — went through the same emerald treatment regardless of value,
 * so a 71 read exactly like a 94. This is the single place that decides what a
 * number means, and it is deliberately kept pure so the thresholds can be
 * unit-tested next to the model that produces the scores.
 *
 * Tier is always carried by a written band label as well as a hue. Colour alone
 * is not an accessible encoding, and these numbers inform money decisions.
 *
 * Colours are the approved semantic tokens from vouchedge-tokens.css. All three
 * clear WCAG AA (4.5:1) against the Today card surfaces (#061018 / #07111b):
 * emerald #31B583 → 7.3:1, amber #D99C4A → 7.9:1, negative #D96459 → 5.3:1.
 */

export type SignalTierId = 'elite' | 'moderate' | 'caution' | 'unknown';

export interface SignalTier {
  id: SignalTierId;
  /** Band name rendered beside the number. */
  label: string;
  /** Inclusive lower bound of the band. */
  min: number;
}

/** Ordered high → low; `signalTierFor` takes the first band the score clears. */
export const SIGNAL_TIERS: readonly SignalTier[] = [
  { id: 'elite', label: 'Elite', min: 80 },
  { id: 'moderate', label: 'Moderate', min: 65 },
  { id: 'caution', label: 'Caution', min: 1 },
] as const;

/**
 * A missing or zero score is not a weak score. The reel already renders those
 * as an em dash, so they get a neutral tier rather than being painted red.
 */
export const UNKNOWN_SIGNAL_TIER: SignalTier = { id: 'unknown', label: 'No score', min: 0 };

export function signalTierFor(score: number | null | undefined): SignalTier {
  if (typeof score !== 'number' || !Number.isFinite(score) || score <= 0) {
    return UNKNOWN_SIGNAL_TIER;
  }
  return SIGNAL_TIERS.find((tier) => score >= tier.min) ?? UNKNOWN_SIGNAL_TIER;
}

export interface SignalTierStyle {
  /** Score glyph and band label. */
  text: string;
  /** Softened variant for the unit caption under the score. */
  caption: string;
  /** Score medallion ring. */
  border: string;
  /** Score medallion fill, layered over the card surface. */
  bg: string;
  /** Card edge when the tier owns the whole card (top HR signal). */
  cardBorder: string;
  /** box-shadow value for the medallion halo — kept as raw CSS so the alpha
   *  stays low enough not to bloom over neighbouring content. */
  halo: string;
  /** radial-gradient value for the card's ambient wash. */
  wash: string;
}

/**
 * Full class strings (never composed at runtime) so Tailwind's scanner sees
 * every utility this module can emit.
 */
export const SIGNAL_TIER_STYLES: Record<SignalTierId, SignalTierStyle> = {
  elite: {
    text: 'text-vouch-emerald',
    caption: 'text-vouch-emerald',
    border: 'border-vouch-emerald/45',
    bg: 'bg-vouch-emerald/10',
    cardBorder: 'border-vouch-emerald/55',
    halo: '0 0 36px -12px rgba(49, 181, 131, 0.85)',
    wash: 'radial-gradient(circle at 18% 20%, rgba(49, 181, 131, 0.13), transparent 34%)',
  },
  moderate: {
    text: 'text-vouch-amber',
    caption: 'text-vouch-amber',
    border: 'border-vouch-amber/45',
    bg: 'bg-vouch-amber/10',
    cardBorder: 'border-vouch-amber/50',
    halo: '0 0 36px -12px rgba(217, 156, 74, 0.8)',
    wash: 'radial-gradient(circle at 18% 20%, rgba(217, 156, 74, 0.12), transparent 34%)',
  },
  caution: {
    text: 'text-ve-negative',
    caption: 'text-ve-negative',
    border: 'border-ve-negative/45',
    bg: 'bg-ve-negative/10',
    cardBorder: 'border-ve-negative/50',
    halo: '0 0 36px -12px rgba(217, 100, 89, 0.75)',
    wash: 'radial-gradient(circle at 18% 20%, rgba(217, 100, 89, 0.11), transparent 34%)',
  },
  unknown: {
    text: 'text-white/75',
    caption: 'text-white/60',
    border: 'border-white/18',
    bg: 'bg-white/[0.04]',
    cardBorder: 'border-white/12',
    halo: '0 0 30px -14px rgba(255, 255, 255, 0.3)',
    wash: 'radial-gradient(circle at 18% 20%, rgba(255, 255, 255, 0.05), transparent 34%)',
  },
};

export function signalTierStyle(score: number | null | undefined): SignalTierStyle {
  return SIGNAL_TIER_STYLES[signalTierFor(score).id];
}
