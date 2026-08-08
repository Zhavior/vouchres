import { getSupabaseAdmin } from "../middleware/auth";
import { isUpstashEnabled, redisPing } from "../lib/upstashRedis";

/**
 * Readiness probe with a short shared cache.
 *
 * GET /api/health/ready is exempt from rate limiting on purpose — a probe that
 * can be 429'd stops describing the process and starts describing the limiter,
 * which is how a rate-limit blip turns into a load-balancer eviction. But the
 * handler runs a Supabase query AND an Upstash PING, so the exemption also made
 * it the cheapest amplifier in the API: one unauthenticated GET, two upstream
 * round-trips, no ceiling.
 *
 * The verdict is therefore computed at most once per READINESS_TTL_MS and shared
 * by every caller in that window. Concurrent callers that arrive on a cold cache
 * join the single in-flight probe rather than each starting their own, so a burst
 * of N requests costs one probe, not N.
 *
 * 5s is well under any sane probe interval (Render/ELB poll every 5-30s), so a
 * real load balancer still sees an effectively live answer.
 */
const READINESS_TTL_MS = 5_000;

/** Hard ceiling on the DB probe so a hung connection can't pin the cache slot. */
const DB_PROBE_TIMEOUT_MS = 3_000;

export interface ReadinessCheck {
  ok: boolean;
  detail?: string;
}

export interface ReadinessResult {
  ready: boolean;
  checks: Record<string, ReadinessCheck>;
  /** When the underlying probe actually ran (not when it was served). */
  checkedAt: string;
}

let cached: { expiresAt: number; result: ReadinessResult } | null = null;
let inFlight: Promise<ReadinessResult> | null = null;

async function probeDatabase(): Promise<ReadinessCheck> {
  try {
    const supabaseAdmin = await getSupabaseAdmin();
    const probe = (await Promise.race([
      supabaseAdmin.from("cappers").select("id", { head: true }).limit(1),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error(`db probe timed out after ${DB_PROBE_TIMEOUT_MS}ms`)),
          DB_PROBE_TIMEOUT_MS,
        ),
      ),
    ])) as { error?: { message?: string } | null };

    if (probe?.error) {
      console.warn("[health/ready] database probe failed:", probe.error.message ?? "query error");
      return { ok: false, detail: "database unreachable" };
    }
    return { ok: true };
  } catch (err) {
    console.warn("[health/ready] database probe error:", (err as Error)?.message ?? err);
    return { ok: false, detail: "database unreachable" };
  }
}

async function probeRedis(): Promise<ReadinessCheck> {
  // Not configured is fine for readiness — prod boot validates Redis separately.
  if (!isUpstashEnabled()) {
    return { ok: true, detail: "not configured (degraded to in-memory)" };
  }
  const redisOk = await redisPing();
  return redisOk
    ? { ok: true, detail: "upstash pong" }
    : { ok: false, detail: "upstash unreachable" };
}

async function runProbe(): Promise<ReadinessResult> {
  const [database, redis] = await Promise.all([probeDatabase(), probeRedis()]);

  return {
    // Fail readiness only on database. Redis check is observational so a blip
    // does not flap the load balancer.
    ready: database.ok,
    checks: { database, redis },
    checkedAt: new Date().toISOString(),
  };
}

/**
 * Cached readiness verdict. `fresh` is false when the answer came from the
 * cache, so the response can advertise its own staleness.
 */
export async function getReadiness(): Promise<ReadinessResult & { fresh: boolean }> {
  const now = Date.now();

  if (cached && cached.expiresAt > now) {
    return { ...cached.result, fresh: false };
  }

  // Single-flight: a burst on a cold cache shares one probe.
  if (!inFlight) {
    inFlight = runProbe()
      .then((result) => {
        cached = { expiresAt: Date.now() + READINESS_TTL_MS, result };
        return result;
      })
      .finally(() => {
        inFlight = null;
      });
  }

  return { ...(await inFlight), fresh: true };
}

/** Test hook — drops the memoized verdict between cases. */
export function resetReadinessCacheForTests(): void {
  cached = null;
  inFlight = null;
}
