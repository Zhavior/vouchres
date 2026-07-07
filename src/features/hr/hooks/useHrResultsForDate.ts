import { useMemo } from 'react';
import { vouchedgeApi } from '../../../api/vouchedgeApi';
import { useVouchResource } from './useVouchResource';
import type { HrEvent } from '../../../types/notifications';

const REFRESH_MS = 60_000;

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export interface HrResultsForDate {
  /** Real HR events for `date`, keyed by batter MLB player id. */
  hitByPlayerId: Map<number, HrEvent>;
  isToday: boolean;
  loading: boolean;
  error: string | null;
}

/**
 * Grades HR Intelligence candidates against what actually happened, using the
 * real play-by-play HR feed (server/services/mlb/hrFeedService.ts) — never a
 * simulated result. For `date === today`, the feed reflects games still in
 * progress, so a miss there is inconclusive rather than a confirmed "no HR".
 */
export function useHrResultsForDate(date: string): HrResultsForDate {
  const isToday = date === todayISO();

  const { data, loading, error } = useVouchResource({
    cacheKey: `hr-feed:${date}`,
    refreshMs: isToday ? REFRESH_MS : null,
    staleMs: isToday ? REFRESH_MS : null,
    fetcher: () => (isToday ? vouchedgeApi.hrFeedToday() : vouchedgeApi.hrFeedByDate(date)),
  });

  const hitByPlayerId = useMemo(() => {
    const map = new Map<number, HrEvent>();
    for (const event of data?.events ?? []) {
      if (!map.has(event.playerId)) map.set(event.playerId, event);
    }
    return map;
  }, [data]);

  return { hitByPlayerId, isToday, loading, error };
}
