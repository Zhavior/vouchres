import { useQuery } from '@tanstack/react-query';
import { vouchedgeApi } from '../../api/vouchedgeApi';
import type { MatchupsResponse } from '../../types/matchup';

const MATCHUP_ENRICH_MS = 3 * 60_000;

async function fetchMatchupsEnrichment(): Promise<MatchupsResponse> {
  return vouchedgeApi.matchupsToday();
}

/** Slow-path matchup model — decoupled from live board polling. */
export function useLiveMatchupsEnrichment(enabled = true) {
  return useQuery({
    queryKey: ['liveMatchupsEnrichment'],
    queryFn: fetchMatchupsEnrichment,
    staleTime: MATCHUP_ENRICH_MS,
    gcTime: MATCHUP_ENRICH_MS * 2,
    refetchInterval: MATCHUP_ENRICH_MS,
    refetchOnMount: false,
    placeholderData: (prev) => prev,
    enabled,
  });
}
