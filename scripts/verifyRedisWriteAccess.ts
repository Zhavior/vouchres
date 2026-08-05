/**
 * Hard gate: fail if the configured Redis credential cannot write.
 *
 * Run against a deployed environment's config (CI, or locally with the target
 * env loaded) so a read-only token is caught before it takes the API down.
 *
 *   npm run verify:redis-write
 *
 * Exits 0 when Redis can INCR, 1 otherwise. Also exits 1 when Redis is not
 * configured at all while NODE_ENV=production, since production requires it.
 */
import { probeRedisWriteCapability } from "../server/lib/redisCapability";

async function main(): Promise<void> {
  const result = await probeRedisWriteCapability();
  const isProduction = process.env.NODE_ENV === "production";

  if (!result.configured) {
    if (isProduction) {
      console.error(
        "[verify:redis-write] FAIL — UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are not set, " +
          "but NODE_ENV=production requires them.",
      );
      process.exit(1);
    }

    console.warn("[verify:redis-write] SKIP — Redis is not configured (non-production).");
    return;
  }

  if (!result.canWrite) {
    console.error("[verify:redis-write] FAIL — Redis is reachable but cannot execute INCR.");
    console.error(`[verify:redis-write] Upstream error: ${result.error}`);
    console.error(
      "[verify:redis-write] A read-only token passes every presence check and then breaks " +
        "rate limiting and all cache writes at request time. Replace " +
        "UPSTASH_REDIS_REST_TOKEN with a write-capable token and redeploy.",
    );
    process.exit(1);
  }

  console.log(`[verify:redis-write] OK — Redis accepted INCR at ${result.checkedAt}.`);
}

main().catch((error) => {
  console.error("[verify:redis-write] FAIL — probe threw unexpectedly:", error);
  process.exit(1);
});
