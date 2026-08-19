import type { HrWatchRow } from '../../../hr/types/hrWatch';
import type { ApiGame } from '../../../../types/mlb';

/* ────────────────────────────────────────────────────────────────────────────
 * Mobile slate filters.
 *
 * Every filter here resolves against a real field on HrWatchRow.
 *
 * A "weather edge" chip was specified twice and is still NOT implemented. The
 * row model does carry a `weather` field, but the pipeline publishes null for
 * it on every row (254/254 at time of writing), so the chip would always come
 * back empty — and there is no wind direction anywhere in the model either.
 * `parkEdge` stands in that slot instead: `parkIndex` is populated on every row
 * and is the venue's HR index centred on 100, which is the same question
 * ("does the venue help the ball leave") answered with data that exists.
 * ──────────────────────────────────────────────────────────────────────────── */

export type TodayMobileFilter = 'collision' | 'live' | 'confirmed' | 'park';

export interface TodayMobileFilterDef {
  id: TodayMobileFilter;
  glyph: string;
  label: string;
  /** Shown to screen readers so the chip's meaning is not carried by an emoji. */
  description: string;
}

export const TODAY_MOBILE_FILTERS: readonly TodayMobileFilterDef[] = [
  {
    id: 'collision',
    glyph: '🔥',
    label: 'Top collision',
    description: 'Ranked by hitter power against opposing pitcher vulnerability',
  },
  { id: 'live', glyph: '⚾', label: 'Live slate', description: 'Only players in games underway' },
  { id: 'confirmed', glyph: '🎯', label: 'Confirmed lineups', description: 'Only players on an official published lineup' },
  {
    id: 'park',
    glyph: '🏟',
    label: 'Park edge',
    description: 'Only venues whose home-run index runs above neutral, best first',
  },
] as const;

/**
 * Collision = how hard a hitter's power runs into how exposed the arm is.
 * Mean of the two published layer sub-scores; null when either is absent, so a
 * row with half the inputs is never ranked as though it had both.
 */
export function collisionScore(row: HrWatchRow): number | null {
  const power = row.hitterPower;
  const vulnerability = row.pitcherVulnerability;
  if (power == null || vulnerability == null) return null;
  if (!Number.isFinite(power) || !Number.isFinite(vulnerability)) return null;
  return (power + vulnerability) / 2;
}

export function livePitchGameKeys(liveGames: readonly ApiGame[]): Set<string> {
  const keys = new Set<string>();
  for (const game of liveGames) {
    if (game.gamePk != null) keys.add(String(game.gamePk));
  }
  return keys;
}

export function applyTodayMobileFilter(
  rows: readonly HrWatchRow[],
  filter: TodayMobileFilter,
  liveGames: readonly ApiGame[],
): HrWatchRow[] {
  if (filter === 'confirmed') {
    return rows.filter((row) => row.truthStatus === 'official');
  }

  if (filter === 'live') {
    const live = livePitchGameKeys(liveGames);
    if (live.size === 0) return [];
    return rows.filter((row) => row.gamePk != null && live.has(String(row.gamePk)));
  }

  if (filter === 'park') {
    // parkIndex is centred on 100 — above it, the venue adds home runs.
    return rows
      .filter((row) => row.parkIndex != null && Number.isFinite(row.parkIndex) && row.parkIndex > 100)
      .sort((a, b) => (b.parkIndex ?? 0) - (a.parkIndex ?? 0) || b.hrScore - a.hrScore);
  }

  // collision — drop rows missing either input, then rank by the pairing.
  return rows
    .map((row) => ({ row, score: collisionScore(row) }))
    .filter((entry): entry is { row: HrWatchRow; score: number } => entry.score != null)
    .sort((a, b) => b.score - a.score || b.row.hrScore - a.row.hrScore)
    .map((entry) => entry.row);
}

/** Why a filter came back empty — shown instead of a blank list. */
export function emptyReasonFor(filter: TodayMobileFilter, hasAnyRows: boolean): string {
  if (!hasAnyRows) return 'The research board has not published any rows for today yet.';
  if (filter === 'live') return 'No game on the board is underway right now.';
  if (filter === 'confirmed') return 'No official lineup has been published yet.';
  if (filter === 'park') return 'No venue on the board is playing above a neutral home-run index today.';
  return 'No row carries both a power and a vulnerability score yet.';
}
