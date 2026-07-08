import { useQuery } from '@tanstack/react-query';
import { edge, kernelQueryKeys } from '../../../kernel';
import type { EdgeIslandData } from '../types/edgeIslandData';


export function useEdgeIslandData() {
  const query = useQuery({
    queryKey: kernelQueryKeys.edgeIsland(),
    queryFn: edge.loadEdgeIsland,
    staleTime: 60_000,
  });

  return {
    data: query.data ?? null,
    loading: query.isLoading,
    error: query.error?.message ?? null,
  };
}
