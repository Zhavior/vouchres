import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';
import { getAuthToken, isSupabaseConfigured } from '../../lib/supabaseClient';
import { queryKeys } from './queryKeys';

export interface AuthMeProfile {
  id: string;
  age_confirmed_at?: string | null;
  jurisdiction_confirmed_at?: string | null;
  jurisdiction?: string | null;
}

async function fetchAuthMe(): Promise<AuthMeProfile | null> {
  if (!isSupabaseConfigured) return null;
  const token = await getAuthToken();
  if (!token) return null;
  try {
    return await apiClient.get<AuthMeProfile>('/api/auth/me');
  } catch {
    return null;
  }
}

/** Slow-changing auth profile — shared across parlay sync, entitlements, settings. */
export function useAuthMe(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.authMe(),
    queryFn: fetchAuthMe,
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
    enabled: (options?.enabled ?? true) && isSupabaseConfigured,
  });
}

export { fetchAuthMe };
