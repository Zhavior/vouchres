/**
 * Canonical odds helpers.
 *
 * Convention: `Leg.odds` is AMERICAN odds (e.g. -110, +450) or `null` when the
 * price is unknown. We never fabricate a price — an unparseable/missing input
 * becomes `null` ("Odds TBD"), NOT a placeholder like 1 or 1.01.
 */

/**
 * Parse any raw odds input into AMERICAN odds, or null if it is not a real price.
 *
 * Rules:
 *   - American odds (|x| >= 100) are kept as-is.
 *   - Decimal odds that are clearly real (> 1.01) are converted to American.
 *   - 0, NaN, empty, "N/A", and tiny placeholders (1, 1.01) → null (unknown).
 */
export function parseAmericanOdds(input: unknown): number | null {
  if (input === null || input === undefined) return null;

  let n: number;
  if (typeof input === 'number') {
    n = input;
  } else {
    const cleaned = String(input).trim().replace(/[^0-9+\-.]/g, '');
    if (!cleaned || cleaned === '+' || cleaned === '-' || cleaned === '.') return null;
    n = Number(cleaned);
  }

  if (!Number.isFinite(n) || n === 0) return null;

  // Already American.
  if (Math.abs(n) >= 100) return Math.round(n);

  // Decimal price that is clearly real (a true decimal price is > 1; we reject
  // the 1 / 1.01 placeholders the old code produced).
  if (n > 1.01) return decimalToAmerican(n);

  // Anything in (-100, 1.01] is a placeholder / not a real price.
  return null;
}

/** Convert any raw odds input into DECIMAL odds (> 1), or null if unknown. */
export function toDecimalOrNull(input: unknown): number | null {
  const american = parseAmericanOdds(input);
  if (american === null) return null;
  return Number(americanToDecimal(american).toFixed(3));
}

export function americanToDecimal(american: number): number {
  return american > 0 ? 1 + american / 100 : 1 + 100 / Math.abs(american);
}

export function decimalToAmerican(decimal: number): number {
  if (!Number.isFinite(decimal) || decimal <= 1) return 0;
  return decimal >= 2 ? Math.round((decimal - 1) * 100) : Math.round(-100 / (decimal - 1));
}

/** AMERICAN odds → display label, or "Odds TBD" when unknown. */
export function americanLabel(american: number | null | undefined): string {
  if (american === null || american === undefined || american === 0) return 'Odds TBD';
  return american > 0 ? `+${american}` : `${american}`;
}

/** DECIMAL odds → display label (American style), or "Odds TBD" when unknown.
 *  Values <= 1.01 are treated as placeholders, not real prices. */
export function decimalLabel(decimal: number | null | undefined): string {
  if (decimal === null || decimal === undefined || decimal <= 1.01) return 'Odds TBD';
  return americanLabel(decimalToAmerican(decimal));
}
