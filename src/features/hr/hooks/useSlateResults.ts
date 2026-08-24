import { hr } from '../../../kernel';
import { useVouchResource } from './useVouchResource';
import type { SlateResultsContract } from '../../../kernel/contracts/slateResults';
import { localISODate } from '../utils/localDate';

/** Live slates move; a finished one is immutable, so it is fetched once. */
const REFRESH_MS = 60_000;

export interface SlateResultsState {
  results: SlateResultsContract | null;
  isToday: boolean;
  loading: boolean;
  error: string | null;
}

/**
 * The Results desk for one date. Grading happens server-side against the real
 * HR play-by-play feed, so nothing here interprets an outcome — it only decides
 * how often to ask.
 */
export function useSlateResults(date: string): SlateResultsState {
  const isToday = date === localISODate();

  const { data, loading, error } = useVouchResource({
    cacheKey: `slate-results:${date}`,
    refreshMs: isToday ? REFRESH_MS : null,
    staleMs: isToday ? REFRESH_MS : null,
    fetcher: () => hr.loadSlateResults(date),
  });

  return { results: data ?? null, isToday, loading, error };
}
