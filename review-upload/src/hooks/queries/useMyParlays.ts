import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';
import { getAuthToken, isSupabaseConfigured } from '../../lib/supabaseClient';
import { queryKeys } from './queryKeys';

export type BackendParlayRow = {
  id: string;
  [key: string]: unknown;
};

async function fetchMyParlays(): Promise<BackendParlayRow[]> {
  if (!isSupabaseConfigured) return [];
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Authentication token unavailable; parlay reconciliation deferred.');
  }
  const result = await apiClient.get<{ parlays: BackendParlayRow[] }>('/api/v3/me/parlays?limit=100');
  return result?.parlays ?? [];
}

export function useMyParlays(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.myParlays(),
    queryFn: fetchMyParlays,
    staleTime: 3 * 60_000,
    gcTime: 10 * 60_000,
    enabled: (options?.enabled ?? true) && isSupabaseConfigured,
  });
}
