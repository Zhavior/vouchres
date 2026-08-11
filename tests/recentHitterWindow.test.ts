import { describe, expect, it } from 'vitest';
import { summarizeHomeRunsInCalendarDays } from '../server/services/mlb/recentHitterWindow';

describe('summarizeHomeRunsInCalendarDays', () => {
  it('counts the inclusive seven-calendar-day window and excludes older or future games', () => {
    const result = summarizeHomeRunsInCalendarDays(
      [
        { date: '2026-08-04', homeRuns: 3 },
        { date: '2026-08-05', homeRuns: 1 },
        { date: '2026-08-10', homeRuns: 2 },
        { date: '2026-08-11T23:30:00Z', homeRuns: 1 },
        { date: '2026-08-12', homeRuns: 4 },
      ],
      '2026-08-11',
      7,
    );

    expect(result).toEqual({ homeRuns: 4, gamesChecked: 3 });
  });

  it('returns a verified zero when dated games exist before the window', () => {
    expect(
      summarizeHomeRunsInCalendarDays(
        [{ date: '2026-08-01', homeRuns: 2 }],
        '2026-08-11',
        7,
      ),
    ).toEqual({ homeRuns: 0, gamesChecked: 0 });
  });

  it('fails closed when the supplied log cannot support the requested date', () => {
    expect(
      summarizeHomeRunsInCalendarDays(
        [{ date: '2026-08-12', homeRuns: 1 }],
        '2026-08-11',
        7,
      ),
    ).toBeNull();
  });
});
