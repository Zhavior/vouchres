import { useQuery } from '@tanstack/react-query';
import { fetchNflTouchdownIntelligence, NflMatchupIntelligence } from '../api/nflTouchdownApi';

export function useNflTouchdownData() {
  const {
    data: games = [],
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery<NflMatchupIntelligence[]>({
    queryKey: ['nfl', 'touchdown-intelligence', 'today'],
    queryFn: fetchNflTouchdownIntelligence,
    refetchInterval: 60 * 1000, // Poll every minute for live game progress
  });

  return {
    games,
    isLoading,
    isSyncing: isFetching,
    error,
    refetch,
  };
}
