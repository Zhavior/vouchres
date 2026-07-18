import { useEffect, useState, useCallback } from "react";
import {
  supabase,
  onAuthStateChange,
  getAuthToken,
} from "./supabaseClient";
import { apiClient } from "./apiClient";
import { mapAuthMeToUserProfile } from "./profileFromAuth";

export type SubscriptionTier = "free" | "gold" | "seller_pro";

export interface UserProfile {
  id: string;
  email: string | null;
  username: string;
  handle: string;
  display_name: string;
  avatar_url: string | null;
  bio: string;
  tier: SubscriptionTier;
  trust_score: number;
  total_picks: number;
  won_picks: number;
  lost_picks: number;
  pushed_picks: number;
  net_units: number;
  age_confirmed_at: string | null;
  jurisdiction_confirmed_at: string | null;
  jurisdiction: string | null;
  is_staff: boolean;
  is_demo: boolean;
}

interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
}

/**
 * useAuth — React hook that subscribes to Supabase auth state and
 * fetches the user's profile from the API.
 *
 * Replaces the localStorage-only profile state in App.tsx.
 *
 * Usage:
 *   const { user, loading, signIn, signOut, refresh } = useAuth();
 *
 *   if (loading) return <LoadingSpinner/>;
 *   if (!user) return <LoginGate/>;
 *   return <App user={user} />;
 */
export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  const fetchProfile = useCallback(async (): Promise<UserProfile | null> => {
    const token = await getAuthToken();
    if (!token) return null;
    try {
      // Hit any authenticated endpoint that returns profile data;
      // /api/auth/me is the cleanest single source of truth.
      return mapAuthMeToUserProfile(await apiClient.get<Record<string, unknown>>("/api/auth/me"));
    } catch (err: any) {
      if (err?.status === 401) return null;
      console.error("[useAuth] profile fetch failed", err);
      return null;
    }
  }, []);

  // Initial load
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const profile = await fetchProfile();
      if (!cancelled) {
        setState({ user: profile, loading: false, error: null });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchProfile]);

  // Subscribe to auth changes
  useEffect(() => {
    let generation = 0;
    const { data } = onAuthStateChange(async (event) => {
      if (event === "SIGNED_OUT") {
        generation += 1;
        setState({ user: null, loading: false, error: null });
        return;
      }
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        const requestId = ++generation;
        setState((s) => ({ ...s, loading: true }));
        const profile = await fetchProfile();
        if (requestId !== generation) return;
        setState({ user: profile, loading: false, error: null });
      }
    });
    return () => {
      generation += 1;
      data.subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    const profile = await fetchProfile();
    setState({ user: profile, loading: false, error: null });
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setState({ user: null, loading: false, error: null });
  }, []);

  return {
    user: state.user,
    loading: state.loading,
    error: state.error,
    refresh,
    signOut,
  };
}

/**
 * useEntitlements — convenience hook for feature gating in the UI.
 *
 * IMPORTANT: UI gating is for UX only. The server enforces real entitlements
 * via server/middleware/entitlements.ts. A user can lie about their tier in
 * the client — that's fine, they can't actually do anything gated.
 *
 * Usage:
 *   const { can, tier } = useEntitlements(user);
 *   if (!can('postUnlimitedPicks')) return <UpgradeBanner/>;
 */
export function useEntitlements(user: UserProfile | null) {
  const tier: SubscriptionTier = user?.tier ?? "free";

  const can = (feature: string): boolean => {
    if (!user) return false;
    if (!user.age_confirmed_at || !user.jurisdiction_confirmed_at) {
      // Legal gate not passed — block everything pick-related
      if (["postPick", "viewPicks", "viewLedger"].includes(feature)) return false;
    }

    switch (feature) {
      // Free
      case "viewFeed":
      case "viewPicks":
      case "viewCappers":
      case "postPick": // limited to 3/day — server enforces
      case "useAiExplain": // limited to 10/day — server enforces
        return true;

      // Gold ($8/mo)
      case "postUnlimitedPicks":
      case "useAiUnlimited":
      case "viewAdvancedStats":
      case "saveParlays":
        return tier === "gold" || tier === "seller_pro";

      // Seller PRO ($40/mo) — REMOVED "monetize picks" feature
      // pending legal review. Currently equivalent to Gold + badges.
      case "verifiedBadge":
      case "customProfileTheme":
      case "prioritySupport":
        return tier === "seller_pro";

      default:
        return false;
    }
  };

  return { tier, can };
}
