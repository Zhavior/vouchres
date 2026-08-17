import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';
import { queryKeys } from './queryKeys';

/** Mirrors PlayerOption in server/services/feed/composerOptionsService.ts. */
export interface ComposerPlayerOption {
  id: string;
  name: string;
  teamId: string;
  teamAbbr: string;
  position: string | null;
  bats: string | null;
  throws: string | null;
  isStarter: boolean;
  battingOrder: number | null;
  headshotUrl: string | null;
}

interface ComposerTeamOption {
  id: string;
  name: string;
  abbr: string;
  players: ComposerPlayerOption[];
}

export interface ComposerGameOption {
  gameId: string;
  label: string;
  startTime: string | null;
  status: string;
  awayTeam: ComposerTeamOption;
  homeTeam: ComposerTeamOption;
}

export interface ComposerOptions {
  sport: string;
  date: string;
  games: ComposerGameOption[];
  markets: Array<{ id: string; label: string }>;
  warnings: string[];
}

/**
 * Real games/players/markets for the feed composer.
 *
 * Only MLB is served by /api/feed/composer-options today, so the hook stays
 * disabled for other sports rather than firing a request that cannot succeed.
 * There is deliberately no fallback payload: the composer keeps its free-text
 * inputs when this is unavailable, instead of showing an invented slate.
 */
export function useComposerOptions(sport: string, enabled: boolean) {
  const supported = sport === 'MLB';

  const query = useQuery({
    queryKey: queryKeys.composerOptions(sport),
    queryFn: () =>
      apiClient.get<ComposerOptions>(`/api/feed/composer-options?sport=${encodeURIComponent(sport)}`),
    enabled: enabled && supported,
    staleTime: 3 * 60_000,
    gcTime: 10 * 60_000,
  });

  return {
    ...query,
    supported,
    games: query.data?.games ?? [],
    markets: query.data?.markets ?? [],
    warnings: query.data?.warnings ?? [],
  };
}
