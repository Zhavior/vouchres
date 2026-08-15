/**
 * Shared Safe Numeric Utility
 *
 * Casts an unknown value to a finite number, with support for finite numeric strings,
 * or safely falls back to a provided default value.
 *
 * @param val The value to safely validate and cast
 * @param fallback Default number if val is null, undefined, NaN, or non-finite (default: 0)
 * @returns Bounded, validated finite number
 */
export function safeNumber(val: unknown, fallback: number = 0): number {
  return typeof val === 'number' && Number.isFinite(val) ? val : fallback;
}
