import { randomUUID } from "node:crypto";
import { AppError } from "../errors/AppError";
import { isUpstashEnabled, redisReleaseLock, redisSet, sleep } from "./upstashRedis";

export type DistributedLockOptions = {
  /** Lock TTL — auto-releases if the holder crashes. */
  ttlSeconds?: number;
  /** Max time to wait for another holder to finish. */
  waitMs?: number;
  pollMs?: number;
};

const DEFAULT_TTL_SECONDS = 600;
const DEFAULT_WAIT_MS = 30_000;
const DEFAULT_POLL_MS = 500;

/** Promise-chain mutex tails — each waiter awaits the previous release only. */
const memoryLockTails = new Map<string, Promise<void>>();

/**
 * Runs `fn` while holding a cluster-wide lock (Upstash SET NX) or a process-local
 * mutex when Redis is disabled. Safe for idempotent jobs like pending-pick grading.
 */
export async function runWithDistributedLock<T>(
  lockName: string,
  fn: () => Promise<T>,
  options: DistributedLockOptions = {},
): Promise<T> {
  const ttlSeconds = options.ttlSeconds ?? DEFAULT_TTL_SECONDS;
  const waitMs = options.waitMs ?? DEFAULT_WAIT_MS;
  const pollMs = options.pollMs ?? DEFAULT_POLL_MS;
  const key = `lock:${lockName}`;

  if (!isUpstashEnabled()) {
    return runWithMemoryLock(lockName, fn);
  }

  const token = randomUUID();
  const deadline = Date.now() + waitMs;

  while (true) {
    const acquired = await redisSet(key, token, { nx: true, exSeconds: ttlSeconds });
    if (acquired) {
      try {
        return await fn();
      } finally {
        try {
          // Atomic compare-and-delete so a TTL-expired holder cannot DEL a new lock.
          await redisReleaseLock(key, token);
        } catch (error) {
          console.warn(`[distributed-lock] release-failed ${lockName}`, (error as Error)?.message);
        }
      }
    }

    if (Date.now() >= deadline) {
      throw new AppError({
        status: 409,
        code: "conflict",
        message: "Another operation is already in progress.",
        details: { lock: lockName },
        expose: true,
      });
    }

    await sleep(pollMs);
  }
}

/**
 * Process-local mutex via promise chaining.
 * Avoids the thundering-herd bug where many waiters wake on one release and all enter.
 */
async function runWithMemoryLock<T>(lockName: string, fn: () => Promise<T>): Promise<T> {
  const previous = memoryLockTails.get(lockName);
  let release!: () => void;
  const mine = new Promise<void>((resolve) => {
    release = resolve;
  });
  memoryLockTails.set(lockName, mine);

  if (previous) await previous;
  try {
    return await fn();
  } finally {
    release();
    if (memoryLockTails.get(lockName) === mine) {
      memoryLockTails.delete(lockName);
    }
  }
}
