import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchAuthMe } from '../../../hooks/queries/useAuthMe';
import { queryKeys } from '../../../hooks/queries/queryKeys';
import { isSupabaseConfigured } from '../../../lib/supabaseClient';

export type CanonicalTier = 'free' | 'pro' | 'creator';
export type DatabaseTier = 'free' | 'gold' | 'seller_pro';

export interface FrontendEntitlements {
  tier: CanonicalTier;
  sourceTier: string | null;
  isPro: boolean;
  isCreator: boolean;
  isStaff: boolean;
  canUseProGraphs: boolean;
  canUseTeamMatchupLab: boolean;
  canUsePlayerEdgeLab: boolean;
  canSellPicks: boolean;
  canAccessNotifications: boolean;
  loading: boolean;
  error: string | null;
  warnings: string[];
  refresh: () => Promise<void>;
}

function normalizeTier(tier: unknown): { tier: CanonicalTier; sourceTier: string | null; warnings: string[] } {
  const sourceTier = typeof tier === 'string' ? tier.trim().toLowerCase() : null;
  const warnings: string[] = [];

  if (!sourceTier) {
    return { tier: 'free', sourceTier, warnings };
  }

  if (sourceTier === 'free' || sourceTier === 'pro' || sourceTier === 'creator') {
    return { tier: sourceTier, sourceTier, warnings };
  }

  if (sourceTier === 'gold') {
    return { tier: 'pro', sourceTier, warnings };
  }

  if (sourceTier === 'seller_pro') {
    return { tier: 'creator', sourceTier, warnings };
  }

  warnings.push(`Unknown subscription tier "${sourceTier}"; defaulted to free.`);
  return { tier: 'free', sourceTier, warnings };
}

function readTierFromAuthPayload(data: unknown): unknown {
  const payload = data as Record<string, unknown> | null | undefined;
  const profile = payload?.profile as Record<string, unknown> | undefined;
  const entitlements = payload?.entitlements as Record<string, unknown> | undefined;
  const user = payload?.user as Record<string, unknown> | undefined;

  return (
    entitlements?.tier ??
    profile?.tier ??
    profile?.subscription_tier ??
    user?.tier ??
    payload?.tier ??
    'free'
  );
}

function readStaffFromAuthPayload(data: unknown): boolean {
  const payload = data as Record<string, unknown> | null | undefined;
  const profile = payload?.profile as Record<string, unknown> | undefined;
  const user = payload?.user as Record<string, unknown> | undefined;

  return Boolean(
    payload?.isStaff ??
      payload?.is_staff ??
      profile?.is_staff ??
      profile?.isStaff ??
      user?.is_staff ??
      user?.isStaff ??
      false,
  );
}

export function useEntitlements(): FrontendEntitlements {
  const queryClient = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.authMe(),
    queryFn: fetchAuthMe,
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
    enabled: isSupabaseConfigured,
  });

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.authMe() });
    await refetch();
  }, [queryClient, refetch]);

  return useMemo(() => {
    const normalized = normalizeTier(readTierFromAuthPayload(data));
    const tier = normalized.tier;
    const isPro = tier === 'pro' || tier === 'creator';
    const isCreator = tier === 'creator';
    const isStaff = readStaffFromAuthPayload(data);
    const queryError = error instanceof Error ? error.message : error ? 'Failed to check entitlements' : null;

    return {
      tier,
      sourceTier: normalized.sourceTier,
      isPro,
      isCreator,
      isStaff,
      canUseProGraphs: isPro,
      canUseTeamMatchupLab: isPro,
      canUsePlayerEdgeLab: isPro,
      canSellPicks: isCreator,
      canAccessNotifications: true,
      loading: isLoading,
      error: queryError,
      warnings: normalized.warnings,
      refresh,
    };
  }, [data, isLoading, error, refresh]);
}
