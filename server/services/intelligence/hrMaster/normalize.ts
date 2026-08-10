/** Shared normalization helpers for HR Master feature engineering. */

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function clampToUnitScale(value: number): number {
  return clamp(value, 0, 1);
}

/** Linear min-max normalize to 0..1 with clamp. */
export function normalizeMinMax(value: number, min: number, max: number): number {
  if (max <= min) return 0.5;
  return clampToUnitScale((value - min) / (max - min));
}

export function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

export function daysSince(isoDate: string, referenceDate: string): number {
  const a = new Date(isoDate).getTime();
  const b = new Date(referenceDate).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 999;
  return Math.max(0, Math.round((b - a) / (1000 * 60 * 60 * 24)));
}

export function decimalToAmerican(decimal: number): number {
  if (decimal <= 1) return 0;
  const p = 1 / decimal;
  if (p >= 0.5) return -Math.round((p / (1 - p)) * 100);
  return Math.round(((1 - p) / p) * 100);
}

export function americanToDecimal(american: number): number {
  if (american === 0) return 1;
  if (american > 0) return 1 + american / 100;
  return 1 + 100 / Math.abs(american);
}

export function formatAmericanOdds(american: number): string {
  if (american === 0) return "EVEN";
  return american > 0 ? `+${american}` : `${american}`;
}

export function formatPercent(value: number, digits = 1): string {
  return `${(value * 100).toFixed(digits)}%`;
}

export function formatEvPercent(ev: number): string {
  const sign = ev >= 0 ? "+" : "";
  return `${sign}${(ev * 100).toFixed(1)}%`;
}
