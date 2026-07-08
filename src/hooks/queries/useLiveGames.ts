import { useQuery } from '@tanstack/react-query';
import { vouchedgeApi } from '../../api/vouchedgeApi';
import { queryKeys } from './queryKeys';

export type LiveGamesPayload = Awaited<ReturnType<typeof vouchedgeApi.liveGames>>;

export function useLiveGames(options?: { enabled?: boolean; refetchInterval?: number | false }) {
  return useQuery<LiveGamesPayload>({
    queryKey: queryKeys.liveGames(),
    queryFn: () => vouchedgeApi.liveGames(),
    staleTime: 15_000,
    refetchInterval: options?.refetchInterval ?? false,
    enabled: options?.enabled ?? true,
  });
}
