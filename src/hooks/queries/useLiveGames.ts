import { useQuery } from '@tanstack/react-query';
import { vouchedgeApi } from '../../api/vouchedgeApi';
import { queryKeys } from './queryKeys';
import type { LiveGamesPayload } from '../../types/liveGames';

export type { LiveGamesPayload } from '../../types/liveGames';

const LIVE_POLL_MS = 6_000;
const IDLE_POLL_MS = 45_000;
const LIVE_STALE_MS = 4_500;

export function hasLiveGames(payload: LiveGamesPayload | undefined): boolean {
  if (!payload?.games?.length) return false;
  return payload.games.some((game) => {
    if (game.isLive) return true;
    const status = String(game.status ?? '').toLowerCase();
    return status.includes('in progress') || status.includes('live') || status === 'p';
  });
}

export function useLiveGames(options?: { enabled?: boolean; refetchInterval?: number | false }) {
  return useQuery<LiveGamesPayload>({
    queryKey: queryKeys.liveGames(),
    queryFn: () => vouchedgeApi.liveGames(),
    staleTime: LIVE_STALE_MS,
    gcTime: 120_000,
    refetchOnMount: false,
    placeholderData: (prev) => prev,
    refetchInterval: (query) => {
      if (options?.refetchInterval !== undefined) return options.refetchInterval;
      return hasLiveGames(query.state.data) ? LIVE_POLL_MS : IDLE_POLL_MS;
    },
    enabled: options?.enabled ?? true,
  });
}
