import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Browser-side Supabase client.
 *
 * Uses the ANON key (public) — safe to expose. RLS policies on the server
 * protect data; the anon key can only do what RLS allows.
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

/**
 * True when both Supabase env vars are present. The UI uses this to decide
 * whether to show the real auth flow or fall back to guest-only entry, so
 * the app stays usable in environments where auth isn't configured.
 */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn(
    "[supabase] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not set. Auth will not work."
  );
}

// createClient throws synchronously if the URL/key are empty. When auth isn't
// configured we still construct a client with harmless placeholders so importing
// this module never crashes the app — every real auth call is gated behind
// isSupabaseConfigured, so the placeholder client is never actually hit.
export const supabase: SupabaseClient = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-anon-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: window.localStorage,
      storageKey: "vouchedge.auth",
    },
  }
);

/**
 * Get the current session's access token for Authorization header.
 * Returns null if not logged in.
 */
export async function getAuthToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function ensureRealtimeAuth(): Promise<void> {
  const token = await getAuthToken();
  if (!token) return;
  await supabase.realtime.setAuth(token);
}

/**
 * Sign up with email + password. Requires invite code during beta.
 */
export async function signUpWithEmail(opts: {
  email: string;
  password: string;
  handle: string;
  inviteCode?: string;
}) {
  const handle = opts.handle.trim().toLowerCase();
  const { data, error } = await supabase.auth.signUp({
    email: opts.email,
    password: opts.password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
      data: {
        handle,
        username: handle,
        display_name: handle,
        invite_code: opts.inviteCode,
      },
    },
  });
  if (!error && data.session) {
    persistAuthSession(data.session);
  }
  return { data, error };
}

/**
 * Persist session token for legacy helpers (hasRealAuthToken, API client).
 */
export function persistAuthSession(session: { access_token?: string; user?: { id?: string } } | null | undefined) {
  if (!session?.access_token || !session.user?.id) return;
  try {
    localStorage.setItem('vouchedge_auth_token', session.access_token);
  } catch {
    // ignore storage failures
  }
}

/**
 * Sign in with email + password.
 */
export async function signInWithEmail(opts: { email: string; password: string }) {
  const { data, error } = await supabase.auth.signInWithPassword(opts);
  if (!error && data.session) {
    persistAuthSession(data.session);
  }
  return { data, error };
}

/** Send a password-recovery email to the dedicated Aurora reset page. */
export async function requestPasswordReset(email: string) {
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });
}

/** Update the password for the authenticated recovery session. */
export async function updatePassword(password: string) {
  return supabase.auth.updateUser({ password });
}

/**
 * Send a magic-link sign-in email (alternative to password).
 */
export async function signInWithMagicLink(email: string) {
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  return { data, error };
}

/**
 * Start the browser-based Google OAuth flow.
 *
 * Supabase redirects back through the same callback page used by email and
 * magic-link auth, where the resulting session is persisted before the app
 * routes the user onward.
 */
export async function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      skipBrowserRedirect: true,
    },
  });
}

let googleAvailabilityRequest: Promise<boolean | null> | null = null;

/** Read the public Auth provider settings so a disabled provider never opens a raw error page. */
export function getGoogleAuthAvailability(): Promise<boolean | null> {
  if (!isSupabaseConfigured) return Promise.resolve(false);
  if (googleAvailabilityRequest) return googleAvailabilityRequest;

  googleAvailabilityRequest = fetch(`${supabaseUrl}/auth/v1/settings`, {
    headers: { apikey: supabaseAnonKey },
  })
    .then(async (response) => {
      if (!response.ok) return null;
      const settings = await response.json() as { external?: { google?: boolean } };
      return settings.external?.google === true;
    })
    .catch(() => null);

  return googleAvailabilityRequest;
}

/**
 * Sign out.
 */
export async function signOut() {
  await supabase.auth.signOut();
}

/**
 * Listen for auth state changes.
 */
export function onAuthStateChange(
  cb: (event: "SIGNED_IN" | "SIGNED_OUT" | "TOKEN_REFRESHED" | "USER_UPDATED", session: any) => void
) {
  return supabase.auth.onAuthStateChange((event, session) => {
    cb(event as any, session);
  });
}
