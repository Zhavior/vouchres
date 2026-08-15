import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { hrBoardQueryOptions, todayISO } from '../../../hooks/queries/hrBoardQuery';
import { buildBoard } from '../../hr/utils/normalizeHrWatch';
import { mapHrWatchBoardToChunkA } from '../api/mapHrWatchRowToChunkA';
import type { ChunkA } from '../api/contracts';

export interface HrSlateFeedState {
  data: ChunkA[];
  loading: boolean;
  error: Error | null;
  isRetrying: boolean;
  isFailed: boolean;
  failureCount: number;
  dataUpdatedAt: number;
  refetch: () => unknown;
  isLastGood?: boolean;
  feedSource?: string | null;
}

/**
 * Same query key + loader as hr_max / Aurora HQ (`queryKeys.hrBoard`).
 * Do not fetch statsapi.mlb.com from the browser — that 6s abort + mock fallback
 * is what made this desk look like it kept disconnecting (L027 / L028).
 */
export function useHrSlateFeed(): HrSlateFeedState {
  const date = todayISO();
  const query = useQuery(hrBoardQueryOptions(date));

  const updatedAt = query.dataUpdatedAt
    ? new Date(query.dataUpdatedAt).toISOString()
    : '';

  const data = useMemo(
    () => (query.data ? mapHrWatchBoardToChunkA(buildBoard(query.data), updatedAt) : []),
    [query.data, updatedAt],
  );

  const isRetrying = Boolean(query.fetchStatus === 'fetching' && query.failureCount > 0);
  const isFailed = Boolean(query.isError && !query.data && query.fetchStatus !== 'fetching');
  const source = typeof query.data?.meta?.source === 'string' ? query.data.meta.source : null;

  return {
    data,
    loading: query.isLoading && !query.data,
    error: isFailed
      ? query.error instanceof Error
        ? query.error
        : new Error('Home Run Intelligence could not reach its validated data service.')
      : null,
    isRetrying,
    isFailed,
    failureCount: query.failureCount,
    dataUpdatedAt: query.dataUpdatedAt,
    refetch: query.refetch,
    isLastGood: source === 'validated_hr_board_last_good',
    feedSource: source,
  };
}
