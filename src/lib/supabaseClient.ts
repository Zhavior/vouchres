import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Browser-side Supabase client.
 *
 * Uses the ANON key (public) — safe to expose. RLS policies on the server
 * protect data; the anon key can only do what RLS allows.
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "[supabase] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not set. Auth will not work."
  );
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: "vouchedge.auth",
  },
});

/**
 * Get the current session's access token for Authorization header.
 * Returns null if not logged in.
 */
export async function getAuthToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

/**
 * Sign up with email + password. Requires invite code during beta.
 */
export async function signUpWithEmail(opts: {
  email: string;
  password: string;
  username: string;
  inviteCode?: string;
}) {
  const { data, error } = await supabase.auth.signUp({
    email: opts.email,
    password: opts.password,
    options: {
      data: {
        username: opts.username,
        display_name: opts.username,
        invite_code: opts.inviteCode,
      },
    },
  });
  return { data, error };
}

/**
 * Sign in with email + password.
 */
export async function signInWithEmail(opts: { email: string; password: string }) {
  const { data, error } = await supabase.auth.signInWithPassword(opts);
  return { data, error };
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
