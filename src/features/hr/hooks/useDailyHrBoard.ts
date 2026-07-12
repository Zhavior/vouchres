import { useQuery } from '@tanstack/react-query';
import { hrBoardQueryOptions } from '../../../hooks/queries/hrBoardQuery';
import type { HrBoardContract } from '../../../kernel/contracts/hrBoard';

export function useDailyHrBoard(date: string) {
  const query = useQuery(hrBoardQueryOptions(date));

  const contract: HrBoardContract | null = query.data
    ? {
        ...query.data,
        date: query.data.date ?? date,
        loadedAt: query.dataUpdatedAt
          ? new Date(query.dataUpdatedAt).toISOString()
          : new Date().toISOString(),
      }
    : null;

  return {
    data: contract,
    loading: query.isLoading && !query.data,
    error: query.isError ? 'Data unavailable right now.' : null,
    lastUpdated: query.dataUpdatedAt ? new Date(query.dataUpdatedAt) : null,
    refresh: async () => {
      await query.refetch();
    },
  };
}
