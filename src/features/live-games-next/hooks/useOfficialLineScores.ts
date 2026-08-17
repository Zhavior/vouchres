import { useQuery } from '@tanstack/react-query';
import { visibilityAwareInterval } from '../../../lib/queryVisibility';
import { fetchSlateLineScores, type SlateLineScores, type OfficialLineScore } from '../api/officialLineScore';

export type { OfficialLineScore } from '../api/officialLineScore';

/** Live half-innings turn over on the order of a minute; 20s is well inside that. */
const LIVE_POLL_MS = 20_000;

/**
 * One slate-wide line score query shared by every Live Next surface.
 *
 * Polling only runs while a game is actually in progress — finals never change
 * and scheduled games have no line score yet — and `visibilityAwareInterval`
 * stops it entirely on a hidden tab. Because the whole slate lives in one cache
 * entry, cycling the featured game is instant and costs no request, so the
 * table never re-enters a loading state mid-session.
 */
export function useOfficialLineScores(date: string, options?: { hasLiveGame?: boolean; enabled?: boolean }) {
  const query = useQuery<SlateLineScores>({
    queryKey: ['officialLineScores', date] as const,
    queryFn: ({ signal }) => fetchSlateLineScores(date, signal),
    staleTime: 10_000,
    gcTime: 300_000,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev,
    refetchInterval: () => visibilityAwareInterval(options?.hasLiveGame ? LIVE_POLL_MS : false),
    enabled: options?.enabled ?? true,
  });

  return {
    lineScores: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

/** Look up one game's line score, or null when the feed has not published one. */
export function lineScoreFor(
  lineScores: SlateLineScores | undefined,
  gamePk: number | null | undefined,
): OfficialLineScore | null {
  if (!lineScores || gamePk == null) return null;
  return lineScores[gamePk] ?? null;
}
