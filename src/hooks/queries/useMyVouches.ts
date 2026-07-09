import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';
import { getAuthToken, isSupabaseConfigured } from '../../lib/supabaseClient';
import { queryKeys } from './queryKeys';

export type BackendVouchRow = {
  id: string;
  [key: string]: unknown;
};

async function fetchMyVouches(): Promise<BackendVouchRow[]> {
  if (!isSupabaseConfigured) return [];
  const token = await getAuthToken();
  if (!token) return [];
  const result = await apiClient.get<{ vouches: BackendVouchRow[] }>('/api/vouches');
  return result?.vouches ?? [];
}

export function useMyVouches(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.myVouches(),
    queryFn: fetchMyVouches,
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    enabled: (options?.enabled ?? true) && isSupabaseConfigured,
  });
}
