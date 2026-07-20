import { useQuery } from '@tanstack/react-query';
import { vouchedgeApi } from '../../api/vouchedgeApi';
import { queryKeys } from './queryKeys';

const HR_FEED_POLL_MS = import.meta.env.DEV ? 60_000 : 30_000;

export function useHrFeedToday(options?: { enabled?: boolean; refetchInterval?: number | false }) {
  return useQuery({
    queryKey: queryKeys.hrFeedToday(),
    queryFn: () => vouchedgeApi.hrFeedToday(),
    staleTime: 25_000,
    gcTime: 10 * 60_000,
    refetchInterval: options?.refetchInterval ?? HR_FEED_POLL_MS,
    enabled: options?.enabled ?? true,
  });
}
