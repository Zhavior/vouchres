import type { Request, Response, NextFunction } from "express";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase service-role client — used for privileged operations
 * (grading picks, syncing subscriptions from Stripe, etc.).
 *
 * NEVER expose this client to the browser. It bypasses RLS.
 */
let supabaseAdminClient: SupabaseClient | null = null;

export async function getSupabaseAdmin(): Promise<SupabaseClient> {
  if (supabaseAdminClient) return supabaseAdminClient;

  const { createClient } = await import("@supabase/supabase-js");
  supabaseAdminClient = createClient(
    process.env.SUPABASE_URL ?? "",
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    {
      auth: { persistSession: false, autoRefreshToken: false },
    }
  );
  return supabaseAdminClient;
}

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
    return res.status(401).json({ error: "missing_token" });
  }

  const token = header.slice(7);

  // Verify the JWT via Supabase auth admin API
  const supabaseAdmin = await getSupabaseAdmin();
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) {
    return res.status(401).json({ error: "invalid_token" });
  }

  // Load profile from public.profiles (bypasses RLS via service role)
  const { data: profile, error: pErr } = await supabaseAdmin
    .from("profiles")
    .select(`
      id, username, tier, is_banned, is_staff, is_demo,
      age_confirmed_at, jurisdiction_confirmed_at, jurisdiction,
      deletion_scheduled_at
    `)
    .eq("id", data.user.id)
    .single();

  if (pErr || !profile) {
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
