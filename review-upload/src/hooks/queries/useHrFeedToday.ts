import { useQuery } from '@tanstack/react-query';
import { vouchedgeApi } from '../../api/vouchedgeApi';
import { queryKeys } from './queryKeys';
import { visibilityAwareInterval } from '../../lib/queryVisibility';

const HR_FEED_POLL_MS = 90_000;

export function useHrFeedToday(options?: { enabled?: boolean; refetchInterval?: number | false }) {
  return useQuery({
    queryKey: queryKeys.hrFeedToday(),
    queryFn: () => vouchedgeApi.hrFeedToday(),
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    refetchInterval: visibilityAwareInterval(options?.refetchInterval ?? HR_FEED_POLL_MS),
    enabled: options?.enabled ?? true,
  });
}
