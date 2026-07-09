import { useQuery } from '@tanstack/react-query';
import { vouchedgeApi } from '../../api/vouchedgeApi';
import { queryKeys } from './queryKeys';

export type LiveGamesPayload = Awaited<ReturnType<typeof vouchedgeApi.liveGames>>;

const LIVE_POLL_MS = 20_000;
const IDLE_POLL_MS = 60_000;

function hasLiveGames(payload: LiveGamesPayload | undefined): boolean {
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
    staleTime: 15_000,
    refetchOnMount: true,
    refetchInterval: (query) => {
      if (options?.refetchInterval !== undefined) return options.refetchInterval;
      return hasLiveGames(query.state.data) ? LIVE_POLL_MS : IDLE_POLL_MS;
    },
    enabled: options?.enabled ?? true,
  });
}
