import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../lib/apiClient';
import { queryKeys } from '../../../hooks/queries/queryKeys';
import { visibilityAwareInterval } from '../../../lib/queryVisibility';

export type MlbNewsCategory = 'INJURY' | 'LINEUP' | 'ROSTER' | 'ALERT' | 'NEWS';

export interface MlbNewsMention {
  /** ESPN athlete id — not an MLBAM id, so it is never joined against the slate. */
  espnId: string | null;
  name: string;
}

export interface MlbNewsItem {
  id: string;
  headline: string;
  description: string;
  publishedAt: string | null;
  category: MlbNewsCategory;
  playerMentions: MlbNewsMention[];
  url: string | null;
}

interface MlbNewsResponse {
  items?: MlbNewsItem[];
  source?: string;
  fetchedAt?: string;
}

/**
 * The intel wire feed.
 *
 * Mirrors the server's five-minute TTL — refetching faster only burns a
 * request to be handed the same cached six stories back.
 */
export function useMlbNewsWire() {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.mlbNewsWire(),
    queryFn: () => apiClient.get<MlbNewsResponse>('/api/mlb/news'),
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
    refetchInterval: () => visibilityAwareInterval(5 * 60_000),
  });

  return {
    items: data?.items ?? [],
    isLoading,
    error: error instanceof Error ? error : null,
  };
}
