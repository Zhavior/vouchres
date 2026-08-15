import { useQuery } from '@tanstack/react-query';
import { ChunkA } from '../api/contracts';
import { fetchDailyMlbSlate } from '../api/liveMlbService';
import { mockChunkAData } from '../api/mockData';

export function useHrSlateFeed() {
  const query = useQuery<ChunkA[]>({
    queryKey: ['mlb-live-hr-desk'],
    queryFn: fetchDailyMlbSlate,
    initialData: mockChunkAData,
    refetchInterval: 45000, // 45-second background line/slate updates
    staleTime: 30000,
    retry: 2,
  });

  const isRetrying = Boolean(query.fetchStatus === 'fetching' && query.failureCount > 0);
  const isFailed = Boolean(query.isError && query.fetchStatus !== 'fetching');

  return {
    data: query.data ?? [],
    loading: query.isLoading,
    error: query.error,
    isRetrying,
    isFailed,
    failureCount: query.failureCount,
    dataUpdatedAt: query.dataUpdatedAt,
    refetch: query.refetch,
  };
}
