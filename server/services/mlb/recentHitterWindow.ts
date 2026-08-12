const DAY_MS = 24 * 60 * 60 * 1000;

export interface DatedHomeRunGame {
  date: string;
  homeRuns: number;
}

export interface HomeRunCalendarWindow {
  homeRuns: number;
  gamesChecked: number;
}

function utcDateOnly(value: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const timestamp = Date.UTC(year, month - 1, day);
  const parsed = new Date(timestamp);

  if (
    parsed.getUTCFullYear() !== year
    || parsed.getUTCMonth() !== month - 1
    || parsed.getUTCDate() !== day
  ) {
    return null;
  }

  return timestamp;
}

/**
 * Counts verified game-log home runs in an inclusive calendar window ending
 * on the requested board date. Returns null when the supplied game log cannot
 * support that date, rather than turning unavailable history into a fake zero.
 */
export function summarizeHomeRunsInCalendarDays(
  games: readonly DatedHomeRunGame[],
  anchorDate: string,
  days: number,
): HomeRunCalendarWindow | null {
  const anchor = utcDateOnly(anchorDate);
  if (anchor === null || !Number.isInteger(days) || days <= 0) return null;

  const datedGames = games.flatMap((game) => {
    const date = utcDateOnly(game.date);
    return date === null ? [] : [{ game, date }];
  });
  const gamesOnOrBeforeAnchor = datedGames.filter(({ date }) => date <= anchor);
  if (gamesOnOrBeforeAnchor.length === 0) return null;

  const start = anchor - (days - 1) * DAY_MS;
  const gamesInWindow = gamesOnOrBeforeAnchor.filter(({ date }) => date >= start);

  return {
    homeRuns: gamesInWindow.reduce((total, { game }) => {
      const value = Number.isFinite(game.homeRuns) ? Math.max(0, Math.floor(game.homeRuns)) : 0;
      return total + value;
    }, 0),
    gamesChecked: gamesInWindow.length,
  };
}
