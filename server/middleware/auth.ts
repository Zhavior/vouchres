import { createHash } from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { AppError } from "../errors/AppError";
import { TTLCache } from "../lib/cache";
import { assertJurisdictionAllowed } from "../lib/jurisdictionPolicy";
import { isUpstashEnabled, redisDel, redisGet, redisGetJson, redisSet, redisSetJson } from "../lib/upstashRedis";

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
      handle: string;
      tier: "free" | "gold" | "seller_pro";
      is_banned: boolean;
      is_staff: boolean;
      is_demo: boolean;
      age_confirmed_at: string | null;
      jurisdiction_confirmed_at: string | null;
      jurisdiction: string | null;
      deletion_scheduled_at?: string | null;
    };
  };
}

type CachedAuthSession = NonNullable<AuthedRequest["user"]> & { authEpoch: number };

/** Short-lived auth session cache — L1 memory + optional L2 Redis for multi-instance. */
const AUTH_SESSION_TTL_MS = 30_000;
const AUTH_SESSION_TTL_SECONDS = 30;
/** Epoch TTL must outlive session cache so ban/tier bumps are visible until sessions expire. */
const AUTH_EPOCH_TTL_SECONDS = 120;
const authSessionCache = new TTLCache<CachedAuthSession>(AUTH_SESSION_TTL_MS, "auth:session");
const authEpochL1 = new Map<string, number>();

