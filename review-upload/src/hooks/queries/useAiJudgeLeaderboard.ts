import { useQuery } from '@tanstack/react-query';
import { cachedJsonFetch } from '../../lib/clientApiCache';
import { apiUrl } from '../../lib/apiBase';
import { queryKeys } from './queryKeys';

export type AiJudgeLeaderboard = {
  status: string;
  date: string;
  candidateCount: number;
  leaderboard: Array<Record<string, unknown>>;
};

export function useAiJudgeLeaderboard() {
  return useQuery<AiJudgeLeaderboard>({
    queryKey: queryKeys.aiJudgeLeaderboard(),
    queryFn: () =>
      cachedJsonFetch<AiJudgeLeaderboard>(apiUrl('/api/ai-judges/leaderboard'), { cache: 'no-store' }, 45_000),
    staleTime: 45_000,
  });
}
