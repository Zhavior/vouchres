import type { Request, Response, NextFunction } from "express";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase service-role client — used for privileged operations
 * (grading picks, syncing subscriptions from Stripe, etc.).
 *
 * NEVER expose this client to the browser. It bypasses RLS.
 */
let supabaseAdminClient: SupabaseClient | null = null;

function initSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdminClient) {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error(
        "Server Supabase admin client requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
      );
    }

    supabaseAdminClient = createClient(
      supabaseUrl,
      serviceRoleKey,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );
  }
  return supabaseAdminClient;
}

export async function getSupabaseAdmin(): Promise<SupabaseClient> {
  return initSupabaseAdmin();
}

/**
 * Synchronous service-role client. Lazily initialized on first property access
 * so importing modules can use `supabaseAdmin.from(...)` directly without await.
 * (Compatibility shim for the many route handlers written against a sync client.)
 */
export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const client = initSupabaseAdmin();
    const value = Reflect.get(client as object, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

/**
 * Auth middleware — verifies the Supabase JWT from the Authorization header
 * and attaches the user profile to req.user.
 *
 * Usage:
 *   router.post("/picks", requireAuth, createPickHandler);
 *   router.post("/admin/...", requireAuth, requireStaff, ...);
 */
export interface AuthedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    profile: {
      id: string;
      username: string;
      tier: "free" | "gold" | "seller_pro";
      is_banned: boolean;
      is_staff: boolean;
      is_demo: boolean;
      age_confirmed_at: string | null;
      jurisdiction_confirmed_at: string | null;
      jurisdiction: string | null;
    };
  };
}

export async function requireAuth(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    console.warn(`[auth] rejected unauthenticated request ${req.method} ${req.originalUrl}`);
    return res.status(401).json({ error: "missing_token" });
  }

  const token = header.slice(7);

  // Verify the JWT via Supabase auth admin API
  const supabaseAdmin = await getSupabaseAdmin();
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) {
    console.warn(`[auth] rejected invalid token ${req.method} ${req.originalUrl}`);
    return res.status(401).json({ error: "invalid_token" });
  }

  const PROFILE_COLUMNS = `
    id, username, tier, is_banned, is_staff, is_demo,
    age_confirmed_at, jurisdiction_confirmed_at, jurisdiction,
    deletion_scheduled_at
  `;

  // Load profile from public.profiles (bypasses RLS via service role)
  let { data: profile, error: pErr } = await supabaseAdmin
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", data.user.id)
    .maybeSingle();

  // Lazy provisioning: if the auth user has no profile row yet (the
  // handle_new_user trigger is missing or didn't run for this account),
  // create a minimal one now so a valid logged-in user is never locked out.
  // Idempotent — a concurrent insert just falls back to a re-select.
  if (!pErr && !profile) {
    const shortId = data.user.id.replace(/-/g, "").slice(0, 12);
    const username = `user_${shortId}`; // 17 chars, within the 3–24 constraint
    const displayName = (data.user.email?.split("@")[0] || "Member").slice(0, 40);

    const { data: created, error: cErr } = await supabaseAdmin
      .from("profiles")
      .insert({ id: data.user.id, username, display_name: displayName })
      .select(PROFILE_COLUMNS)
      .single();

    if (created) {
      profile = created;
    } else if (cErr) {
      // Likely a race (unique violation) — the row now exists; re-read it.
      const reread = await supabaseAdmin
        .from("profiles")
        .select(PROFILE_COLUMNS)
        .eq("id", data.user.id)
        .maybeSingle();
      profile = reread.data ?? null;
      pErr = reread.error ?? cErr;
    }
  }

  if (pErr || !profile) {
    console.warn(`[auth] rejected request without profile user=${data.user.id} ${req.method} ${req.originalUrl}`);
    return res.status(403).json({ error: "profile_missing" });
  }

  if (profile.is_banned) {
    // Distinguish "banned by moderator" from "scheduled for deletion"
    if (profile.deletion_scheduled_at) {
      return res.status(403).json({
        error: "account_scheduled_for_deletion",
        deletion_scheduled_at: profile.deletion_scheduled_at,
        message: "Your account is scheduled for deletion. Visit Settings to cancel.",
      });
    }
    return res.status(403).json({ error: "banned" });
  }

  req.user = {
    id: data.user.id,
    email: data.user.email,
    profile,
  };

  next();
}

/**
 * Optional auth — attaches user if token present, does not 401 if absent.
 * Use on public endpoints where you want to personalize for logged-in users.
 */
export async function optionalAuth(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return next();

  const token = header.slice(7);
  const supabaseAdmin = await getSupabaseAdmin();
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return next();

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select(`
      id, username, tier, is_banned, is_staff, is_demo,
      age_confirmed_at, jurisdiction_confirmed_at, jurisdiction,
      deletion_scheduled_at
    `)
    .eq("id", data.user.id)
    .single();

  if (profile && !profile.is_banned) {
    req.user = { id: data.user.id, email: data.user.email, profile };
  }
  next();
}

/**
 * Staff gate — must come after requireAuth.
 */
export function requireStaff(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!req.user?.profile.is_staff) {
    console.warn(`[auth] rejected non-staff request user=${req.user?.id ?? "unknown"} ${req.method} ${req.originalUrl}`);
    return res.status(403).json({ error: "staff_only" });
  }
  next();
}

/**
 * Age + jurisdiction gate — must come after requireAuth.
 * Users cannot post picks until they've confirmed 21+ and a jurisdiction.
 */
export function requireLegalConfirmed(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
) {
  const p = req.user?.profile;
  if (!p) return res.status(401).json({ error: "missing_token" });
  if (!p.age_confirmed_at) {
    return res.status(403).json({ error: "age_confirmation_required" });
  }
  if (!p.jurisdiction_confirmed_at || !p.jurisdiction) {
    return res.status(403).json({ error: "jurisdiction_required" });
  }
  // Block jurisdictions where sports betting is illegal (US list, update as law changes)
  const blockedJurisdictions = [
    "US-CA", "US-TX", "US-FL", "US-NY", "US-IL", "US-MA", "US-MN", "US-MO",
    "US-OH", "US-AL", "US-AK", "US-HI", "US-ID", "US-UT", "US-SC", "US-GA",
    "US-MS", "US-NC", "US-OK", "US-OR", "US-DE", "US-VT", "US-RI", "US-CT",
    "US-KY", "US-LA", "US-MD", "US-ME", "US-MT", "US-NE", "US-NH", "US-NJ",
    "US-NM", "US-ND", "US-SD", "US-TN", "US-WA", "US-WV", "US-WI", "US-WY",
    "US-CO", "US-AZ", "US-IA", "US-IN", "US-KS", "US-MI", "US-NV", "US-PA",
    "US-VA", "US-AR", "US-DC"
  ];
  // NOTE: This is a non-exhaustive blocklist. Consult counsel. Above list is
  // intentionally conservative — it blocks almost every US state. Adjust to
  // your actual legal exposure. Outside the US, geofence by IP at the edge
  // (Cloudflare / Vercel middleware) before requests reach this layer.
  if (blockedJurisdictions.includes(p.jurisdiction)) {
    return res.status(403).json({ error: "jurisdiction_blocked" });
  }
  next();
}
