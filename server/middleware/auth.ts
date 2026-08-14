import { createHash } from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { AppError } from "../errors/AppError";
import { isFounderEmail } from "../../src/lib/founderAccess";
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
      discord_connected_at: string | null;
      discord_guild_member: boolean;
      discord_beta_access: boolean;
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
/**
 * Soft L1 for epochs when Redis is on. Must be short so another instance's
 * bumpAuthUserEpoch is observed quickly (not stuck until the 30s session TTL).
 */
const AUTH_EPOCH_L1_TTL_MS = 1_000;
const authSessionCache = new TTLCache<CachedAuthSession>(AUTH_SESSION_TTL_MS, "auth:session");
type AuthEpochL1Entry = { epoch: number; expiresAt: number };
const authEpochL1 = new Map<string, AuthEpochL1Entry>();

function authTokenCacheKey(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function authRedisKey(tokenHash: string): string {
  return `auth:session:${tokenHash}`;
}

function authEpochRedisKey(userId: string): string {
  return `auth:epoch:${userId}`;
}

/**
 * Returns the auth epoch, or `null` when Redis is enabled but unreadable.
 * Callers must treat `null` as "do not trust cached sessions".
 */
async function getAuthUserEpoch(userId: string): Promise<number | null> {
  const local = authEpochL1.get(userId);

  // Without Redis, process-local epoch is the source of truth.
  if (!isUpstashEnabled()) {
    return local?.epoch ?? 0;
  }

  // With Redis, only trust a fresh L1 hit — otherwise re-read so cross-instance bumps apply.
  if (local && local.expiresAt > Date.now()) {
    return local.epoch;
  }

  try {
    const remote = await redisGet(authEpochRedisKey(userId));
    const n = remote == null ? 0 : Number(remote);
    const epoch = Number.isFinite(n) ? n : 0;
    authEpochL1.set(userId, { epoch, expiresAt: Date.now() + AUTH_EPOCH_L1_TTL_MS });
    return epoch;
  } catch (error) {
    console.warn("[auth] redis epoch read failed", (error as Error)?.message ?? error);
    return null;
  }
}

/**
 * Invalidate cached auth sessions for a user (ban, tier, staff, deletion schedule).
 * Next request reloads profile from DB instead of serving a stale 30s cache hit.
 */
export async function bumpAuthUserEpoch(userId: string): Promise<void> {
  if (!userId) return;
  const current = (await getAuthUserEpoch(userId)) ?? authEpochL1.get(userId)?.epoch ?? 0;
  const next = current + 1;
  authEpochL1.set(userId, { epoch: next, expiresAt: Date.now() + AUTH_EPOCH_L1_TTL_MS });
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
  // Redis epoch unread ⇒ cache miss (never treat unknown epoch as 0 / pre-ban).
  if (epoch === null || (candidate.authEpoch ?? 0) !== epoch) {
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
  const epoch = (await getAuthUserEpoch(session.id)) ?? 0;
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

function pendingDeletionAuthError(profile: NonNullable<AuthedRequest["user"]>["profile"]) {
  return new AppError({
    status: 403,
    code: "forbidden",
    message: "Your account is scheduled for deletion. Visit Settings to cancel.",
    details: { deletion_scheduled_at: profile.deletion_scheduled_at },
  });
}

function bannedAuthError() {
  return new AppError({ status: 403, code: "forbidden", message: "Account is banned." });
}

/** Deletion schedule and staff bans are independent gates. */
function authAccessError(
  profile: NonNullable<AuthedRequest["user"]>["profile"],
  options: RequireAuthOptions,
): AppError | null {
  if (profile.deletion_scheduled_at && !options.allowPendingDeletion) {
    return pendingDeletionAuthError(profile);
  }
  if (profile.is_banned) {
    return bannedAuthError();
  }
  return null;
}

const DISCORD_BETA_EXEMPT_PREFIXES = [
  "/api/auth",
  "/api/discord",
  "/api/billing",
  "/api/privacy",
];

function isDiscordBetaExemptRequest(req: AuthedRequest): boolean {
  const path = String(req.originalUrl ?? req.url ?? "").split("?", 1)[0];
  return DISCORD_BETA_EXEMPT_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

function isLocalDiscordBetaBypass(): boolean {
  if (process.env.DISCORD_FORCE_BETA_GATE === "true") return false;
  const env = process.env.NODE_ENV;
  return env !== "production" && env !== "test";
}

function discordBetaAccessError(
  profile: NonNullable<AuthedRequest["user"]>["profile"],
  req: AuthedRequest,
  email?: string | null,
): AppError | null {
  // Local `npm run dev` must not trap on Discord flags. Vite middleware
  // runs whenever NODE_ENV is not production (often unset). Tests and
  // production still enforce. Opt back in with DISCORD_FORCE_BETA_GATE=true.
  if (isLocalDiscordBetaBypass()) return null;
  // Staff and the product founder retain access even when Discord role
  // assignment 403s (bots cannot assign roles to the guild owner).
  if (profile.is_staff || isFounderEmail(email) || isDiscordBetaExemptRequest(req)) return null;
  if (profile.discord_guild_member && profile.discord_beta_access) return null;
  return new AppError({
    status: 403,
    code: "discord_beta_access_required",
    message: "Connect Discord and verify VouchEdge server membership to access the Open Beta.",
    details: { error: "discord_beta_access_required" },
  });
}

/**
 * Extracts the Supabase auth token from either the Authorization: Bearer header
 * or Supabase SSR auth cookies (sb-*-auth-token or multi-chunk cookies).
 */
export function extractAuthToken(req: Request): { token: string; source: "bearer" | "cookie" } | null {
  // 1. Bearer token in Authorization header
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    const raw = header.slice(7).trim();
    if (raw) return { token: raw, source: "bearer" };
  }

  // 2. Supabase SSR cookies from request
  const cookies = req.cookies;
  if (cookies && typeof cookies === "object") {
    const keys = Object.keys(cookies);

    // Single-key cookie: sb-<project-ref>-auth-token or sb-auth-token
    const singleKey = keys.find((k) => /^sb-.*-auth-token$/.test(k) || k === "sb-auth-token" || k === "supabase-auth-token");
    if (singleKey) {
      const rawVal = cookies[singleKey];
      if (typeof rawVal === "string" && rawVal.trim()) {
        const val = rawVal.trim();
        try {
          if (val.startsWith("{") || val.startsWith("[")) {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed) && typeof parsed[0] === "string") return { token: parsed[0], source: "cookie" };
            if (typeof parsed.access_token === "string") return { token: parsed.access_token, source: "cookie" };
          } else if (val.startsWith("base64-")) {
            const decoded = Buffer.from(val.slice(7), "base64").toString("utf-8");
            const parsed = JSON.parse(decoded);
            if (Array.isArray(parsed) && typeof parsed[0] === "string") return { token: parsed[0], source: "cookie" };
            if (typeof parsed.access_token === "string") return { token: parsed.access_token, source: "cookie" };
          } else {
            return { token: val, source: "cookie" };
          }
        } catch {
          return { token: val, source: "cookie" };
        }
      }
    }

    // Multi-chunk cookies: sb-<ref>-auth-token.0, sb-<ref>-auth-token.1 ...
    const chunkZeroKey = keys.find((k) => /^sb-.*-auth-token\.0$/.test(k));
    if (chunkZeroKey) {
      const prefix = chunkZeroKey.slice(0, -2);
      const chunks: string[] = [];
      let idx = 0;
      while (typeof cookies[`${prefix}.${idx}`] === "string") {
        chunks.push(cookies[`${prefix}.${idx}`]);
        idx++;
      }
      if (chunks.length > 0) {
        try {
          const combined = chunks.join("");
          if (combined.startsWith("base64-")) {
            const decoded = Buffer.from(combined.slice(7), "base64").toString("utf-8");
            const parsed = JSON.parse(decoded);
            if (Array.isArray(parsed) && typeof parsed[0] === "string") return { token: parsed[0], source: "cookie" };
            if (typeof parsed.access_token === "string") return { token: parsed.access_token, source: "cookie" };
          } else if (combined.startsWith("{") || combined.startsWith("[")) {
            const parsed = JSON.parse(combined);
            if (Array.isArray(parsed) && typeof parsed[0] === "string") return { token: parsed[0], source: "cookie" };
            if (typeof parsed.access_token === "string") return { token: parsed.access_token, source: "cookie" };
          }
        } catch {
          // ignore chunk parse failure
        }
      }
    }
  }

  return null;
}

/**
 * Validates CSRF safety when a mutating request relies on cookie authentication.
 */
function validateCookieCsrf(req: Request): boolean {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return true;

  // Custom anti-CSRF request header
  const customHeader = req.headers["x-vouchedge-csrf"] || req.headers["x-requested-with"];
  if (customHeader) return true;

  // Sec-Fetch-Site protection (same-origin / none)
  const secFetchSite = req.headers["sec-fetch-site"];
  if (secFetchSite === "same-origin" || secFetchSite === "none") return true;

  // Origin / Referer check
  const origin = (req.headers.origin || req.headers.referer) as string | undefined;
  const host = req.headers.host;
  if (origin && host) {
    try {
      const originHost = new URL(origin).host;
      if (originHost === host) return true;
    } catch {
      // ignore parse error
    }
  }

  return false;
}

function createRequireAuth(options: RequireAuthOptions = {}) {
  return async function requireAuthImpl(
    req: AuthedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const authResult = extractAuthToken(req);
      if (!authResult) {
        console.warn(`[auth] rejected unauthenticated request ${req.method} ${req.originalUrl}`);
        return next(new AppError({ status: 401, code: "missing_token", message: "Authentication token is required." }));
      }

      const { token, source } = authResult;

      // Anti-CSRF protection for cookie-authenticated mutating requests
      if (source === "cookie" && !validateCookieCsrf(req)) {
        console.warn(`[auth] rejected cookie request failed csrf check ${req.method} ${req.originalUrl}`);
        return next(new AppError({ status: 403, code: "forbidden", message: "Cross-site request forgery validation failed." }));
      }

      const cacheKey = authTokenCacheKey(token);
      const cached = await readAuthSessionCache(cacheKey);
      if (cached) {
        const blocked = authAccessError(cached.profile, options);
        if (blocked) return next(blocked);
        const betaBlocked = discordBetaAccessError(cached.profile, req, cached.email);
        if (betaBlocked) return next(betaBlocked);
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
    discord_connected_at, discord_guild_member, discord_beta_access,
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

      const blocked = authAccessError(profile, options);
      if (blocked) return next(blocked);
      const betaBlocked = discordBetaAccessError(profile, req, data.user.email);
      if (betaBlocked) return next(betaBlocked);

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
      if (!cached.profile.is_banned && !cached.profile.deletion_scheduled_at) {
        req.user = cached;
      }
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
        discord_connected_at, discord_guild_member, discord_beta_access,
        deletion_scheduled_at
      `)
      .eq("id", data.user.id)
      .single();

    if (profile && !profile.is_banned && !profile.deletion_scheduled_at) {
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
