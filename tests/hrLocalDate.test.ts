import { describe, expect, it } from 'vitest';
import { localISODate } from '../src/features/hr/utils/localDate';

describe('localISODate', () => {
  it('uses the local calendar date instead of UTC', () => {
    const lateLocalDate = new Date(2026, 6, 10, 23, 30, 0);
    expect(localISODate(lateLocalDate)).toBe('2026-07-10');
  });
});
