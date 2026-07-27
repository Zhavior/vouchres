import { useQuery } from '@tanstack/react-query';
import { hrResearchQueryOptions } from '../../../hooks/queries/hrResearchQuery';

export function useHrResearch(
  playerId: string | number | null | undefined,
  date: string | null | undefined,
  enabled = true,
) {
  const query = useQuery({
    ...hrResearchQueryOptions(playerId, date),
    enabled:
      enabled
      && playerId !== null
      && playerId !== undefined
      && String(playerId).trim() !== '',
  });

  return {
    research: query.data ?? null,
    loading: query.isLoading || query.isFetching,
    error:
      query.error instanceof Error
        ? query.error.message
        : query.error
          ? 'HR research unavailable.'
          : null,
    refresh: query.refetch,
    isSuccess: query.isSuccess,
  };
}
