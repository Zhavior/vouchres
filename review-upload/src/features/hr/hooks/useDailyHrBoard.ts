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

  return {
    data: contract,
    loading: query.isLoading && !query.data,
    syncing: query.isFetching,
    error: query.isError ? 'Data unavailable right now.' : null,
    lastUpdated: query.dataUpdatedAt ? new Date(query.dataUpdatedAt) : null,
    refresh: async () => {
      await query.refetch();
    },
  };
}
