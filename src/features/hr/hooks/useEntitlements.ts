import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiClient } from '../../../lib/apiClient';

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

function readTierFromAuthPayload(data: any): unknown {
  return (
    data?.entitlements?.tier ??
    data?.profile?.tier ??
    data?.profile?.subscription_tier ??
    data?.user?.tier ??
    data?.tier ??
    'free'
  );
}

function readStaffFromAuthPayload(data: any): boolean {
  return Boolean(
    data?.isStaff ??
      data?.is_staff ??
      data?.profile?.is_staff ??
      data?.profile?.isStaff ??
      data?.user?.is_staff ??
      data?.user?.isStaff ??
      false,
  );
}

export function useEntitlements(): FrontendEntitlements {
  const [tier, setTier] = useState<CanonicalTier>('free');
  const [sourceTier, setSourceTier] = useState<string | null>(null);
  const [isStaff, setIsStaff] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // apiClient attaches the Supabase Bearer token — a raw cookie-only fetch
      // always 401s here and silently locked every pro feature as "free".
      const data = await apiClient.get<any>('/api/auth/me');
      const normalized = normalizeTier(readTierFromAuthPayload(data));

      setTier(normalized.tier);
      setSourceTier(normalized.sourceTier);
      setIsStaff(readStaffFromAuthPayload(data));
      setWarnings(normalized.warnings);
    } catch (err: any) {
      setTier('free');
      setSourceTier(null);
      setIsStaff(false);
      if (Number(err?.status) === 401) {
        // Logged out — free tier is the correct, quiet answer.
        setWarnings([]);
      } else {
        setWarnings(['Entitlements check failed; defaulted to free.']);
        setError(err instanceof Error ? err.message : 'Failed to check entitlements');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return useMemo(() => {
    const isPro = tier === 'pro' || tier === 'creator';
    const isCreator = tier === 'creator';

    return {
      tier,
      sourceTier,
      isPro,
      isCreator,
      isStaff,
      canUseProGraphs: isPro,
      canUseTeamMatchupLab: isPro,
      canUsePlayerEdgeLab: isPro,
      canSellPicks: isCreator,
      canAccessNotifications: true,
      loading,
      error,
      warnings,
      refresh,
    };
  }, [tier, sourceTier, isStaff, loading, error, warnings, refresh]);
}
