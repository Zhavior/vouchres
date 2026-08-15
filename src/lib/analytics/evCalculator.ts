/**
 * Calibrated Expected Value (EV) calculation engine for MLB props.
 */

/**
 * Convert American odds (e.g. +250, -120) to Decimal odds.
 */
export function americanToDecimal(americanOdds: number): number {
  if (americanOdds > 0) {
    return Number((americanOdds / 100 + 1).toFixed(4));
  }
  if (americanOdds < 0) {
    return Number((100 / Math.abs(americanOdds) + 1).toFixed(4));
  }
  return 1.0;
}

export interface EvCalculationResult {
  evPercent: number;
  decimalOdds: number;
  isPositiveEv: boolean;
  formatted: string;
}

/**
 * Calculate expected value percentage given model probability and American odds.
 * Equation: EV% = ((Model_Probability * Decimal_Odds) - 1) * 100
 */
export function calculateExpectedValue(
  modelProb: number,
  americanOdds: number
): EvCalculationResult {
  const decimalOdds = americanToDecimal(americanOdds);
  const evPercent = (modelProb * decimalOdds - 1) * 100;
  const isPositiveEv = evPercent > 0;
  const rounded = Number(evPercent.toFixed(1));

  return {
    evPercent: rounded,
    decimalOdds,
    isPositiveEv,
    formatted: rounded >= 0 ? `+${rounded.toFixed(1)}%` : `${rounded.toFixed(1)}%`,
  };
}

/**
 * Quick helper to get formatted EV badge string directly from HR Index and price.
 */
export function getCalibratedEvBadge(hrIndex: number, price?: number): string {
  if (price === undefined) return '+0.0%';
  const modelProb = hrIndex / 100;
  const result = calculateExpectedValue(modelProb, price);
  return result.formatted;
}
