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

export interface MlbNewsImage {
  url: string;
  alt: string;
  width: number | null;
  height: number | null;
}

export interface MlbNewsItem {
  id: string;
  headline: string;
  description: string;
  publishedAt: string | null;
  category: MlbNewsCategory;
  playerMentions: MlbNewsMention[];
  /** Kept for provenance only — the reader never links out. */
  url: string | null;
  image: MlbNewsImage | null;
  /** Body text, already split and stripped of markup server-side. */
  paragraphs: string[];
  /** False when `paragraphs` is only the wire summary. */
  hasFullStory: boolean;
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

/**
 * The full body of one wire story.
 *
 * The listing endpoint carries headlines and a one-line summary; the editorial
 * body is fetched per story, parsed server-side and returned as plain-text
 * paragraphs. Enabled only once the reader is actually open, and skipped
 * entirely when the listing already shipped a full body — the drawer opens on
 * the summary it has and swaps in the full text when it lands, so nothing is
 * blocked on this request.
 *
 * A failure is not surfaced as an error state: the reader keeps rendering the
 * summary, which is a smaller version of the same story rather than nothing.
 */
export function useMlbNewsArticle(item: MlbNewsItem | null) {
  const id = item?.id ?? null;
  const needsBody = Boolean(id) && !item?.hasFullStory;

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.mlbNewsArticle(id ?? ''),
    queryFn: () => apiClient.get<MlbNewsItem>(`/api/mlb/news/${encodeURIComponent(id ?? '')}`),
    enabled: needsBody,
    // A published story is immutable; never refetch one inside a session.
    staleTime: Infinity,
    gcTime: 30 * 60_000,
    retry: 1,
  });

  const article = data?.hasFullStory ? data : null;

  return {
    paragraphs: article?.paragraphs ?? item?.paragraphs ?? [],
    image: article?.image ?? item?.image ?? null,
    /** True while the full body is still in flight and only the summary is up. */
    isLoadingBody: needsBody && isLoading,
  };
}
