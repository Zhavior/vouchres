import { useQuery } from '@tanstack/react-query';
import { vouchedgeApi } from '../../api/vouchedgeApi';
import { queryKeys } from './queryKeys';
import type { LiveGamesPayload } from '../../types/liveGames';
import { visibilityAwareInterval } from '../../lib/queryVisibility';

export type { LiveGamesPayload } from '../../types/liveGames';

const LIVE_POLL_MS = 12_000;
const IDLE_POLL_MS = 60_000;
const LIVE_STALE_MS = 8_000;

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
      if (options?.refetchInterval !== undefined) {
        return visibilityAwareInterval(options.refetchInterval);
      }
      return visibilityAwareInterval(hasLiveGames(query.state.data) ? LIVE_POLL_MS : IDLE_POLL_MS);
    },
    enabled: options?.enabled ?? true,
  });
}
