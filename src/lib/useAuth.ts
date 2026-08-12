import { useCallback, useEffect, useSyncExternalStore } from "react";
import type { User } from "@supabase/supabase-js";
import { signOut as signOutCurrentSession } from "./supabaseClient";
import { useAuthSession } from "./authSessionStore";
import { apiClient } from "./apiClient";
import { mapAuthMeToUserProfile } from "./profileFromAuth";
import { FREE_BETA_ALL_ACCESS } from "./betaAccess";

export type SubscriptionTier = "free" | "gold" | "seller_pro";

export interface UserProfile {
  id: string;
  email: string | null;
  username: string;
  handle: string;
  display_name: string;
  avatar_url: string | null;
  header_url: string | null;
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
  discord_username: string | null;
  discord_connected_at: string | null;
  discord_guild_member: boolean;
  discord_beta_access: boolean;
}

interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
}

let authState: AuthState = { user: null, loading: true, error: null };
let profileRequest: { key: string; promise: Promise<void> } | null = null;
let activeProfileKey: string | null = null;
let loadedProfileKey: string | null = null;
const authListeners = new Set<() => void>();

function publishAuthState(next: AuthState) {
  authState = next;
  authListeners.forEach((listener) => listener());
}

function fallbackUser(user: User): UserProfile {
  const metadata = user.user_metadata ?? {};
  const emailHandle = user.email?.split('@')[0] ?? '';
  const handle = String(metadata.handle ?? metadata.username ?? emailHandle);
  return {
    id: user.id,
    email: user.email ?? null,
    username: handle,
    handle,
    display_name: String(metadata.display_name ?? metadata.full_name ?? handle),
    avatar_url: typeof metadata.avatar_url === 'string' ? metadata.avatar_url : null,
    header_url: null,
    bio: '',
    tier: 'free',
    trust_score: 0,
    total_picks: 0,
    won_picks: 0,
    lost_picks: 0,
    pushed_picks: 0,
    net_units: 0,
    age_confirmed_at: null,
    jurisdiction_confirmed_at: null,
    jurisdiction: null,
    is_staff: false,
    is_demo: false,
    discord_username: null,
    discord_connected_at: null,
    discord_guild_member: false,
    discord_beta_access: false,
  };
}

function loadProfile(accessToken: string, user: User, force = false): Promise<void> {
  const requestKey = `${user.id}:${accessToken}`;
  activeProfileKey = requestKey;
  if (!force && loadedProfileKey === requestKey) return Promise.resolve();
  if (profileRequest?.key === requestKey) return profileRequest.promise;

  if (authState.user?.id !== user.id) {
    publishAuthState({ user: fallbackUser(user), loading: true, error: null });
  } else {
    publishAuthState({ ...authState, loading: true, error: null });
  }

  const promise = apiClient.get<Record<string, unknown>>("/api/auth/me")
    .then((data) => {
      if (activeProfileKey !== requestKey) return;
      loadedProfileKey = requestKey;
      publishAuthState({ user: mapAuthMeToUserProfile(data), loading: false, error: null });
    })
    .catch((error: unknown) => {
      if (activeProfileKey !== requestKey) return;
      const message = error instanceof Error ? error.message : 'Profile temporarily unavailable';
      publishAuthState({
        user: authState.user?.id === user.id ? authState.user : fallbackUser(user),
        loading: false,
        error: message,
      });
    })
    .finally(() => {
      if (profileRequest?.key === requestKey) profileRequest = null;
    });

  profileRequest = { key: requestKey, promise };
  return promise;
}

function subscribeAuthProfile(listener: () => void) {
  authListeners.add(listener);
  return () => authListeners.delete(listener);
}

function getAuthProfileSnapshot() {
  return authState;
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
  const sessionState = useAuthSession();
  const state = useSyncExternalStore(subscribeAuthProfile, getAuthProfileSnapshot, getAuthProfileSnapshot);

  useEffect(() => {
    if (sessionState.status === 'loading') return;
    if (!sessionState.session) {
      activeProfileKey = null;
      loadedProfileKey = null;
      profileRequest = null;
      publishAuthState({ user: null, loading: false, error: null });
      return;
    }
    void loadProfile(
      sessionState.session.access_token,
      sessionState.session.user,
    );
  }, [sessionState.session, sessionState.status]);

  const refresh = useCallback(async () => {
    if (!sessionState.session) return;
    await loadProfile(sessionState.session.access_token, sessionState.session.user, true);
  }, [sessionState.session]);

  const signOut = useCallback(async () => {
    await signOutCurrentSession();
    publishAuthState({ user: null, loading: false, error: null });
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
      // Legal gate not passed — block everything pick-related. This is a legal
      // requirement, not a paywall, so the free beta does NOT lift it.
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

      // Paid — unlocked for everyone during the free open beta.
      case "postUnlimitedPicks":
      case "useAiUnlimited":
      case "viewAdvancedStats":
      case "saveParlays":
        return FREE_BETA_ALL_ACCESS || tier === "gold" || tier === "seller_pro";

      // Creator — also unlocked during the free open beta.
      case "verifiedBadge":
      case "customProfileTheme":
      case "prioritySupport":
        return FREE_BETA_ALL_ACCESS || tier === "seller_pro";

      default:
        return false;
    }
  };

  return { tier, can };
}
