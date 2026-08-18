import type { HrWatchRow } from '../../../hr/types/hrWatch';

/*
 * `row.oddsLabel` is prose, not a price — it carries strings like "Odds TBD"
 * when no book has posted. In a fixed-width column that wraps and breaks the
 * row rhythm, and it also reads as though a number is present when none is.
 * Show the American price when there is one, and an em dash when there is not.
 */
export function shortOdds(row: HrWatchRow): string {
  const book = row.bookOdds;
  if (book != null && Number.isFinite(book)) {
    return `${book > 0 ? '+' : ''}${Math.round(book)}`;
  }
  const label = row.oddsLabel?.trim() ?? '';
  return /^[+-]\d+$/.test(label) ? label : '—';
}
