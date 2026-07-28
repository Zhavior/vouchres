import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { hrBoardQueryOptions } from '../../../hooks/queries/hrBoardQuery';
import type { HrBoardContract } from '../../../kernel/contracts/hrBoard';

export function useDailyHrBoard(date: string) {
  const query = useQuery(hrBoardQueryOptions(date));

  const contract = useMemo<HrBoardContract | null>(() => {
    if (!query.data) return null;
    return {
      ...query.data,
      date: query.data.date ?? date,
      loadedAt: query.dataUpdatedAt
        ? new Date(query.dataUpdatedAt).toISOString()
        : new Date().toISOString(),
    };
  }, [date, query.data, query.dataUpdatedAt]);

  const meta = query.data?.meta;
  const requestId = typeof meta?.requestId === 'string' ? meta.requestId : null;
  const source = typeof meta?.source === 'string' ? meta.source : null;
  const sourceUpdatedAt = typeof meta?.updatedAt === 'string' ? new Date(meta.updatedAt) : null;
  const validSourceUpdatedAt = sourceUpdatedAt && !Number.isNaN(sourceUpdatedAt.getTime()) ? sourceUpdatedAt : null;
  const lastSuccessfulUpdate = validSourceUpdatedAt
    ?? (query.dataUpdatedAt ? new Date(query.dataUpdatedAt) : null);
  const backgroundError = query.isError && Boolean(query.data);
  const blockingError = query.isError && !query.data;

  return {
    data: contract,
    loading: query.isLoading && !query.data,
    syncing: query.isFetching,
    error: blockingError ? 'Home Run Intelligence could not reach its validated data service.' : null,
    refreshError: backgroundError
      ? `Refresh failed — showing the last successful board${requestId ? ` (request ${requestId})` : ''}.`
      : null,
    lastUpdated: lastSuccessfulUpdate,
    connection: {
      requestId,
      source,
      transportMode: query.data?.transportMode ?? null,
      contractVersion: query.data?.contractVersion ?? null,
      isLastGood: source === 'validated_hr_board_last_good',
    },
    refresh: async () => {
      const result = await query.refetch({ throwOnError: false });
      return result.isSuccess;
    },
  };
}
