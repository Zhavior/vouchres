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

/** Full /api/auth/me payload — shared by profile sync and entitlements. */
export interface AuthMeResponse extends AuthMeProfile {
  username?: string;
  handle?: string;
  display_name?: string;
  avatar_url?: string | null;
  bio?: string;
  trust_score?: number;
  total_picks?: number;
  won_picks?: number;
  lost_picks?: number;
  pushed_picks?: number;
  net_units?: number;
  is_demo?: boolean;
  entitlements?: { tier?: string };
  profile?: {
    tier?: string;
    subscription_tier?: string;
    is_staff?: boolean;
    isStaff?: boolean;
  };
  user?: { tier?: string; is_staff?: boolean; isStaff?: boolean };
  isStaff?: boolean;
  is_staff?: boolean;
  tier?: string;
}

async function fetchAuthMe(): Promise<AuthMeResponse | null> {
  if (!isSupabaseConfigured) return null;
  const token = await getAuthToken();
  if (!token) return null;
  try {
    return await apiClient.get<AuthMeResponse>('/api/auth/me');
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
