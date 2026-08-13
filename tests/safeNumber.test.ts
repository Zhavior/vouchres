import { describe, expect, it } from 'vitest';
import { safeNumber } from '../src/utils/safeNumber';

describe('src/utils/safeNumber — Shared Numeric Utility', () => {
  it('returns finite numbers unchanged', () => {
    expect(safeNumber(42)).toBe(42);
    expect(safeNumber(0)).toBe(0);
    expect(safeNumber(-10.5)).toBe(-10.5);
    expect(safeNumber(3.14159)).toBe(3.14159);
  });

  it('falls back to default fallback (0) for non-finite and non-number types', () => {
    expect(safeNumber(NaN)).toBe(0);
    expect(safeNumber(Infinity)).toBe(0);
    expect(safeNumber(-Infinity)).toBe(0);
    expect(safeNumber(null)).toBe(0);
    expect(safeNumber(undefined)).toBe(0);
    expect(safeNumber('42')).toBe(0);
    expect(safeNumber('not_a_number')).toBe(0);
    expect(safeNumber({})).toBe(0);
    expect(safeNumber([])).toBe(0);
    expect(safeNumber(true)).toBe(0);
  });

  it('uses custom fallback when provided', () => {
    expect(safeNumber(null, 100)).toBe(100);
    expect(safeNumber('invalid', -1)).toBe(-1);
    expect(safeNumber(undefined, 60)).toBe(60);
    expect(safeNumber(NaN, 50)).toBe(50);
  });
});