function authTokenCacheKey(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function authRedisKey(tokenHash: string): string {
  return `auth:session:${tokenHash}`;
}

function authEpochRedisKey(userId: string): string {
  return `auth:epoch:${userId}`;
}

async function getAuthUserEpoch(userId: string): Promise<number> {
  const local = authEpochL1.get(userId);
  if (local !== undefined) return local;

  if (!isUpstashEnabled()) return 0;
  try {
    const remote = await redisGet(authEpochRedisKey(userId));
    const n = remote == null ? 0 : Number(remote);
    const epoch = Number.isFinite(n) ? n : 0;
    authEpochL1.set(userId, epoch);
    return epoch;
  } catch (error) {
    console.warn("[auth] redis epoch read failed", (error as Error)?.message ?? error);
    return 0;
  }
}

/**
 * Invalidate cached auth sessions for a user (ban, tier, staff, deletion schedule).
 * Next request reloads profile from DB instead of serving a stale 30s cache hit.
 */
export async function bumpAuthUserEpoch(userId: string): Promise<void> {
  if (!userId) return;
  const current = await getAuthUserEpoch(userId);
  const next = current + 1;
  authEpochL1.set(userId, next);
  if (!isUpstashEnabled()) return;
  try {
    await redisSet(authEpochRedisKey(userId), String(next), { exSeconds: AUTH_EPOCH_TTL_SECONDS });
  } catch (error) {
    console.warn("[auth] redis epoch bump failed", (error as Error)?.message ?? error);
  }
}

async function readAuthSessionCache(tokenHash: string): Promise<CachedAuthSession | null> {
  const local = authSessionCache.get(tokenHash);
  const candidate = local ?? (isUpstashEnabled()
    ? await (async () => {
        try {
          const remote = await redisGetJson<CachedAuthSession>(authRedisKey(tokenHash));
          if (!remote?.id || !remote.profile) return null;
          authSessionCache.set(tokenHash, remote, AUTH_SESSION_TTL_MS);
          return remote;
        } catch (error) {
          console.warn("[auth] redis session read failed", (error as Error)?.message ?? error);
          return null;
        }
      })()
    : null);

  if (!candidate) return null;

  const epoch = await getAuthUserEpoch(candidate.id);
  if ((candidate.authEpoch ?? 0) !== epoch) {
    authSessionCache.delete(tokenHash);
    if (isUpstashEnabled()) {
      try {
        await redisDel(authRedisKey(tokenHash));
      } catch (error) {
        console.warn("[auth] redis session delete failed", (error as Error)?.message ?? error);
      }
    }
    return null;
  }

  return candidate;
}

async function writeAuthSessionCache(
  tokenHash: string,
  session: NonNullable<AuthedRequest["user"]>,
): Promise<void> {
  const epoch = await getAuthUserEpoch(session.id);
  const cached: CachedAuthSession = { ...session, authEpoch: epoch };
  authSessionCache.set(tokenHash, cached, AUTH_SESSION_TTL_MS);
  if (!isUpstashEnabled()) return;
  try {
    await redisSetJson(authRedisKey(tokenHash), cached, AUTH_SESSION_TTL_SECONDS);
  } catch (error) {
    console.warn("[auth] redis session write failed", (error as Error)?.message ?? error);
  }
}

/** Test-only: clear cached sessions between cases. */
export function resetAuthSessionCacheForTests(): void {
  authSessionCache.clear();
  authEpochL1.clear();
}

type RequireAuthOptions = {
  /** Allow users with deletion_scheduled_at to reach cancel/status privacy routes. */
  allowPendingDeletion?: boolean;
};

function bannedAuthError(profile: NonNullable<AuthedRequest["user"]>["profile"]) {
  if (profile.deletion_scheduled_at) {
    return new AppError({
      status: 403,
      code: "forbidden",
      message: "Your account is scheduled for deletion. Visit Settings to cancel.",
      details: { deletion_scheduled_at: profile.deletion_scheduled_at },
    });
  }
  return new AppError({ status: 403, code: "forbidden", message: "Account is banned." });
}

function createRequireAuth(options: RequireAuthOptions = {}) {
  return async function requireAuthImpl(
    req: AuthedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const header = req.headers.authorization;
      if (!header?.startsWith("Bearer ")) {
        console.warn(`[auth] rejected unauthenticated request ${req.method} ${req.originalUrl}`);
        return next(new AppError({ status: 401, code: "missing_token", message: "Authentication token is required." }));
      }

      const token = header.slice(7);
      const cacheKey = authTokenCacheKey(token);
      const cached = await readAuthSessionCache(cacheKey);
      if (cached) {
        if (cached.profile.is_banned) {
          const pendingDeletion = Boolean(cached.profile.deletion_scheduled_at);
          if (!(options.allowPendingDeletion && pendingDeletion)) {
            return next(bannedAuthError(cached.profile));
          }
        }
        req.user = cached;
        return next();
      }

      // Verify the JWT via Supabase auth admin API
      const supabaseAdmin = await getSupabaseAdmin();
      const { data, error } = await supabaseAdmin.auth.getUser(token);
      if (error || !data.user) {
        console.warn(`[auth] rejected invalid token ${req.method} ${req.originalUrl}`);
        return next(new AppError({ status: 401, code: "invalid_token", message: "Authentication token is invalid." }));
      }

      const PROFILE_COLUMNS = `
    id, username, handle, tier, is_banned, is_staff, is_demo,
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
        const shortId = data.user.id.replace(/-/g, "").slice(0, 8);
        const handle = `user_${shortId}`;
        const displayName = (data.user.email?.split("@")[0] || "Member").slice(0, 40);

        const { data: created, error: cErr } = await supabaseAdmin
          .from("profiles")
          .insert({ id: data.user.id, username: handle, handle, display_name: displayName })
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
        return next(new AppError({ status: 403, code: "forbidden", message: "Profile is missing." }));
      }

      if (profile.is_banned) {
        const pendingDeletion = Boolean(profile.deletion_scheduled_at);
        if (!(options.allowPendingDeletion && pendingDeletion)) {
          return next(bannedAuthError(profile));
        }
      }

      req.user = {
        id: data.user.id,
        email: data.user.email,
        profile,
      };
      await writeAuthSessionCache(cacheKey, req.user);

      next();
    } catch (error) {
      next(new AppError({
        status: 500,
        code: "internal_server_error",
        message: "Authentication check failed.",
        expose: false,
        cause: error,
      }));
    }
  };
}

export const requireAuth = createRequireAuth();

/** Privacy cancel/status only — scheduled-deletion users must still authenticate. */
export const requireAuthAllowPendingDeletion = createRequireAuth({ allowPendingDeletion: true });

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

  // optionalAuth must NEVER fail the request — it only *upgrades* an
  // anonymous request to authenticated when a valid token is present. Any
  // error (Supabase outage, getSupabaseAdmin throwing on missing env, a
  // malformed token) must fall through to anonymous, not 500 the public
  // feed/leaderboard/profile routes that use it.
  try {
    const token = header.slice(7);
    const cacheKey = authTokenCacheKey(token);
    const cached = await readAuthSessionCache(cacheKey);
    if (cached) {
      if (!cached.profile.is_banned) req.user = cached;
      return next();
    }

    const supabaseAdmin = await getSupabaseAdmin();
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) return next();

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select(`
        id, username, handle, tier, is_banned, is_staff, is_demo,
        age_confirmed_at, jurisdiction_confirmed_at, jurisdiction,
        deletion_scheduled_at
      `)
      .eq("id", data.user.id)
      .single();

    if (profile && !profile.is_banned) {
      req.user = { id: data.user.id, email: data.user.email, profile };
      await writeAuthSessionCache(cacheKey, req.user);
    }
  } catch (err) {
    // Degrade to anonymous — do not surface the error to the client.
    console.warn("[auth] optionalAuth soft-failed, continuing anonymously:", (err as Error)?.message ?? err);
  }
  next();
}

/**
 * Staff gate — must come after requireAuth.
 */
export function requireStaff(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!req.user?.profile.is_staff) {
    console.warn(`[auth] rejected non-staff request user=${req.user?.id ?? "unknown"} ${req.method} ${req.originalUrl}`);
    return next(new AppError({ status: 403, code: "forbidden", message: "Staff access is required." }));
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
  if (!p) return next(new AppError({ status: 401, code: "missing_token", message: "Authentication token is required." }));
  if (!p.age_confirmed_at) {
    return next(new AppError({ status: 403, code: "forbidden", message: "Age confirmation is required." }));
  }
  if (!p.jurisdiction_confirmed_at || !p.jurisdiction) {
    return next(new AppError({ status: 403, code: "forbidden", message: "Jurisdiction confirmation is required." }));
  }

  try {
    assertJurisdictionAllowed(p.jurisdiction);
  } catch (error) {
    return next(error);
  }

  next();
}
