import { useQuery } from '@tanstack/react-query';
import { cachedJsonFetch } from '../../lib/clientApiCache';
import { apiUrl } from '../../lib/apiBase';
import type { AgentRegistryResponse } from '../../types/aiAgent';
import { queryKeys } from './queryKeys';

export function useAiAgentRegistry() {
  return useQuery<AgentRegistryResponse>({
    queryKey: queryKeys.aiAgentRegistry(),
    queryFn: () =>
      cachedJsonFetch<AgentRegistryResponse>(
        apiUrl('/api/ai-judges/registry'),
        { cache: 'no-store' },
        120_000,
      ),
    staleTime: 120_000,
  });
}
